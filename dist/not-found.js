/**
 * Where the not-found page sends a reader for the docs: the main doc of the latest version of the
 * default docs plugin (or the first one), else that version's root. Undefined without a docs plugin.
 */
export function docsEntry(plugins) {
    const plugin = plugins.default ?? Object.values(plugins)[0];
    const version = plugin?.versions.find(entry => entry.isLast) ?? plugin?.versions[0];
    if (!version)
        return plugin?.path;
    return version.docs.find(doc => doc.id === version.mainDocId)?.path ?? version.path;
}
