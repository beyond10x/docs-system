import type { ProductLandingData } from './product-data.js';
export interface ProductSiteOptions {
    /** A `b10x-product-landing/1` file (JSON or YAML), relative to the site directory. */
    landing?: string;
    /** Route of the landing page below `baseUrl`. */
    landingPath?: string;
    /** One to three characters for the navbar mark; defaults to the site title's first letter. */
    mark?: string;
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
        headTags: Array<{
            tagName: string;
            innerHTML: string;
        }>;
    };
}
export default function productSitePlugin(context: SiteContext, options?: ProductSiteOptions): ProductSitePlugin;
/** Read a landing file and inline every referenced terminal session and graph document. */
export declare function readLanding(file: string, watched?: Set<string>): Promise<ProductLandingData>;
/** Wrap a Docusaurus config: add the product layer, the matched Prism themes and a dark default. */
export declare function withProductSite<T extends Record<string, unknown>>(config: T, options?: ProductSiteOptions): T;
export {};
