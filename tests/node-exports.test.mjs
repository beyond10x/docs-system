import assert from 'node:assert/strict';
import test from 'node:test';

test('documented Node-safe package subpaths load without Docusaurus theme aliases', async () => {
  const modules = await Promise.all([
    import('@beyond10x/docs-system/manifest'),
    import('@beyond10x/docs-system/code'),
    import('@beyond10x/docs-system/collector'),
    import('@beyond10x/docs-system/discovery'),
    import('@beyond10x/docs-system/documents'),
    import('@beyond10x/docs-system/experiences'),
    import('@beyond10x/docs-system/feeds'),
    import('@beyond10x/docs-system/navigation'),
    import('@beyond10x/docs-system/redirects'),
    import('@beyond10x/docs-system/types'),
  ]);
  assert.equal(typeof modules[0].readManifest, 'function');
  assert.equal(typeof modules[0].readSourceLock, 'function');
  assert.equal(typeof modules[1].normalizeMarkdownFenceLanguage, 'function');
  assert.equal(typeof modules[2].collectManifestSources, 'function');
  assert.equal(typeof modules[3].renderDiscoveryBlock, 'function');
  assert.equal(typeof modules[4].buildDocumentPageIndex, 'function');
  assert.equal(typeof modules[5].evaluateExperienceCatalog, 'function');
  assert.equal(typeof modules[5].readExperienceCatalog, 'function');
  assert.equal(typeof modules[6].writeJsonFeed, 'function');
  assert.equal(typeof modules[7].deriveEcosystemNavigation, 'function');
  assert.equal(typeof modules[8].writeRedirectMap, 'function');
  assert.deepEqual(Object.keys(modules[9]), []);
});

test('published schema subpaths load as JSON in plain Node', async () => {
  const schemas = await Promise.all([
    import('@beyond10x/docs-system/schema', {with: {type: 'json'}}),
    import('@beyond10x/docs-system/schema/v2', {with: {type: 'json'}}),
    import('@beyond10x/docs-system/schema/v3', {with: {type: 'json'}}),
    import('@beyond10x/docs-system/schema/v4', {with: {type: 'json'}}),
    import('@beyond10x/docs-system/schema/experiences', {with: {type: 'json'}}),
    import('@beyond10x/docs-system/schema/doc-page', {with: {type: 'json'}}),
    import('@beyond10x/docs-system/schema/change', {with: {type: 'json'}}),
    import('@beyond10x/docs-system/schema/change/v2', {with: {type: 'json'}}),
    import('@beyond10x/docs-system/schema/sources', {with: {type: 'json'}}),
    import('@beyond10x/docs-system/schema/redirects', {with: {type: 'json'}}),
    import('@beyond10x/docs-system/schema/bundle/v1', {with: {type: 'json'}}),
  ]);
  assert.deepEqual(schemas.map((schema) => schema.default.$schema), Array(schemas.length).fill('https://json-schema.org/draft/2020-12/schema'));
});
