import type { DocsSystemBuild } from './family.js';
import type { ProductLandingData } from './product-data.js';
import type { ProductId } from './product-palette.js';
import type { LoadedReference, ProductSiteReference } from './reference-data.js';
export { checkReferenceOptions, readReference, REFERENCE_KINDS } from './reference-data.js';
export type { LoadedReference, ProductSiteReference, ReferenceKind, ReferenceModule } from './reference-data.js';
export interface ProductSiteOptions {
    /** A `b10x-product-landing/1` file (JSON or YAML), relative to the site directory. */
    landing?: string;
    /** Route of the landing page below `baseUrl`. */
    landingPath?: string;
    /** One to three characters for the navbar mark; defaults to the product's mark or the title's first letter. */
    mark?: string;
    /**
     * The product whose signature hue tints the navbar mark, kicker dot and hero emphasis:
     * 'canon', 'els', 'loom', 'commission', 'ess' or 'a2a'. Status, truth and kind colours never change with it.
     */
    product?: ProductId;
    /**
     * The site's favicon, a path under one of its static directories, passed to Docusaurus as
     * `favicon`. A `favicon` already set in the config wins. With neither, `withProductSite` serves a
     * generated SVG of the mark on the product hue (the family green without a product).
     */
    favicon?: string;
    /** Self-hosted Inter and Fira Code with preload. `withProductSite` turns this on and serves the files. */
    fonts?: boolean;
    /** Fail the build when a raw `:::kind Title` line reaches a page. Default true. */
    admonitionGuard?: boolean;
    /**
     * With `trailingSlash: false`, write a redirect at `x/index.html` for every `x.html`, so `/docs/x/`
     * reaches the page instead of a 404. Default true.
     */
    trailingSlashRedirects?: boolean;
    /**
     * Reference pages: each source (OpenAPI 3.1, AsyncAPI 3.0 or `b10x-cli-reference/1`, JSON or
     * YAML, relative to the site directory) is read and checked at build time, importable in MDX as
     * `@b10x-reference/<id>.json` for `<ApiReference reference={...} />`, and served unchanged at
     * `<baseUrl>reference/<id>.<ext>`.
     */
    references?: ProductSiteReference[];
}
/**
 * The generated static directory of reference downloads, relative to the site directory (inside
 * the Docusaurus generated-files directory): it holds `reference/<id>.<ext>`.
 */
export declare const PRODUCT_REFERENCE_STATIC = ".docusaurus/b10x-reference-files";
/** The module prefix of reference data: `@b10x-reference/<id>.json`. */
export declare const PRODUCT_REFERENCE_ALIAS = "@b10x-reference";
/**
 * The theme's MDX vocabulary loads the reference renderers with `import()`. Docusaurus's server
 * Babel turns that into `require()`, which a bundler leaves alone in a `"type": "module"` package,
 * so this one file is bundled as `javascript/auto` (webpack and rspack alike).
 */
export declare const PRODUCT_MDX_COMPONENTS: string;
/**
 * Each `@b10x-reference/<id>.json` resolves to a generated module that returns the data through
 * this file, so the renderers ride in the importing page's own chunks (see `reference-preload.ts`).
 */
export declare const PRODUCT_REFERENCE_PRELOAD: string;
/** Self-hosted font files, served from `styles/static` under `<baseUrl>b10x-fonts/`. */
export declare const PRODUCT_FONT_DIRECTORY: string;
/** The default share card, served from `styles/social` as `<baseUrl>b10x-social/card.png`. */
export declare const PRODUCT_SOCIAL_DIRECTORY: string;
export declare const PRODUCT_SOCIAL_CARD = "b10x-social/card.png";
/**
 * Generated favicons live below this directory, one content-addressed subdirectory per SVG, and the
 * chosen one is served as `<baseUrl>b10x-favicon.svg`.
 */
export declare const PRODUCT_FAVICON_ROOT: string;
export declare const PRODUCT_FAVICON = "b10x-favicon.svg";
/**
 * The generated favicon: the mark in white on a tile of the product's light ink (at least 6.5:1),
 * ringed with the product hue. Without a product the tile takes the family green.
 */
export declare function productFaviconSvg(mark: string, product?: ProductId): string;
/** Write one generated favicon (once per content) and return the static directory serving it. */
export declare function writeProductFavicon(svg: string): string;
/** `@font-face` rules and preload links for the self-hosted fonts (latin subset, swap). */
export declare function fontHeadTags(baseUrl: string): HeadTag[];
interface HeadTag {
    tagName: string;
    innerHTML?: string;
    attributes?: Record<string, string>;
}
interface SiteContext {
    siteDir: string;
    baseUrl: string;
    generatedFilesDir?: string;
    siteConfig?: {
        title?: string;
        url?: string;
        trailingSlash?: boolean;
    };
}
interface PluginActions {
    createData(name: string, content: string): Promise<string>;
    addRoute(route: {
        path: string;
        component: string;
        exact?: boolean;
        modules?: Record<string, string>;
    }): void;
    setGlobalData?(data: unknown): void;
}
export interface ProductSitePlugin {
    name: string;
    getThemePath(): string;
    getClientModules(): string[];
    getPathsToWatch(): string[];
    loadContent(): Promise<ProductLandingData | null>;
    contentLoaded(input: {
        content: ProductLandingData | null;
        actions: PluginActions;
    }): Promise<void>;
    injectHtmlTags(): {
        headTags: HeadTag[];
    };
    configureWebpack(): {
        module: {
            rules: Array<{
                test: string;
                type: string;
            }>;
        };
        resolve?: {
            alias: Record<string, string>;
        };
    };
    postBuild(input: {
        outDir: string;
    }): Promise<void>;
}
export default function productSitePlugin(context: SiteContext, options?: ProductSiteOptions): ProductSitePlugin;
/**
 * Write the unchanged source bytes as `<directory>/<id>.<ext>`, each atomically and only when it
 * changed, and remove files of references that are gone.
 */
export declare function writeReferenceFiles(directory: string, loaded: LoadedReference[]): Promise<void>;
/** Read a landing file and inline every referenced terminal session and graph document. */
export declare function readLanding(file: string, watched?: Set<string>): Promise<ProductLandingData>;
/**
 * The docs-system revision this site is built with: `B10X_DOCS_SYSTEM_REVISION`, else the commit
 * the site's lockfile pins, else this package's own Git checkout, else its version.
 */
export declare function docsSystemBuild(siteDir: string): Promise<DocsSystemBuild>;
/**
 * With `trailingSlash: false` Docusaurus writes `docs/x.html`, and static hosts answer `docs/x/` with
 * a 404. Write `docs/x/index.html` for every page that has none, as a copy of the page with a
 * canonical link to `docs/x` and a script that moves to `docs/x` only when the path ends in `/`
 * (keeping query and hash). A server that answers `docs/x` with `docs/x/index.html` therefore shows
 * the page instead of redirecting to itself; there is no meta refresh. Earlier copies are refreshed.
 */
export declare function writeTrailingSlashRedirects(outDir: string, baseUrl: string, origin: string): Promise<string[]>;
/** Mermaid themed from the tokens, per colour mode. Added only beside `@docusaurus/theme-mermaid`. */
export declare function productMermaidTheme(): {
    name: string;
    getThemePath(): string;
};
/**
 * Wrap a Docusaurus config: the product layer, self-hosted fonts, matched Prism themes with the
 * protocol/1 kind gutter, meaning chips and status admonitions in docs, Mermaid from the tokens,
 * a default share card when `themeConfig.image` is unset, a generated favicon when neither the
 * config nor `options.favicon` names one, and a dark default.
 */
export declare function withProductSite<T extends Record<string, unknown>>(config: T, options?: ProductSiteOptions): T;
