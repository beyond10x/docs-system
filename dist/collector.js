import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildDocumentPageIndex } from './documents.js';
const markdownExtensions = new Set(['.md', '.mdx']);
const forbiddenHtmlTags = new Set(['embed', 'form', 'iframe', 'input', 'link', 'meta', 'object', 'script', 'style']);
const neverCollectDirectories = new Set([
    '.cache',
    '.docusaurus',
    '.git',
    '.venv',
    'build',
    'coverage',
    'dist',
    'node_modules',
    'target',
]);
/**
 * Collect only paths explicitly declared by a v3 or v4 manifest. The collector never imports or executes
 * repository code. It optionally copies the validated bytes and always returns their stable index.
 */
export async function collectManifestSources(manifest, repositoryRoot, options = {}) {
    if (manifest.schema !== 'b10x-docs/v3' && manifest.schema !== 'b10x-docs/v4') {
        throw new Error('source collection requires b10x-docs/v3 or b10x-docs/v4');
    }
    const repositoryReal = await fs.realpath(repositoryRoot);
    const files = [];
    for (const surface of manifest.surfaces) {
        const sourceReal = await resolveInside(repositoryReal, surface.source.root, `${manifest.repository.id}/${surface.id} source.root`);
        const stat = await fs.stat(sourceReal);
        if (!stat.isDirectory())
            throw new Error(`${manifest.repository.id}/${surface.id} source.root is not a directory`);
        const availableFiles = await enumerateFiles(sourceReal, repositoryReal);
        const allowedComponents = surface.source.components ?? [];
        await addSelection(files, manifest.repository.id, surface.id, 'document', sourceReal, repositoryReal, availableFiles, surface.source.documents, allowedComponents);
        await addSelection(files, manifest.repository.id, surface.id, 'data', sourceReal, repositoryReal, availableFiles, surface.source.data, allowedComponents);
        await addSelection(files, manifest.repository.id, surface.id, 'blog', sourceReal, repositoryReal, availableFiles, surface.source.blog, allowedComponents);
        await addSelection(files, manifest.repository.id, surface.id, 'asset', sourceReal, repositoryReal, availableFiles, surface.source.assets, allowedComponents);
        for (const specification of surface.source.specifications ?? []) {
            const relative = normalizeRelativePath(specification.path, `${manifest.repository.id}/${surface.id} specification ${specification.id}`);
            const absolute = await resolveInside(sourceReal, relative, `${manifest.repository.id}/${surface.id} specification ${specification.id}`);
            const sourcePath = toPosix(path.relative(repositoryReal, absolute));
            const sourceStat = await fs.stat(absolute);
            if (!sourceStat.isFile())
                throw new Error(`${sourcePath} is not a regular specification file`);
            files.push(await sourceEntry({
                repository: manifest.repository.id,
                surface: surface.id,
                kind: specification.format,
                absolute,
                sourcePath,
                relative,
                specificationId: specification.id,
                route: specification.route,
            }));
        }
    }
    files.sort(compareSources);
    assertUniqueOutputs(files);
    const index = buildCollectionIndex(manifest, files);
    if (manifest.schema === 'b10x-docs/v4')
        await buildDocumentPageIndex(manifest, index, repositoryReal);
    if (options.outputRoot)
        await copyCollection(repositoryReal, options.outputRoot, files);
    return index;
}
export function buildCollectionIndex(manifest, files) {
    const normalized = [...files].sort(compareSources);
    const contentSha256 = sha256(JSON.stringify(normalized.map((file) => ({
        repository: file.repository,
        surface: file.surface,
        kind: file.kind,
        sourcePath: file.sourcePath,
        outputPath: file.outputPath,
        sha256: file.sha256,
        size: file.size,
        ...(file.specificationId ? { specificationId: file.specificationId } : {}),
        ...(file.route ? { route: file.route } : {}),
    }))));
    return { schema: 'b10x-docs-collection/v1', repository: manifest.repository, files: normalized, contentSha256 };
}
export function verifyCollectionLock(lock, index, options = {}) {
    const source = lock.sources.find((entry) => entry.repository === index.repository.id);
    if (!source)
        throw new Error(`source lock has no entry for ${index.repository.id}`);
    if (source.url !== index.repository.url)
        throw new Error(`source lock URL for ${index.repository.id} is ${source.url}, expected ${index.repository.url}`);
    if (source.contentSha256 !== index.contentSha256) {
        throw new Error(`source lock content digest for ${index.repository.id} is ${source.contentSha256}, collected ${index.contentSha256}`);
    }
    if (options.commit && source.commit !== options.commit) {
        throw new Error(`source lock commit for ${index.repository.id} is ${source.commit}, checked out ${options.commit}`);
    }
    if (options.manifestSha256 && source.manifestSha256 !== options.manifestSha256) {
        throw new Error(`source lock manifest digest for ${index.repository.id} is ${source.manifestSha256}, read ${options.manifestSha256}`);
    }
}
export async function sha256File(file) {
    return sha256(await fs.readFile(file));
}
/** Refuse executable MDX while allowing a small, explicitly declared shared-component vocabulary. */
export function assertPassiveMdx(source, file, allowedComponents = []) {
    const proseWithInlineCode = withoutFencedCodeAndFrontmatter(source);
    const prose = withoutInlineCode(proseWithInlineCode);
    const expressionProse = withoutInlineCode(withoutInertMdxSyntax(proseWithInlineCode));
    if (/^\s*(?:import|export)(?:\s|\{)/m.test(prose))
        throw new Error(`${file} contains an import or export; public documentation must be data-only`);
    if (hasUnescapedOpeningBrace(expressionProse))
        throw new Error(`${file} contains an MDX expression; public documentation must be data-only`);
    if (/\bon[a-z]+\s*=/i.test(prose) || /dangerouslySetInnerHTML/i.test(prose) || /(?:href|src)\s*=\s*["']\s*javascript:/i.test(prose)) {
        throw new Error(`${file} contains executable markup`);
    }
    const allowed = new Set(allowedComponents);
    for (const match of prose.matchAll(/<\/?([A-Za-z][A-Za-z0-9.-]*)\b/g)) {
        const tag = match[1];
        if (tag[0] === tag[0].toUpperCase()) {
            if (!allowed.has(tag))
                throw new Error(`${file} uses undeclared shared component ${tag}`);
        }
        else if (forbiddenHtmlTags.has(tag.toLowerCase())) {
            throw new Error(`${file} contains forbidden HTML element ${tag}`);
        }
    }
}
async function addSelection(target, repository, surface, kind, sourceRoot, repositoryRoot, availableFiles, selection, allowedComponents) {
    if (!selection)
        return;
    const selected = selectFiles(availableFiles, selection, `${repository}/${surface} ${kind}`);
    if (selected.length === 0)
        throw new Error(`${repository}/${surface} ${kind} declaration selects no files`);
    for (const relative of selected) {
        if ((kind === 'document' || kind === 'blog') && !markdownExtensions.has(path.extname(relative).toLowerCase())) {
            throw new Error(`${repository}/${surface} ${kind} source ${relative} must be Markdown or MDX`);
        }
        const absolute = await resolveInside(sourceRoot, relative, `${repository}/${surface} ${kind} source`);
        const sourcePath = toPosix(path.relative(repositoryRoot, absolute));
        if (kind === 'document' || kind === 'blog')
            assertPassiveMdx(await fs.readFile(absolute, 'utf8'), sourcePath, allowedComponents);
        target.push(await sourceEntry({ repository, surface, kind, absolute, sourcePath, relative }));
    }
}
function selectFiles(availableFiles, selection, context) {
    const includeMatchers = selection.include.map((pattern) => ({ pattern, matcher: globMatcher(normalizeRelativePath(pattern, context)) }));
    const excludeMatchers = (selection.exclude ?? []).map((pattern) => globMatcher(normalizeRelativePath(pattern, context)));
    for (const { pattern, matcher } of includeMatchers) {
        if (!availableFiles.some((file) => matcher.test(file)))
            throw new Error(`${context} include pattern ${pattern} matches no files`);
    }
    return availableFiles.filter((file) => includeMatchers.some(({ matcher }) => matcher.test(file)) && !excludeMatchers.some((matcher) => matcher.test(file)));
}
async function enumerateFiles(root, repositoryRoot) {
    const files = [];
    async function visit(directory, relativeDirectory) {
        const entries = await fs.readdir(directory, { withFileTypes: true });
        entries.sort((left, right) => left.name.localeCompare(right.name));
        for (const entry of entries) {
            if (neverCollectDirectories.has(entry.name))
                continue;
            const relative = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
            const absolute = path.join(directory, entry.name);
            if (entry.isSymbolicLink()) {
                const resolved = await fs.realpath(absolute);
                ensureInside(repositoryRoot, resolved, relative);
                throw new Error(`${relative} is a symbolic link; public documentation sources must be regular files`);
            }
            if (entry.isDirectory())
                await visit(absolute, relative);
            else if (entry.isFile())
                files.push(toPosix(relative));
        }
    }
    await visit(root, '');
    return files;
}
async function sourceEntry(input) {
    const bytes = await fs.readFile(input.absolute);
    return {
        repository: input.repository,
        surface: input.surface,
        kind: input.kind,
        sourcePath: input.sourcePath,
        outputPath: [input.repository, input.surface, input.kind, toPosix(input.relative)].join('/'),
        sha256: sha256(bytes),
        size: bytes.byteLength,
        ...(input.specificationId ? { specificationId: input.specificationId } : {}),
        ...(input.route ? { route: input.route } : {}),
    };
}
async function copyCollection(repositoryRoot, outputRoot, files) {
    for (const file of files) {
        const source = await resolveInside(repositoryRoot, file.sourcePath, `${file.repository}/${file.surface} source`);
        const destination = path.resolve(outputRoot, ...file.outputPath.split('/'));
        ensureInside(path.resolve(outputRoot), destination, file.outputPath);
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.copyFile(source, destination);
    }
}
function assertUniqueOutputs(files) {
    const outputs = new Set();
    const routes = new Set();
    for (const file of files) {
        if (outputs.has(file.outputPath))
            throw new Error(`duplicate collected output ${file.outputPath}`);
        outputs.add(file.outputPath);
        if (file.route) {
            if (routes.has(file.route))
                throw new Error(`duplicate collected specification route ${file.route}`);
            routes.add(file.route);
        }
    }
}
async function resolveInside(root, relative, context) {
    const normalized = normalizeRelativePath(relative, context);
    const candidate = path.resolve(root, ...normalized.split('/'));
    ensureInside(root, candidate, context);
    const resolved = await fs.realpath(candidate);
    ensureInside(root, resolved, context);
    return resolved;
}
function ensureInside(root, candidate, context) {
    const relative = path.relative(root, candidate);
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
        throw new Error(`${context} escapes repository source root`);
    }
}
function normalizeRelativePath(value, context) {
    if (!value || path.posix.isAbsolute(value) || value.includes('\\'))
        throw new Error(`${context} path must be relative and use / separators: ${value}`);
    const normalized = path.posix.normalize(value);
    if (normalized === '..' || normalized.startsWith('../'))
        throw new Error(`${context} path escapes its source root: ${value}`);
    return normalized;
}
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
function withoutFencedCodeAndFrontmatter(source) {
    const lines = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').split(/\r?\n/);
    let fence;
    return lines.map((line) => {
        const marker = line.match(/^\s*(```+|~~~+)/)?.[1];
        if (marker) {
            if (!fence)
                fence = marker[0];
            else if (marker[0] === fence)
                fence = undefined;
            return '';
        }
        if (fence)
            return '';
        return line;
    }).join('\n');
}
function withoutInlineCode(source) {
    let output = '';
    let cursor = 0;
    while (cursor < source.length) {
        if (source[cursor] !== '`') {
            output += source[cursor];
            cursor += 1;
            continue;
        }
        const openerEnd = endOfBacktickRun(source, cursor);
        if (isEscaped(source, cursor)) {
            output += source.slice(cursor, openerEnd);
            cursor = openerEnd;
            continue;
        }
        const delimiterLength = openerEnd - cursor;
        let candidate = openerEnd;
        let closerEnd;
        while (candidate < source.length) {
            const next = source.indexOf('`', candidate);
            if (next === -1)
                break;
            const runEnd = endOfBacktickRun(source, next);
            if (runEnd - next === delimiterLength) {
                closerEnd = runEnd;
                break;
            }
            candidate = runEnd;
        }
        if (closerEnd === undefined) {
            output += source.slice(cursor, openerEnd);
            cursor = openerEnd;
            continue;
        }
        output += source.slice(cursor, closerEnd).replace(/[^\r\n]/g, ' ');
        cursor = closerEnd;
    }
    return output;
}
function endOfBacktickRun(source, start) {
    let end = start + 1;
    while (source[end] === '`')
        end += 1;
    return end;
}
function isEscaped(source, index) {
    let backslashes = 0;
    for (let before = index - 1; before >= 0 && source[before] === '\\'; before -= 1)
        backslashes += 1;
    return backslashes % 2 === 1;
}
/**
 * Remove only passive syntax that MDX represents with braces. The source itself is never changed:
 * this projection exists solely so the executable-expression check can distinguish inert comments
 * and explicit heading ids from JavaScript expressions.
 */
function withoutInertMdxSyntax(source) {
    return source.split('\n').map((line) => {
        if (isWholeLineMdxComment(line))
            return '';
        return line.replace(/^(\s{0,3}#{1,6}(?!#)\s+.+?)\s+\{#[-A-Za-z0-9_:.]+\}\s*$/, '$1');
    }).join('\n');
}
function isWholeLineMdxComment(line) {
    return /^\s*\{\s*\/\*(?:(?!\*\/)[^\r\n])*\*\/\s*\}\s*$/.test(line);
}
function hasUnescapedOpeningBrace(source) {
    for (let index = 0; index < source.length; index += 1) {
        if (source[index] !== '{')
            continue;
        let escapes = 0;
        for (let before = index - 1; before >= 0 && source[before] === '\\'; before -= 1)
            escapes += 1;
        if (escapes % 2 === 0)
            return true;
    }
    return false;
}
function compareSources(left, right) {
    return left.outputPath.localeCompare(right.outputPath) || left.sourcePath.localeCompare(right.sourcePath);
}
function sha256(value) { return createHash('sha256').update(value).digest('hex'); }
function toPosix(value) { return value.split(path.sep).join('/'); }
