import fs from 'node:fs/promises';
import path from 'node:path';
/** Materialize deterministic GitHub Pages compatibility routes without changing machine payloads. */
export async function writeRedirectMap(outputRoot, map, options = {}) {
    const resolvedOutput = path.resolve(outputRoot);
    const aliasRoot = path.resolve(options.aliasSourceRoot ?? '.');
    const destinations = new Set();
    for (const redirect of map.redirects) {
        const relativeOutput = outputPathForRoute(redirect.from, redirect.type === 'html');
        if (destinations.has(relativeOutput))
            throw new Error(`duplicate compatibility output ${relativeOutput}`);
        destinations.add(relativeOutput);
        const destination = path.resolve(resolvedOutput, ...relativeOutput.split('/'));
        ensureInside(resolvedOutput, destination, redirect.from);
        await fs.mkdir(path.dirname(destination), { recursive: true });
        if (redirect.type === 'html') {
            await fs.writeFile(destination, renderRedirectHtml(map.origin, redirect), 'utf8');
        }
        else {
            const source = path.resolve(aliasRoot, ...safeRelative(redirect.source, 'alias source').split('/'));
            ensureInside(aliasRoot, source, redirect.source);
            const stat = await fs.lstat(source);
            if (!stat.isFile() || stat.isSymbolicLink())
                throw new Error(`${redirect.source} is not a regular alias source file`);
            await fs.copyFile(source, destination);
        }
    }
}
export function renderRedirectHtml(origin, redirect) {
    const canonical = new URL(redirect.to, `${origin.replace(/\/$/, '')}/`).href;
    const target = JSON.stringify(redirect.to).replaceAll('<', '\\u003c');
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Documentation moved</title>
  <link rel="canonical" href="${html(canonical)}">
  <meta http-equiv="refresh" content="0;url=${html(redirect.to)}">
</head>
<body>
  <main><p>This documentation moved to <a href="${html(redirect.to)}">${html(canonical)}</a>.</p></main>
  <script>
    const destination = new URL(${target}, window.location.origin);
    if (!destination.search) destination.search = window.location.search;
    if (!destination.hash) destination.hash = window.location.hash;
    window.location.replace(destination.href);
  </script>
</body>
</html>
`;
}
export function outputPathForRoute(route, htmlRoute = false) {
    const value = route.replace(/^\/+/, '');
    if (!value)
        return 'index.html';
    const normalized = safeRelative(value.replace(/\/+$/, ''), 'compatibility route');
    if (htmlRoute && !path.posix.extname(normalized))
        return `${normalized}/index.html`;
    if (htmlRoute && route.endsWith('/'))
        return `${normalized}/index.html`;
    return normalized;
}
function safeRelative(value, context) {
    if (!value || value.includes('\\') || path.posix.isAbsolute(value))
        throw new Error(`${context} must be a non-empty relative path`);
    const normalized = path.posix.normalize(value);
    if (normalized === '..' || normalized.startsWith('../'))
        throw new Error(`${context} escapes its root`);
    return normalized;
}
function ensureInside(root, candidate, context) {
    const relative = path.relative(root, candidate);
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative))
        throw new Error(`${context} escapes its output root`);
}
function html(value) {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
