/**
 * Exactly one active navbar item: the most specific route match.
 *
 * Docusaurus marks every link whose path prefixes the current route, so `/docs/` and
 * `/docs/reference/ess` are both active on the reference page. This module scores each item by how
 * much of the route it matches and picks one winner; ties go to the earlier item. Node-safe.
 */
export interface NavbarItemLike {
    type?: string;
    to?: string;
    href?: string;
    label?: string;
    activeBasePath?: string;
    activeBaseRegex?: string;
    sidebarId?: string;
    docId?: string;
    docsPluginId?: string;
    items?: unknown;
}
export interface DocsGlobalDoc {
    id: string;
    path: string;
    sidebar?: string;
}
export interface DocsGlobalVersion {
    name?: string;
    isLast?: boolean;
    docs: DocsGlobalDoc[];
    sidebars?: Record<string, {
        link?: {
            path: string;
            label: string;
        };
    }>;
}
/** The docs plugin's global data, keyed by plugin id. */
export type DocsGlobalData = Record<string, {
    path: string;
    versions: DocsGlobalVersion[];
}>;
/** `useBaseUrl` semantics: prefix site-relative paths once. */
export declare function withBaseUrl(baseUrl: string, path: string): string;
export declare function currentDoc(pathname: string, docs: DocsGlobalData, pluginId?: string): DocsGlobalDoc | undefined;
/** How specifically an item matches the route: the matched length, or -1 when it does not match. */
export declare function navbarItemScore(item: NavbarItemLike, pathname: string, baseUrl: string, docs?: DocsGlobalData): number;
/** Index of the one item that should render active, or -1. */
export declare function activeNavbarItem(items: readonly NavbarItemLike[], pathname: string, baseUrl: string, docs?: DocsGlobalData): number;
/** Whether a rendered navbar item's props describe this configured item. */
export declare function sameNavbarItem(config: NavbarItemLike, props: NavbarItemLike): boolean;
/** The link a docSidebar or doc item points at, from the docs global data. */
export declare function docItemLink(item: NavbarItemLike, docs: DocsGlobalData, pathname: string): {
    path: string;
    label?: string;
} | undefined;
