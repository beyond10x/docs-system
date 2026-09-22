import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {collectManifestSources} from '../dist/collector.js';
import {discoveryOptionsFromManifest} from '../dist/discovery.js';
import {effectiveDocumentPageMetadata} from '../dist/documents.js';
import {normalizeManifestExperiences} from '../dist/experiences.js';
import {readExperienceCatalog} from '../dist/manifest.js';

function manifestV5() {
  return {
    schema: 'b10x-docs/v5',
    repository: {id: 'example', url: 'https://github.com/beyond10x/example', displayName: 'Example'},
    delivery: {publisher: 'website', repository: 'beyond10x.github.io', origin: 'https://beyond10x.github.io'},
    surfaces: [{
      id: 'docs', name: 'Example', summary: 'Example documentation.', kind: 'documentation',
      canonicalUrl: 'https://beyond10x.github.io/docs/example/', maturity: 'development',
      publication: {availability: 'published', discoverability: 'public'},
      experienceIds: ['validate-documentation'],
      documentDefaults: {audiences: ['developer'], experienceIds: ['validate-documentation'], support: 'supported', access: 'public'},
      capabilities: ['example'], sections: [], routeBase: '/docs/example/',
      source: {
        root: '.',
        documents: {include: ['README.md']},
        navigation: {sidebar: [{label: 'Start', items: ['README.md']}], landing: 'README.md'},
      },
    }],
  };
}

test('every v4 consumer treats a v5 manifest as v4 or later, not as a legacy compatibility projection', async () => {
  const manifest = manifestV5();
  const catalog = await readExperienceCatalog(new URL('../fixtures/experiences.yaml', import.meta.url));

  const [experiences] = normalizeManifestExperiences(manifest, catalog);
  assert.equal(experiences.compatibility, false);
  assert.deepEqual(experiences.experienceIds, ['validate-documentation']);

  const effective = effectiveDocumentPageMetadata(manifest, 'docs');
  assert.equal(effective.compatibility, false);
  assert.equal(effective.support, 'supported');

  assert.equal(discoveryOptionsFromManifest(manifest).origin, 'https://beyond10x.github.io');

  const repository = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-v5-collect-'));
  try {
    await fs.writeFile(path.join(repository, 'README.md'), '# Example\n');
    const index = await collectManifestSources(manifest, repository);
    assert.deepEqual(index.files.map((file) => file.sourcePath), ['README.md']);
  } finally {
    await fs.rm(repository, {recursive: true});
  }
});
