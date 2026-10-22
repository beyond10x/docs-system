/** The global data one docs plugin instance publishes, as far as the not-found page reads it. */
export interface DocsPluginData {
    path: string;
    versions: readonly {
        isLast: boolean;
        path: string;
        mainDocId: string;
        docs: readonly {
            id: string;
            path: string;
        }[];
    }[];
}
/**
 * Where the not-found page sends a reader for the docs: the main doc of the latest version of the
 * default docs plugin (or the first one), else that version's root. Undefined without a docs plugin.
 */
export declare function docsEntry(plugins: Readonly<Record<string, DocsPluginData>>): string | undefined;
/**
 * The meta description of the not-found page. Every other page carries one; a 404 without it
 * leaves a search result or a link preview with no summary.
 */
export declare function notFoundDescription(siteTitle: string | undefined): string;
/**
 * A 404 has no address of its own to name as canonical, so the page asks search engines not to
 * index it instead.
 */
export declare const NOT_FOUND_ROBOTS = "noindex";
