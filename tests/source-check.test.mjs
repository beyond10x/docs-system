import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {promisify} from 'node:util';
import {parse, stringify} from 'yaml';

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

// A b10x-docs/v5 repository: the ESS v5 manifest from fixtures/ess-v5.yaml over the documents its
// selection and declared navigation name. Each variant mutates the manifest or one document in a
// copy, so the case always runs against the manifest the v5 consumers are tested with.
const essV5 = new URL('../fixtures/ess-v5.yaml', import.meta.url);

async function checkV5(mutate = () => {}, edit = async () => {}) {
  const document = parse(await fs.readFile(essV5, 'utf8'));
  mutate(document.surfaces[0]);
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-docs-check-source-v5-'));
  try {
    await fs.cp(fixture('v5-ess'), directory, {recursive: true});
    await fs.writeFile(path.join(directory, 'b10x.docs.yaml'), stringify(document), 'utf8');
    await edit(directory);
    try {
      const {stdout, stderr} = await execFileAsync(process.execPath, [cli, 'check-source', directory]);
      return {code: 0, stdout, stderr};
    } catch (error) {
      return {code: error.code, stdout: error.stdout, stderr: error.stderr};
    }
  } finally {
    await fs.rm(directory, {recursive: true});
  }
}

const rewrite = (relative, change) => async (directory) => {
  const file = path.join(directory, ...relative.split('/'));
  await fs.writeFile(file, change(await fs.readFile(file, 'utf8')), 'utf8');
};

test('check-source accepts the ESS b10x-docs/v5 repository', async () => {
  const result = await checkV5();
  assert.equal(result.code, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.match(result.stdout, /21 document\(s\), 0 change\(s\), 20 code fence\(s\) checked/);
});

for (const [name, mutate, edit = async () => {}, pattern] of [
  // validateV5Paths through readManifest: a leaf the selection does not publish.
  ['an excluded sidebar leaf', (surface) => surface.source.documents.exclude.push('docs/status/outlook.md'), undefined,
    /^b10x\.docs\.yaml: surface docs sidebar leaf docs\/status\/outlook\.md is not a published document of the surface$/m],
  // Website declaredNavigationRefusals: declared paths with no collected document.
  ['a sidebar leaf with no document', (surface) => surface.source.navigation.sidebar[2].items.push('docs/guides/missing.md'), undefined,
    /^b10x\.docs\.yaml:\d+: surface docs sidebar leaf docs\/guides\/missing\.md is not a collected document$/m],
  ['a menu-withheld path with no document', (surface) => surface.source.navigation.menuWithheld.push('docs/guides/missing.md'), undefined,
    /^b10x\.docs\.yaml:\d+: surface docs menu-withheld document docs\/guides\/missing\.md is not a collected document$/m],
  ['a landing with no document', (surface) => {
    surface.source.navigation.landing = 'docs/welcome.md';
  }, undefined, /^b10x\.docs\.yaml:\d+: surface docs landing docs\/welcome\.md is not a collected document$/m],
  // Website declaredNavigationRefusals: the route-base document is the sidebar's category link.
  ['a withheld route-base document', (surface) => {
    surface.source.navigation.sidebar[0].items = ['docs/getting-started.md'];
    surface.source.navigation.menuWithheld.push('docs/index.md');
  }, undefined, /^b10x\.docs\.yaml:\d+: surface docs menu-withheld document docs\/index\.md serves the route base \/docs\/ess\/, which cannot be withheld$/m],
  ['a landing that shares its route with another document', (surface) => {
    surface.source.navigation.landing = 'docs/getting-started.md';
  }, undefined, /^b10x\.docs\.yaml:\d+: surface docs landing docs\/getting-started\.md and website\/docs\/index\.md both serve \/docs\/ess\/$/m],
  // Website declaredNavigationRefusals: a document surface stays in its own namespace.
  ['a routeBase outside its own namespace', (surface) => {
    surface.routeBase = '/docs/other/';
    surface.canonicalUrl = 'https://beyond10x.github.io/docs/other/';
  }, undefined, /^b10x\.docs\.yaml:\d+: surface docs routeBase \/docs\/other\/ is not at or below \/docs\/ess\/$/m],
  // A declared route is compared by prefix, so a `.` or `..` segment is refused outright: the
  // publisher writes pages with path.join, which resolves it (tests/source-check-adversary-3.test.mjs).
  ['a routeBase with a dot segment', (surface) => {
    surface.routeBase = '/docs/ess/./';
    surface.canonicalUrl = 'https://beyond10x.github.io/docs/ess/';
  }, undefined, /^b10x\.docs\.yaml:\d+: surface docs routeBase \/docs\/ess\/\.\/ has a \. or \.\. segment$/m],
  ['a blog slug with a dot segment', undefined,
    rewrite('website/blog/2026-09-01-release.md', (raw) => raw.replace('title: Release note\n', 'title: Release note\nslug: ../../escape\n')),
    /^website\/blog\/2026-09-01-release\.md:3: blog slug \.\.\/\.\.\/escape has a \. or \.\. segment$/m],
  // A browser decodes percent-escapes and reads `\` as `/` before it resolves dot segments
  // (tests/source-check-adversary-4.test.mjs), so the rule tests the decoded value.
  ['a blog slug that is not valid percent-encoding', undefined,
    rewrite('website/blog/2026-09-01-release.md', (raw) => raw.replace('title: Release note\n', 'title: Release note\nslug: notes/%zz\n')),
    /^website\/blog\/2026-09-01-release\.md:3: blog slug notes\/%zz is not valid percent-encoding$/m],
  ['a blog slug with a mixed-case encoded dot segment', undefined,
    rewrite('website/blog/2026-09-01-release.md', (raw) => raw.replace('title: Release note\n', 'title: Release note\nslug: .%2E/aep/post\n')),
    /^website\/blog\/2026-09-01-release\.md:3: blog slug \.%2E\/aep\/post has a \. or \.\. segment$/m],
  // Docusaurus ensureValidSlug refuses a document slug that isValidPathname rejects.
  ...['guides/a#b.md', 'guides/what?.md', 'guides/100%.md'].map((name) => [`a document path ${name} that makes an invalid route`, undefined,
    async (directory) => fs.writeFile(path.join(directory, 'website', 'docs', ...name.split('/')), '# A page\n', 'utf8'),
    new RegExp(`^website/docs/${name.replace(/[?.]/g, '\\$&')}: document route /docs/ess/.* is not a valid Docusaurus pathname$`, 'm')]),
  ['a specification route that leaves /api/ through a dot segment', (surface) => {
    surface.source.specifications = [{id: 'api', format: 'openapi', path: 'api/openapi.json', route: '/api/../docs/ess/api/'}];
  }, async (directory) => {
    await fs.mkdir(path.join(directory, 'website', 'api'));
    await fs.writeFile(path.join(directory, 'website', 'api', 'openapi.json'), '{"openapi": "3.1.0", "info": {"title": "Example", "version": "1"}, "paths": {}}\n');
  }, /^website\/api\/openapi\.json: specification route \/api\/\.\.\/docs\/ess\/api\/ has a \. or \.\. segment$/m],
  // Every refusal a v4 page gets.
  // The collector's page-metadata index throws on the first page it cannot read; each is still
  // refused at the page, not only as a collection failure of the manifest.
  ['malformed document frontmatter', undefined, rewrite('website/docs/guides/track-change.md', (raw) => raw.replace('description: ', 'description: [')),
    /^website\/docs\/guides\/track-change\.md:2: frontmatter is not valid YAML: /m],
  ['b10x page metadata outside the schema', undefined,
    rewrite('website/docs/guides/track-change.md', (raw) => raw.replace('description: ', 'b10x:\n  schema: b10x-doc-page/v1\n  audiences: [developer]\n  experienceIds: [try-spec-driven-development]\n  support: someday\ndescription: ')),
    /^website\/docs\/guides\/track-change\.md(?::\d+)?: .*b10x frontmatter does not satisfy b10x-doc-page\/v1:\n\s+\/support /m],
  ['a page experience its surface does not declare', undefined,
    rewrite('website/docs/guides/track-change.md', (raw) => raw.replace('description: ', 'b10x:\n  schema: b10x-doc-page/v1\n  audiences: [developer]\n  experienceIds: [undeclared-experience]\ndescription: ')),
    /^website\/docs\/guides\/track-change\.md(?::\d+)?: .*undeclared-experience/m],
  ['an unlabelled fence', undefined, rewrite('website/docs/reference/cli.md', (raw) => raw.replace('```text', '```')),
    /^website\/docs\/reference\/cli\.md:7: fenced code block has no language; use text for plain output$/m],
]) {
  test(`check-source refuses the ESS b10x-docs/v5 repository with ${name}`, async () => {
    const result = await checkV5(mutate, edit);
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
