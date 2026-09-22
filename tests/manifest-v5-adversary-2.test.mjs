import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {parse, stringify} from 'yaml';
import {readManifest} from '../dist/manifest.js';

const essV5 = new URL('../fixtures/ess-v5.yaml', import.meta.url);

async function withManifest(mutate, check) {
  const document = parse(await fs.readFile(essV5, 'utf8'));
  mutate(document.surfaces[0]);
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-docs-v5-adv2-'));
  const file = path.join(directory, 'b10x.docs.yaml');
  try {
    await fs.writeFile(file, stringify(document), 'utf8');
    await check(file);
  } finally {
    await fs.rm(directory, {recursive: true});
  }
}

// schema/b10x.docs.v5.schema.json describes builtAssets as "Built files" and the README names
// "built files"; the collector's glob dialect makes `*` a wildcard everywhere else in the manifest.
test('adversary 2: a glob is refused as a built asset, which names one file', async () => {
  await withManifest(
    (surface) => { surface.builtAssets = ['static/lab/*.js']; },
    (file) => assert.rejects(readManifest(file), /static\/lab\/\*\.js/),
  );
});

test('adversary 2: a directory is refused as a built asset, which names one file', async () => {
  await withManifest(
    (surface) => { surface.builtAssets = ['static/lab/']; },
    (file) => assert.rejects(readManifest(file), /static\/lab\//),
  );
});

// Built assets travel as assets in the docs bundle (design 1c); the collector never enters build/.
test('adversary 2: a built asset under a directory the collector never enters is refused', async () => {
  await withManifest(
    (surface) => { surface.builtAssets = ['build/lab/lab.js']; },
    (file) => assert.rejects(readManifest(file), /build\/lab\/lab\.js/),
  );
});

// The correction refuses control characters; U+0085 (NEL) is a Unicode control character (Cc) and
// JSON.stringify does not escape it, so a refusal message would not show it either.
test('adversary 2: a C1 control character in a landing path is refused', async () => {
  await withManifest(
    (surface) => { surface.source.navigation.landing = 'docs/\u0085index.md'; surface.source.documents.include = ['**/*.md']; },
    (file) => assert.rejects(readManifest(file), /index\.md/),
  );
});
