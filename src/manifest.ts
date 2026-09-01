import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv2020Module, {type ErrorObject} from 'ajv/dist/2020.js';
import addFormatsModule from 'ajv-formats';
import {parse} from 'yaml';
import type {DocumentationManifest, EcosystemRegistry, RegistrySurface} from './types.js';

const schemaPath = fileURLToPath(new URL('../schema/b10x.docs.schema.json', import.meta.url));
interface ValidateFunction {
  (document: unknown): boolean;
  errors?: ErrorObject[] | null;
}
interface AjvLike {compile(schema: unknown): ValidateFunction}
const Ajv2020 = Ajv2020Module as unknown as new (options: {allErrors: boolean; strict: boolean}) => AjvLike;
const addFormats = addFormatsModule as unknown as (ajv: AjvLike) => AjvLike;

export async function readManifest(file: string | URL): Promise<DocumentationManifest> {
  const [source, schemaSource] = await Promise.all([
    fs.readFile(file, 'utf8'),
    fs.readFile(schemaPath, 'utf8'),
  ]);
  const document: unknown = parse(source);
  const ajv = new Ajv2020({allErrors: true, strict: true});
  addFormats(ajv);
  const validate = ajv.compile(JSON.parse(schemaSource));
  if (!validate(document)) {
    throw new Error(formatErrors(String(file), validate.errors ?? []));
  }
  return document as DocumentationManifest;
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
  return {schema: 'b10x-docs-registry/v1', surfaces: published};
}

export async function writeRegistry(out: string, registry: EcosystemRegistry): Promise<void> {
  await fs.mkdir(path.dirname(out), {recursive: true});
  await fs.writeFile(out, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
}

function formatErrors(file: string, errors: ErrorObject[]): string {
  return [
    `${file} does not satisfy b10x-docs/v1:`,
    ...errors.map((error) => `  ${error.instancePath || '/'} ${error.message ?? 'is invalid'}`),
  ].join('\n');
}
