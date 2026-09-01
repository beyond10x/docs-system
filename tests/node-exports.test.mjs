import assert from 'node:assert/strict';
import test from 'node:test';

test('documented Node-safe package subpaths load without Docusaurus theme aliases', async () => {
  const modules = await Promise.all([
    import('@beyond10x/docs-system/manifest'),
    import('@beyond10x/docs-system/collector'),
    import('@beyond10x/docs-system/discovery'),
    import('@beyond10x/docs-system/feeds'),
    import('@beyond10x/docs-system/redirects'),
    import('@beyond10x/docs-system/types'),
  ]);
  assert.equal(typeof modules[0].readManifest, 'function');
  assert.equal(typeof modules[0].readSourceLock, 'function');
  assert.equal(typeof modules[1].collectManifestSources, 'function');
  assert.equal(typeof modules[2].renderDiscoveryBlock, 'function');
  assert.equal(typeof modules[3].writeJsonFeed, 'function');
  assert.equal(typeof modules[4].writeRedirectMap, 'function');
  assert.deepEqual(Object.keys(modules[5]), []);
});

test('published schema subpaths load as JSON in plain Node', async () => {
  const schemas = await Promise.all([
    import('@beyond10x/docs-system/schema', {with: {type: 'json'}}),
    import('@beyond10x/docs-system/schema/v2', {with: {type: 'json'}}),
    import('@beyond10x/docs-system/schema/v3', {with: {type: 'json'}}),
    import('@beyond10x/docs-system/schema/change', {with: {type: 'json'}}),
    import('@beyond10x/docs-system/schema/change/v2', {with: {type: 'json'}}),
    import('@beyond10x/docs-system/schema/sources', {with: {type: 'json'}}),
    import('@beyond10x/docs-system/schema/redirects', {with: {type: 'json'}}),
  ]);
  assert.deepEqual(schemas.map((schema) => schema.default.$schema), Array(schemas.length).fill('https://json-schema.org/draft/2020-12/schema'));
});
