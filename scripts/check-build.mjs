import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const before = await snapshot('dist');
await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build']);
const after = await snapshot('dist');
assertSame(before, after);

async function snapshot(root) {
  const files = new Map();
  async function visit(directory) {
    for (const entry of await fs.readdir(directory, {withFileTypes: true})) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile()) files.set(file, createHash('sha256').update(await fs.readFile(file)).digest('hex'));
    }
  }
  await visit(root);
  return files;
}

function assertSame(before, after) {
  const changed = [...new Set([...before.keys(), ...after.keys()])]
    .filter((file) => before.get(file) !== after.get(file))
    .sort();
  if (changed.length > 0) {
    process.stderr.write(`generated distribution is stale:\n${changed.map((file) => `  ${file}`).join('\n')}\nRun npm run build and commit dist.\n`);
    process.exitCode = 1;
  }
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: 'inherit'});
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code ?? 'no status'}`)));
  });
}
