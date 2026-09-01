import assert from 'node:assert/strict';
import test from 'node:test';
import {buildRegistry, readManifest} from '../dist/manifest.js';

test('public registry is deterministic and excludes internal surfaces', async () => {
  const manifest = await readManifest(new URL('../fixtures/public.yaml', import.meta.url));
  manifest.surfaces.push({...manifest.surfaces[0], id: 'internal', canonicalUrl: 'https://service.invalid/docs/', availability: 'local-only', discoverability: 'internal'});
  const registry = buildRegistry([manifest]);
  assert.deepEqual(registry.surfaces.map((surface) => surface.key), ['getting-started/docs']);
});

test('a public relationship to an unavailable surface is refused', async () => {
  const manifest = await readManifest(new URL('../fixtures/public.yaml', import.meta.url));
  manifest.surfaces[0].relationships = [{target: 'private/docs', kind: 'uses'}];
  assert.throws(() => buildRegistry([manifest]), /non-public surface private\/docs/);
});
