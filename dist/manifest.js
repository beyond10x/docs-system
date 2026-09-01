import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020Module, {} from 'ajv/dist/2020.js';
import addFormatsModule from 'ajv-formats';
import { parse } from 'yaml';
const schemaPaths = {
    'b10x-docs/v1': fileURLToPath(new URL('../schema/b10x.docs.schema.json', import.meta.url)),
    'b10x-docs/v2': fileURLToPath(new URL('../schema/b10x.docs.v2.schema.json', import.meta.url)),
    'b10x-change/v1': fileURLToPath(new URL('../schema/b10x.change.schema.json', import.meta.url)),
};
const Ajv2020 = Ajv2020Module;
const addFormats = addFormatsModule;
export async function readManifest(file) {
    return readTypedDocument(file, ['b10x-docs/v1', 'b10x-docs/v2']);
}
export async function readChange(file) {
    return readTypedDocument(file, ['b10x-change/v1']);
}
export async function readDocument(file) {
    return readTypedDocument(file, ['b10x-docs/v1', 'b10x-docs/v2', 'b10x-change/v1']);
}
async function readTypedDocument(file, accepted) {
    const source = await fs.readFile(file, 'utf8');
    const document = parse(source);
    const schema = isObject(document) && typeof document.schema === 'string' ? document.schema : '';
    if (!accepted.includes(schema)) {
        throw new Error(`${String(file)} has unsupported schema ${schema || '(missing)'}`);
    }
    const schemaSource = await fs.readFile(schemaPaths[schema], 'utf8');
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const validate = ajv.compile(JSON.parse(schemaSource));
    if (!validate(document))
        throw new Error(formatErrors(String(file), schema, validate.errors ?? []));
    return document;
}
export function buildRegistry(manifests) {
    const all = new Map();
    for (const manifest of manifests) {
        for (const surface of manifest.surfaces) {
            const key = `${manifest.repository.id}/${surface.id}`;
            if (all.has(key))
                throw new Error(`duplicate documentation surface ${key}`);
            all.set(key, { ...surface, key, repository: manifest.repository });
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
    return { schema: 'b10x-docs-registry/v2', surfaces: published };
}
export function buildLedger(registry, changes, releaseFacts) {
    const publicSurfaces = new Set(registry.surfaces.map((surface) => surface.key));
    const publicRepositories = new Set(registry.surfaces.map((surface) => surface.repository.id));
    const explicit = new Map();
    for (const change of changes) {
        if (!publicRepositories.has(change.repository))
            throw new Error(`${change.id} belongs to non-public repository ${change.repository}`);
        if (explicit.has(change.id))
            throw new Error(`duplicate ecosystem change ${change.id}`);
        for (const target of change.affectedSurfaces) {
            if (!publicSurfaces.has(target))
                throw new Error(`${change.id} affects non-public surface ${target}`);
        }
        explicit.set(change.id, { ...withoutSchema(change), key: change.id, automatic: false });
    }
    for (const change of explicit.values()) {
        for (const relation of change.relations ?? []) {
            const [targetType, target] = relation.target.split(':', 2);
            if (targetType === 'surface' && !publicSurfaces.has(target))
                throw new Error(`${change.id} relates to non-public surface ${target}`);
            if (targetType === 'change' && !explicit.has(target))
                throw new Error(`${change.id} relates to unknown change ${target}`);
        }
    }
    const entries = [...explicit.values()];
    const enrichedReleases = new Set(entries.filter((entry) => entry.source.version).map((entry) => `${entry.repository}/${entry.source.version}`));
    for (const release of releaseFacts?.releases ?? []) {
        const releaseKey = `${release.repository}/${release.version}`;
        if (!publicRepositories.has(release.repository) || enrichedReleases.has(releaseKey))
            continue;
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
            source: { url: release.url, version: release.version },
            journeys: unique(surfaces.flatMap((surface) => surface.journeys)),
            affectedSurfaces: surfaces.map((surface) => surface.key),
            automatic: true,
        });
    }
    entries.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt) || left.key.localeCompare(right.key));
    return { schema: 'b10x-change-ledger/v1', changes: entries };
}
export async function readReleaseFacts(file) {
    if (!file)
        return undefined;
    const document = JSON.parse(await fs.readFile(file, 'utf8'));
    if (!isObject(document) || document.schema !== 'b10x-release-facts/v1' || !Array.isArray(document.releases)) {
        throw new Error(`${file} does not satisfy b10x-release-facts/v1`);
    }
    for (const release of document.releases) {
        if (!isObject(release) || !['repository', 'version', 'publishedAt', 'url'].every((field) => typeof release[field] === 'string')) {
            throw new Error(`${file} contains an invalid release fact`);
        }
    }
    return document;
}
export async function writeJson(out, document) {
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
}
export const writeRegistry = writeJson;
function withoutSchema(change) {
    const { schema: _, ...entry } = change;
    return entry;
}
function unique(values) { return [...new Set(values)].sort(); }
function displayName(value) { return value.split('-').map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part).join(' '); }
function isObject(value) { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function formatErrors(file, schema, errors) {
    return [`${file} does not satisfy ${schema}:`, ...errors.map((error) => `  ${error.instancePath || '/'} ${error.message ?? 'is invalid'}`)].join('\n');
}
