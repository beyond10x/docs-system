import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv2020Module, {type ErrorObject} from 'ajv/dist/2020.js';
import addFormatsModule from 'ajv-formats';
import {parse} from 'yaml';
import type {
  ChangeLedger,
  ChangeLedgerEntry,
  DocumentationManifest,
  EcosystemChange,
  EcosystemRegistry,
  Journey,
  RegistrySurface,
  ReleaseFactsDocument,
} from './types.js';

const schemaPaths = {
  'b10x-docs/v1': fileURLToPath(new URL('../schema/b10x.docs.schema.json', import.meta.url)),
  'b10x-docs/v2': fileURLToPath(new URL('../schema/b10x.docs.v2.schema.json', import.meta.url)),
  'b10x-change/v1': fileURLToPath(new URL('../schema/b10x.change.schema.json', import.meta.url)),
} as const;

interface ValidateFunction {
  (document: unknown): boolean;
  errors?: ErrorObject[] | null;
}
interface AjvLike {compile(schema: unknown): ValidateFunction}
const Ajv2020 = Ajv2020Module as unknown as new (options: {allErrors: boolean; strict: boolean}) => AjvLike;
const addFormats = addFormatsModule as unknown as (ajv: AjvLike) => AjvLike;

export async function readManifest(file: string | URL): Promise<DocumentationManifest> {
  return readTypedDocument(file, ['b10x-docs/v1', 'b10x-docs/v2']) as Promise<DocumentationManifest>;
}

export async function readChange(file: string | URL): Promise<EcosystemChange> {
  return readTypedDocument(file, ['b10x-change/v1']) as Promise<EcosystemChange>;
}

export async function readDocument(file: string | URL): Promise<DocumentationManifest | EcosystemChange> {
  return readTypedDocument(file, ['b10x-docs/v1', 'b10x-docs/v2', 'b10x-change/v1']);
}

async function readTypedDocument(file: string | URL, accepted: Array<keyof typeof schemaPaths>): Promise<DocumentationManifest | EcosystemChange> {
  const source = await fs.readFile(file, 'utf8');
  const document: unknown = parse(source);
  const schema = isObject(document) && typeof document.schema === 'string' ? document.schema : '';
  if (!accepted.includes(schema as keyof typeof schemaPaths)) {
    throw new Error(`${String(file)} has unsupported schema ${schema || '(missing)'}`);
  }
  const schemaSource = await fs.readFile(schemaPaths[schema as keyof typeof schemaPaths], 'utf8');
  const ajv = new Ajv2020({allErrors: true, strict: true});
  addFormats(ajv);
  const validate = ajv.compile(JSON.parse(schemaSource));
  if (!validate(document)) throw new Error(formatErrors(String(file), schema, validate.errors ?? []));
  return document as DocumentationManifest | EcosystemChange;
}

export function buildRegistry(manifests: DocumentationManifest[]): EcosystemRegistry {
  const all = new Map<string, RegistrySurface>();
  for (const manifest of manifests) {
    for (const surface of manifest.surfaces) {
      const key = `${manifest.repository.id}/${surface.id}`;
      if (all.has(key)) throw new Error(`duplicate documentation surface ${key}`);
      all.set(key, {...surface, key, repository: manifest.repository});
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
  return {schema: 'b10x-docs-registry/v2', surfaces: published};
}

export function buildLedger(registry: EcosystemRegistry, changes: EcosystemChange[], releaseFacts?: ReleaseFactsDocument): ChangeLedger {
  const publicSurfaces = new Set(registry.surfaces.map((surface) => surface.key));
  const publicRepositories = new Set(registry.surfaces.map((surface) => surface.repository.id));
  const explicit = new Map<string, ChangeLedgerEntry>();
  for (const change of changes) {
    if (!publicRepositories.has(change.repository)) throw new Error(`${change.id} belongs to non-public repository ${change.repository}`);
    if (explicit.has(change.id)) throw new Error(`duplicate ecosystem change ${change.id}`);
    for (const target of change.affectedSurfaces) {
      if (!publicSurfaces.has(target)) throw new Error(`${change.id} affects non-public surface ${target}`);
    }
    explicit.set(change.id, {...withoutSchema(change), key: change.id, automatic: false});
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
      title: `${displayName(release.repository)} ${release.version}`,
      summary: `${displayName(release.repository)} released version ${release.version}.`,
      kind: 'release',
      impact: 'notable',
      source: {url: release.url, version: release.version},
      journeys: unique(surfaces.flatMap((surface) => surface.journeys)),
      affectedSurfaces: surfaces.map((surface) => surface.key),
      automatic: true,
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

export async function writeJson(out: string, document: EcosystemRegistry | ChangeLedger): Promise<void> {
  await fs.mkdir(path.dirname(out), {recursive: true});
  await fs.writeFile(out, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
}

export const writeRegistry = writeJson;

function withoutSchema(change: EcosystemChange): Omit<EcosystemChange, 'schema'> {
  const {schema: _, ...entry} = change;
  return entry;
}

function unique(values: Journey[]): Journey[] { return [...new Set(values)].sort(); }
function displayName(value: string): string { return value.split('-').map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part).join(' '); }
function isObject(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function formatErrors(file: string, schema: string, errors: ErrorObject[]): string {
  return [`${file} does not satisfy ${schema}:`, ...errors.map((error) => `  ${error.instancePath || '/'} ${error.message ?? 'is invalid'}`)].join('\n');
}
