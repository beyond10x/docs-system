import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';

/** Build the actual shared component with Docusaurus, without an external Website checkout. */
export async function viewerServer() {
  const root = path.resolve(import.meta.dirname, '..');
  const output = path.join(root, '.cache/ess-viewer-site-build');
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['node_modules/@docusaurus/core/bin/docusaurus.mjs', 'build', 'tests/viewer-site', '--out-dir', output], {cwd: root, stdio: 'inherit'});
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`viewer fixture build exited ${code}`)));
  });
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      let file = path.resolve(output, `.${pathname}`);
      if (!file.startsWith(`${output}${path.sep}`) && file !== output) throw new Error('invalid path');
      if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
      const content = await readFile(file);
      const types = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml'};
      response.writeHead(200, {'Content-Type': types[path.extname(file)] ?? 'application/octet-stream'}); response.end(content);
    } catch { response.writeHead(404); response.end('Not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))};
}
