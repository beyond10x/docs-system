// Adversarial pass on story:docs-v3-check-source-accepts-v5: the ESS b10x-docs/v5 repository
// (fixtures/ess-v5.yaml over tests/fixtures/source-check/v5-ess) with one manifest defect that Website
// origin/main refuses, or that the unit's acceptance statement says must fail, and check-source passes.
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {promisify} from 'node:util';
import {parse, stringify} from 'yaml';

const execFileAsync = promisify(execFile);
const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const essV5 = new URL('../fixtures/ess-v5.yaml', import.meta.url);
const repository = fileURLToPath(new URL('./fixtures/source-check/v5-ess/', import.meta.url));

async function checkMutatedV5(mutate) {
  const manifest = parse(await fs.readFile(essV5, 'utf8'));
  mutate(manifest.surfaces[0]);
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-docs-check-source-adv3-'));
  try {
    await fs.cp(repository, directory, {recursive: true});
    await fs.writeFile(path.join(directory, 'b10x.docs.yaml'), stringify(manifest), 'utf8');
    try {
      const {stdout, stderr} = await execFileAsync(process.execPath, [cli, 'check-source', directory]);
      return {code: 0, stdout, stderr};
    } catch (error) {
      return {code: error.code, stdout: error.stdout, stderr: error.stderr};
    }
  } finally {
    await fs.rm(directory, {recursive: true});
  }
}

const detail = (result) => `expected exit 1, got ${result.code}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`;

// Acceptance: "a routeBase outside its own namespace ... fails naming the file". The v5 schema's
// routeBase pattern admits a `..` segment, readManifest only requires canonicalUrl to equal the
// resolved URL, and the namespace rule is a string prefix test, so `/docs/ess/../other/` passes it
// while every page is written to docs/other/ (path.join resolves the segment) and served at
// https://beyond10x.github.io/docs/other/.
test('check-source refuses a v5 routeBase that leaves /docs/<repository>/ through a dot segment', async () => {
  const result = await checkMutatedV5((surface) => {
    surface.routeBase = '/docs/ess/../other/';
    surface.canonicalUrl = 'https://beyond10x.github.io/docs/other/';
  });
  assert.equal(result.code, 1, detail(result));
  assert.match(result.stderr, /^b10x\.docs\.yaml(?::\d+)?: .*routeBase/m);
});

// Website prepare-site.mjs:101 assertDocumentationFamilyDistribution -> sidebar-contract.mjs:
// `throw new Error(`${repository} declares unknown documentation family ${declared.group}`)` when a
// source's navigation.group is not a family id in data/ecosystem-families.json (Foundation, Build,
// Services, Products). The refusal depends on this one manifest alone.
//
// Coordinator decision (wave 3b, U4 correction round 1): check-source does not refuse it. The family
// list is Website-owned data, and a copy in Docs System would drift from it. This case pins today's
// behaviour so that changing it is a deliberate decision, not an accident.
test('check-source does not refuse a v5 navigation group outside the Website documentation families', async () => {
  const result = await checkMutatedV5((surface) => {
    surface.source.navigation.group = 'Nonsense';
  });
  assert.equal(
    result.code,
    0,
    `the documentation family list is Website-owned data (data/ecosystem-families.json); check-source deliberately does not copy it, so an unknown navigation group passes here and is refused by Website alone. Changing this is a decision for the coordinator, not a fix.\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
  );
});
