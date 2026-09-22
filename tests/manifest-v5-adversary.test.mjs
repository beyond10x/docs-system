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
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-docs-v5-adv-'));
  const file = path.join(directory, 'b10x.docs.yaml');
  try {
    await fs.writeFile(file, stringify(document), 'utf8');
    await check(file);
  } finally {
    await fs.rm(directory, {recursive: true});
  }
}

// ESS's manifest on origin/main publishes docs/**/*.md minus this exclude list, which names
// docs/examples/specification-to-contracts.md; website/sidebars.ts lists that document. Today the
// curated sidebar is therefore refused against ESS's real selection, naming the path.
// story:docs-v3-ess-portal-fidelity removes the exclude from ESS; when it lands, flip this case to
// assert that the sidebar validates against ESS's selection.
test('adversary: against the selection ESS publishes today, the curated sidebar is refused naming the excluded example', async () => {
  await withManifest(
    (surface) => {
      surface.source.documents.exclude = [
        'docs/adr/**',
        'docs/adrs/**',
        'docs/decisions/**',
        'docs/examples/specification-to-contracts.md',
        'docs/internal/**',
        'docs/plans/**',
        'docs/stories/**',
        'docs/worklogs/**',
      ];
    },
    (file) => assert.rejects(
      readManifest(file),
      /sidebar leaf docs\/examples\/specification-to-contracts\.md is not a published document/,
      'ESS still excludes docs/examples/specification-to-contracts.md; flip this case to expect validation when story:docs-v3-ess-portal-fidelity removes that exclude',
    ),
  );
});

test('adversary: a leaf listed in two sidebar categories is refused', async () => {
  await withManifest(
    (surface) => surface.source.navigation.sidebar[1].items.push('docs/getting-started.md'),
    (file) => assert.rejects(readManifest(file), /docs\/getting-started\.md/),
  );
});

test('adversary: a document both placed in the sidebar and withheld from the menu is refused', async () => {
  await withManifest(
    (surface) => surface.source.navigation.menuWithheld.push('docs/getting-started.md'),
    (file) => assert.rejects(readManifest(file), /docs\/getting-started\.md/),
  );
});

test('adversary: the same withheld document spelled twice (./ prefix) is refused', async () => {
  await withManifest(
    (surface) => surface.source.navigation.menuWithheld.push('./docs/guides/record-realization.md'),
    (file) => assert.rejects(readManifest(file), /record-realization\.md/),
  );
});

test('adversary: a non-canonical leaf that is not the collected path is refused', async () => {
  await withManifest(
    (surface) => { surface.source.navigation.sidebar[0].items[1] = './docs//getting-started.md'; },
    (file) => assert.rejects(readManifest(file), /getting-started\.md/),
  );
});

test('adversary: a leaf that normalizes above source.root is refused', async () => {
  await withManifest(
    (surface) => {
      surface.source.documents.include = ['**/*.md'];
      surface.source.navigation.sidebar[0].items.push('x\n/../../secret.md');
    },
    (file) => assert.rejects(readManifest(file), /secret\.md/),
  );
});

test('adversary: a leaf in a directory the collector never collects is refused', async () => {
  await withManifest(
    (surface) => surface.source.navigation.sidebar[0].items.push('docs/build/overview.md'),
    (file) => assert.rejects(readManifest(file), /sidebar leaf docs\/build\/overview\.md is not a published document/),
  );
});
