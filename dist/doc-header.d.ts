/**
 * The documentation page header: which front matter turns it on, and where the page sits in its
 * sidebar ("Concepts · 2 of 4"). Node-safe; the renderer is `theme/DocItem/Content`.
 */
import type { ProductStatus } from './product-data.js';
/** Front matter keys the header reads. Any of `status`, `lede` or `source` turns the header on. */
export interface DocHeaderFrontMatter {
    status?: ProductStatus;
    /** One or two sentences under the title. */
    lede?: string;
    /** Where the page's content comes from, for example "Generated from canon-ir/1 by canon-docs". */
    source?: string;
    /** Link for the source line. */
    source_url?: string;
    /** Replaces the sidebar category in the kicker. */
    kicker?: string;
}
/** The header fields of a page's front matter, or `undefined` when the page keeps today's layout. */
export declare function docHeaderFields(frontMatter: Record<string, unknown>): DocHeaderFrontMatter | undefined;
export interface SidebarItemLike {
    type: string;
    label?: string;
    href?: string;
    docId?: string;
    items?: SidebarItemLike[];
}
export interface SidebarPosition {
    /** The enclosing category's label; absent at the top level. */
    category?: string;
    index: number;
    total: number;
}
/** Where `permalink` sits among its siblings. Categories count as one sibling each; HTML items do not count. */
export declare function sidebarPosition(items: readonly SidebarItemLike[] | undefined, permalink: string): SidebarPosition | undefined;
/** "Concepts · 2 of 4", or "2 of 6" at the top level. */
export declare function docKicker(position: SidebarPosition | undefined, override?: string): string | undefined;
