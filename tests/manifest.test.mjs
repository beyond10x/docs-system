import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {writeJsonFeed, writeRss} from '../dist/feeds.js';
import {buildLedger, buildRegistry, readChange, readManifest} from '../dist/manifest.js';

test('public registry dual-reads v1 and v2 deterministically', async () => {
  const v1 = await readManifest(new URL('../fixtures/public.yaml', import.meta.url));
  const v2 = await readManifest(new URL('../fixtures/public-v2.yaml', import.meta.url));
  v1.surfaces.push({...v1.surfaces[0], id: 'internal', canonicalUrl: 'https://service.invalid/docs/', availability: 'local-only', discoverability: 'internal'});
  const registry = buildRegistry([v2, v1]);
  assert.equal(registry.schema, 'b10x-docs-registry/v2');
  assert.deepEqual(registry.surfaces.map((surface) => surface.key), ['agentplugins/docs', 'getting-started/docs']);
  assert.equal(registry.surfaces[0].adoption.mode, 'install');
});

test('a public relationship to an unavailable surface is refused', async () => {
  const manifest = await readManifest(new URL('../fixtures/public.yaml', import.meta.url));
  manifest.surfaces[0].relationships = [{target: 'private/docs', kind: 'uses'}];
  assert.throws(() => buildRegistry([manifest]), /non-public surface private\/docs/);
});

test('ledger enriches releases and validates public relationships', async () => {
  const manifests = await Promise.all([
    readManifest(new URL('../fixtures/public.yaml', import.meta.url)),
    readManifest(new URL('../fixtures/public-v2.yaml', import.meta.url)),
  ]);
  const change = await readChange(new URL('../fixtures/change.yaml', import.meta.url));
  const ledger = buildLedger(buildRegistry(manifests), [change], {
    schema: 'b10x-release-facts/v1',
    releases: [
      {repository: 'agentplugins', version: '0.3.1', publishedAt: '2026-09-01T12:00:00Z', url: 'https://github.com/beyond10x/agentplugins/releases/tag/0.3.1'},
      {repository: 'getting-started', version: '0.1.0', publishedAt: '2026-08-31T12:00:00Z', url: 'https://github.com/beyond10x/getting-started/releases/tag/0.1.0'},
      {repository: 'private', version: '9.9.9', publishedAt: '2026-09-02T12:00:00Z', url: 'https://example.invalid/private'},
    ],
  });
  assert.deepEqual(ledger.changes.map((entry) => entry.key), ['agentplugins/0.3.1', 'getting-started/0.1.0']);
  assert.equal(ledger.changes[0].automatic, false);
  assert.equal(ledger.changes[1].automatic, true);
});

test('change relations cannot expose unknown public state', async () => {
  const manifests = await Promise.all([
    readManifest(new URL('../fixtures/public.yaml', import.meta.url)),
    readManifest(new URL('../fixtures/public-v2.yaml', import.meta.url)),
  ]);
  const change = await readChange(new URL('../fixtures/change.yaml', import.meta.url));
  change.relations = [{target: 'change:aep/missing', kind: 'depends-on'}];
  assert.throws(() => buildLedger(buildRegistry(manifests), [change]), /unknown change aep\/missing/);
});

test('feeds are stable derivatives of the ledger', async () => {
  const manifests = await Promise.all([
    readManifest(new URL('../fixtures/public.yaml', import.meta.url)),
    readManifest(new URL('../fixtures/public-v2.yaml', import.meta.url)),
  ]);
  const change = await readChange(new URL('../fixtures/change.yaml', import.meta.url));
  const ledger = buildLedger(buildRegistry(manifests), [change]);
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-docs-system-'));
  const rss = path.join(directory, 'feed.xml');
  const json = path.join(directory, 'feed.json');

  await writeRss(rss, ledger);
  await writeJsonFeed(json, ledger);
  const first = await Promise.all([fs.readFile(rss, 'utf8'), fs.readFile(json, 'utf8')]);
  await writeRss(rss, ledger);
  await writeJsonFeed(json, ledger);
  const second = await Promise.all([fs.readFile(rss, 'utf8'), fs.readFile(json, 'utf8')]);

  assert.deepEqual(second, first);
  assert.match(first[0], /<guid isPermaLink="false">agentplugins\/0.3.1<\/guid>/);
  assert.equal(JSON.parse(first[1]).items[0].id, 'agentplugins/0.3.1');
  await fs.rm(directory, {recursive: true});
});
