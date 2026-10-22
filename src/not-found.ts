/** The global data one docs plugin instance publishes, as far as the not-found page reads it. */
export interface DocsPluginData {
  path: string;
  versions: readonly {isLast: boolean; path: string; mainDocId: string; docs: readonly {id: string; path: string}[]}[];
}

/**
 * Where the not-found page sends a reader for the docs: the main doc of the latest version of the
 * default docs plugin (or the first one), else that version's root. Undefined without a docs plugin.
 */
export function docsEntry(plugins: Readonly<Record<string, DocsPluginData>>): string | undefined {
  const plugin = plugins.default ?? Object.values(plugins)[0];
  const version = plugin?.versions.find(entry => entry.isLast) ?? plugin?.versions[0];
  if (!version) return plugin?.path;
  return version.docs.find(doc => doc.id === version.mainDocId)?.path ?? version.path;
}

/**
 * The meta description of the not-found page. Every other page carries one; a 404 without it
 * leaves a search result or a link preview with no summary.
 */
export function notFoundDescription(siteTitle: string | undefined): string {
  const title = siteTitle?.trim();
  return title ? `There is no page at this address on ${title}. It may have moved, or the link is out of date.` : 'There is no page at this address. It may have moved, or the link is out of date.';
}

/**
 * A 404 has no address of its own to name as canonical, so the page asks search engines not to
 * index it instead.
 */
export const NOT_FOUND_ROBOTS = 'noindex';
