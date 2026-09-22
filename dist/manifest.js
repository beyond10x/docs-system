import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020Module, {} from 'ajv/dist/2020.js';
import addFormatsModule from 'ajv-formats';
import { parse } from 'yaml';
const schemaPaths = {
    'b10x-docs/v1': fileURLToPath(new URL('../schema/b10x.docs.schema.json', import.meta.url)),
    'b10x-docs/v2': fileURLToPath(new URL('../schema/b10x.docs.v2.schema.json', import.meta.url)),
    'b10x-docs/v3': fileURLToPath(new URL('../schema/b10x.docs.v3.schema.json', import.meta.url)),
    'b10x-docs/v4': fileURLToPath(new URL('../schema/b10x.docs.v4.schema.json', import.meta.url)),
    'b10x-docs/v5': fileURLToPath(new URL('../schema/b10x.docs.v5.schema.json', import.meta.url)),
    'b10x-experiences/v1': fileURLToPath(new URL('../schema/b10x.experiences.schema.json', import.meta.url)),
    'b10x-doc-page/v1': fileURLToPath(new URL('../schema/b10x.doc-page.schema.json', import.meta.url)),
    'b10x-change/v1': fileURLToPath(new URL('../schema/b10x.change.schema.json', import.meta.url)),
    'b10x-change/v2': fileURLToPath(new URL('../schema/b10x.change.v2.schema.json', import.meta.url)),
    'b10x-sources/v1': fileURLToPath(new URL('../schema/b10x.sources.schema.json', import.meta.url)),
    'b10x-redirects/v1': fileURLToPath(new URL('../schema/b10x.redirects.schema.json', import.meta.url)),
};
const Ajv2020 = Ajv2020Module;
const addFormats = addFormatsModule;
export async function readManifest(file) {
    const document = await readTypedDocument(file, ['b10x-docs/v1', 'b10x-docs/v2', 'b10x-docs/v3', 'b10x-docs/v4', 'b10x-docs/v5']);
    validateManifestSemantics(document, String(file));
    return document;
}
export async function readExperienceCatalog(file) {
    const catalog = await readTypedDocument(file, ['b10x-experiences/v1']);
    const { validateExperienceCatalogSemantics } = await import('./experiences.js');
    validateExperienceCatalogSemantics(catalog, String(file));
    return catalog;
}
export async function validateDocumentPageMetadata(document, context = 'document page metadata') {
    const validate = await validatorFor('b10x-doc-page/v1');
    if (!validate(document))
        throw new Error(formatErrors(context, 'b10x-doc-page/v1', validate.errors ?? [], document));
    return document;
}
export async function readChange(file) {
    return readTypedDocument(file, ['b10x-change/v1', 'b10x-change/v2']);
}
export async function readSourceLock(file) {
    const lock = await readTypedDocument(file, ['b10x-sources/v1']);
    const repositories = new Set();
    for (const source of lock.sources) {
        if (repositories.has(source.repository))
            throw new Error(`${String(file)} contains duplicate source ${source.repository}`);
        const expectedUrl = `https://github.com/beyond10x/${source.repository}`;
        if (source.url !== expectedUrl)
            throw new Error(`${String(file)} source ${source.repository} URL must be ${expectedUrl}`);
        repositories.add(source.repository);
    }
    const declared = lock.sources.map((source) => source.repository);
    const sorted = [...declared].sort((left, right) => left.localeCompare(right));
    if (declared.some((repository, index) => repository !== sorted[index]))
        throw new Error(`${String(file)} sources must be sorted by repository`);
    return lock;
}
export async function readRedirectMap(file) {
    const map = await readTypedDocument(file, ['b10x-redirects/v1']);
    const routes = new Set();
    for (const redirect of map.redirects) {
        const route = normalizeRoute(redirect.from);
        if (routes.has(route))
            throw new Error(`${String(file)} contains duplicate compatibility route ${route}`);
        routes.add(route);
    }
    return map;
}
export async function readDocument(file) {
    const document = await readTypedDocument(file, Object.keys(schemaPaths));
    if (document.schema.startsWith('b10x-docs/'))
        validateManifestSemantics(document, String(file));
    if (document.schema === 'b10x-experiences/v1') {
        const { validateExperienceCatalogSemantics } = await import('./experiences.js');
        validateExperienceCatalogSemantics(document, String(file));
    }
    return document;
}
async function readTypedDocument(file, accepted) {
    const source = await fs.readFile(file, 'utf8');
    const document = parse(source);
    const schema = isObject(document) && typeof document.schema === 'string' ? document.schema : '';
    if (!accepted.includes(schema)) {
        throw new Error(`${String(file)} has unsupported schema ${schema || '(missing)'}`);
    }
    const validate = await validatorFor(schema);
    if (!validate(document))
        throw new Error(formatErrors(String(file), schema, validate.errors ?? [], document));
    return document;
}
export function buildRegistry(manifests) {
    const all = new Map();
    const routes = new Map();
    for (const manifest of manifests) {
        for (const surface of manifest.surfaces) {
            const key = `${manifest.repository.id}/${surface.id}`;
            if (all.has(key))
                throw new Error(`duplicate documentation surface ${key}`);
            const v4Surface = manifest.schema === 'b10x-docs/v4' ? surface
                : manifest.schema === 'b10x-docs/v5' ? registryShapeOfV5(surface)
                    : undefined;
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
                : { ...surface, key, repository: manifest.repository };
            all.set(key, registrySurface);
            if ('routeBase' in surface) {
                const conflict = routes.get(surface.routeBase);
                if (conflict)
                    throw new Error(`documentation route ${surface.routeBase} is declared by both ${conflict} and ${key}`);
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
        if (manifest.schema !== 'b10x-docs/v3' || !manifest.journeyPaths)
            continue;
        if (!manifest.surfaces.some((surface) => surface.kind === 'front-door')) {
            throw new Error(`${manifest.repository.id} declares journeyPaths without a front-door surface`);
        }
        for (const [journey, keys] of Object.entries(manifest.journeyPaths)) {
            for (const key of keys ?? []) {
                if (!publicKeys.has(key))
                    throw new Error(`${manifest.repository.id} journey ${journey} includes non-public surface ${key}`);
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
        const entry = normalizeChange(change);
        for (const target of entry.affectedSurfaces) {
            if (!publicSurfaces.has(target))
                throw new Error(`${change.id} affects non-public surface ${target}`);
        }
        for (const target of entry.affectedRepositories ?? [])
            validatePublicTarget(change.id, target, publicRepositories, 'repository');
        for (const target of [...(entry.affectedComponents ?? []), ...(entry.affectedApis ?? [])]) {
            validatePublicTarget(change.id, target.split('/', 1)[0] ?? '', publicRepositories, 'target');
        }
        explicit.set(change.id, entry);
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
            title: `${repositoryDisplayName(registry, release.repository)} ${release.version}`,
            summary: `${repositoryDisplayName(registry, release.repository)} released version ${release.version}.`,
            kind: 'release',
            impact: 'notable',
            source: { url: release.url, version: release.version },
            journeys: unique(surfaces.flatMap((surface) => surface.journeys ?? [])),
            affectedSurfaces: surfaces.map((surface) => surface.key),
            automatic: true,
            channel: 'releases',
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
function validateV3Semantics(manifest, file) {
    const expectedRepositoryUrl = `https://github.com/beyond10x/${manifest.repository.id}`;
    if (manifest.repository.url !== expectedRepositoryUrl) {
        throw new Error(`${file} repository.url must be ${expectedRepositoryUrl}`);
    }
    const ids = new Set();
    for (const surface of manifest.surfaces) {
        if (ids.has(surface.id))
            throw new Error(`${file} contains duplicate surface ${surface.id}`);
        ids.add(surface.id);
        if (!surface.journeys.includes(surface.primaryJourney)) {
            throw new Error(`${file} surface ${surface.id} primaryJourney must also appear in journeys`);
        }
        const expectedCanonicalUrl = new URL(surface.routeBase, `${manifest.delivery.origin}/`).href;
        if (surface.canonicalUrl !== expectedCanonicalUrl) {
            throw new Error(`${file} surface ${surface.id} canonicalUrl must be ${expectedCanonicalUrl}`);
        }
        const specificationIds = new Set();
        const specificationRoutes = new Set();
        for (const specification of surface.source.specifications ?? []) {
            if (specificationIds.has(specification.id))
                throw new Error(`${file} surface ${surface.id} contains duplicate specification ${specification.id}`);
            if (specificationRoutes.has(specification.route))
                throw new Error(`${file} surface ${surface.id} contains duplicate specification route ${specification.route}`);
            specificationIds.add(specification.id);
            specificationRoutes.add(specification.route);
        }
    }
}
function validateManifestSemantics(manifest, file) {
    if (manifest.schema === 'b10x-docs/v3')
        validateV3Semantics(manifest, file);
    if (manifest.schema === 'b10x-docs/v4' || manifest.schema === 'b10x-docs/v5')
        validateV4Semantics(manifest, file);
    if (manifest.schema === 'b10x-docs/v5')
        validateV5Paths(manifest, file);
}
function validateV4Semantics(manifest, file) {
    const expectedRepositoryUrl = `https://github.com/beyond10x/${manifest.repository.id}`;
    if (manifest.repository.url !== expectedRepositoryUrl) {
        throw new Error(`${file} repository.url must be ${expectedRepositoryUrl}`);
    }
    const ids = new Set();
    for (const surface of manifest.surfaces) {
        if (ids.has(surface.id))
            throw new Error(`${file} contains duplicate surface ${surface.id}`);
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
        const specificationIds = new Set();
        const specificationRoutes = new Set();
        for (const specification of surface.source.specifications ?? []) {
            if (specificationIds.has(specification.id))
                throw new Error(`${file} surface ${surface.id} contains duplicate specification ${specification.id}`);
            if (specificationRoutes.has(specification.route))
                throw new Error(`${file} surface ${surface.id} contains duplicate specification route ${specification.route}`);
            specificationIds.add(specification.id);
            specificationRoutes.add(specification.route);
        }
    }
}
/**
 * Every v5 path field names one file by its one canonical spelling, at most once. Sidebar leaves, the
 * landing document and menu-withheld documents must also be documents the surface publishes: matched
 * by `source.documents.include`, not by its `exclude`, with the collector's glob semantics and outside
 * the directories the collector never enters. A withheld document may not also be a sidebar leaf; it
 * may be the landing document, which is served at the route base and needs no menu entry. The check
 * reads the manifest only; whether the file exists is the collector's concern.
 */
function validateV5Paths(manifest, file) {
    for (const surface of manifest.surfaces) {
        const refuse = (role, value, reason) => {
            throw new Error(`${file} surface ${surface.id} ${role} ${visible(value)} ${reason}`);
        };
        const canonicalOnce = (role, values) => {
            const seen = new Set();
            for (const value of values) {
                if (!isCanonicalPath(value))
                    refuse(role, value, 'is not a canonical path relative to source.root');
                if (seen.has(value))
                    refuse(role, value, 'appears more than once');
                seen.add(value);
            }
        };
        const builtAssets = surface.builtAssets ?? [];
        canonicalOnce('builtAssets', builtAssets);
        for (const value of builtAssets) {
            if (/[*?]/.test(value))
                refuse('builtAssets', value, 'is not one file: globs are not allowed');
            if (underNeverCollectedDirectory(value))
                refuse('builtAssets', value, 'lies under a directory the collector never enters');
        }
        const navigation = surface.source.navigation;
        if (!navigation)
            continue;
        const published = publishedDocumentMatcher(surface.source.documents);
        const requirePublished = (role, values) => {
            canonicalOnce(role, values);
            for (const value of values)
                if (!published(value))
                    refuse(role, value, 'is not a published document of the surface');
        };
        const leaves = Array.isArray(navigation.sidebar) ? sidebarLeaves(navigation.sidebar) : [];
        requirePublished('sidebar leaf', leaves);
        if (navigation.landing !== undefined)
            requirePublished('landing', [navigation.landing]);
        const withheld = navigation.menuWithheld ?? [];
        requirePublished('menuWithheld', withheld);
        const inSidebar = new Set(leaves);
        for (const value of withheld)
            if (inSidebar.has(value))
                refuse('menuWithheld', value, 'is also a sidebar leaf');
    }
}
/** The directories `src/collector.ts` skips while enumerating a source root; nothing beneath them is published. */
const neverCollectDirectories = new Set(['.cache', '.docusaurus', '.git', '.venv', 'build', 'coverage', 'dist', 'node_modules', 'target']);
/** C0 and C1 controls, DEL, and the Unicode line and paragraph separators; the v5 schema refuses the same set. */
const invisibleCharacters = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g;
function isCanonicalPath(value) {
    if (new RegExp(invisibleCharacters.source).test(value) || value.includes('\\') || value.endsWith('/'))
        return false;
    return value !== '' && path.posix.normalize(value) === value && !value.startsWith('/') && value !== '..' && !value.startsWith('../');
}
function underNeverCollectedDirectory(value) {
    return value.split('/').slice(0, -1).some((segment) => neverCollectDirectories.has(segment));
}
/** A refused value as a reader can see it: every invisible character written as `\uXXXX`. */
function visible(value) {
    return value.replace(invisibleCharacters, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
}
function sidebarLeaves(items) {
    return items.flatMap((item) => (typeof item === 'string' ? [item] : sidebarLeaves(item.items)));
}
function publishedDocumentMatcher(documents) {
    if (!documents)
        return () => false;
    const include = documents.include.map((pattern) => globMatcher(path.posix.normalize(pattern)));
    const exclude = (documents.exclude ?? []).map((pattern) => globMatcher(path.posix.normalize(pattern)));
    return (documentPath) => !underNeverCollectedDirectory(documentPath)
        && include.some((matcher) => matcher.test(documentPath))
        && !exclude.some((matcher) => matcher.test(documentPath));
}
/** A v5 surface in the registry's v4 shape: built assets, landing, withheld documents and a sidebar tree stay out. */
function registryShapeOfV5(surface) {
    const { builtAssets: _builtAssets, source, ...rest } = surface;
    const { navigation: declared, ...sourceRest } = source;
    if (!declared)
        return { ...rest, source: sourceRest };
    const { sidebar, landing: _landing, menuWithheld: _menuWithheld, ...navigation } = declared;
    return { ...rest, source: { ...sourceRest, navigation: Array.isArray(sidebar) ? navigation : { ...navigation, sidebar } } };
}
/** The collector's glob dialect (`src/collector.ts` `globMatcher`): `*`, `?` and `**` path segments. */
function globMatcher(pattern) {
    let expression = '^';
    for (let index = 0; index < pattern.length; index += 1) {
        const character = pattern[index];
        if (character === '*') {
            if (pattern[index + 1] === '*') {
                index += 1;
                if (pattern[index + 1] === '/') {
                    index += 1;
                    expression += '(?:.*/)?';
                }
                else
                    expression += '.*';
            }
            else
                expression += '[^/]*';
        }
        else if (character === '?')
            expression += '[^/]';
        else
            expression += character.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
    }
    return new RegExp(`${expression}$`);
}
const validators = new Map();
function validatorFor(schema) {
    const existing = validators.get(schema);
    if (existing)
        return existing;
    const pending = fs.readFile(schemaPaths[schema], 'utf8').then((source) => {
        const ajv = new Ajv2020({ allErrors: true, strict: true });
        addFormats(ajv);
        return ajv.compile(JSON.parse(source));
    });
    validators.set(schema, pending);
    return pending;
}
function normalizeChange(change) {
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
        ...(change.schema === 'b10x-change/v2' && change.affected.repositories ? { affectedRepositories: change.affected.repositories } : {}),
        ...(change.schema === 'b10x-change/v2' && change.affected.components ? { affectedComponents: change.affected.components } : {}),
        ...(change.schema === 'b10x-change/v2' && change.affected.apis ? { affectedApis: change.affected.apis } : {}),
        ...(change.relations ? { relations: change.relations } : {}),
        ...(change.action ? { action: change.action } : {}),
        automatic: false,
        channel: 'impact',
    };
}
function validatePublicTarget(change, target, repositories, kind) {
    if (!repositories.has(target))
        throw new Error(`${change} affects non-public ${kind} ${target}`);
}
function repositoryDisplayName(registry, repository) {
    return registry.surfaces.find((surface) => surface.repository.id === repository)?.repository.displayName ?? repository;
}
function unique(values) { return [...new Set(values)].sort(); }
function normalizeRoute(value) { return value.length > 1 ? value.replace(/\/+$/, '') : value; }
function isObject(value) { return typeof value === 'object' && value !== null && !Array.isArray(value); }
/** A refused pattern names the refused value, JSON-quoted so control characters stay visible. */
function formatErrors(file, schema, errors, document) {
    return [`${file} does not satisfy ${schema}:`, ...errors.map((error) => {
            const value = error.keyword === 'pattern' ? valueAt(document, error.instancePath) : undefined;
            return `  ${error.instancePath || '/'} ${error.message ?? 'is invalid'}${typeof value === 'string' ? `: "${visible(value)}"` : ''}`;
        })].join('\n');
}
function valueAt(document, pointer) {
    let current = document;
    for (const token of pointer.split('/').slice(1).map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))) {
        if (Array.isArray(current))
            current = current[Number(token)];
        else if (isObject(current))
            current = current[token];
        else
            return undefined;
    }
    return current;
}
