import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv2020Module, {type ErrorObject} from 'ajv/dist/2020.js';
import addFormatsModule from 'ajv-formats';
import {parse} from 'yaml';
import type {
  ChangeLedger,
  ChangeLedgerEntry,
  DocumentPageMetadata,
  DocumentationManifest,
  DocumentationManifestV3,
  DocumentationManifestV4,
  EcosystemChange,
  EcosystemRegistry,
  ExperienceCatalog,
  Journey,
  RedirectMap,
  RegistrySurface,
  ReleaseFactsDocument,
  SourceLock,
} from './types.js';

const schemaPaths = {
  'b10x-docs/v1': fileURLToPath(new URL('../schema/b10x.docs.schema.json', import.meta.url)),
  'b10x-docs/v2': fileURLToPath(new URL('../schema/b10x.docs.v2.schema.json', import.meta.url)),
  'b10x-docs/v3': fileURLToPath(new URL('../schema/b10x.docs.v3.schema.json', import.meta.url)),
  'b10x-docs/v4': fileURLToPath(new URL('../schema/b10x.docs.v4.schema.json', import.meta.url)),
  'b10x-experiences/v1': fileURLToPath(new URL('../schema/b10x.experiences.schema.json', import.meta.url)),
  'b10x-doc-page/v1': fileURLToPath(new URL('../schema/b10x.doc-page.schema.json', import.meta.url)),
  'b10x-change/v1': fileURLToPath(new URL('../schema/b10x.change.schema.json', import.meta.url)),
  'b10x-change/v2': fileURLToPath(new URL('../schema/b10x.change.v2.schema.json', import.meta.url)),
  'b10x-sources/v1': fileURLToPath(new URL('../schema/b10x.sources.schema.json', import.meta.url)),
  'b10x-redirects/v1': fileURLToPath(new URL('../schema/b10x.redirects.schema.json', import.meta.url)),
} as const;

type DocumentSchema = keyof typeof schemaPaths;
export type B10xDocument = DocumentationManifest | EcosystemChange | SourceLock | RedirectMap | ExperienceCatalog | DocumentPageMetadata;

interface ValidateFunction {
  (document: unknown): boolean;
  errors?: ErrorObject[] | null;
}
interface AjvLike {compile(schema: unknown): ValidateFunction}
const Ajv2020 = Ajv2020Module as unknown as new (options: {allErrors: boolean; strict: boolean}) => AjvLike;
const addFormats = addFormatsModule as unknown as (ajv: AjvLike) => AjvLike;

export async function readManifest(file: string | URL): Promise<DocumentationManifest> {
  const document = await readTypedDocument(file, ['b10x-docs/v1', 'b10x-docs/v2', 'b10x-docs/v3', 'b10x-docs/v4']) as DocumentationManifest;
  validateManifestSemantics(document, String(file));
  return document;
}

export async function readExperienceCatalog(file: string | URL): Promise<ExperienceCatalog> {
  const catalog = await readTypedDocument(file, ['b10x-experiences/v1']) as ExperienceCatalog;
  const {validateExperienceCatalogSemantics} = await import('./experiences.js');
  validateExperienceCatalogSemantics(catalog, String(file));
  return catalog;
}

export async function validateDocumentPageMetadata(document: unknown, context = 'document page metadata'): Promise<DocumentPageMetadata> {
  const validate = await validatorFor('b10x-doc-page/v1');
  if (!validate(document)) throw new Error(formatErrors(context, 'b10x-doc-page/v1', validate.errors ?? []));
  return document as DocumentPageMetadata;
}

export async function readChange(file: string | URL): Promise<EcosystemChange> {
  return readTypedDocument(file, ['b10x-change/v1', 'b10x-change/v2']) as Promise<EcosystemChange>;
}

export async function readSourceLock(file: string | URL): Promise<SourceLock> {
  const lock = await readTypedDocument(file, ['b10x-sources/v1']) as SourceLock;
  const repositories = new Set<string>();
  for (const source of lock.sources) {
    if (repositories.has(source.repository)) throw new Error(`${String(file)} contains duplicate source ${source.repository}`);
    const expectedUrl = `https://github.com/beyond10x/${source.repository}`;
    if (source.url !== expectedUrl) throw new Error(`${String(file)} source ${source.repository} URL must be ${expectedUrl}`);
    repositories.add(source.repository);
  }
  const declared = lock.sources.map((source) => source.repository);
  const sorted = [...declared].sort((left, right) => left.localeCompare(right));
  if (declared.some((repository, index) => repository !== sorted[index])) throw new Error(`${String(file)} sources must be sorted by repository`);
  return lock;
}

export async function readRedirectMap(file: string | URL): Promise<RedirectMap> {
  const map = await readTypedDocument(file, ['b10x-redirects/v1']) as RedirectMap;
  const routes = new Set<string>();
  for (const redirect of map.redirects) {
    const route = normalizeRoute(redirect.from);
    if (routes.has(route)) throw new Error(`${String(file)} contains duplicate compatibility route ${route}`);
    routes.add(route);
  }
  return map;
}

export async function readDocument(file: string | URL): Promise<B10xDocument> {
  const document = await readTypedDocument(file, Object.keys(schemaPaths) as DocumentSchema[]);
  if (document.schema.startsWith('b10x-docs/')) validateManifestSemantics(document as DocumentationManifest, String(file));
  if (document.schema === 'b10x-experiences/v1') {
    const {validateExperienceCatalogSemantics} = await import('./experiences.js');
    validateExperienceCatalogSemantics(document as ExperienceCatalog, String(file));
  }
  return document;
}

async function readTypedDocument(file: string | URL, accepted: DocumentSchema[]): Promise<B10xDocument> {
  const source = await fs.readFile(file, 'utf8');
  const document: unknown = parse(source);
  const schema = isObject(document) && typeof document.schema === 'string' ? document.schema : '';
  if (!accepted.includes(schema as DocumentSchema)) {
    throw new Error(`${String(file)} has unsupported schema ${schema || '(missing)'}`);
  }
  const validate = await validatorFor(schema as DocumentSchema);
  if (!validate(document)) throw new Error(formatErrors(String(file), schema, validate.errors ?? []));
  return document as B10xDocument;
}

export function buildRegistry(manifests: DocumentationManifest[]): EcosystemRegistry {
  const all = new Map<string, RegistrySurface>();
  const routes = new Map<string, string>();
  for (const manifest of manifests) {
    for (const surface of manifest.surfaces) {
      const key = `${manifest.repository.id}/${surface.id}`;
      if (all.has(key)) throw new Error(`duplicate documentation surface ${key}`);
      const v4Surface = manifest.schema === 'b10x-docs/v4' ? surface as DocumentationManifestV4['surfaces'][number] : undefined;
      const registrySurface = v4Surface
        ? {
            ...v4Surface,
            availability: v4Surface.publication.availability,
            discoverability: v4Surface.publication.discoverability,
            audiences: v4Surface.documentDefaults.audiences,
            journeys: v4Surface.journeys ?? [],
            key,
            repository: manifest.repository,
          }
        : {...surface, key, repository: manifest.repository};
      all.set(key, registrySurface as RegistrySurface);
      if ('routeBase' in surface) {
        const conflict = routes.get(surface.routeBase);
        if (conflict) throw new Error(`documentation route ${surface.routeBase} is declared by both ${conflict} and ${key}`);
        routes.set(surface.routeBase, key);
      }
    }
  }
  const published = [...all.values()]
    .filter((surface) => surface.discoverability === 'public' && surface.availability === 'published')
    .sort((left, right) => left.key.localeCompare(right.key));
  const publicKeys = new Set(published.map((surface) => surface.key));
  for (const surface of published) {
    for (const relation of surface.relationships ?? []) {
      if (!publicKeys.has(relation.target)) {
        throw new Error(`${surface.key} exposes a relationship to non-public surface ${relation.target}`);
      }
    }
  }
  for (const manifest of manifests) {
    if (manifest.schema !== 'b10x-docs/v3' || !manifest.journeyPaths) continue;
    if (!manifest.surfaces.some((surface) => surface.kind === 'front-door')) {
      throw new Error(`${manifest.repository.id} declares journeyPaths without a front-door surface`);
    }
    for (const [journey, keys] of Object.entries(manifest.journeyPaths)) {
      for (const key of keys ?? []) {
        if (!publicKeys.has(key)) throw new Error(`${manifest.repository.id} journey ${journey} includes non-public surface ${key}`);
      }
    }
  }
  return {schema: 'b10x-docs-registry/v2', surfaces: published};
}

export function buildLedger(registry: EcosystemRegistry, changes: EcosystemChange[], releaseFacts?: ReleaseFactsDocument): ChangeLedger {
  const publicSurfaces = new Set(registry.surfaces.map((surface) => surface.key));
  const publicRepositories = new Set(registry.surfaces.map((surface) => surface.repository.id));
  const explicit = new Map<string, ChangeLedgerEntry>();
  for (const change of changes) {
    if (!publicRepositories.has(change.repository)) throw new Error(`${change.id} belongs to non-public repository ${change.repository}`);
    if (explicit.has(change.id)) throw new Error(`duplicate ecosystem change ${change.id}`);
    const entry = normalizeChange(change);
    for (const target of entry.affectedSurfaces) {
      if (!publicSurfaces.has(target)) throw new Error(`${change.id} affects non-public surface ${target}`);
    }
    for (const target of entry.affectedRepositories ?? []) validatePublicTarget(change.id, target, publicRepositories, 'repository');
    for (const target of [...(entry.affectedComponents ?? []), ...(entry.affectedApis ?? [])]) {
      validatePublicTarget(change.id, target.split('/', 1)[0] ?? '', publicRepositories, 'target');
    }
    explicit.set(change.id, entry);
  }
  for (const change of explicit.values()) {
    for (const relation of change.relations ?? []) {
      const [targetType, target] = relation.target.split(':', 2);
      if (targetType === 'surface' && !publicSurfaces.has(target)) throw new Error(`${change.id} relates to non-public surface ${target}`);
      if (targetType === 'change' && !explicit.has(target)) throw new Error(`${change.id} relates to unknown change ${target}`);
    }
  }

  const entries = [...explicit.values()];
  const enrichedReleases = new Set(entries.filter((entry) => entry.source.version).map((entry) => `${entry.repository}/${entry.source.version}`));
  for (const release of releaseFacts?.releases ?? []) {
    const releaseKey = `${release.repository}/${release.version}`;
    if (!publicRepositories.has(release.repository) || enrichedReleases.has(releaseKey)) continue;
    const surfaces = registry.surfaces.filter((surface) => surface.repository.id === release.repository);
    entries.push({
      key: releaseKey,
      id: releaseKey,
      repository: release.repository,
      publishedAt: release.publishedAt,
      title: `${repositoryDisplayName(registry, release.repository)} ${release.version}`,
      summary: `${repositoryDisplayName(registry, release.repository)} released version ${release.version}.`,
      kind: 'release',
      impact: 'notable',
      source: {url: release.url, version: release.version},
      journeys: unique(surfaces.flatMap((surface) => surface.journeys ?? [])),
      affectedSurfaces: surfaces.map((surface) => surface.key),
      automatic: true,
      channel: 'releases',
    });
  }
  entries.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt) || left.key.localeCompare(right.key));
  return {schema: 'b10x-change-ledger/v1', changes: entries};
}

export async function readReleaseFacts(file?: string): Promise<ReleaseFactsDocument | undefined> {
  if (!file) return undefined;
  const document: unknown = JSON.parse(await fs.readFile(file, 'utf8'));
  if (!isObject(document) || document.schema !== 'b10x-release-facts/v1' || !Array.isArray(document.releases)) {
    throw new Error(`${file} does not satisfy b10x-release-facts/v1`);
  }
  for (const release of document.releases) {
    if (!isObject(release) || !['repository', 'version', 'publishedAt', 'url'].every((field) => typeof release[field] === 'string')) {
      throw new Error(`${file} contains an invalid release fact`);
    }
  }
  return document as unknown as ReleaseFactsDocument;
}

export async function writeJson(out: string, document: unknown): Promise<void> {
  await fs.mkdir(path.dirname(out), {recursive: true});
  await fs.writeFile(out, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
}

export const writeRegistry = writeJson;

function validateV3Semantics(manifest: DocumentationManifestV3, file: string): void {
  const expectedRepositoryUrl = `https://github.com/beyond10x/${manifest.repository.id}`;
  if (manifest.repository.url !== expectedRepositoryUrl) {
    throw new Error(`${file} repository.url must be ${expectedRepositoryUrl}`);
  }
  const ids = new Set<string>();
  for (const surface of manifest.surfaces) {
    if (ids.has(surface.id)) throw new Error(`${file} contains duplicate surface ${surface.id}`);
    ids.add(surface.id);
    if (!surface.journeys.includes(surface.primaryJourney)) {
      throw new Error(`${file} surface ${surface.id} primaryJourney must also appear in journeys`);
    }
    const expectedCanonicalUrl = new URL(surface.routeBase, `${manifest.delivery.origin}/`).href;
    if (surface.canonicalUrl !== expectedCanonicalUrl) {
      throw new Error(`${file} surface ${surface.id} canonicalUrl must be ${expectedCanonicalUrl}`);
    }
    const specificationIds = new Set<string>();
    const specificationRoutes = new Set<string>();
    for (const specification of surface.source.specifications ?? []) {
      if (specificationIds.has(specification.id)) throw new Error(`${file} surface ${surface.id} contains duplicate specification ${specification.id}`);
      if (specificationRoutes.has(specification.route)) throw new Error(`${file} surface ${surface.id} contains duplicate specification route ${specification.route}`);
      specificationIds.add(specification.id);
      specificationRoutes.add(specification.route);
    }
  }
}

function validateManifestSemantics(manifest: DocumentationManifest, file: string): void {
  if (manifest.schema === 'b10x-docs/v3') validateV3Semantics(manifest, file);
  if (manifest.schema === 'b10x-docs/v4') validateV4Semantics(manifest, file);
}

function validateV4Semantics(manifest: DocumentationManifestV4, file: string): void {
  const expectedRepositoryUrl = `https://github.com/beyond10x/${manifest.repository.id}`;
  if (manifest.repository.url !== expectedRepositoryUrl) {
    throw new Error(`${file} repository.url must be ${expectedRepositoryUrl}`);
  }
  const ids = new Set<string>();
  for (const surface of manifest.surfaces) {
    if (ids.has(surface.id)) throw new Error(`${file} contains duplicate surface ${surface.id}`);
    ids.add(surface.id);
    if (surface.primaryJourney && !surface.journeys?.includes(surface.primaryJourney)) {
      throw new Error(`${file} surface ${surface.id} primaryJourney must also appear in journeys`);
    }
    const expectedCanonicalUrl = new URL(surface.routeBase, `${manifest.delivery.origin}/`).href;
    if (surface.canonicalUrl !== expectedCanonicalUrl) {
      throw new Error(`${file} surface ${surface.id} canonicalUrl must be ${expectedCanonicalUrl}`);
    }
    for (const experienceId of surface.documentDefaults.experienceIds) {
      if (!surface.experienceIds.includes(experienceId)) {
        throw new Error(`${file} surface ${surface.id} document default experience ${experienceId} is not declared by the surface`);
      }
    }
    const specificationIds = new Set<string>();
    const specificationRoutes = new Set<string>();
    for (const specification of surface.source.specifications ?? []) {
      if (specificationIds.has(specification.id)) throw new Error(`${file} surface ${surface.id} contains duplicate specification ${specification.id}`);
      if (specificationRoutes.has(specification.route)) throw new Error(`${file} surface ${surface.id} contains duplicate specification route ${specification.route}`);
      specificationIds.add(specification.id);
      specificationRoutes.add(specification.route);
    }
  }
}

const validators = new Map<DocumentSchema, Promise<ValidateFunction>>();

function validatorFor(schema: DocumentSchema): Promise<ValidateFunction> {
  const existing = validators.get(schema);
  if (existing) return existing;
  const pending = fs.readFile(schemaPaths[schema], 'utf8').then((source) => {
    const ajv = new Ajv2020({allErrors: true, strict: true});
    addFormats(ajv);
    return ajv.compile(JSON.parse(source));
  });
  validators.set(schema, pending);
  return pending;
}

function normalizeChange(change: EcosystemChange): ChangeLedgerEntry {
  const affectedSurfaces = change.schema === 'b10x-change/v1' ? change.affectedSurfaces : change.affected.surfaces ?? [];
  return {
    key: change.id,
    id: change.id,
    repository: change.repository,
    publishedAt: change.publishedAt,
    title: change.title,
    summary: change.summary,
    kind: change.kind,
    impact: change.impact,
    source: change.source,
    journeys: change.journeys,
    affectedSurfaces,
    ...(change.schema === 'b10x-change/v2' && change.affected.repositories ? {affectedRepositories: change.affected.repositories} : {}),
    ...(change.schema === 'b10x-change/v2' && change.affected.components ? {affectedComponents: change.affected.components} : {}),
    ...(change.schema === 'b10x-change/v2' && change.affected.apis ? {affectedApis: change.affected.apis} : {}),
    ...(change.relations ? {relations: change.relations} : {}),
    ...(change.action ? {action: change.action} : {}),
    automatic: false,
    channel: 'impact',
  };
}

function validatePublicTarget(change: string, target: string, repositories: Set<string>, kind: string): void {
  if (!repositories.has(target)) throw new Error(`${change} affects non-public ${kind} ${target}`);
}

function repositoryDisplayName(registry: EcosystemRegistry, repository: string): string {
  return registry.surfaces.find((surface) => surface.repository.id === repository)?.repository.displayName ?? repository;
}

function unique(values: Journey[]): Journey[] { return [...new Set(values)].sort(); }
function normalizeRoute(value: string): string { return value.length > 1 ? value.replace(/\/+$/, '') : value; }
function isObject(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function formatErrors(file: string, schema: string, errors: ErrorObject[]): string {
  return [`${file} does not satisfy ${schema}:`, ...errors.map((error) => `  ${error.instancePath || '/'} ${error.message ?? 'is invalid'}`)].join('\n');
}
