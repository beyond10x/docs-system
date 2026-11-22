/**
 * Reference sources for a product site: read an OpenAPI 3.1, AsyncAPI 3.0 or `b10x-cli-reference/1`
 * file at build time, check its kind and version, and describe the data module the plugin writes.
 * Node-safe: no React, no Docusaurus.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { parseCliReference } from './cli-reference.js';
export const REFERENCE_KINDS = ['openapi', 'asyncapi', 'cli'];
const ID = /^[a-z0-9][a-z0-9-]*$/;
const EXTENSIONS = ['.json', '.yaml', '.yml'];
const record = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
/** Check the `references` option of `withProductSite`; the message names the entry. */
export function checkReferenceOptions(value) {
    if (value === undefined)
        return [];
    if (!Array.isArray(value))
        throw new Error(`product-site references must be an array of {id, kind, source, title?}, received ${JSON.stringify(value)}`);
    const ids = new Set();
    return value.map((entry, index) => {
        const at = `product-site references[${index}]`;
        if (!record(entry))
            throw new Error(`${at} must be an object {id, kind, source, title?}`);
        for (const key of Object.keys(entry))
            if (!['id', 'kind', 'source', 'title'].includes(key))
                throw new Error(`${at}.${key} is not an option; allowed: id, kind, source, title`);
        if (typeof entry.id !== 'string' || !ID.test(entry.id))
            throw new Error(`${at}.id must be lower-case letters, digits and hyphens, received ${JSON.stringify(entry.id)}`);
        if (ids.has(entry.id))
            throw new Error(`${at}.id repeats ${JSON.stringify(entry.id)}`);
        ids.add(entry.id);
        if (!REFERENCE_KINDS.includes(entry.kind))
            throw new Error(`product-site reference "${entry.id}": kind must be one of ${REFERENCE_KINDS.join(', ')}, received ${JSON.stringify(entry.kind)}`);
        if (typeof entry.source !== 'string' || !entry.source)
            throw new Error(`product-site reference "${entry.id}": source must be a file path relative to the site directory`);
        if (!EXTENSIONS.includes(path.extname(entry.source).toLowerCase()))
            throw new Error(`product-site reference "${entry.id}": source ${entry.source} must end in ${EXTENSIONS.join(', ')}`);
        if (entry.title !== undefined && (typeof entry.title !== 'string' || !entry.title.trim()))
            throw new Error(`product-site reference "${entry.id}": title must be a non-empty string`);
        return { id: entry.id, kind: entry.kind, source: entry.source, ...(entry.title ? { title: entry.title } : {}) };
    });
}
function declared(document) {
    if (!record(document))
        return 'no document';
    if (typeof document.openapi === 'string')
        return `openapi: ${document.openapi}`;
    if (typeof document.asyncapi === 'string')
        return `asyncapi: ${document.asyncapi}`;
    if (typeof document.format === 'string')
        return `format: ${document.format}`;
    return 'neither openapi, asyncapi nor format';
}
/** Check one parsed document against its declared kind and version; returns its default title. */
export function checkReferenceDocument(kind, document) {
    if (kind === 'openapi') {
        if (!record(document) || typeof document.openapi !== 'string' || !/^3\.1\.\d+$/.test(document.openapi))
            throw new Error(`kind openapi needs an OpenAPI 3.1 document, this one declares ${declared(document)}`);
        if (!record(document.info) || typeof document.info.title !== 'string')
            throw new Error('an OpenAPI document needs info.title');
        return document.info.title;
    }
    if (kind === 'asyncapi') {
        if (!record(document) || typeof document.asyncapi !== 'string' || !/^3\.0\.\d+$/.test(document.asyncapi))
            throw new Error(`kind asyncapi needs an AsyncAPI 3.0 document, this one declares ${declared(document)}`);
        if (!record(document.info) || typeof document.info.title !== 'string')
            throw new Error('an AsyncAPI document needs info.title');
        return document.info.title;
    }
    return parseCliReference(document).binary;
}
/** Read and check one reference source. `baseUrl` is the site's, ending in `/`. */
export async function readReference(reference, siteDir, baseUrl) {
    const file = path.resolve(siteDir, reference.source);
    const at = `product-site reference "${reference.id}" (${file})`;
    let bytes;
    try {
        bytes = await fs.readFile(file);
    }
    catch (error) {
        throw new Error(`${at}: cannot read the source: ${error.code ?? String(error)}`);
    }
    const extension = path.extname(file).toLowerCase();
    let document;
    try {
        const text = bytes.toString('utf8');
        document = extension === '.json' ? JSON.parse(text) : YAML.parse(text, { maxAliasCount: 1000 });
    }
    catch (error) {
        throw new Error(`${at}: not valid ${extension === '.json' ? 'JSON' : 'YAML'}: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`);
    }
    // The document is published as a JSON data module. A YAML alias that refers to itself parses
    // into an object JSON cannot hold, and a renderer would not end on it.
    try {
        JSON.stringify(document);
    }
    catch {
        throw new Error(`${at}: the document contains itself (a recursive YAML alias) and cannot be published as JSON`);
    }
    let title;
    try {
        title = checkReferenceDocument(reference.kind, document);
    }
    catch (error) {
        throw new Error(`${at}: ${error instanceof Error ? error.message : String(error)}`);
    }
    const served = `${reference.id}${extension}`;
    const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return {
        module: { id: reference.id, kind: reference.kind, title: reference.title ?? title, document, sourceUrl: `${base}reference/${served}`, sourceName: path.basename(file) },
        file,
        served,
        bytes,
    };
}
