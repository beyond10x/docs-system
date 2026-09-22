import fs from 'node:fs/promises';
import path from 'node:path';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { mdxFromMarkdown } from 'mdast-util-mdx';
import { gfm } from 'micromark-extension-gfm';
import { mdxjs } from 'micromark-extension-mdxjs';
import { isMap, isScalar, LineCounter, parse, parseDocument } from 'yaml';
import { ManagedRangeError, markdownFenceProblems, normalizeMarkdownFenceLanguage, normalizePassiveMarkdown } from './code.js';
import { collectManifestSources } from './collector.js';
import { parseEssDocument } from './ess-document.js';
import { resolveDocumentPageMetadata } from './documents.js';
import { readChange, readManifest } from './manifest.js';
const MANIFEST = 'b10x.docs.yaml';
const CHANGES = 'changes';
/**
 * Run, over the files one repository's `b10x.docs.yaml` declares, every validator the Website
 * publisher applies to that source alone: the manifest schema, every `changes/**\/*.yaml`
 * ecosystem change, the Markdown code-fence contract, passive rendering, frontmatter, field-note
 * dates, search audiences, sidebar positions, navigation groups, structured inputs, and website
 * output uniqueness. Nothing from the repository is imported or executed.
 */
export async function checkSource(repositoryRoot) {
    const root = path.resolve(repositoryRoot);
    const result = { failures: [], documents: 0, changes: 0, fences: 0 };
    const manifestFile = path.join(root, MANIFEST);
    const manifestYaml = await readYaml(manifestFile);
    if (!manifestYaml) {
        result.failures.push({ file: MANIFEST, message: `${root} has no ${MANIFEST}` });
        return result;
    }
    let manifest;
    try {
        manifest = await readManifest(manifestFile);
    }
    catch (error) {
        result.failures.push(...schemaFailures(error, manifestFile, MANIFEST, manifestYaml, root));
    }
    await checkChanges(root, result);
    if (manifest && manifest.schema !== 'b10x-docs/v3' && manifest.schema !== 'b10x-docs/v4') {
        result.failures.push({ file: MANIFEST, line: lineOf(manifestYaml, ['schema']), message: `check-source requires b10x-docs/v3 or b10x-docs/v4, found ${manifest.schema}` });
    }
    else if (manifest) {
        let index;
        try {
            index = await collectManifestSources(manifest, root);
        }
        catch (error) {
            result.failures.push({ file: MANIFEST, message: relativeMessage(error, root) });
        }
        if (index) {
            const markdown = index.files.filter((file) => file.kind === 'document' || file.kind === 'blog');
            result.documents = markdown.length;
            await checkPublication(root, manifest, index.files, manifestYaml, result);
        }
    }
    return result;
}
/** `file:line: message`, or `file: message` when the violation has no line. */
export function formatSourceCheckFailure(failure) {
    return `${failure.file}${failure.line === undefined ? '' : `:${failure.line}`}: ${failure.message}`;
}
async function readYaml(file) {
    let source;
    try {
        source = await fs.readFile(file, 'utf8');
    }
    catch {
        return undefined;
    }
    const lines = new LineCounter();
    return { document: parseDocument(source, { lineCounter: lines }), lines };
}
async function checkChanges(root, result) {
    const changeRoot = path.join(root, CHANGES);
    let stat;
    try {
        stat = await fs.lstat(changeRoot);
    }
    catch {
        return;
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
        result.failures.push({ file: CHANGES, message: 'changes/ must be a real directory when present' });
        return;
    }
    for (const relative of await enumerateChanges(root, CHANGES, result)) {
        result.changes += 1;
        const file = path.join(root, ...relative.split('/'));
        const yaml = await readYaml(file);
        const parseError = yaml?.document.errors[0];
        if (!yaml || parseError) {
            result.failures.push({ file: relative, line: parseError?.linePos?.[0].line, message: `is not valid YAML${parseError ? `: ${parseError.message.split('\n')[0]}` : ''}` });
            continue;
        }
        try {
            await readChange(file);
        }
        catch (error) {
            result.failures.push(...schemaFailures(error, file, relative, yaml, root));
        }
    }
}
async function enumerateChanges(root, relative, result) {
    const found = [];
    const entries = await fs.readdir(path.join(root, ...relative.split('/')), { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
        const child = `${relative}/${entry.name}`;
        if (entry.isSymbolicLink())
            result.failures.push({ file: child, message: 'is a symbolic link; change inputs must be regular files' });
        else if (entry.isDirectory())
            found.push(...await enumerateChanges(root, child, result));
        else if (entry.isFile() && path.extname(entry.name) === '.yaml')
            found.push(child);
        else if (!entry.isFile())
            result.failures.push({ file: child, message: 'is not a regular file' });
    }
    return found;
}
/**
 * Code-contract source mode's `inventoryMarkdownFences`: every backtick or tilde fence the
 * CommonMark parser finds, with its canonical language and body. A parse failure yields no fences.
 */
function inventoryFences(source, sourcePath) {
    let tree;
    try {
        const options = /\.mdx$/i.test(sourcePath)
            ? { extensions: [gfm(), mdxjs()], mdastExtensions: [gfmFromMarkdown(), mdxFromMarkdown()] }
            : { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] };
        tree = fromMarkdown(source, options);
    }
    catch (error) {
        const line = typeof error.line === 'number' ? error.line : undefined;
        return { fences: [], error: { line, message: `Markdown cannot be parsed: ${error instanceof Error ? error.message : String(error)}` } };
    }
    const fences = [];
    visit(tree, (node) => {
        if (node.type !== 'code' || !node.position)
            return;
        const { start, end } = { start: node.position.start.offset, end: node.position.end.offset };
        if (start === undefined || end === undefined)
            return;
        const raw = source.slice(start, end);
        if (!/^(`{3,}|~{3,})/.test(raw))
            return;
        const normalizedLanguage = normalizeMarkdownFenceLanguage(node.lang ?? '');
        const body = String(node.value ?? '').replace(/\r\n?/g, '\n');
        fences.push({ line: node.position.start.line, lang: node.lang, raw, normalizedLanguage, identity: `${normalizedLanguage}\0${body}` });
    });
    return { fences };
}
function visit(node, visitor) {
    visitor(node);
    for (const child of node.children ?? [])
        visit(child, visitor);
}
const PLACEHOLDER_COMMIT = '0000000000000000000000000000000000000000';
const SEARCH_AUDIENCE_VOCABULARY = new Set(['adopter', 'developer', 'evaluator', 'operator', 'researcher']);
/**
 * Reproduce, for one repository, the per-source refusals of Website's `prepare-site.mjs`
 * (`materializeCollection` and what it calls) and `code-contract.mjs` source mode. Each check
 * names the Website function it mirrors; the fence-level rule and passive rendering are shared
 * through `./code.js`.
 */
async function checkPublication(root, manifest, files, manifestYaml, result) {
    const surfaces = new Map(manifest.surfaces.map((surface, position) => [surface.id, { surface, position }]));
    const routes = { documents: new Map(), blogs: new Map(), assets: new Map() };
    const markdown = [];
    for (const file of files) {
        const declared = surfaces.get(file.surface);
        if (file.kind === 'asset')
            routes.assets.set(file.sourcePath, `/source-assets/${file.outputPath}`);
        if (file.kind === 'document' && declared) {
            // documentRoute
            if (!declared.surface.routeBase.startsWith('/docs/')) {
                result.failures.push({ file: MANIFEST, line: lineOf(manifestYaml, ['surfaces', declared.position, 'routeBase']), message: `surface ${file.surface} routeBase must begin /docs/ to publish documents` });
            }
            else {
                routes.documents.set(file.sourcePath, documentRoute(declared.surface.routeBase, file));
            }
        }
        if (file.kind === 'openapi' || file.kind === 'json-schema' || file.kind === 'data')
            await checkStructured(root, file, result);
        if (file.kind !== 'document' && file.kind !== 'blog')
            continue;
        const raw = await fs.readFile(path.join(root, ...file.sourcePath.split('/')), 'utf8');
        const split = splitFrontmatter(raw, file.sourcePath, result);
        if (split)
            markdown.push({ file, raw, ...split });
        else
            checkFenceContract(raw, file.sourcePath, result);
    }
    for (const source of markdown) {
        if (source.file.kind !== 'blog')
            continue;
        // blogRoute
        const declaredSlug = source.frontmatter?.slug;
        const originalSlug = String(declaredSlug ?? path.basename(source.file.sourcePath, path.extname(source.file.sourcePath)).replace(/^\d{4}-\d{2}-\d{2}-/, ''));
        routes.blogs.set(source.file.sourcePath, `/updates/field-notes/${source.file.repository}/${originalSlug.replace(/^\/+|\/+$/g, '')}/`);
    }
    for (const source of markdown) {
        const collected = checkFenceContract(source.raw, source.file.sourcePath, result);
        let generated;
        try {
            generated = source.file.kind === 'document'
                ? await renderDocument(source, manifest, routes, result)
                : await renderBlog(source, manifest, routes, result);
        }
        catch (error) {
            const line = error instanceof ManagedRangeError ? error.line + source.bodyOffset : undefined;
            result.failures.push({ file: source.file.sourcePath, line, message: error instanceof Error ? error.message : String(error) });
            continue;
        }
        if (generated === undefined)
            continue;
        // code-contract inspectSourceTree: passive rendering must keep the fence language and body sequence.
        const rendered = inventoryFences(generated, source.file.sourcePath).fences.map((fence) => fence.identity);
        const expected = collected.map((fence) => fence.identity);
        const changed = expected.findIndex((identity, index) => identity !== rendered[index]);
        if (changed >= 0) {
            const fence = collected[changed];
            result.failures.push({ file: source.file.sourcePath, line: fence.line, message: `passive rendering changes this ${fence.normalizedLanguage} fence; Website refuses a changed fence language or body sequence` });
        }
        else if (rendered.length !== expected.length) {
            result.failures.push({ file: source.file.sourcePath, message: `passive rendering turns ${expected.length} fence(s) into ${rendered.length}; Website refuses a changed fence language or body sequence` });
        }
    }
    checkDestinations(surfaces, files, routes, manifestYaml, result);
    checkNavigationGroups(manifest, manifestYaml, result);
}
function checkFenceContract(raw, sourcePath, result) {
    const inventory = inventoryFences(raw, sourcePath);
    if (inventory.error)
        result.failures.push({ file: sourcePath, ...inventory.error });
    for (const fence of inventory.fences) {
        result.fences += 1;
        for (const message of markdownFenceProblems({ language: fence.lang, raw: fence.raw })) {
            result.failures.push({ file: sourcePath, line: fence.line, message });
        }
    }
    return inventory.fences;
}
/** Website `splitFrontmatter`: a leading `---` block parsed as YAML, which throws on malformed input. */
function splitFrontmatter(raw, sourcePath, result) {
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
    if (!match)
        return { body: raw, bodyOffset: 0 };
    let frontmatter;
    try {
        frontmatter = parse(match[1]) ?? {};
    }
    catch (error) {
        const position = error.linePos?.[0];
        const message = (error instanceof Error ? error.message.split('\n')[0] : String(error)).replace(/ at line \d+, column \d+:?$/, '');
        result.failures.push({ file: sourcePath, line: position ? position.line + 1 : 1, message: `frontmatter is not valid YAML: ${message}` });
        return undefined;
    }
    const lines = new LineCounter();
    const frontmatterYaml = { document: parseDocument(match[1], { lineCounter: lines }), lines };
    return {
        frontmatter: typeof frontmatter === 'object' && frontmatter !== null ? frontmatter : {},
        frontmatterYaml,
        body: raw.slice(match[0].length),
        bodyOffset: match[0].split('\n').length - 1,
    };
}
function frontmatterLine(source, keys) {
    if (!source.frontmatterYaml)
        return undefined;
    const line = lineOf(source.frontmatterYaml, keys);
    return line === undefined ? undefined : line + 1;
}
/** Website `qualifiedDocumentTitle`; `title.trim()` throws for any non-string title, as Website's does. */
function qualifiedDocumentTitle(title, projectName) {
    const page = title.trim();
    const project = projectName.trim();
    return page.toLowerCase() === project.toLowerCase() ? page : `${page} | ${project}`;
}
/** The title Website derives, or a failure when it is not a string and `qualifiedDocumentTitle` would throw. */
function sourceTitle(source, result) {
    const title = source.frontmatter?.title ?? firstHeading(source.body) ?? path.basename(source.file.sourcePath, path.extname(source.file.sourcePath));
    if (typeof title === 'string')
        return title;
    result.failures.push({ file: source.file.sourcePath, line: frontmatterLine(source, ['title']), message: 'title must be a string; Website calls title.trim()' });
    return undefined;
}
/**
 * Website `documentMetadata` + `renderImportedMarkdown`. Every value that comes from the source is
 * rendered exactly as Website renders it; only Website-owned inputs (the commit, experience
 * presentations, ranked search queries) are fixed placeholders, and none of them is source text.
 */
async function renderDocument(source, manifest, routes, result) {
    const route = routes.documents.get(source.file.sourcePath);
    if (!route)
        return undefined;
    const frontmatter = source.frontmatter ?? {};
    const title = sourceTitle(source, result);
    if (title === undefined)
        return undefined;
    const projectName = manifest.repository.displayName ?? source.file.repository;
    const declared = typeof frontmatter.b10x === 'object' && frontmatter.b10x !== null ? frontmatter.b10x : {};
    const surface = manifest.surfaces.find((candidate) => candidate.id === source.file.surface);
    const resolved = manifest.schema === 'b10x-docs/v4'
        ? await resolveDocumentPageMetadata(manifest, source.file.surface, source.raw, `${source.file.repository}/${source.file.sourcePath}`)
        : undefined;
    const surfaceAudiences = surface?.audiences;
    const audiences = resolved
        ? resolved.effective.audiences
        : stringArray(declared.audiences, surfaceAudiences?.length ? surfaceAudiences : ['developer']);
    const metadata = {
        route,
        title,
        qualifiedTitle: qualifiedDocumentTitle(title, projectName),
        project: source.file.repository,
        projectName,
        description: summaryText(frontmatter.description ?? `${title} in the source-owned ${projectName} documentation.`),
        documentType: declared.documentType ?? inferDocumentType(source.file.sourcePath, title),
        audiences,
        experiences: resolved ? [...new Set(resolved.effective.experienceIds)].sort() : [],
        support: resolved?.effective.support ?? 'unspecified',
        access: resolved?.effective.access ?? 'unspecified',
        tasks: stringArray(declared.tasks, inferTasks(source.file.sourcePath, title)),
    };
    // renderSearchAttributes -> assertSearchAudienceVocabulary
    const undeclared = [...new Set(audiences.filter((audience) => !SEARCH_AUDIENCE_VOCABULARY.has(audience)))];
    if (undeclared.length > 0) {
        result.failures.push({ file: source.file.sourcePath, line: frontmatterLine(source, ['b10x', 'audiences']), message: `${route} search metadata uses undeclared audience values: ${undeclared.join(', ')}` });
    }
    // sidebar-contract sourceSidebarMetadata
    const declaredLabel = frontmatter.sidebar_label;
    const sidebarLabel = typeof declaredLabel === 'string' && declaredLabel.trim() ? declaredLabel.trim() : title;
    const position = frontmatter.sidebar_position;
    if (position !== undefined && position !== null && (typeof position !== 'number' || !Number.isSafeInteger(position))) {
        result.failures.push({ file: source.file.sourcePath, line: frontmatterLine(source, ['sidebar_position']), message: 'sidebar_position must be a safe YAML integer' });
    }
    const hasPosition = typeof position === 'number' && Number.isSafeInteger(position);
    const rewritten = rewriteLinks(normalizePassiveMarkdown(source.body), source.file, manifest.repository.url, routes);
    const context = [
        '<DocContext',
        `  currentRoute={${JSON.stringify(route)}}`,
        `  repository={${JSON.stringify(source.file.repository)}}`,
        `  projectName={${JSON.stringify(projectName)}}`,
        `  documentType={${JSON.stringify(metadata.documentType)}}`,
        `  audiences={${JSON.stringify(metadata.audiences)}}`,
        `  experienceIds={${JSON.stringify(metadata.experiences)}}`,
        `  support={${JSON.stringify(metadata.support)}}`,
        `  access={${JSON.stringify(metadata.access)}}`,
        `  sourceLabel={${JSON.stringify(`${source.file.repository}/${source.file.sourcePath}`)}}`,
        `  sourceHref={${JSON.stringify(`${manifest.repository.url}/blob/${PLACEHOLDER_COMMIT}/${encodeURI(source.file.sourcePath)}`)}}`,
        `  revision={${JSON.stringify(PLACEHOLDER_COMMIT)}}`,
        '/>',
    ].join('\n');
    return [
        '---',
        `title: ${JSON.stringify(metadata.qualifiedTitle)}`,
        `sidebar_label: ${JSON.stringify(sidebarLabel)}`,
        ...(hasPosition ? [`sidebar_position: ${JSON.stringify(position)}`] : []),
        `description: ${JSON.stringify(metadata.description)}`,
        `slug: ${JSON.stringify(route.replace(/^\/docs/, ''))}`,
        'pagination_next: null',
        'pagination_prev: null',
        '---',
        '',
        "import DocContext from '@site/src/components/DocContext';",
        '',
        renderSearchAttributes(metadata),
        '',
        insertDocContextAfterTitle(rewritten.trim(), context, title),
        '',
    ].join('\n');
}
/** Website `renderSearchAttributes`, without Website's ranked search queries. */
function renderSearchAttributes(metadata) {
    const attributes = [
        ['data-pagefind-meta', 'qualified_title', metadata.qualifiedTitle],
        ['data-pagefind-meta', 'description', metadata.description],
        ['data-pagefind-meta', 'project', metadata.projectName],
        ['data-pagefind-meta', 'document_type', metadata.documentType],
        ['data-pagefind-filter', 'project', metadata.project],
        ['data-pagefind-filter', 'document_type', metadata.documentType],
        ...metadata.audiences.map((audience) => ['data-pagefind-filter', 'audience', audience]),
        ...metadata.experiences.map((experience) => ['data-pagefind-filter', 'experience', experience]),
        ...metadata.tasks.map((task) => ['data-pagefind-filter', 'task', task]),
    ];
    return [
        '<div className="b10x-search-attributes" data-pagefind-ignore>',
        ...attributes.map(([name, key, value]) => `  <span ${name}="${htmlAttribute(key)}">${htmlText(value)}</span>`),
        '</div>',
    ].join('\n');
}
/** Website `renderBlog`, including `normalizeBlogDate`. */
async function renderBlog(source, manifest, routes, result) {
    const frontmatter = source.frontmatter ?? {};
    const title = sourceTitle(source, result);
    if (title === undefined)
        return undefined;
    const rawDate = String(frontmatter.date ?? /^([0-9]{4}-[0-9]{2}-[0-9]{2})/.exec(path.basename(source.file.sourcePath))?.[1] ?? '1970-01-01');
    let date = rawDate;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        const parsed = new Date(rawDate);
        if (!Number.isFinite(parsed.getTime())) {
            result.failures.push({ file: source.file.sourcePath, line: frontmatterLine(source, ['date']), message: `invalid source blog date ${rawDate}` });
        }
        else {
            date = parsed.toISOString().replace(/\.\d{3}Z$/, '');
        }
    }
    const route = routes.blogs.get(source.file.sourcePath) ?? '/updates/field-notes/';
    const projectName = manifest.repository.displayName ?? source.file.repository;
    const resolved = manifest.schema === 'b10x-docs/v4'
        ? await resolveDocumentPageMetadata(manifest, source.file.surface, source.raw, `${source.file.repository}/${source.file.sourcePath}`)
        : undefined;
    const rewritten = rewriteLinks(normalizePassiveMarkdown(source.body), source.file, manifest.repository.url, routes);
    const sourceUrl = `${manifest.repository.url}/blob/${PLACEHOLDER_COMMIT}/${encodeURI(source.file.sourcePath)}`;
    return [
        '---',
        `title: ${JSON.stringify(title)}`,
        `date: ${JSON.stringify(date)}`,
        `slug: ${JSON.stringify(route.replace(/^\/updates\/field-notes/, ''))}`,
        ...(frontmatter.description ? [`description: ${JSON.stringify(frontmatter.description)}`] : []),
        ...(Array.isArray(frontmatter.tags) ? [`tags: ${JSON.stringify(frontmatter.tags)}`] : []),
        '---',
        '',
        renderSearchAttributes({
            project: source.file.repository,
            projectName,
            title,
            qualifiedTitle: qualifiedDocumentTitle(title, projectName),
            description: summaryText(frontmatter.description ?? `${title} in the source-owned ${projectName} documentation.`),
            documentType: 'field-note',
            audiences: resolved ? resolved.effective.audiences : ['researcher'],
            experiences: resolved ? [...new Set(resolved.effective.experienceIds)] : [],
            tasks: ['research'],
        }),
        '',
        [
            '<div className="b10x-source-banner" data-pagefind-ignore>',
            '',
            `> Source-owned field note · [${source.file.sourcePath}](${sourceUrl}) · revision <code className="b10x-revision" title="${PLACEHOLDER_COMMIT}">${PLACEHOLDER_COMMIT.slice(0, 12)}</code>`,
            '',
            '</div>',
        ].join('\n'),
        '',
        rewritten.trim(),
        '',
    ].join('\n');
}
function summaryText(value) {
    return String(value).replace(/\s+/g, ' ').trim();
}
function stringArray(value, fallback) {
    return Array.isArray(value) && value.every((item) => typeof item === 'string') ? [...new Set(value)] : [...new Set(fallback)];
}
function htmlAttribute(value) {
    return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
function htmlText(value) {
    return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('{', '&#123;').replaceAll('}', '&#125;');
}
/** Website `inferDocumentType`. */
function inferDocumentType(sourcePath, title) {
    const value = `${sourcePath} ${title}`.toLowerCase();
    if (/tutorial|golden-path/.test(value))
        return 'tutorial';
    if (/troubleshoot|failure|debug/.test(value))
        return 'troubleshooting';
    if (/(^|\/)guides?\//.test(sourcePath.toLowerCase()) || /getting-started|install|quickstart/.test(value))
        return 'how-to';
    if (/(^|\/)concepts?\//.test(sourcePath.toLowerCase()) || /overview/.test(value))
        return 'explanation';
    if (/(^|\/)status\//.test(sourcePath.toLowerCase()) || /roadmap|limitations|where-this-stands/.test(value))
        return 'status';
    return 'reference';
}
/** Website `inferTasks`. */
function inferTasks(sourcePath, title) {
    const value = `${sourcePath} ${title}`.toLowerCase();
    const tasks = [];
    for (const [task, pattern] of [
        ['install', /install|getting-started|quickstart/],
        ['specify', /spec|schema|contract|conformance/],
        ['govern-work', /aep|govern|plan|evidence/],
        ['run-agents', /harness|agent-loop|session|workflow/],
        ['deploy', /deploy|helm|kubernetes|infrastructure/],
        ['operate', /operate|operations|reliability|configuration|security/],
        ['troubleshoot', /troubleshoot|failure|debug|limitation/],
        ['research', /research|principle|study|observation/],
    ]) {
        if (pattern.test(value))
            tasks.push(task);
    }
    return tasks.length ? tasks : ['reference'];
}
function firstHeading(source) {
    return /^#\s+(.+)$/m.exec(source)?.[1]?.replace(/[*_`]/g, '').trim();
}
/** Website `insertDocContextAfterTitle`. */
function insertDocContextAfterTitle(markdown, context, title) {
    const lines = markdown.split('\n');
    let fenceCharacter;
    let fenceLength = 0;
    for (let index = 0; index < lines.length; index += 1) {
        const fence = /^\s*(`{3,}|~{3,})/.exec(lines[index]);
        if (fence) {
            const character = fence[1][0];
            if (!fenceCharacter) {
                fenceCharacter = character;
                fenceLength = fence[1].length;
            }
            else if (character === fenceCharacter && fence[1].length >= fenceLength) {
                fenceCharacter = undefined;
                fenceLength = 0;
            }
            continue;
        }
        if (!fenceCharacter && /^#\s+.+$/.test(lines[index])) {
            lines.splice(index + 1, 0, '', context);
            return lines.join('\n');
        }
    }
    return `# ${title}\n\n${context}\n\n${markdown}`;
}
/** Website `link-rewriting.mjs` `rewriteLinks`, which rewrites fence bodies too. */
function rewriteLinks(body, file, repositoryUrl, routes) {
    const markdown = body.replace(/(!?\[[^\]]*\])\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (match, label, destination) => {
        const resolved = resolveLink(destination, file, repositoryUrl, routes, label.startsWith('!'));
        return resolved === destination ? match : `${label}(${resolved})`;
    });
    const withAttributes = markdown.replace(/(<[A-Za-z][A-Za-z0-9.-]*\b[^>]*?\s(?:href|src)=["'])([^"']+)(["'])/g, (match, prefix, destination, quote) => {
        const resolved = resolveLink(destination, file, repositoryUrl, routes, /\ssrc=["']$/i.test(prefix));
        return `${prefix}${resolved}${quote}`;
    });
    return withAttributes.replace(/^([ ]{0,3}\[[^\]\n]+\]:[ \t]*)(<[^>\n]*>|\S+)([ \t]*(?:"[^"\n]*"|'[^'\n]*'|\([^)\n]*\))?[ \t]*)$/gm, (match, prefix, destination, title) => {
        const bracketed = destination.startsWith('<') && destination.endsWith('>');
        const target = bracketed ? destination.slice(1, -1) : destination;
        const resolved = resolveLink(target, file, repositoryUrl, routes, false);
        if (resolved === target)
            return match;
        return `${prefix}${bracketed ? `<${resolved}>` : resolved}${title}`;
    });
}
function resolveLink(destination, file, repositoryUrl, routes, image) {
    if (/^(?:https?:|mailto:|tel:|data:|#)/i.test(destination))
        return destination;
    const suffixIndex = destination.search(/[?#]/);
    const target = suffixIndex === -1 ? destination : destination.slice(0, suffixIndex);
    const suffix = suffixIndex === -1 ? '' : destination.slice(suffixIndex);
    let decoded;
    try {
        decoded = decodeURI(target);
    }
    catch {
        return destination;
    }
    const base = decoded.startsWith('/')
        ? decoded.replace(/^\/+/, '')
        : path.posix.normalize(path.posix.join(path.posix.dirname(file.sourcePath), decoded));
    const roots = [base];
    const repositoryPrefix = `${file.repository}/`;
    if (decoded.startsWith('/') && base.startsWith(repositoryPrefix))
        roots.push(base.slice(repositoryPrefix.length));
    for (const rootCandidate of roots) {
        for (const candidate of sourceCandidates(rootCandidate, decoded.startsWith('/'))) {
            const found = routes.documents.get(candidate) ?? routes.blogs.get(candidate) ?? routes.assets.get(candidate);
            if (found)
                return `${found}${suffix}`;
        }
    }
    if (decoded.startsWith('/'))
        return `${canonicalSectionUrl(file.repository, decoded)}${suffix}`;
    if (image)
        return `https://raw.githubusercontent.com/beyond10x/${file.repository}/${PLACEHOLDER_COMMIT}/${encodeURI(base)}${suffix}`;
    return `${repositoryUrl}/blob/${PLACEHOLDER_COMMIT}/${encodeURI(base)}${suffix}`;
}
function sourceCandidates(target, rootRelative) {
    const cleaned = target.replace(/^\.\//, '').replace(/\/$/, '');
    const roots = rootRelative ? [cleaned, `static/${cleaned}`, `website/static/${cleaned}`, `docs/${cleaned}`, `website/docs/${cleaned}`] : [cleaned];
    return [...new Set(roots.flatMap((candidate) => /\.(?:md|mdx)$/i.test(candidate)
            ? [candidate]
            : [candidate, `${candidate}.md`, `${candidate}.mdx`, `${candidate}/README.md`, `${candidate}/README.mdx`, `${candidate}/index.md`, `${candidate}/index.mdx`]))];
}
function canonicalSectionUrl(repository, url) {
    if (url.startsWith(`https://beyond10x.github.io/${repository}/docs/`))
        return url.replace(`https://beyond10x.github.io/${repository}/docs/`, `/docs/${repository}/`);
    if (url === `https://beyond10x.github.io/${repository}/` || url === `/${repository}/`)
        return `/docs/${repository}/`;
    if (url.startsWith(`/${repository}/docs/`))
        return url.replace(`/${repository}/docs/`, `/docs/${repository}/`);
    if (url === `/${repository}/api` || url === `/${repository}/api/`)
        return `/api/${repository}/`;
    if (url.startsWith('/docs/') && !url.startsWith(`/docs/${repository}/`))
        return `/docs/${repository}/${url.slice('/docs/'.length)}`;
    return url;
}
/** Website `materializeSpecification` and `materializeData`: parse, summarize, and project ESS contracts. */
async function checkStructured(root, file, result) {
    const raw = await fs.readFile(path.join(root, ...file.sourcePath.split('/')), 'utf8');
    const label = file.kind === 'data' ? 'data' : 'specification';
    let document;
    try {
        document = file.sourcePath.endsWith('.json') ? JSON.parse(raw) : parse(raw);
    }
    catch (error) {
        const position = error.linePos?.[0];
        result.failures.push({ file: file.sourcePath, line: position?.line, message: `${label} cannot be parsed: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}` });
        return;
    }
    if (file.kind !== 'data') {
        // materializeSpecification: the route check follows the parse, then specificationSummary dereferences the document.
        if (!file.route?.startsWith('/api/')) {
            result.failures.push({ file: file.sourcePath, message: `specification route ${file.route ?? '(none)'} must begin /api/` });
            return;
        }
        if (document === null || document === undefined)
            result.failures.push({ file: file.sourcePath, message: 'specification cannot be summarized: the document is empty' });
        return;
    }
    const format = document?.format;
    if (typeof format !== 'string' || !format.startsWith('ess-docs/'))
        return;
    try {
        const index = parseEssDocument(document);
        for (const page of document.pages) {
            if (!index.sections.get(page.id))
                throw new Error(`page ${page.id} has no sections`);
        }
    }
    catch (error) {
        result.failures.push({ file: file.sourcePath, message: `ESS documentation projection is invalid: ${error instanceof Error ? error.message : String(error)}` });
    }
}
/** Website `sidebar-contract.mjs` `navigationByRepository`: one repository declares one documentation group. */
function checkNavigationGroups(manifest, manifestYaml, result) {
    let group;
    manifest.surfaces.forEach((surface, position) => {
        const declared = surface.source.navigation;
        if (!declared)
            return;
        if (group && declared.group && group !== declared.group) {
            result.failures.push({
                file: MANIFEST,
                line: lineOf(manifestYaml, ['surfaces', position, 'source', 'navigation', 'group']),
                message: `surface ${surface.id} navigation group ${declared.group} conflicts with ${group} declared by another surface`,
            });
            return;
        }
        group = declared.group ?? group;
    });
}
const kindLabels = { document: 'documents', blog: 'blog', asset: 'assets' };
/**
 * Website materializes documents, field notes and assets into one generated tree with
 * `path.join` and refuses a second source landing on an occupied path (`assertUniqueDestination`).
 */
function checkDestinations(surfaces, files, routes, manifestYaml, result) {
    const claimed = new Map();
    for (const file of files) {
        const declared = surfaces.get(file.surface);
        if (!declared)
            continue;
        let destination;
        if (file.kind === 'document') {
            const route = routes.documents.get(file.sourcePath);
            if (!route)
                continue;
            destination = docDestination(route, file.sourcePath);
        }
        else if (file.kind === 'blog') {
            destination = path.posix.join('blog', `${file.repository}-${file.sourcePath.replace(/[^a-zA-Z0-9.-]+/g, '-')}`);
        }
        else if (file.kind === 'asset') {
            destination = path.posix.join('static', 'source-assets', ...file.outputPath.split('/'));
        }
        if (!destination)
            continue;
        const previous = claimed.get(destination);
        if (!previous) {
            claimed.set(destination, file);
            continue;
        }
        const line = lineOf(manifestYaml, ['surfaces', declared.position, 'source', file.kind === 'asset' ? 'assets' : file.kind === 'blog' ? 'blog' : 'documents'], true);
        const same = previous.surface === file.surface && previous.kind === file.kind;
        const message = same
            ? `surface ${file.surface} ${kindLabels[file.kind]} ${previous.sourcePath} and ${file.sourcePath} map to one website output ${destination}`
            : `surface ${previous.surface} ${previous.kind} ${previous.sourcePath} and surface ${file.surface} ${file.kind} ${file.sourcePath} map to one website output ${destination}`;
        result.failures.push({ file: MANIFEST, line, message });
    }
}
/** Website `documentRoute`. */
function documentRoute(routeBase, file) {
    const relative = file.outputPath.split('/').slice(3).join('/');
    const normalized = relative
        .replace(/^website\/docs\//, '')
        .replace(/^docs\//, '')
        .replace(/(^|\/)(?:README|index|intro)\.(?:md|mdx)$/i, '$1index.md');
    const base = routeBase.replace(/^\/docs\//, '').replace(/^\/+|\/+$/g, '');
    const leaf = normalized.replace(/\.(?:md|mdx)$/i, '').replace(/(?:^|\/)index$/i, '');
    return `/docs/${[base, leaf].filter(Boolean).join('/')}/`.replace(/\/+/g, '/');
}
/** Website `docDestination`, relative to its generated root; `path.join` resolves `..` segments. */
function docDestination(route, sourcePath) {
    const relative = route.replace(/^\/docs\//, '').replace(/\/$/, '');
    const extension = path.extname(sourcePath).toLowerCase() === '.mdx' ? '.mdx' : '.md';
    return path.posix.join('docs', ...relative.split('/'), `index${extension}`);
}
/**
 * Split a `readTypedDocument` schema error into one failure per Ajv problem, each located at the
 * YAML node its instance path names. Other errors become one failure without a line.
 */
function schemaFailures(error, absolute, relative, yaml, root) {
    const message = error instanceof Error ? error.message : String(error);
    const [heading, ...problems] = message.split('\n');
    if (!/ does not satisfy \S+:$/.test(heading) || problems.length === 0) {
        return [{ file: relative, message: message.split(absolute).join(relative).split(`${root}${path.sep}`).join('') }];
    }
    return problems.map((problem) => {
        const match = /^\s+(\/\S*) (.*)$/.exec(problem);
        if (!match)
            return { file: relative, message: problem.trim() };
        const [, pointer, detail] = match;
        const segments = pointer === '/' ? [] : pointer.slice(1).split('/').map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'));
        const keys = segments.map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
        const node = keys.length ? yaml.document.getIn(keys, true) : undefined;
        const found = isScalar(node) ? ` (found ${JSON.stringify(node.value)})` : '';
        return { file: relative, line: keys.length ? lineOf(yaml, keys) : undefined, message: `${pointer} ${detail}${found}` };
    });
}
/** The 1-based line of the node at `keys`, or of its key when `atKey` is set; the nearest existing ancestor otherwise. */
function lineOf(yaml, keys, atKey = false) {
    for (let length = keys.length; length > 0; length -= 1) {
        const prefix = keys.slice(0, length);
        if (atKey || length < keys.length) {
            const parent = prefix.length > 1 ? yaml.document.getIn(prefix.slice(0, -1), true) : yaml.document.contents;
            if (isMap(parent)) {
                const pair = parent.items.find((item) => isScalar(item.key) && item.key.value === prefix.at(-1));
                const offset = isScalar(pair?.key) ? pair.key.range?.[0] : undefined;
                if (offset !== undefined)
                    return yaml.lines.linePos(offset).line;
            }
        }
        const node = yaml.document.getIn(prefix, true);
        if (node?.range)
            return yaml.lines.linePos(node.range[0]).line;
    }
    return undefined;
}
function relativeMessage(error, root) {
    return (error instanceof Error ? error.message : String(error)).split(`${root}${path.sep}`).join('');
}
