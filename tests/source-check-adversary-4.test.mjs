// Adversarial pass 2 on story:docs-v3-check-source-accepts-v5: hasDotSegment refuses a literal `.` or
// `..` segment, but a published route is resolved by a browser under the WHATWG URL rules, which also
// treat `%2e%2e` (any case, or mixed with a literal dot) as a double-dot segment and `\` as `/` for an
// https URL. A route that carries either form passes the literal-segment test, is written to disk inside
// its own directory, and is served at a URL that every browser, link and feed reader resolves into
// another repository's namespace.
//
// Measured against Docusaurus 3.10.2 `normalizeUrl` and Node's WHATWG `URL`:
//   /updates/field-notes/ess/%2e%2e/aep/post/  -> https://beyond10x.github.io/updates/field-notes/aep/post/
//   /updates/field-notes/ess/..\aep\post/      -> https://beyond10x.github.io/updates/field-notes/aep/post/
//   /docs/ess/%2e%2e/aep/                      -> https://beyond10x.github.io/docs/aep/
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {promisify} from 'node:util';
import {stringify, parse} from 'yaml';

const execFileAsync = promisify(execFile);
const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const essV5 = new URL('../fixtures/ess-v5.yaml', import.meta.url);
const repository = fileURLToPath(new URL('./fixtures/source-check/v5-ess/', import.meta.url));

async function checkV5(prepare) {
  const manifest = parse(await fs.readFile(essV5, 'utf8'));
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-docs-check-source-adv4-'));
  try {
    await fs.cp(repository, directory, {recursive: true});
    await fs.writeFile(path.join(directory, 'b10x.docs.yaml'), stringify(manifest), 'utf8');
    await prepare(directory);
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

const withSlug = (slug) => async (directory) => {
  const file = path.join(directory, 'website/blog/2026-09-01-release.md');
  const raw = await fs.readFile(file, 'utf8');
  await fs.writeFile(file, raw.replace('title: Release note\n', `title: Release note\nslug: ${JSON.stringify(slug)}\n`), 'utf8');
};

const withDocument = (relative) => async (directory) => {
  const file = path.join(directory, 'website', relative);
  await fs.mkdir(path.dirname(file), {recursive: true});
  await fs.writeFile(file, '---\ndescription: A page.\n---\n\n# A page\n\nText.\n', 'utf8');
};

test('check-source refuses a blog slug that leaves its repository through a percent-encoded dot segment', async () => {
  const result = await checkV5(withSlug('%2e%2e/aep/post'));
  assert.equal(result.code, 1, detail(result));
  assert.match(result.stderr, /^website\/blog\/2026-09-01-release\.md(?::\d+)?: .*slug/m);
});

test('check-source refuses a blog slug that leaves its repository through backslash separators', async () => {
  const result = await checkV5(withSlug('..\\aep\\post'));
  assert.equal(result.code, 1, detail(result));
  assert.match(result.stderr, /^website\/blog\/2026-09-01-release\.md(?::\d+)?: .*slug/m);
});

test('check-source refuses a document whose path puts a percent-encoded dot segment in its route', async () => {
  const result = await checkV5(withDocument('docs/%2e%2e/aep.md'));
  assert.equal(result.code, 1, detail(result));
  assert.match(result.stderr, /%2e%2e/);
});

test('check-source refuses a document whose path puts a backslash-separated dot segment in its route', async () => {
  const result = await checkV5(withDocument('docs/..\\aep.md'));
  assert.equal(result.code, 1, detail(result));
  assert.match(result.stderr, /aep/);
});
