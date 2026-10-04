/**
 * The product-site layer: one opt-in that turns a repository's Docusaurus site into a product
 * front page with documentation that shares its tokens.
 *
 * ```ts
 * import {withProductSite} from '@beyond10x/docs-system/product-site';
 * export default withProductSite(config, {landing: './product.json', product: 'canon'});
 * ```
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { PRISM_ADDITIONAL_LANGUAGES } from './code.js';
import { isFamilyRelatedTool, parseFamilyRelatedTool } from './family.js';
import { parseDomainGraph, parseProtocolGraph } from './product-graphs.js';
import { ART_KINDS, landingKpis, PRODUCT_LANDING_FORMAT, parseCaseDocument, parseCodePairDocument, parseStatusDocument, parseStatusItems, parseTerminalSession } from './product-data.js';
import { productPrismDarkTheme, productPrismTheme } from './prism-themes.js';
import { rawAdmonitionHtmlProblems } from './admonition-guard.js';
import { isProductId, PRODUCT_SIGNATURES, productSignatureCss } from './product-palette.js';
import rehypeSemanticChips, { PROTOCOL_KIND_MAGIC_COMMENTS } from './rehype-semantic-chips.js';
/** Self-hosted font files, served from `styles/static` under `<baseUrl>b10x-fonts/`. */
export const PRODUCT_FONT_DIRECTORY = fileURLToPath(new URL('../styles/static', import.meta.url));
const FONT_RANGE = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2190-21FF,U+2212,U+2215,U+2315,U+25A0-25FF,U+2713,U+2715,U+FEFF,U+FFFD';
/** `@font-face` rules and preload links for the self-hosted fonts (latin subset, swap). */
export function fontHeadTags(baseUrl) {
    const url = (file) => `${baseUrl.replace(/\/+$/, '')}/b10x-fonts/${file}`;
    const face = (family, file, weight) => `@font-face{font-family:"${family}";src:url("${url(file)}") format("woff2");font-weight:${weight};font-style:normal;font-display:swap;unicode-range:${FONT_RANGE}}`;
    const css = [
        face('Inter', 'inter-variable-latin.woff2', '100 900'),
        face('Fira Code', 'fira-code-regular-latin.woff2', '400'),
        face('Fira Code', 'fira-code-semibold-latin.woff2', '600'),
    ].join('');
    const preload = (file) => ({ tagName: 'link', attributes: { rel: 'preload', href: url(file), as: 'font', type: 'font/woff2', crossorigin: 'anonymous' } });
    return [preload('inter-variable-latin.woff2'), preload('fira-code-regular-latin.woff2'), { tagName: 'style', innerHTML: css }];
}
const styles = (name) => fileURLToPath(new URL(`../styles/${name}`, import.meta.url));
export default function productSitePlugin(context, options = {}) {
    const landingFile = options.landing ? path.resolve(context.siteDir, options.landing) : undefined;
    const watched = new Set(landingFile ? [landingFile] : []);
    if (options.product !== undefined && !isProductId(options.product))
        throw new Error(`product-site product must be one of ${Object.keys(PRODUCT_SIGNATURES).join(', ')}, received ${JSON.stringify(options.product)}`);
    const mark = options.mark ?? (options.product ? PRODUCT_SIGNATURES[options.product].mark : context.siteConfig?.title?.slice(0, 1)) ?? '';
    if (mark && !/^[\p{L}\p{N}]{1,3}$/u.test(mark))
        throw new Error(`product-site mark must be one to three letters or digits, received ${JSON.stringify(mark)}`);
    return {
        name: 'b10x-product-site',
        getThemePath: () => fileURLToPath(new URL('./theme', import.meta.url)),
        getClientModules: () => [styles('tokens.css'), styles('product-components.css'), styles('product-theme.css')],
        getPathsToWatch: () => [...watched],
        async loadContent() {
            if (!landingFile)
                return null;
            const landing = await readLanding(landingFile, watched);
            return landing;
        },
        async contentLoaded({ content, actions }) {
            const global = { ...(options.product ? { product: options.product } : {}), build: await docsSystemBuild(context.siteDir) };
            actions.setGlobalData?.(global);
            if (!content)
                return;
            const data = await actions.createData('b10x-product-landing.json', JSON.stringify(content));
            actions.addRoute({ path: joinRoute(context.baseUrl, options.landingPath ?? '/'), component: '@theme/ProductLandingPage', exact: true, modules: { landing: data } });
        },
        injectHtmlTags: () => ({ headTags: [
                ...(options.fonts ? fontHeadTags(context.baseUrl) : []),
                ...(mark ? [{ tagName: 'style', innerHTML: `:root{--b10x-product-mark:"${mark}"}` }] : []),
                ...(options.product ? [{ tagName: 'style', innerHTML: productSignatureCss(options.product) }] : []),
            ] }),
        async postBuild({ outDir }) {
            if (options.admonitionGuard !== false) {
                const found = [];
                for (const file of await htmlFiles(outDir)) {
                    for (const problem of rawAdmonitionHtmlProblems(await fs.readFile(file, 'utf8')))
                        found.push(`  ${path.relative(outDir, file)}:${problem.line}: ${problem.text}`);
                }
                if (found.length)
                    throw new Error(`raw admonition markers reached the built pages; write titles in brackets (:::caution[Planned]):\n${found.join('\n')}`);
            }
            if (options.trailingSlashRedirects !== false && context.siteConfig?.trailingSlash === false) {
                await writeTrailingSlashRedirects(outDir, context.baseUrl, context.siteConfig.url ?? 'http://localhost');
            }
        },
    };
}
/** Read a landing file and inline every referenced terminal session and graph document. */
export async function readLanding(file, watched) {
    const directory = path.dirname(file);
    const parse = (text, name) => name.endsWith('.json') ? JSON.parse(text) : YAML.parse(text);
    const landing = parse(await fs.readFile(file, 'utf8'), file);
    if (landing?.format !== PRODUCT_LANDING_FORMAT)
        throw new Error(`${file}: format must be ${PRODUCT_LANDING_FORMAT}`);
    const load = async (reference) => {
        if (typeof reference !== 'string')
            return reference;
        const target = path.resolve(directory, reference);
        watched?.add(target);
        return parse(await fs.readFile(target, 'utf8'), target);
    };
    if (landing.product.terminal !== undefined)
        landing.product.terminal = parseTerminalSession(await load(landing.product.terminal));
    const art = landing.product.art;
    if (art !== undefined) {
        if (!art || typeof art !== 'object' || !ART_KINDS.includes(art.kind))
            throw new Error(`${file}: product.art.kind must be one of ${ART_KINDS.join(', ')}`);
        if (art.kind === 'terminal')
            art.session = parseTerminalSession(await load(art.session));
        else if (art.kind === 'protocol-graph')
            art.data = parseProtocolGraph(await load(art.data));
        else if (art.kind === 'domain-graph')
            art.data = parseDomainGraph(await load(art.data));
        else if (art.kind === 'case')
            art.data = parseCaseDocument(await load(art.data));
        else
            art.data = parseCodePairDocument(await load(art.data));
    }
    for (const [index, section] of (landing.sections ?? []).entries()) {
        if (section.kind === 'terminal')
            section.session = parseTerminalSession(await load(section.session));
        if (section.kind === 'protocol-graph')
            section.data = parseProtocolGraph(await load(section.data));
        if (section.kind === 'domain-graph')
            section.data = parseDomainGraph(await load(section.data));
        if (section.kind === 'status') {
            if (typeof section.items === 'string') {
                const status = parseStatusDocument(await load(section.items));
                section.items = status.items;
                if (status.asOf)
                    section.asOf = status.asOf;
                if (status.source)
                    section.source = status.source;
            }
            else
                parseStatusItems(section.items, `${file}: sections[${index}].items`);
        }
        if (section.kind === 'related') {
            section.tools.forEach((tool, toolIndex) => {
                if (isFamilyRelatedTool(tool))
                    parseFamilyRelatedTool(tool, `${file}: sections[${index}].tools[${toolIndex}]`);
            });
        }
    }
    try {
        landingKpis(landing);
    }
    catch (error) {
        throw new Error(`${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
    return landing;
}
/**
 * The docs-system revision this site is built with: `B10X_DOCS_SYSTEM_REVISION`, else the commit
 * the site's lockfile pins, else this package's own Git checkout, else its version.
 */
export async function docsSystemBuild(siteDir) {
    const env = process.env.B10X_DOCS_SYSTEM_REVISION;
    if (env && /^[0-9a-f]{7,40}$/.test(env))
        return { revision: env, kind: 'commit' };
    for (let directory = path.resolve(siteDir);; directory = path.dirname(directory)) {
        try {
            const lock = JSON.parse(await fs.readFile(path.join(directory, 'package-lock.json'), 'utf8'));
            const resolved = lock.packages?.['node_modules/@beyond10x/docs-system']?.resolved;
            const commit = resolved && /#([0-9a-f]{40})$/.exec(resolved)?.[1];
            if (commit)
                return { revision: commit, kind: 'commit' };
        }
        catch {
            // No lockfile here, or not one that pins docs-system.
        }
        if (path.dirname(directory) === directory)
            break;
    }
    const packageRoot = fileURLToPath(new URL('..', import.meta.url));
    try {
        const git = (args) => execFileSync('git', ['-C', packageRoot, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        // Only this package's own checkout counts; an installed copy sits inside the site's repository.
        if (await fs.realpath(git(['rev-parse', '--show-toplevel'])) === await fs.realpath(packageRoot)) {
            const revision = git(['rev-parse', 'HEAD']);
            if (/^[0-9a-f]{40}$/.test(revision))
                return { revision, kind: 'commit', ...(git(['status', '--porcelain', '--untracked-files=no']) ? { dirty: true } : {}) };
        }
    }
    catch {
        // No Git, or not a checkout.
    }
    const manifest = JSON.parse(await fs.readFile(path.join(packageRoot, 'package.json'), 'utf8'));
    return { revision: manifest.version, kind: 'version' };
}
const SLASH_COPY_MARK = '<!-- b10x-trailing-slash-copy -->';
/**
 * With `trailingSlash: false` Docusaurus writes `docs/x.html`, and static hosts answer `docs/x/` with
 * a 404. Write `docs/x/index.html` for every page that has none, as a copy of the page with a
 * canonical link to `docs/x` and a script that moves to `docs/x` only when the path ends in `/`
 * (keeping query and hash). A server that answers `docs/x` with `docs/x/index.html` therefore shows
 * the page instead of redirecting to itself; there is no meta refresh. Earlier copies are refreshed.
 */
export async function writeTrailingSlashRedirects(outDir, baseUrl, origin) {
    const written = [];
    const base = `/${baseUrl.replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/');
    for (const file of await htmlFiles(outDir)) {
        const relative = path.relative(outDir, file).split(path.sep).join('/');
        if (relative === 'index.html' || relative === '404.html' || relative.endsWith('/index.html'))
            continue;
        const route = relative.slice(0, -'.html'.length);
        const target = path.join(outDir, ...route.split('/'), 'index.html');
        if (await exists(target) && !(await fs.readFile(target, 'utf8')).includes(SLASH_COPY_MARK))
            continue;
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, trailingSlashCopy(await fs.readFile(file, 'utf8'), `${base}${route}`, origin), 'utf8');
        written.push(`${route}/index.html`);
    }
    return written;
}
function trailingSlashCopy(page, to, origin) {
    const attribute = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const canonical = `<link rel="canonical" href="${attribute(new URL(to, `${origin.replace(/\/$/, '')}/`).href)}">`;
    const script = `<script>if(location.pathname.endsWith("/"))location.replace(${JSON.stringify(to).replace(/</g, '\\u003c')}+location.search+location.hash)</script>`;
    const withoutCanonical = page.replace(/<link\b[^>]*\brel=["']?canonical\b[^>]*>/gi, '');
    const head = /<head\b[^>]*>/i.exec(withoutCanonical);
    return head
        ? `${withoutCanonical.slice(0, head.index + head[0].length)}${SLASH_COPY_MARK}${script}${canonical}${withoutCanonical.slice(head.index + head[0].length)}`
        : `${SLASH_COPY_MARK}${script}${canonical}${withoutCanonical}`;
}
async function exists(file) {
    try {
        await fs.access(file);
        return true;
    }
    catch {
        return false;
    }
}
async function htmlFiles(directory) {
    const files = [];
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
        const full = path.join(directory, entry.name);
        if (entry.isDirectory())
            files.push(...await htmlFiles(full));
        else if (entry.isFile() && entry.name.endsWith('.html'))
            files.push(full);
    }
    return files.sort();
}
/** Mermaid themed from the tokens, per colour mode. Added only beside `@docusaurus/theme-mermaid`. */
export function productMermaidTheme() {
    return { name: 'b10x-product-mermaid', getThemePath: () => fileURLToPath(new URL('./theme-mermaid', import.meta.url)) };
}
const DOCS_PLUGINS = new Set(['@docusaurus/plugin-content-docs', 'content-docs', 'docusaurus-plugin-content-docs']);
const PAGES_PLUGINS = new Set(['@docusaurus/plugin-content-pages', 'content-pages', 'docusaurus-plugin-content-pages']);
const CLASSIC = new Set(['classic', '@docusaurus/preset-classic', 'docusaurus-preset-classic']);
const STATUS_ADMONITIONS = { keywords: ['shipped', 'decided', 'planned'], extendDefaults: true };
/** Add the chips pass (and status admonition keywords for docs) to one content plugin's options. */
function withContentOptions(options, docs) {
    if (options === false)
        return options;
    const current = (options && typeof options === 'object' ? options : {});
    const rehype = Array.isArray(current.rehypePlugins) ? current.rehypePlugins : [];
    const admonitions = current.admonitions;
    return {
        ...current,
        rehypePlugins: rehype.includes(rehypeSemanticChips) ? rehype : [...rehype, rehypeSemanticChips],
        ...(docs || admonitions !== undefined ? { admonitions: admonitions === false ? false : mergeAdmonitions(admonitions) } : {}),
    };
}
function mergeAdmonitions(value) {
    if (!value || typeof value !== 'object')
        return STATUS_ADMONITIONS;
    const current = value;
    return { ...current, keywords: [...new Set([...(current.keywords ?? []), ...STATUS_ADMONITIONS.keywords])], extendDefaults: current.extendDefaults ?? true };
}
function withChips(entries, kind) {
    return entries?.map((entry) => {
        if (!Array.isArray(entry) || typeof entry[0] !== 'string')
            return entry;
        const [name, options] = entry;
        if (kind === 'preset' && CLASSIC.has(name)) {
            const preset = (options && typeof options === 'object' ? options : {});
            return [name, { ...preset, docs: withContentOptions(preset.docs, true), pages: withContentOptions(preset.pages, false) }];
        }
        if (kind === 'plugin' && DOCS_PLUGINS.has(name))
            return [name, withContentOptions(options, true)];
        if (kind === 'plugin' && PAGES_PLUGINS.has(name))
            return [name, withContentOptions(options, false)];
        return entry;
    });
}
/**
 * Wrap a Docusaurus config: the product layer, self-hosted fonts, matched Prism themes with the
 * protocol/1 kind gutter, meaning chips and status admonitions in docs, Mermaid from the tokens,
 * and a dark default.
 */
export function withProductSite(config, options = {}) {
    const themeConfig = (config.themeConfig ?? {});
    const prism = (themeConfig.prism ?? {});
    const colorMode = (themeConfig.colorMode ?? {});
    const themes = config.themes ?? [];
    const mermaid = themes.some((theme) => theme === '@docusaurus/theme-mermaid' || (Array.isArray(theme) && theme[0] === '@docusaurus/theme-mermaid'));
    const fonts = options.fonts ?? true;
    const staticDirectories = config.staticDirectories ?? ['static'];
    const highlight = { className: 'theme-code-block-highlighted-line', line: 'highlight-next-line', block: { start: 'highlight-start', end: 'highlight-end' } };
    return {
        ...config,
        ...(fonts ? { staticDirectories: staticDirectories.includes(PRODUCT_FONT_DIRECTORY) ? staticDirectories : [...staticDirectories, PRODUCT_FONT_DIRECTORY] } : {}),
        ...(config.presets ? { presets: withChips(config.presets, 'preset') } : {}),
        // Standalone themes load after plugins, so the Mermaid override goes right after theme-mermaid.
        ...(mermaid ? { themes: themes.flatMap((theme) => theme === '@docusaurus/theme-mermaid' || (Array.isArray(theme) && theme[0] === '@docusaurus/theme-mermaid') ? [theme, productMermaidTheme] : [theme]) } : {}),
        plugins: [...(withChips(config.plugins, 'plugin') ?? []), [productSitePlugin, { ...options, fonts }]],
        themeConfig: {
            ...themeConfig,
            colorMode: { defaultMode: 'dark', respectPrefersColorScheme: true, ...colorMode },
            prism: {
                theme: productPrismTheme,
                darkTheme: productPrismDarkTheme,
                ...prism,
                magicComments: [...(prism.magicComments ?? [highlight]), ...PROTOCOL_KIND_MAGIC_COMMENTS],
                additionalLanguages: [...new Set([...PRISM_ADDITIONAL_LANGUAGES, ...(prism.additionalLanguages ?? [])])],
            },
        },
    };
}
function joinRoute(baseUrl, route) {
    const joined = `${baseUrl.replace(/\/+$/, '')}/${route.replace(/^\/+/, '')}`;
    return joined === '' ? '/' : joined;
}
