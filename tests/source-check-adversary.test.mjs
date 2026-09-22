// Adversarial cases: sources Website's publisher (origin/main scripts/prepare-site.mjs and
// scripts/code-contract.mjs source mode) refuses for one repository alone, and which
// `b10x-docs check-source` must therefore refuse too.
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

// code-contract.mjs inspectSourceTree compares the fences of the collected file with those of the
// passively rendered file and refuses a changed body. normalizePassiveMarkdown toggles fence state
// on any same-character marker, so an inner ``` closes a ```` fence and the next line is escaped
// as prose (`<task>` becomes `&lt;task&gt;`), changing the outer fence body.
test('check-source refuses a nested fence whose body passive rendering rewrites', async () => {
  const result = await checkSource('adv-nested-fence');
  assert.equal(result.code, 1, `expected exit 1, got ${result.code}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
  assert.match(result.stderr, /^docs\/guide\.md:7: /m);
});

// prepare-site.mjs renderBlog -> normalizeBlogDate throws `invalid source blog date`.
test('check-source refuses a field note whose date Website cannot parse', async () => {
  const result = await checkSource('adv-blog-date');
  assert.equal(result.code, 1, `expected exit 1, got ${result.code}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
  assert.match(result.stderr, /^blog\/2026-09-01-note\.md(?::\d+)?: .*date/m);
});

// prepare-site.mjs documentMetadata -> splitFrontmatter -> yaml parse throws on malformed frontmatter.
test('check-source refuses a document whose frontmatter is not YAML', async () => {
  const result = await checkSource('adv-frontmatter');
  assert.equal(result.code, 1, `expected exit 1, got ${result.code}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
  assert.match(result.stderr, /^docs\/guide\.md(?::\d+)?: /m);
});

// prepare-site.mjs renderSearchAttributes -> assertSearchAudienceVocabulary throws for a v3 page
// whose frontmatter b10x.audiences names a value outside the search vocabulary.
test('check-source refuses a v3 page audience outside the search vocabulary', async () => {
  const result = await checkSource('adv-audience');
  assert.equal(result.code, 1, `expected exit 1, got ${result.code}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
  assert.match(result.stderr, /^docs\/guide\.md(?::\d+)?: .*martians/m);
});

// prepare-site.mjs docDestination uses path.join, which resolves `..` segments the route schema
// admits (`^/(?:[A-Za-z0-9._~-]+/)*$`); two surfaces then land on one output and Website refuses.
test('check-source refuses two surfaces whose routeBases resolve to one website output', async () => {
  const result = await checkSource('adv-dot-segment');
  assert.equal(result.code, 1, `expected exit 1, got ${result.code}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
  assert.match(result.stderr, /^b10x\.docs\.yaml(?::\d+)?: .*docs\/example\/index\.md/m);
});
