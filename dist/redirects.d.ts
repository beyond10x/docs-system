import type { HtmlRedirect, RedirectMap } from './types.js';
export interface RedirectWriteOptions {
    /** Root containing the `source` files used by static aliases. Defaults to the current directory. */
    aliasSourceRoot?: string;
}
/** Materialize deterministic GitHub Pages compatibility routes without changing machine payloads. */
export declare function writeRedirectMap(outputRoot: string, map: RedirectMap, options?: RedirectWriteOptions): Promise<void>;
export declare function renderRedirectHtml(origin: string, redirect: HtmlRedirect): string;
export declare function outputPathForRoute(route: string, htmlRoute?: boolean): string;
