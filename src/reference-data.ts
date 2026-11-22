/**
 * Reference sources for a product site: read an OpenAPI 3.1, AsyncAPI 3.0 or `b10x-cli-reference/1`
 * file at build time, check its kind and version, and describe the data module the plugin writes.
 * Node-safe: no React, no Docusaurus.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import {parseCliReference} from './cli-reference.js';

export const REFERENCE_KINDS = ['openapi', 'asyncapi', 'cli'] as const;
export type ReferenceKind = typeof REFERENCE_KINDS[number];

export interface ProductSiteReference {
  /** Lower-case letters, digits and hyphens: the module `@b10x-reference/<id>.json` and the download `reference/<id>.<ext>`. */
  id: string;
  kind: ReferenceKind;
  /** The file, relative to the site directory: `.json`, `.yaml` or `.yml`. */
  source: string;
  /** Heading of the rendered reference; defaults to the document's title or binary name. */
  title?: string;
}

/** The data module `@b10x-reference/<id>.json`, as `ApiReference` reads it. */
export interface ReferenceModule {
  id: string;
  kind: ReferenceKind;
  title: string;
  document: unknown;
  /** The unchanged source bytes, served by the site. */
  sourceUrl: string;
  sourceName: string;
}

export interface LoadedReference {
  module: ReferenceModule;
  /** The absolute path of the source. */
  file: string;
  /** The served file name below `reference/`: `<id>.<ext>`. */
  served: string;
  bytes: Buffer;
}

const ID = /^[a-z0-9][a-z0-9-]*$/;
const EXTENSIONS = ['.json', '.yaml', '.yml'];
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

/** Check the `references` option of `withProductSite`; the message names the entry. */
export function checkReferenceOptions(value: unknown): ProductSiteReference[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`product-site references must be an array of {id, kind, source, title?}, received ${JSON.stringify(value)}`);
  const ids = new Set<string>();
  return value.map((entry, index) => {
    const at = `product-site references[${index}]`;
    if (!record(entry)) throw new Error(`${at} must be an object {id, kind, source, title?}`);
    for (const key of Object.keys(entry)) if (!['id', 'kind', 'source', 'title'].includes(key)) throw new Error(`${at}.${key} is not an option; allowed: id, kind, source, title`);
    if (typeof entry.id !== 'string' || !ID.test(entry.id)) throw new Error(`${at}.id must be lower-case letters, digits and hyphens, received ${JSON.stringify(entry.id)}`);
    if (ids.has(entry.id)) throw new Error(`${at}.id repeats ${JSON.stringify(entry.id)}`);
    ids.add(entry.id);
    if (!REFERENCE_KINDS.includes(entry.kind as ReferenceKind)) throw new Error(`product-site reference "${entry.id}": kind must be one of ${REFERENCE_KINDS.join(', ')}, received ${JSON.stringify(entry.kind)}`);
    if (typeof entry.source !== 'string' || !entry.source) throw new Error(`product-site reference "${entry.id}": source must be a file path relative to the site directory`);
    if (!EXTENSIONS.includes(path.extname(entry.source).toLowerCase())) throw new Error(`product-site reference "${entry.id}": source ${entry.source} must end in ${EXTENSIONS.join(', ')}`);
    if (entry.title !== undefined && (typeof entry.title !== 'string' || !entry.title.trim())) throw new Error(`product-site reference "${entry.id}": title must be a non-empty string`);
    return {id: entry.id, kind: entry.kind as ReferenceKind, source: entry.source, ...(entry.title ? {title: entry.title as string} : {})};
  });
}

function declared(document: unknown): string {
  if (!record(document)) return 'no document';
  if (typeof document.openapi === 'string') return `openapi: ${document.openapi}`;
  if (typeof document.asyncapi === 'string') return `asyncapi: ${document.asyncapi}`;
  if (typeof document.format === 'string') return `format: ${document.format}`;
  return 'neither openapi, asyncapi nor format';
}

/** Check one parsed document against its declared kind and version; returns its default title. */
export function checkReferenceDocument(kind: ReferenceKind, document: unknown): string {
  if (kind === 'openapi') {
    if (!record(document) || typeof document.openapi !== 'string' || !/^3\.1\.\d+$/.test(document.openapi)) throw new Error(`kind openapi needs an OpenAPI 3.1 document, this one declares ${declared(document)}`);
    if (!record(document.info) || typeof document.info.title !== 'string') throw new Error('an OpenAPI document needs info.title');
    return document.info.title;
  }
  if (kind === 'asyncapi') {
    if (!record(document) || typeof document.asyncapi !== 'string' || !/^3\.0\.\d+$/.test(document.asyncapi)) throw new Error(`kind asyncapi needs an AsyncAPI 3.0 document, this one declares ${declared(document)}`);
    if (!record(document.info) || typeof document.info.title !== 'string') throw new Error('an AsyncAPI document needs info.title');
    return document.info.title;
  }
  return parseCliReference(document).binary;
}

/** Read and check one reference source. `baseUrl` is the site's, ending in `/`. */
export async function readReference(reference: ProductSiteReference, siteDir: string, baseUrl: string): Promise<LoadedReference> {
  const file = path.resolve(siteDir, reference.source);
  const at = `product-site reference "${reference.id}" (${file})`;
  let bytes: Buffer;
  try {
    bytes = await fs.readFile(file);
  } catch (error) {
    throw new Error(`${at}: cannot read the source: ${(error as NodeJS.ErrnoException).code ?? String(error)}`);
  }
  const extension = path.extname(file).toLowerCase();
  let document: unknown;
  try {
    const text = bytes.toString('utf8');
    document = extension === '.json' ? JSON.parse(text) : YAML.parse(text, {maxAliasCount: 1000});
  } catch (error) {
    throw new Error(`${at}: not valid ${extension === '.json' ? 'JSON' : 'YAML'}: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`);
  }
  // The document is published as a JSON data module. A YAML alias that refers to itself parses
  // into an object JSON cannot hold, and a renderer would not end on it.
  try {
    JSON.stringify(document);
  } catch {
    throw new Error(`${at}: the document contains itself (a recursive YAML alias) and cannot be published as JSON`);
  }
  let title: string;
  try {
    title = checkReferenceDocument(reference.kind, document);
  } catch (error) {
    throw new Error(`${at}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const served = `${reference.id}${extension}`;
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return {
    module: {id: reference.id, kind: reference.kind, title: reference.title ?? title, document, sourceUrl: `${base}reference/${served}`, sourceName: path.basename(file)},
    file,
    served,
    bytes,
  };
}
