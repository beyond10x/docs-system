// Adversarial pass 2: per-source refusals of Website origin/main (fb4024e) that check-source
// still passes. Each fixture is a copy of `clean` with one defect.
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {promisify} from 'node:util';

const execFileAsync = promisify(execFile);
const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const fixture = (name) => fileURLToPath(new URL(`./fixtures/source-check/${name}/`, import.meta.url));

async function checkSource(name) {
  try {
    const {stdout, stderr} = await execFileAsync(process.execPath, [cli, 'check-source', fixture(name)]);
    return {code: 0, stdout, stderr};
  } catch (error) {
    return {code: error.code, stdout: error.stdout, stderr: error.stderr};
  }
}

const detail = (result) => `expected exit 1, got ${result.code}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`;

// prepare-site documentMetadata -> qualifiedDocumentTitle(title, projectName) calls title.trim();
// a YAML-numeric `title: 2026` makes it throw "title.trim is not a function".
test('check-source refuses a document whose frontmatter title is not a string', async () => {
  const result = await checkSource('adv2-title-number');
  assert.equal(result.code, 1, detail(result));
  assert.match(result.stderr, /^docs\/guide\.md(?::\d+)?: /m);
});

// prepare-site materializeSpecification: `if (!route?.startsWith('/api/')) throw ...
// specification route must begin /api/`. The v3 schema allows any `^/.../$` route.
test('check-source refuses a specification whose route is not under /api/', async () => {
  const result = await checkSource('adv2-spec-route');
  assert.equal(result.code, 1, detail(result));
  assert.match(result.stderr, /schema\/example\.json|\/reference\/example\/schema\//);
});

// code-contract inspectSourceTree parses the generated .mdx, whose frontmatter line
// `title: "Set \\{name\\} | Example"` is an unbalanced MDX expression. The parse fails, the
// generated inventory is empty, and the one source fence is reported as changed.
test('check-source refuses an MDX document whose generated title breaks the generated fence inventory', async () => {
  const result = await checkSource('adv2-mdx-title');
  assert.equal(result.code, 1, detail(result));
  assert.match(result.stderr, /^docs\/braces\.mdx(?::\d+)?: /m);
});
