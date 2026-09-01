import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020Module, {} from 'ajv/dist/2020.js';
import addFormatsModule from 'ajv-formats';
import { parse } from 'yaml';
const schemaPath = fileURLToPath(new URL('../schema/b10x.docs.schema.json', import.meta.url));
const Ajv2020 = Ajv2020Module;
const addFormats = addFormatsModule;
export async function readManifest(file) {
    const [source, schemaSource] = await Promise.all([
        fs.readFile(file, 'utf8'),
        fs.readFile(schemaPath, 'utf8'),
    ]);
    const document = parse(source);
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const validate = ajv.compile(JSON.parse(schemaSource));
    if (!validate(document)) {
        throw new Error(formatErrors(String(file), validate.errors ?? []));
    }
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
    return { schema: 'b10x-docs-registry/v1', surfaces: published };
}
export async function writeRegistry(out, registry) {
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
}
function formatErrors(file, errors) {
    return [
        `${file} does not satisfy b10x-docs/v1:`,
        ...errors.map((error) => `  ${error.instancePath || '/'} ${error.message ?? 'is invalid'}`),
    ].join('\n');
}
