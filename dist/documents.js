import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import { validateDocumentPageMetadata } from './manifest.js';
export { validateDocumentPageMetadata } from './manifest.js';
/** Validate the inner value of a top-level `b10x:` Markdown/MDX frontmatter property. */
export async function parseDocumentPageMetadata(source, context = 'document page') {
    const frontmatter = parseFrontmatter(source, context);
    if (!frontmatter || !Object.prototype.hasOwnProperty.call(frontmatter, 'b10x'))
        return undefined;
    return validateDocumentPageMetadata(frontmatter.b10x, `${context} b10x frontmatter`);
}
export async function readDocumentPageMetadata(file) {
    return parseDocumentPageMetadata(await fs.readFile(file, 'utf8'), String(file));
}
/** Return both the page declaration and its effective metadata after applying surface defaults. */
export async function resolveDocumentPageMetadata(manifest, surfaceId, source, context = 'document page') {
    const declared = await parseDocumentPageMetadata(source, context);
    const effective = effectiveDocumentPageMetadata(manifest, surfaceId, declared);
    return { ...(declared ? { declared } : {}), effective };
}
export function effectiveDocumentPageMetadata(manifest, surfaceId, declared) {
    const surface = manifest.surfaces.find((candidate) => candidate.id === surfaceId);
    if (!surface)
        throw new Error(`${manifest.repository.id} has no documentation surface ${surfaceId}`);
    if (manifest.schema !== 'b10x-docs/v4') {
        const audiences = 'audiences' in surface ? [...(surface.audiences ?? [])] : [];
        return {
            audiences,
            experienceIds: (surface.journeys ?? []).map(compatibilityExperienceId),
            support: 'unspecified',
            access: 'unspecified',
            compatibility: true,
        };
    }
    const v4Surface = surface;
    if (declared) {
        for (const experienceId of declared.experienceIds) {
            if (!v4Surface.experienceIds.includes(experienceId)) {
                throw new Error(`${manifest.repository.id}/${surfaceId} page references experience ${experienceId} not declared by the surface`);
            }
        }
    }
    return {
        audiences: [...(declared?.audiences ?? v4Surface.documentDefaults.audiences)],
        experienceIds: [...(declared?.experienceIds ?? v4Surface.documentDefaults.experienceIds)],
        support: declared?.support ?? v4Surface.documentDefaults.support,
        access: declared?.access ?? v4Surface.documentDefaults.access,
        compatibility: false,
    };
}
/**
 * Build the normalized metadata sidecar consumed by presentation/search code. The collected source
 * index is deliberately neither extended nor re-hashed.
 */
export async function buildDocumentPageIndex(manifest, collection, repositoryRoot) {
    if (collection.repository.id !== manifest.repository.id) {
        throw new Error(`collection belongs to ${collection.repository.id}, not ${manifest.repository.id}`);
    }
    const root = path.resolve(repositoryRoot);
    const pages = [];
    for (const file of collection.files) {
        if (file.kind !== 'document' && file.kind !== 'blog')
            continue;
        const absolute = path.resolve(root, ...file.sourcePath.split('/'));
        ensureInside(root, absolute, file.sourcePath);
        const source = await fs.readFile(absolute, 'utf8');
        const resolved = await resolveDocumentPageMetadata(manifest, file.surface, source, file.sourcePath);
        pages.push({
            repository: file.repository,
            surface: file.surface,
            kind: file.kind,
            sourcePath: file.sourcePath,
            outputPath: file.outputPath,
            ...resolved,
        });
    }
    pages.sort((left, right) => left.outputPath.localeCompare(right.outputPath));
    return { schema: 'b10x-doc-index/v1', repository: collection.repository, pages };
}
function parseFrontmatter(source, context) {
    const match = source.match(/^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
    if (!match)
        return undefined;
    let value;
    try {
        value = parse(match[1]);
    }
    catch (error) {
        throw new Error(`${context} contains invalid YAML frontmatter: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (value === null || value === undefined)
        return {};
    if (typeof value !== 'object' || Array.isArray(value))
        throw new Error(`${context} frontmatter must be a mapping`);
    return value;
}
function compatibilityExperienceId(journey) {
    return `legacy-${journey}`;
}
function ensureInside(root, candidate, context) {
    const relative = path.relative(root, candidate);
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
        throw new Error(`${context} escapes repository root`);
    }
}
