/**
 * The product-site layer: one opt-in that turns a repository's Docusaurus site into a product
 * front page with documentation that shares its tokens.
 *
 * ```ts
 * import {withProductSite} from '@beyond10x/docs-system/product-site';
 * export default withProductSite(config, {landing: './product.json', product: 'canon'});
 * ```
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import YAML from 'yaml';
import {PRISM_ADDITIONAL_LANGUAGES} from './code.js';
import {parseDomainGraph, parseProtocolGraph} from './product-graphs.js';
import {PRODUCT_LANDING_FORMAT, parseTerminalSession} from './product-data.js';
import type {ProductLandingData} from './product-data.js';
import {productPrismDarkTheme, productPrismTheme} from './prism-themes.js';
import {rawAdmonitionHtmlProblems} from './admonition-guard.js';
import {isProductId, PRODUCT_SIGNATURES, productSignatureCss} from './product-palette.js';
import type {ProductId} from './product-palette.js';
import rehypeSemanticChips, {PROTOCOL_KIND_MAGIC_COMMENTS} from './rehype-semantic-chips.js';

export interface ProductSiteOptions {
  /** A `b10x-product-landing/1` file (JSON or YAML), relative to the site directory. */
  landing?: string;
  /** Route of the landing page below `baseUrl`. */
  landingPath?: string;
  /** One to three characters for the navbar mark; defaults to the product's mark or the title's first letter. */
  mark?: string;
  /**
   * The product whose signature hue tints the navbar mark, kicker dot and hero emphasis:
   * 'canon', 'els', 'loom', 'commission' or 'ess'. Status, truth and kind colours never change with it.
   */
  product?: ProductId;
  /** Self-hosted Inter and Fira Code with preload. `withProductSite` turns this on and serves the files. */
  fonts?: boolean;
  /** Fail the build when a raw `:::kind Title` line reaches a page. Default true. */
  admonitionGuard?: boolean;
}

/** Self-hosted font files, served from `styles/static` under `<baseUrl>b10x-fonts/`. */
export const PRODUCT_FONT_DIRECTORY = fileURLToPath(new URL('../styles/static', import.meta.url));
const FONT_RANGE = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2190-21FF,U+2212,U+2215,U+2315,U+25A0-25FF,U+2713,U+2715,U+FEFF,U+FFFD';

/** `@font-face` rules and preload links for the self-hosted fonts (latin subset, swap). */
export function fontHeadTags(baseUrl: string): HeadTag[] {
  const url = (file: string): string => `${baseUrl.replace(/\/+$/, '')}/b10x-fonts/${file}`;
  const face = (family: string, file: string, weight: string): string => `@font-face{font-family:"${family}";src:url("${url(file)}") format("woff2");font-weight:${weight};font-style:normal;font-display:swap;unicode-range:${FONT_RANGE}}`;
  const css = [
    face('Inter', 'inter-variable-latin.woff2', '100 900'),
    face('Fira Code', 'fira-code-regular-latin.woff2', '400'),
    face('Fira Code', 'fira-code-semibold-latin.woff2', '600'),
  ].join('');
  const preload = (file: string): HeadTag => ({tagName: 'link', attributes: {rel: 'preload', href: url(file), as: 'font', type: 'font/woff2', crossorigin: 'anonymous'}});
  return [preload('inter-variable-latin.woff2'), preload('fira-code-regular-latin.woff2'), {tagName: 'style', innerHTML: css}];
}

interface HeadTag {tagName: string; innerHTML?: string; attributes?: Record<string, string>}

interface SiteContext {siteDir: string; baseUrl: string; siteConfig?: {title?: string}}
interface PluginActions {
  createData(name: string, content: string): Promise<string>;
  addRoute(route: {path: string; component: string; exact?: boolean; modules?: Record<string, string>}): void;
}

export interface ProductSitePlugin {
  name: string;
  getThemePath(): string;
  getClientModules(): string[];
  getPathsToWatch(): string[];
  loadContent(): Promise<ProductLandingData | null>;
  contentLoaded(input: {content: ProductLandingData | null; actions: PluginActions}): Promise<void>;
  injectHtmlTags(): {headTags: HeadTag[]};
  postBuild(input: {outDir: string}): Promise<void>;
}

const styles = (name: string): string => fileURLToPath(new URL(`../styles/${name}`, import.meta.url));

export default function productSitePlugin(context: SiteContext, options: ProductSiteOptions = {}): ProductSitePlugin {
  const landingFile = options.landing ? path.resolve(context.siteDir, options.landing) : undefined;
  const watched = new Set<string>(landingFile ? [landingFile] : []);
  if (options.product !== undefined && !isProductId(options.product)) throw new Error(`product-site product must be one of ${Object.keys(PRODUCT_SIGNATURES).join(', ')}, received ${JSON.stringify(options.product)}`);
  const mark = options.mark ?? (options.product ? PRODUCT_SIGNATURES[options.product].mark : context.siteConfig?.title?.slice(0, 1)) ?? '';
  if (mark && !/^[\p{L}\p{N}]{1,3}$/u.test(mark)) throw new Error(`product-site mark must be one to three letters or digits, received ${JSON.stringify(mark)}`);
  return {
    name: 'b10x-product-site',
    getThemePath: () => fileURLToPath(new URL('./theme', import.meta.url)),
    getClientModules: () => [styles('tokens.css'), styles('product-components.css'), styles('product-theme.css')],
    getPathsToWatch: () => [...watched],
    async loadContent() {
      if (!landingFile) return null;
      const landing = await readLanding(landingFile, watched);
      return landing;
    },
    async contentLoaded({content, actions}) {
      if (!content) return;
      const data = await actions.createData('b10x-product-landing.json', JSON.stringify(content));
      actions.addRoute({path: joinRoute(context.baseUrl, options.landingPath ?? '/'), component: '@theme/ProductLandingPage', exact: true, modules: {landing: data}});
    },
    injectHtmlTags: () => ({headTags: [
      ...(options.fonts ? fontHeadTags(context.baseUrl) : []),
      ...(mark ? [{tagName: 'style', innerHTML: `:root{--b10x-product-mark:"${mark}"}`}] : []),
      ...(options.product ? [{tagName: 'style', innerHTML: productSignatureCss(options.product)}] : []),
    ]}),
    async postBuild({outDir}) {
      if (options.admonitionGuard === false) return;
      const found: string[] = [];
      for (const file of await htmlFiles(outDir)) {
        for (const problem of rawAdmonitionHtmlProblems(await fs.readFile(file, 'utf8'))) found.push(`  ${path.relative(outDir, file)}:${problem.line}: ${problem.text}`);
      }
      if (found.length) throw new Error(`raw admonition markers reached the built pages; write titles in brackets (:::caution[Planned]):\n${found.join('\n')}`);
    },
  };
}

/** Read a landing file and inline every referenced terminal session and graph document. */
export async function readLanding(file: string, watched?: Set<string>): Promise<ProductLandingData> {
  const directory = path.dirname(file);
  const parse = (text: string, name: string): unknown => name.endsWith('.json') ? JSON.parse(text) : YAML.parse(text);
  const landing = parse(await fs.readFile(file, 'utf8'), file) as ProductLandingData;
  if (landing?.format !== PRODUCT_LANDING_FORMAT) throw new Error(`${file}: format must be ${PRODUCT_LANDING_FORMAT}`);
  const load = async (reference: unknown): Promise<unknown> => {
    if (typeof reference !== 'string') return reference;
    const target = path.resolve(directory, reference);
    watched?.add(target);
    return parse(await fs.readFile(target, 'utf8'), target);
  };
  if (landing.product.terminal !== undefined) landing.product.terminal = parseTerminalSession(await load(landing.product.terminal));
  for (const section of landing.sections ?? []) {
    if (section.kind === 'terminal') section.session = parseTerminalSession(await load(section.session));
    if (section.kind === 'protocol-graph') section.data = parseProtocolGraph(await load(section.data));
    if (section.kind === 'domain-graph') section.data = parseDomainGraph(await load(section.data));
  }
  return landing;
}

async function htmlFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await fs.readdir(directory, {withFileTypes: true})) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files.sort();
}

/** Mermaid themed from the tokens, per colour mode. Added only beside `@docusaurus/theme-mermaid`. */
export function productMermaidTheme(): {name: string; getThemePath(): string} {
  return {name: 'b10x-product-mermaid', getThemePath: () => fileURLToPath(new URL('./theme-mermaid', import.meta.url))};
}

const DOCS_PLUGINS = new Set(['@docusaurus/plugin-content-docs', 'content-docs', 'docusaurus-plugin-content-docs']);
const PAGES_PLUGINS = new Set(['@docusaurus/plugin-content-pages', 'content-pages', 'docusaurus-plugin-content-pages']);
const CLASSIC = new Set(['classic', '@docusaurus/preset-classic', 'docusaurus-preset-classic']);
const STATUS_ADMONITIONS = {keywords: ['shipped', 'decided', 'planned'], extendDefaults: true};

/** Add the chips pass (and status admonition keywords for docs) to one content plugin's options. */
function withContentOptions(options: unknown, docs: boolean): unknown {
  if (options === false) return options;
  const current = (options && typeof options === 'object' ? options : {}) as Record<string, unknown>;
  const rehype = Array.isArray(current.rehypePlugins) ? current.rehypePlugins : [];
  const admonitions = current.admonitions;
  return {
    ...current,
    rehypePlugins: rehype.includes(rehypeSemanticChips) ? rehype : [...rehype, rehypeSemanticChips],
    ...(docs || admonitions !== undefined ? {admonitions: admonitions === false ? false : mergeAdmonitions(admonitions)} : {}),
  };
}

function mergeAdmonitions(value: unknown): unknown {
  if (!value || typeof value !== 'object') return STATUS_ADMONITIONS;
  const current = value as {keywords?: string[]; extendDefaults?: boolean};
  return {...current, keywords: [...new Set([...(current.keywords ?? []), ...STATUS_ADMONITIONS.keywords])], extendDefaults: current.extendDefaults ?? true};
}

function withChips(entries: unknown[] | undefined, kind: 'preset' | 'plugin'): unknown[] | undefined {
  return entries?.map((entry) => {
    if (!Array.isArray(entry) || typeof entry[0] !== 'string') return entry;
    const [name, options] = entry as [string, unknown];
    if (kind === 'preset' && CLASSIC.has(name)) {
      const preset = (options && typeof options === 'object' ? options : {}) as Record<string, unknown>;
      return [name, {...preset, docs: withContentOptions(preset.docs, true), pages: withContentOptions(preset.pages, false)}];
    }
    if (kind === 'plugin' && DOCS_PLUGINS.has(name)) return [name, withContentOptions(options, true)];
    if (kind === 'plugin' && PAGES_PLUGINS.has(name)) return [name, withContentOptions(options, false)];
    return entry;
  });
}

/**
 * Wrap a Docusaurus config: the product layer, self-hosted fonts, matched Prism themes with the
 * protocol/1 kind gutter, meaning chips and status admonitions in docs, Mermaid from the tokens,
 * and a dark default.
 */
export function withProductSite<T extends Record<string, unknown>>(config: T, options: ProductSiteOptions = {}): T {
  const themeConfig = (config.themeConfig ?? {}) as Record<string, unknown>;
  const prism = (themeConfig.prism ?? {}) as {additionalLanguages?: string[]; magicComments?: unknown[]} & Record<string, unknown>;
  const colorMode = (themeConfig.colorMode ?? {}) as Record<string, unknown>;
  const themes = (config.themes as unknown[] | undefined) ?? [];
  const mermaid = themes.some((theme) => theme === '@docusaurus/theme-mermaid' || (Array.isArray(theme) && theme[0] === '@docusaurus/theme-mermaid'));
  const fonts = options.fonts ?? true;
  const staticDirectories = (config.staticDirectories as string[] | undefined) ?? ['static'];
  const highlight = {className: 'theme-code-block-highlighted-line', line: 'highlight-next-line', block: {start: 'highlight-start', end: 'highlight-end'}};
  return {
    ...config,
    ...(fonts ? {staticDirectories: staticDirectories.includes(PRODUCT_FONT_DIRECTORY) ? staticDirectories : [...staticDirectories, PRODUCT_FONT_DIRECTORY]} : {}),
    ...(config.presets ? {presets: withChips(config.presets as unknown[], 'preset')} : {}),
    // Standalone themes load after plugins, so the Mermaid override goes right after theme-mermaid.
    ...(mermaid ? {themes: themes.flatMap((theme) => theme === '@docusaurus/theme-mermaid' || (Array.isArray(theme) && theme[0] === '@docusaurus/theme-mermaid') ? [theme, productMermaidTheme] : [theme])} : {}),
    plugins: [...(withChips(config.plugins as unknown[] | undefined, 'plugin') ?? []), [productSitePlugin, {...options, fonts}]],
    themeConfig: {
      ...themeConfig,
      colorMode: {defaultMode: 'dark', respectPrefersColorScheme: true, ...colorMode},
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

function joinRoute(baseUrl: string, route: string): string {
  const joined = `${baseUrl.replace(/\/+$/, '')}/${route.replace(/^\/+/, '')}`;
  return joined === '' ? '/' : joined;
}
