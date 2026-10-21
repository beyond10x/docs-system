import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdir, readFile, stat, symlink} from 'node:fs/promises';
import path from 'node:path';

/** Build the example product site with Docusaurus against this checkout and serve it under its base URL. */
export async function productSiteServer() {
  const root = path.resolve(import.meta.dirname, '..');
  const site = path.join(root, 'examples/product-site');
  const output = path.join(root, '.cache/product-site-build');
  const base = '/product-site/';
  await mkdir(path.join(site, 'node_modules/@beyond10x'), {recursive: true});
  await symlink('../../../..', path.join(site, 'node_modules/@beyond10x/docs-system')).catch(error => { if (error.code !== 'EEXIST') throw error; });
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['node_modules/@docusaurus/core/bin/docusaurus.mjs', 'build', 'examples/product-site', '--out-dir', output], {cwd: root, stdio: 'inherit'});
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`product site build exited ${code}`)));
  });
  const types = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2'};
  const resolveFile = async pathname => {
    if (!pathname.startsWith(base)) return undefined;
    const file = path.resolve(output, `.${pathname.slice(base.length - 1)}`);
    if (!file.startsWith(`${output}${path.sep}`) && file !== output) return undefined;
    for (const candidate of [file, path.join(file, 'index.html'), `${file}.html`]) {
      if (await stat(candidate).then(entry => entry.isFile(), () => false)) return candidate;
    }
    return undefined;
  };
  const server = createServer(async (request, response) => {
    const file = await resolveFile(decodeURIComponent(new URL(request.url, 'http://localhost').pathname)).catch(() => undefined);
    if (file) {
      response.writeHead(200, {'Content-Type': types[path.extname(file)] ?? 'application/octet-stream'});
      response.end(await readFile(file));
      return;
    }
    response.writeHead(404, {'Content-Type': 'text/html'});
    response.end(await readFile(path.join(output, '404.html')).catch(() => 'Not found'));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {url: `http://127.0.0.1:${server.address().port}${base}`, output, close: () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))};
}
