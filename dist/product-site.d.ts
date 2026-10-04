import type { ProductLandingData } from './product-data.js';
import type { ProductId } from './product-palette.js';
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
export declare const PRODUCT_FONT_DIRECTORY: string;
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
    siteConfig?: {
        title?: string;
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
    postBuild(input: {
        outDir: string;
    }): Promise<void>;
}
export default function productSitePlugin(context: SiteContext, options?: ProductSiteOptions): ProductSitePlugin;
/** Read a landing file and inline every referenced terminal session and graph document. */
export declare function readLanding(file: string, watched?: Set<string>): Promise<ProductLandingData>;
/** Mermaid themed from the tokens, per colour mode. Added only beside `@docusaurus/theme-mermaid`. */
export declare function productMermaidTheme(): {
    name: string;
    getThemePath(): string;
};
/**
 * Wrap a Docusaurus config: the product layer, self-hosted fonts, matched Prism themes with the
 * protocol/1 kind gutter, meaning chips and status admonitions in docs, Mermaid from the tokens,
 * and a dark default.
 */
export declare function withProductSite<T extends Record<string, unknown>>(config: T, options?: ProductSiteOptions): T;
export {};
