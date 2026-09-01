import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  assertPassiveMdx,
  collectManifestSources,
  verifyCollectionLock,
} from '../dist/collector.js';
import {
  discoveryOptionsFromManifest,
  renderDiscoveryBlock,
  updateDiscoveryBlock,
  writeDiscoveryBlock,
} from '../dist/discovery.js';
import {selectFeedEntries} from '../dist/feeds.js';
import {
  buildLedger,
  buildRegistry,
  readChange,
  readManifest,
  readRedirectMap,
  readSourceLock,
} from '../dist/manifest.js';
import {renderRedirectHtml, writeRedirectMap} from '../dist/redirects.js';

test('v3 validates central delivery and joins the legacy public registry', async () => {
  const manifests = await Promise.all([
    readManifest(new URL('../fixtures/public.yaml', import.meta.url)),
    readManifest(new URL('../fixtures/public-v2.yaml', import.meta.url)),
    readManifest(new URL('../fixtures/public-v3.yaml', import.meta.url)),
  ]);
  const registry = buildRegistry(manifests);
  assert.deepEqual(registry.surfaces.map((surface) => surface.key), ['agentplugins/docs', 'docs-system/docs', 'getting-started/docs']);
  const docsSystem = registry.surfaces.find((surface) => surface.key === 'docs-system/docs');
  assert.equal(docsSystem.repository.displayName, 'Docs System');
  assert.equal(docsSystem.routeBase, '/docs/docs-system/');
  assert.equal(docsSystem.shell, undefined);
});

test('v3 semantic validation ties canonical routing and primary journey to the declaration', async () => {
  const fixture = await fs.readFile(new URL('../fixtures/public-v3.yaml', import.meta.url), 'utf8');
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-v3-invalid-'));
  const canonical = path.join(directory, 'canonical.yaml');
  const journey = path.join(directory, 'journey.yaml');
  await fs.writeFile(canonical, fixture.replace('https://beyond10x.github.io/docs/docs-system/', 'https://beyond10x.github.io/docs/wrong/'));
  await fs.writeFile(journey, fixture.replace('primaryJourney: build-agents', 'primaryJourney: understand'));
  await assert.rejects(readManifest(canonical), /canonicalUrl must be/);
  await assert.rejects(readManifest(journey), /primaryJourney must also appear in journeys/);
  await fs.rm(directory, {recursive: true});
});

test('collector copies only declared passive inputs and produces a stable digest', async () => {
  const repository = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-collect-repo-'));
  const output = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-collect-out-'));
  await fs.mkdir(path.join(repository, 'docs'), {recursive: true});
  await fs.mkdir(path.join(repository, 'static'), {recursive: true});
  await fs.mkdir(path.join(repository, 'api'), {recursive: true});
  await fs.writeFile(path.join(repository, 'README.md'), '# Example\n');
  await fs.writeFile(path.join(repository, 'docs', 'guide.mdx'), '# Guide\n\n<Diagram kind="mermaid" source="graph TD; A-->B" title="Flow" description="Flow" />\n');
  await fs.writeFile(path.join(repository, 'static', 'mark.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>\n');
  await fs.writeFile(path.join(repository, 'api', 'openapi.yaml'), 'openapi: 3.1.0\ninfo: {title: Example, version: 1.0.0}\npaths: {}\n');
  await fs.writeFile(path.join(repository, 'not-public.txt'), 'private by omission\n');
  await fs.mkdir(path.join(repository, 'build'), {recursive: true});
  await fs.writeFile(path.join(repository, 'build', 'generated.md'), '# Generated and ignored\n');
  const generatedEnvironment = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-generated-environment-'));
  await fs.symlink(generatedEnvironment, path.join(repository, '.venv'));

  const manifest = v3Manifest({
    root: '.',
    documents: {include: ['README.md', 'docs/**/*.mdx']},
    assets: {include: ['static/*.svg']},
    specifications: [{id: 'http', format: 'openapi', path: 'api/openapi.yaml', route: '/api/example/http/'}],
    components: ['Diagram'],
  });
  const first = await collectManifestSources(manifest, repository, {outputRoot: output});
  await fs.writeFile(path.join(repository, 'build', 'generated.md'), '# Generated changed without affecting collection\n');
  const second = await collectManifestSources(manifest, repository);
  assert.equal(first.contentSha256, second.contentSha256);
  assert.deepEqual(first.files.map((file) => file.sourcePath), ['static/mark.svg', 'docs/guide.mdx', 'README.md', 'api/openapi.yaml']);
  assert.equal(await fs.readFile(path.join(output, 'example', 'docs', 'document', 'README.md'), 'utf8'), '# Example\n');
  assert.equal(first.files.at(-1).route, '/api/example/http/');
  assert.ok(!first.files.some((file) => file.sourcePath === 'not-public.txt'));

  const lock = {schema: 'b10x-sources/v1', sources: [{
    repository: 'example',
    url: 'https://github.com/beyond10x/example',
    commit: '0'.repeat(40),
    manifestPath: 'b10x.docs.yaml',
    manifestSha256: '0'.repeat(64),
    contentSha256: first.contentSha256,
  }]};
  assert.doesNotThrow(() => verifyCollectionLock(lock, first, {commit: '0'.repeat(40), manifestSha256: '0'.repeat(64)}));
  assert.throws(() => verifyCollectionLock(lock, first, {commit: 'f'.repeat(40)}), /checked out/);
  lock.sources[0].contentSha256 = 'f'.repeat(64);
  assert.throws(() => verifyCollectionLock(lock, first), /content digest/);
  await fs.rm(repository, {recursive: true});
  await fs.rm(output, {recursive: true});
  await fs.rm(generatedEnvironment, {recursive: true});
});

test('collector rejects executable MDX, undeclared widgets, escaping links, and unmatched declarations', async () => {
  assert.throws(() => assertPassiveMdx('import Thing from "./Thing"\n', 'guide.mdx'), /import or export/);
  assert.throws(() => assertPassiveMdx('<LabLaunch />\n', 'guide.mdx'), /undeclared shared component LabLaunch/);
  assert.throws(() => assertPassiveMdx('Hello {process.env.SECRET}\n', 'guide.mdx'), /MDX expression/);
  assert.doesNotThrow(() => assertPassiveMdx('```tsx\nexport const ignored = true\n```\n', 'guide.mdx'));

  const repository = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-collect-unsafe-'));
  const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-collect-outside-'));
  await fs.writeFile(path.join(repository, 'README.md'), '# Safe\n');
  await fs.writeFile(path.join(outside, 'secret.md'), '# Secret\n');
  await fs.symlink(path.join(outside, 'secret.md'), path.join(repository, 'escape.md'));
  await assert.rejects(collectManifestSources(v3Manifest({root: '.', documents: {include: ['README.md']}}), repository), /symbolic link|escapes repository source root/);
  await fs.rm(path.join(repository, 'escape.md'));
  await assert.rejects(collectManifestSources(v3Manifest({root: '.', documents: {include: ['missing/**/*.md']}}), repository), /matches no files/);
  await fs.rm(repository, {recursive: true});
  await fs.rm(outside, {recursive: true});
});

test('typed v2 changes split deterministic impact and release channels', async () => {
  const manifests = await Promise.all([
    readManifest(new URL('../fixtures/public.yaml', import.meta.url)),
    readManifest(new URL('../fixtures/public-v2.yaml', import.meta.url)),
    readManifest(new URL('../fixtures/public-v3.yaml', import.meta.url)),
  ]);
  const change = await readChange(new URL('../fixtures/change-v2.yaml', import.meta.url));
  const ledger = buildLedger(buildRegistry(manifests), [change], {
    schema: 'b10x-release-facts/v1',
    releases: [
      {repository: 'docs-system', version: '0.3.0', publishedAt: '2026-09-02T12:00:00Z', url: 'https://github.com/beyond10x/docs-system/releases/tag/0.3.0'},
      {repository: 'agentplugins', version: '0.3.2', publishedAt: '2026-09-03T12:00:00Z', url: 'https://github.com/beyond10x/agentplugins/releases/tag/0.3.2'},
    ],
  });
  assert.deepEqual(selectFeedEntries(ledger, 'impact').map((entry) => entry.key), ['docs-system/0.3.0']);
  assert.deepEqual(selectFeedEntries(ledger, 'releases').map((entry) => entry.key), ['agentplugins/0.3.2']);
  assert.deepEqual(ledger.changes.find((entry) => entry.key === 'docs-system/0.3.0').affectedComponents, ['docs-system/collector']);
});

test('source locks and redirect maps validate duplicates and materialize byte-preserving aliases', async () => {
  const lock = await readSourceLock(new URL('../fixtures/sources.yaml', import.meta.url));
  assert.equal(lock.sources[0].commit.length, 40);
  const redirectMap = await readRedirectMap(new URL('../fixtures/redirects.yaml', import.meta.url));
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-redirects-'));
  const aliases = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-aliases-'));
  await fs.mkdir(path.join(aliases, 'changes'), {recursive: true});
  const feed = '{"version":"https://jsonfeed.org/version/1.1"}\n';
  await fs.writeFile(path.join(aliases, 'changes', 'feed.json'), feed);
  await writeRedirectMap(directory, redirectMap, {aliasSourceRoot: aliases});
  const html = await fs.readFile(path.join(directory, 'getting-started', 'index.html'), 'utf8');
  assert.match(html, /rel="canonical" href="https:\/\/beyond10x.github.io\/"/);
  assert.match(html, /window\.location\.search/);
  assert.equal(await fs.readFile(path.join(directory, 'legacy', 'feed.json'), 'utf8'), feed);
  assert.match(renderRedirectHtml('https://beyond10x.github.io', {type: 'html', from: '/old/', to: '/docs/new/'}), /noindex/);
  await fs.rm(directory, {recursive: true});
  await fs.rm(aliases, {recursive: true});
});

test('README discovery blocks are generated and drift-checkable', async () => {
  const manifest = await readManifest(new URL('../fixtures/public-v3.yaml', import.meta.url));
  const options = discoveryOptionsFromManifest(manifest);
  const block = renderDiscoveryBlock(options);
  assert.match(block, /\[Project\]\(https:\/\/beyond10x.github.io\/ecosystem\/docs-system\/\)/);
  const updated = updateDiscoveryBlock('# Docs System\n', options);
  assert.equal(updateDiscoveryBlock(updated, options), updated);

  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-readme-'));
  const readme = path.join(directory, 'README.md');
  await fs.writeFile(readme, '# Docs System\n');
  assert.equal(await writeDiscoveryBlock(readme, options), true);
  assert.equal(await writeDiscoveryBlock(readme, options, {check: true}), false);
  await fs.writeFile(readme, (await fs.readFile(readme, 'utf8')).replace('[Changes]', '[News]'));
  await assert.rejects(writeDiscoveryBlock(readme, options, {check: true}), /discovery block is stale/);
  await fs.rm(directory, {recursive: true});
});

function v3Manifest(source) {
  return {
    schema: 'b10x-docs/v3',
    repository: {id: 'example', url: 'https://github.com/beyond10x/example', displayName: 'Example'},
    delivery: {publisher: 'website', repository: 'beyond10x.github.io', origin: 'https://beyond10x.github.io'},
    surfaces: [{
      id: 'docs',
      name: 'Example',
      summary: 'Example public documentation.',
      kind: 'documentation',
      canonicalUrl: 'https://beyond10x.github.io/docs/example/',
      maturity: 'development',
      availability: 'published',
      discoverability: 'public',
      audiences: ['developer'],
      primaryJourney: 'build-agents',
      journeys: ['build-agents'],
      capabilities: ['example'],
      sections: [],
      adoption: {label: 'Read', url: 'https://beyond10x.github.io/docs/example/', mode: 'browser', estimatedMinutes: 5, outcome: 'Understand the example.'},
      routeBase: '/docs/example/',
      source,
    }],
  };
}
