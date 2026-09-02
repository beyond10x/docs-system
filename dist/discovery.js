import fs from 'node:fs/promises';
export const discoveryBlockStart = '<!-- b10x-docs:discovery:start -->';
export const discoveryBlockEnd = '<!-- b10x-docs:discovery:end -->';
export function discoveryOptionsFromManifest(manifest) {
    const publicSurface = manifest.surfaces.find((surface) => 'publication' in surface
        ? surface.publication.discoverability === 'public' && surface.publication.availability === 'published'
        : surface.discoverability === 'public' && surface.availability === 'published');
    if (!publicSurface)
        throw new Error(`${manifest.repository.id} has no published public documentation surface`);
    return {
        repository: manifest.repository.id,
        displayName: manifest.repository.displayName ?? publicSurface.name,
        docsUrl: publicSurface.canonicalUrl,
        ...(manifest.schema === 'b10x-docs/v3' || manifest.schema === 'b10x-docs/v4' ? { origin: manifest.delivery.origin } : {}),
    };
}
export function renderDiscoveryBlock(options) {
    const origin = (options.origin ?? 'https://beyond10x.github.io').replace(/\/$/, '');
    const projectUrl = `${origin}/ecosystem/${encodeURIComponent(options.repository)}/`;
    return `${discoveryBlockStart}
> **${options.displayName} in beyond10x:** [Start](${origin}/) · [Project](${projectUrl}) · [Documentation](${options.docsUrl}) · [Ecosystem](${origin}/ecosystem/) · [Changes](${origin}/changes/)
${discoveryBlockEnd}`;
}
export function updateDiscoveryBlock(readme, options) {
    const block = renderDiscoveryBlock(options);
    const start = readme.indexOf(discoveryBlockStart);
    const end = readme.indexOf(discoveryBlockEnd);
    if ((start < 0) !== (end < 0) || (start >= 0 && end < start))
        throw new Error('README contains an incomplete or malformed b10x discovery block');
    if (start >= 0)
        return `${readme.slice(0, start)}${block}${readme.slice(end + discoveryBlockEnd.length)}`;
    return `${readme.trimEnd()}\n\n${block}\n`;
}
export async function writeDiscoveryBlock(file, options, writeOptions = {}) {
    const before = await fs.readFile(file, 'utf8');
    const after = updateDiscoveryBlock(before, options);
    if (after === before)
        return false;
    if (writeOptions.check)
        throw new Error(`${file} discovery block is stale; run b10x-docs readme without --check`);
    await fs.writeFile(file, after, 'utf8');
    return true;
}
