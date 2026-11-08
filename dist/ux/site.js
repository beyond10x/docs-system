// Serves a built static site under its base URL on 127.0.0.1, with no network beyond loopback.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const TYPES = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
    '.xml': 'application/xml', '.txt': 'text/plain',
};
export async function serveSite(root, baseUrl) {
    const output = path.resolve(root);
    const resolveFile = async (pathname) => {
        if (!pathname.startsWith(baseUrl) && `${pathname}/` !== baseUrl)
            return undefined;
        const file = path.resolve(output, `.${pathname.slice(baseUrl.length - 1)}`);
        if (!file.startsWith(`${output}${path.sep}`) && file !== output)
            return undefined;
        for (const candidate of [file, path.join(file, 'index.html'), `${file}.html`]) {
            if (await stat(candidate).then((entry) => entry.isFile(), () => false))
                return candidate;
        }
        return undefined;
    };
    const server = createServer(async (request, response) => {
        const file = await resolveFile(decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)).catch(() => undefined);
        if (file) {
            response.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
            response.end(await readFile(file));
            return;
        }
        response.writeHead(404, { 'Content-Type': 'text/html' });
        response.end(await readFile(path.join(output, '404.html')).catch(() => 'Not found'));
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    return { url: `http://127.0.0.1:${port}${baseUrl}`, close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) };
}
/** Page paths after the base URL from the build's sitemap.xml, sorted; the root page is ''. */
export async function sitemapPages(root, baseUrl) {
    const xml = await readFile(path.join(root, 'sitemap.xml'), 'utf8').catch(() => '');
    const pages = new Set();
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
        const pathname = new URL(match[1]).pathname;
        if (!pathname.startsWith(baseUrl) && `${pathname}/` !== baseUrl)
            continue;
        pages.add(pathname.slice(baseUrl.length).replace(/\/$/, ''));
    }
    if (pages.size === 0)
        pages.add('');
    return [...pages].sort();
}
