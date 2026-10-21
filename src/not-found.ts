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
