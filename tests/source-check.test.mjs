import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {promisify} from 'node:util';
import {parse} from 'yaml';

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

test('check-source accepts a clean repository', async () => {
  const result = await checkSource('clean');
  assert.equal(result.code, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.match(result.stdout, /2 document\(s\), 1 change\(s\), 3 code fence\(s\) checked/);
});

test('check-source rejects an undefined journey in a b10x-change/v2 document at its line', async () => {
  const result = await checkSource('journey');
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^changes\/example-0\.1\.0\.yaml:12: \/journeys\/1 must be equal to one of the allowed values \(found "operate"\)$/m);
});

test('check-source rejects two documents that map to one website destination', async () => {
  const result = await checkSource('destination');
  assert.equal(result.code, 1);
  assert.match(
    result.stderr,
    /^b10x\.docs\.yaml:30: surface docs documents docs\/guide\.md and docs\/guide\/index\.md map to one website output docs\/example\/guide\/index\.md$/m,
  );
});

test('check-source rejects an unlabelled code fence at its line', async () => {
  const result = await checkSource('fence');
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^docs\/guide\.md:7: fenced code block has no language; use text for plain output$/m);
});

// The rest of the class the adversary's five cases belong to: each is a refusal Website's
// prepare-site.mjs or code-contract.mjs source mode raises from one repository's files alone.
for (const [name, pattern] of [
  ['sidebar-position', /^docs\/guide\.md:3: sidebar_position must be a safe YAML integer$/m],
  ['managed-range', /^README\.md:14: managed documentation range b10x-docs is not closed$/m],
  ['link-in-fence', /^docs\/guide\.md:7: passive rendering changes this text fence; Website refuses a changed fence language or body sequence$/m],
  ['spec-parse', /^schema\/broken\.json: specification cannot be parsed: /m],
  ['ess-data', /^data\/contracts\.json: ESS documentation projection is invalid: /m],
  ['nav-groups', /^b10x\.docs\.yaml:65: surface other navigation group Services conflicts with Build declared by another surface$/m],
  // Every source value Website renders into the generated page is rendered for real, so a value
  // that is inert in the source but breaks the generated MDX is caught (qualifiedDocumentTitle,
  // sourceSidebarMetadata, summaryText through JSON.stringify).
  ['blog-title-number', /^blog\/2026-09-01-note\.md:2: title must be a string; Website calls title\.trim\(\)$/m],
  ['mdx-sidebar-label', /^docs\/label\.mdx:7: passive rendering changes this text fence; /m],
  ['mdx-description', /^docs\/described\.mdx:7: passive rendering changes this text fence; /m],
]) {
  test(`check-source refuses the ${name} fixture as the publisher does`, async () => {
    const result = await checkSource(name);
    assert.equal(result.code, 1, `stdout: ${result.stdout}\nstderr: ${result.stderr}`);
    assert.match(result.stderr, pattern);
  });
}

test('the shared passive rendering leaves ordinary fences and prose alone', async () => {
  const {normalizePassiveMarkdown} = await import('../dist/code.js');
  assert.equal(normalizePassiveMarkdown('# T {#t}\n\n```sh\nls <x>\n```\n\nrun <task> `<b>`\n'), '<a id="t"></a>\n# T\n\n```bash\nls <x>\n```\n\nrun &lt;task&gt; `<b>`\n');
  assert.equal(normalizePassiveMarkdown('a\n<!-- b10x-docs:start -->\nmanaged\n<!-- b10x-docs:end -->\nb'), 'a\nb');
  assert.throws(() => normalizePassiveMarkdown('<!-- b10x-docs:end -->'), /ends without a start/);
});

test('check-source refuses a directory without b10x.docs.yaml', async () => {
  const result = await checkSource('clean/docs');
  assert.equal(result.code, 1);
  assert.match(result.stderr, /b10x\.docs\.yaml/);
});

test('the shared fence rule states the Website source-mode contract', async () => {
  const {markdownFenceProblems} = await import('../dist/code.js');
  assert.deepEqual(markdownFenceProblems({language: 'bash', raw: '```bash\nls\n```'}), []);
  assert.deepEqual(markdownFenceProblems({language: 'mermaid', raw: '~~~mermaid\na\n~~~'}), []);
  assert.deepEqual(markdownFenceProblems({language: '', raw: '```\nx\n```'}), ['fenced code block has no language; use text for plain output']);
  assert.deepEqual(markdownFenceProblems({language: 'Console', raw: '```Console\n$ ls\n```'}), ['console is ambiguous; use bash, shell-session, or text']);
  assert.deepEqual(markdownFenceProblems({language: 'cobol', raw: '```cobol\nx\n```'}), ['unsupported fenced-code language "cobol"']);
  assert.deepEqual(markdownFenceProblems({language: 'text', raw: '````text\nx\n```'}), ['fenced code block is not closed']);
});

test('the check action executes only this package\'s own dist', async () => {
  const action = parse(await fs.readFile(new URL('../.github/actions/check/action.yml', import.meta.url), 'utf8'));
  assert.equal(action.runs.using, 'composite');
  assert.equal(action.inputs['repository-root'].default, '.');
  const scripts = action.runs.steps.map((step) => step.run).join('\n');
  assert.match(scripts, /node "\$DOCS_SYSTEM_ACTION_ROOT\/dist\/cli\.js" check-source "\$DOCS_SOURCE_ROOT"/);
  assert.match(scripts, /npm ci --ignore-scripts --prefix "\$DOCS_SYSTEM_ACTION_ROOT"/);
  for (const line of scripts.split('\n')) {
    if (line.includes('DOCS_SOURCE_ROOT')) assert.doesNotMatch(line, /\b(?:npm|npx|node|bash|sh|cargo)\b[^"]*"\$DOCS_SOURCE_ROOT\//, line);
  }
});
