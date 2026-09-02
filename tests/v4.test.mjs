import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {promisify} from 'node:util';
import {collectManifestSources} from '../dist/collector.js';
import {
  buildDocumentPageIndex,
  effectiveDocumentPageMetadata,
  parseDocumentPageMetadata,
  readDocumentPageMetadata,
  resolveDocumentPageMetadata,
} from '../dist/documents.js';
import {
  evaluateExperienceCatalog,
  mostRestrictiveAccess,
  normalizeManifestExperiences,
  validateExperienceCatalogSemantics,
  validateManifestExperienceReferences,
} from '../dist/experiences.js';
import {buildRegistry, readDocument, readExperienceCatalog, readManifest} from '../dist/manifest.js';

const execFileAsync = promisify(execFile);

test('experience catalog evaluates the most restrictive access and honest CTA state', async () => {
  const catalog = await readExperienceCatalog(new URL('../fixtures/experiences.yaml', import.meta.url));
  const evaluated = evaluateExperienceCatalog(catalog);
  const source = evaluated[0].adoptionPaths[0];
  assert.equal(source.effectiveAccess, 'public');
  assert.equal(source.actionable, true);
  assert.deepEqual(source.blockers, []);
  assert.deepEqual(source.artifacts.map((artifact) => artifact.id), ['docs-system-documentation', 'docs-system-source']);

  const production = evaluated[1].adoptionPaths[0];
  assert.equal(production.access, 'public');
  assert.equal(production.effectiveAccess, 'private');
  assert.equal(production.actionable, false);
  assert.deepEqual(production.blockers, ['non-actionable-support', 'unavailable-artifact', 'private-access']);
  assert.match(production.explanation, /devcenter-container \(unpublished\)/);
  assert.equal(mostRestrictiveAccess('public', 'account-required', 'approval-required'), 'approval-required');

  const approvalCatalog = structuredClone(catalog);
  approvalCatalog.artifacts[1].access = 'approval-required';
  approvalCatalog.experiences[0].adoptionPaths[0].support = 'experimental';
  const approval = evaluateExperienceCatalog(approvalCatalog)[0].adoptionPaths[0];
  assert.equal(approval.effectiveAccess, 'approval-required');
  assert.equal(approval.actionable, true);

  delete approvalCatalog.experiences[0].adoptionPaths[0].url;
  const statusOnly = evaluateExperienceCatalog(approvalCatalog)[0].adoptionPaths[0];
  assert.equal(statusOnly.actionable, false);
  assert.deepEqual(statusOnly.blockers, ['missing-url']);
});

test('experience catalog rejects duplicate identities and dangling artifacts', async () => {
  const catalog = await readExperienceCatalog(new URL('../fixtures/experiences.yaml', import.meta.url));
  const duplicateArtifact = structuredClone(catalog);
  duplicateArtifact.artifacts.push({...duplicateArtifact.artifacts[0]});
  assert.throws(() => validateExperienceCatalogSemantics(duplicateArtifact), /duplicate artifact docs-system-documentation/);

  const duplicatePath = structuredClone(catalog);
  duplicatePath.experiences[0].adoptionPaths.push({...duplicatePath.experiences[0].adoptionPaths[0]});
  assert.throws(() => validateExperienceCatalogSemantics(duplicatePath), /duplicate adoption path source/);

  const dangling = structuredClone(catalog);
  dangling.experiences[0].adoptionPaths[0].artifactIds.push('missing');
  assert.throws(() => validateExperienceCatalogSemantics(dangling), /requires unknown artifact missing/);
});

test('v4 keeps publication independent from access and joins stable experience ids', async () => {
  const [manifest, catalog] = await Promise.all([
    readManifest(new URL('../fixtures/public-v4.yaml', import.meta.url)),
    readExperienceCatalog(new URL('../fixtures/experiences.yaml', import.meta.url)),
  ]);
  assert.equal(manifest.surfaces[0].publication.availability, 'published');
  assert.equal(manifest.surfaces[0].documentDefaults.access, 'public');
  validateManifestExperienceReferences(manifest, catalog);

  const normalized = normalizeManifestExperiences(manifest, catalog);
  assert.equal(normalized[0].compatibility, false);
  assert.equal(normalized[0].experiences[0].id, 'validate-documentation');
  assert.equal(normalized[0].experiences[0].adoptionPaths[0].actionable, true);

  const registry = buildRegistry([manifest]);
  assert.equal(registry.surfaces.length, 1);
  assert.equal(registry.surfaces[0].availability, 'published');
  assert.equal(registry.surfaces[0].discoverability, 'public');
  assert.deepEqual(registry.surfaces[0].audiences, ['developer']);

  const hidden = structuredClone(manifest);
  hidden.surfaces[0].publication.discoverability = 'unlisted';
  assert.equal(buildRegistry([hidden]).surfaces.length, 0);

  const publishedButPrivate = structuredClone(manifest);
  publishedButPrivate.surfaces[0].documentDefaults.access = 'private';
  assert.equal(buildRegistry([publishedButPrivate]).surfaces.length, 1);
  assert.equal(publishedButPrivate.surfaces[0].publication.discoverability, 'public');
});

test('v4 semantic validation refuses undeclared defaults and broken compatibility journeys', async () => {
  const fixture = await fs.readFile(new URL('../fixtures/public-v4.yaml', import.meta.url), 'utf8');
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-v4-invalid-'));
  try {
    const experience = path.join(directory, 'experience.yaml');
    const journey = path.join(directory, 'journey.yaml');
    await fs.writeFile(experience, fixture.replace('experienceIds: [validate-documentation]\n      support:', 'experienceIds: [deploy-devcenter]\n      support:'));
    await fs.writeFile(journey, fixture.replace('journeys: [build-agents, operate-services]', 'journeys: [operate-services]'));
    await assert.rejects(readManifest(experience), /document default experience deploy-devcenter is not declared/);
    await assert.rejects(readManifest(journey), /primaryJourney must also appear in journeys/);
  } finally {
    await fs.rm(directory, {recursive: true});
  }
});

test('unspecified access and support are derived-only compatibility values', async () => {
  const [v4Fixture, experiencesFixture] = await Promise.all([
    fs.readFile(new URL('../fixtures/public-v4.yaml', import.meta.url), 'utf8'),
    fs.readFile(new URL('../fixtures/experiences.yaml', import.meta.url), 'utf8'),
  ]);
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-unspecified-invalid-'));
  try {
    const manifest = path.join(directory, 'manifest.yaml');
    const experiences = path.join(directory, 'experiences.yaml');
    await fs.writeFile(manifest, v4Fixture.replace('access: public\n    journeys:', 'access: unspecified\n    journeys:'));
    await fs.writeFile(experiences, experiencesFixture.replace('support: supported', 'support: unspecified'));
    await assert.rejects(readManifest(manifest), /must be equal to one of the allowed values/);
    await assert.rejects(readExperienceCatalog(experiences), /must be equal to one of the allowed values/);
  } finally {
    await fs.rm(directory, {recursive: true});
  }
});

test('page parser validates only the top-level b10x value and returns declared plus effective metadata', async () => {
  const manifest = await readManifest(new URL('../fixtures/public-v4.yaml', import.meta.url));
  const file = new URL('../fixtures/page-v1.md', import.meta.url);
  const declared = await readDocumentPageMetadata(file);
  assert.deepEqual(declared, {
    schema: 'b10x-doc-page/v1',
    audiences: ['operator'],
    experienceIds: ['validate-documentation'],
    support: 'preview',
    access: 'account-required',
  });
  const source = await fs.readFile(file, 'utf8');
  const resolved = await resolveDocumentPageMetadata(manifest, 'docs', source, 'page-v1.md');
  assert.deepEqual(resolved.declared, declared);
  assert.deepEqual(resolved.effective, {
    audiences: ['operator'],
    experienceIds: ['validate-documentation'],
    support: 'preview',
    access: 'account-required',
    compatibility: false,
  });

  assert.equal(await parseDocumentPageMetadata('---\ntitle: Ordinary Docusaurus page\n---\n\n# Page\n'), undefined);
  assert.deepEqual(effectiveDocumentPageMetadata(manifest, 'docs'), {
    audiences: ['developer'],
    experienceIds: ['validate-documentation'],
    support: 'supported',
    access: 'public',
    compatibility: false,
  });
  await assert.rejects(
    parseDocumentPageMetadata('---\nb10x:\n  schema: b10x-doc-page/v1\n  audiences: [developer]\n  experienceIds: [validate-documentation]\n  access: unspecified\n---\n'),
    /must be equal to one of the allowed values/,
  );
});

test('v1-v3 normalize as unspecified, artifact-free, and never actionable', async () => {
  const manifest = await readManifest(new URL('../fixtures/public-v3.yaml', import.meta.url));
  const normalized = normalizeManifestExperiences(manifest);
  assert.equal(normalized[0].compatibility, true);
  assert.deepEqual(normalized[0].experienceIds, ['legacy-build-agents', 'legacy-operate-services']);
  for (const experience of normalized[0].experiences) {
    assert.equal(experience.compatibility, true);
    assert.equal(experience.adoptionPaths[0].support, 'unspecified');
    assert.equal(experience.adoptionPaths[0].effectiveAccess, 'unspecified');
    assert.deepEqual(experience.adoptionPaths[0].artifacts, []);
    assert.equal(experience.adoptionPaths[0].actionable, false);
  }
  assert.deepEqual(effectiveDocumentPageMetadata(manifest, 'docs'), {
    audiences: ['developer'],
    experienceIds: ['legacy-build-agents', 'legacy-operate-services'],
    support: 'unspecified',
    access: 'unspecified',
    compatibility: true,
  });
});

test('v4 collection keeps b10x-docs-collection/v1 unchanged and emits metadata separately', async () => {
  const repository = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-v4-collect-'));
  try {
    await fs.mkdir(path.join(repository, 'docs'), {recursive: true});
    await fs.writeFile(path.join(repository, 'README.md'), '# Example\n');
    await fs.writeFile(path.join(repository, 'docs', 'operator.md'), await fs.readFile(new URL('../fixtures/page-v1.md', import.meta.url), 'utf8'));
    const v3 = manifestV3();
    const v4 = manifestV4();
    const [legacyIndex, v4Index] = await Promise.all([
      collectManifestSources(v3, repository),
      collectManifestSources(v4, repository),
    ]);
    assert.deepEqual(v4Index, legacyIndex);
    assert.equal(v4Index.schema, 'b10x-docs-collection/v1');
    assert.ok(v4Index.files.every((file) => !('effective' in file) && !('metadata' in file)));

    const documentIndex = await buildDocumentPageIndex(v4, v4Index, repository);
    assert.equal(documentIndex.schema, 'b10x-doc-index/v1');
    assert.deepEqual(documentIndex.pages.map((page) => page.sourcePath), ['docs/operator.md', 'README.md']);
    const readme = documentIndex.pages.find((page) => page.sourcePath === 'README.md');
    const operator = documentIndex.pages.find((page) => page.sourcePath === 'docs/operator.md');
    assert.equal(readme.declared, undefined);
    assert.equal(readme.effective.support, 'supported');
    assert.equal(operator.declared.schema, 'b10x-doc-page/v1');
    assert.equal(operator.effective.access, 'account-required');

    await fs.writeFile(path.join(repository, 'docs', 'operator.md'), '---\nb10x:\n  schema: b10x-doc-page/v1\n  audiences: [operator]\n  experienceIds: [not-declared]\n---\n');
    await assert.rejects(collectManifestSources(v4, repository), /experience not-declared not declared by the surface/);
  } finally {
    await fs.rm(repository, {recursive: true});
  }
});

test('readDocument dual-reads new public schemas', async () => {
  const documents = await Promise.all([
    readDocument(new URL('../fixtures/public-v4.yaml', import.meta.url)),
    readDocument(new URL('../fixtures/experiences.yaml', import.meta.url)),
    readDocument(new URL('../fixtures/page-v1.yaml', import.meta.url)),
  ]);
  assert.deepEqual(documents.map((document) => document.schema), ['b10x-docs/v4', 'b10x-experiences/v1', 'b10x-doc-page/v1']);
});

test('CLI validates embedded page metadata', async () => {
  const page = new URL('../fixtures/page-v1.md', import.meta.url);
  const {stdout} = await execFileAsync(process.execPath, [new URL('../dist/cli.js', import.meta.url).pathname, 'validate-page', page.pathname]);
  assert.match(stdout, /b10x-doc-page\/v1 valid/);
});

test('immutable manifest and source-lock schema bytes remain unchanged', async () => {
  const expected = new Map([
    ['b10x.docs.schema.json', 'e1ea1fe308109b2b78d4aafd8bb405c4b3ddc154dc82dfcd9c14acbc4a8cb392'],
    ['b10x.docs.v2.schema.json', 'e6cc89b55176712709cc76df2e718ccc9e79a9c9a426cde9256ec96c241f25e1'],
    ['b10x.docs.v3.schema.json', 'ad456e1b77dedbf734522e77b95a2110c0308ddf4192a29eaca84a1d489027ae'],
    ['b10x.sources.schema.json', '5ee49f6ebe8e97c850c8e2d77d9f1e3a40daacd5ef1086bde6345e63af669489'],
  ]);
  for (const [file, digest] of expected) {
    const bytes = await fs.readFile(new URL(`../schema/${file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), digest, file);
  }
});

function manifestV3() {
  return {
    schema: 'b10x-docs/v3',
    repository: {id: 'example', url: 'https://github.com/beyond10x/example', displayName: 'Example'},
    delivery: {publisher: 'website', repository: 'beyond10x.github.io', origin: 'https://beyond10x.github.io'},
    surfaces: [{
      id: 'docs', name: 'Example', summary: 'Example documentation.', kind: 'documentation',
      canonicalUrl: 'https://beyond10x.github.io/docs/example/', maturity: 'development', availability: 'published',
      discoverability: 'public', audiences: ['developer'], primaryJourney: 'build-agents', journeys: ['build-agents'],
      capabilities: ['example'], sections: [], adoption: {label: 'Read', url: 'https://beyond10x.github.io/docs/example/', mode: 'browser', estimatedMinutes: 5, outcome: 'Read it.'},
      routeBase: '/docs/example/', source: {root: '.', documents: {include: ['README.md', 'docs/*.md']}},
    }],
  };
}

function manifestV4() {
  return {
    schema: 'b10x-docs/v4',
    repository: {id: 'example', url: 'https://github.com/beyond10x/example', displayName: 'Example'},
    delivery: {publisher: 'website', repository: 'beyond10x.github.io', origin: 'https://beyond10x.github.io'},
    surfaces: [{
      id: 'docs', name: 'Example', summary: 'Example documentation.', kind: 'documentation',
      canonicalUrl: 'https://beyond10x.github.io/docs/example/', maturity: 'development',
      publication: {availability: 'published', discoverability: 'public'},
      experienceIds: ['validate-documentation'],
      documentDefaults: {audiences: ['developer'], experienceIds: ['validate-documentation'], support: 'supported', access: 'public'},
      capabilities: ['example'], sections: [], routeBase: '/docs/example/',
      source: {root: '.', documents: {include: ['README.md', 'docs/*.md']}},
    }],
  };
}
