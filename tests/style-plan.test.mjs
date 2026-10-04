import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import {register} from 'node:module';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {rawAdmonitionHtmlProblems, rawAdmonitionSourceProblems} from '../dist/admonition-guard.js';
import {mermaidThemeVariables, PRODUCT_SIGNATURES, productSignatureCss, STATUS_RAMP, TRUTH} from '../dist/product-palette.js';
import rehypeSemanticChips, {annotateProtocolSource, chipMeaning, PROTOCOL_KIND_MAGIC_COMMENTS} from '../dist/rehype-semantic-chips.js';
import {parseTerminalSession} from '../dist/product-data.js';
import productSitePlugin, {fontHeadTags, PRODUCT_FONT_DIRECTORY, productMermaidTheme, withProductSite} from '../dist/product-site.js';

register('./theme-loader.mjs', import.meta.url);
const {Terminal, terminalSummary, StatusStrip} = await import('../dist/product.js');
const {EmptyState, Kind, StatusBadge, Truth} = await import('../dist/components.js');
const {admonitionStatus, default: Admonition} = await import('../dist/theme/Admonition/index.js');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const example = path.join(root, 'examples/product-site');

test('P1: the self-hosted fonts ship with their OFL licences and load with swap and preload', async () => {
  const files = (await fs.readdir(path.join(PRODUCT_FONT_DIRECTORY, 'b10x-fonts'))).sort();
  assert.deepEqual(files, ['OFL-FiraCode.txt', 'OFL-Inter.txt', 'fira-code-regular-latin.woff2', 'fira-code-semibold-latin.woff2', 'inter-variable-latin.woff2']);
  for (const licence of ['OFL-FiraCode.txt', 'OFL-Inter.txt']) assert.match(await fs.readFile(path.join(PRODUCT_FONT_DIRECTORY, 'b10x-fonts', licence), 'utf8'), /SIL OPEN FONT LICENSE Version 1\.1/);
  const woff2 = await fs.readFile(path.join(PRODUCT_FONT_DIRECTORY, 'b10x-fonts', 'inter-variable-latin.woff2'));
  assert.equal(woff2.subarray(0, 4).toString('latin1'), 'wOF2');
  const tags = fontHeadTags('/canon/');
  assert.deepEqual(tags.filter((tag) => tag.tagName === 'link').map((tag) => tag.attributes.href), ['/canon/b10x-fonts/inter-variable-latin.woff2', '/canon/b10x-fonts/fira-code-regular-latin.woff2']);
  const css = tags.find((tag) => tag.tagName === 'style').innerHTML;
  assert.equal((css.match(/font-display:swap/g) ?? []).length, 3);
  assert.match(css, /font-family:"Inter";src:url\("\/canon\/b10x-fonts\/inter-variable-latin\.woff2"\) format\("woff2"\);font-weight:100 900/);
  const config = withProductSite({title: 'X', staticDirectories: ['static', 'public']});
  assert.deepEqual(config.staticDirectories, ['static', 'public', PRODUCT_FONT_DIRECTORY]);
  assert.equal(withProductSite({title: 'X'}, {fonts: false}).staticDirectories, undefined);
});

test('P2: raw admonition markers are refused in source and in built HTML, never inside code', () => {
  const source = ':::caution[Planned]\nok\n:::\n\n:::caution Planned\ntext\n:::\n\n```md\n:::note Inside a fence\n```\n:::note\nplain\n:::\n';
  assert.deepEqual(rawAdmonitionSourceProblems(source).map((problem) => problem.line), [5]);
  const html = '<main><p>:::caution Planned\nThis title is not in brackets.</p><pre><code>:::note in code</code></pre><p>Use <code>:::note[Title]</code>.</p><p>a ::: b</p></main>';
  assert.deepEqual(rawAdmonitionHtmlProblems(html).map((problem) => problem.text), [':::caution Planned']);
});

test('P2: the build guard fails the build and names the page', async () => {
  const out = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-guard-'));
  try {
    await fs.mkdir(path.join(out, 'docs', 'loom'), {recursive: true});
    await fs.writeFile(path.join(out, 'docs', 'loom', 'index.html'), '<article><p>:::caution Planned</p></article>');
    await fs.writeFile(path.join(out, 'index.html'), '<article><pre><code>:::note fine</code></pre></article>');
    const plugin = productSitePlugin({siteDir: example, baseUrl: '/'}, {});
    await assert.rejects(plugin.postBuild({outDir: out}), /raw admonition markers[\s\S]*docs\/loom\/index\.html:1: :::caution Planned/);
    await fs.rm(path.join(out, 'docs'), {recursive: true});
    await plugin.postBuild({outDir: out});
    await productSitePlugin({siteDir: example, baseUrl: '/'}, {admonitionGuard: false}).postBuild({outDir: out});
  } finally {
    await fs.rm(out, {recursive: true, force: true});
  }
});

test('P3: the roles use exactly the validated values and the product option sets only the signature', () => {
  assert.deepEqual(STATUS_RAMP, {light: {planned: '#6db794', decided: '#269269', shipped: '#006948'}, dark: {planned: '#277354', decided: '#3ba97d', shipped: '#8bdfb8'}});
  assert.deepEqual(TRUTH, {light: {true: '#139e6f', unknown: '#c98500', false: '#ac312a'}, dark: {true: '#34aa7c', unknown: '#bb881a', false: '#b24039'}});
  assert.deepEqual(Object.fromEntries(Object.entries(PRODUCT_SIGNATURES).map(([id, signature]) => [id, [signature.mark, signature.hue.light, signature.hue.dark, signature.ink.light, signature.ink.dark]])), {
    canon: ['C', '#26996e', '#3ba97d', '#17684a', '#b6e5ce'],
    els: ['El', '#a06b01', '#a36e09', '#744c00', '#f0cea1'],
    loom: ['L', '#0e5794', '#4296e7', '#23588a', '#b7d8fb'],
    commission: ['Co', '#946fbd', '#885cb5', '#624581', '#ddcbf5'],
    ess: ['Es', '#8c352a', '#a95043', '#843d33', '#f9c6bd'],
  });
  const plugin = productSitePlugin({siteDir: example, baseUrl: '/loom/', siteConfig: {title: 'Loom'}}, {product: 'loom'});
  const css = plugin.injectHtmlTags().headTags.map((tag) => tag.innerHTML ?? '').join('\n');
  assert.match(css, /--b10x-product-mark:"L"/);
  assert.equal(productSignatureCss('loom'), ":root,html[data-theme='light']{--b10x-product-hue:#0e5794;--b10x-product-ink:#23588a;}html[data-theme='dark']{--b10x-product-hue:#4296e7;--b10x-product-ink:#b7d8fb;}");
  assert.ok(css.includes(productSignatureCss('loom')));
  assert.throws(() => productSitePlugin({siteDir: example, baseUrl: '/'}, {product: 'atlas'}), /product must be one of canon, els, loom, commission, ess/);
});

test('P3: status components carry glyph and word and group by state', async () => {
  for (const [status, glyph] of [['planned', '○'], ['decided', '◐'], ['shipped', '●']]) {
    assert.match(renderToStaticMarkup(createElement(StatusBadge, {status})), new RegExp(`aria-hidden="true">${glyph}</span>${status[0].toUpperCase()}${status.slice(1)}`));
  }
  const css = await fs.readFile(path.join(root, 'styles/product-components.css'), 'utf8');
  for (const value of ['#6db794', '#269269', '#006948', '#277354', '#3ba97d', '#8bdfb8', '#139e6f', '#c98500', '#ac312a', '#34aa7c', '#bb881a', '#b24039']) assert.ok(css.includes(value), value);
  assert.doesNotMatch(css, /--b10x-status-shipped: var\(--b10x-color-accent/, 'status is decoupled from the accent');
  const strip = renderToStaticMarkup(createElement(StatusStrip, {items: [{label: 'b', status: 'planned'}, {label: 'a', status: 'shipped'}, {label: 'c', status: 'shipped'}]}));
  assert.deepEqual([...strip.matchAll(/b10x-status-strip__group-title">([^<]+)</g)].map((match) => match[1]), ['Shipped · runs today', 'Planned · roadmap only']);
});

test('P4: reserved words become chips; everything else is left alone', () => {
  assert.deepEqual(chipMeaning('UNKNOWN'), {kind: 'truth', value: 'unknown', glyph: '?'});
  assert.deepEqual(chipMeaning('Shipped'), {kind: 'status', value: 'shipped', glyph: '●'});
  assert.deepEqual(chipMeaning('claim'), {kind: 'kind', value: 'claim', glyph: ''});
  for (const word of ['true', 'Unknown', 'claims', 'sHipped', 'TRUE!']) assert.equal(chipMeaning(word), undefined, word);
  const text = (value) => ({type: 'text', value});
  const element = (tagName, children, properties = {}) => ({type: 'element', tagName, properties, children});
  const tree = {type: 'root', children: [
    element('table', [element('tbody', [element('tr', [element('td', [text('The check was never run')]), element('td', [element('code', [text('UNKNOWN')])]), element('td', [text('planned')])])])]),
    element('p', [text('A claim is '), element('code', [text('TRUE')]), text(' or '), element('code', [text('true')]), text('.')]),
    element('pre', [element('code', [text('TRUE')], {className: ['language-text']})]),
  ]};
  rehypeSemanticChips()(tree);
  const cells = tree.children[0].children[0].children[0].children;
  assert.equal(cells[0].children[0].type, 'text');
  assert.deepEqual(cells[1].children[0].properties.className, ['b10x-chip', 'b10x-chip--truth', 'b10x-chip--unknown']);
  assert.deepEqual(cells[2].children[0].properties.className, ['b10x-chip', 'b10x-chip--status', 'b10x-chip--planned']);
  const paragraph = tree.children[1].children;
  assert.equal(paragraph[1].tagName, 'span');
  assert.equal(paragraph[3].tagName, 'code', 'lower-case true stays code');
  assert.equal(tree.children[2].children[0].tagName, 'code', 'code blocks are never chipped');
});

test('P4: status admonitions take the status from the type or the title', () => {
  assert.deepEqual(admonitionStatus('shipped', 'Claim evaluation'), {status: 'shipped', rest: 'Claim evaluation'});
  assert.deepEqual(admonitionStatus('note', 'Planned: evidence bound to revisions'), {status: 'planned', rest: 'evidence bound to revisions'});
  assert.deepEqual(admonitionStatus('caution', ['Decided', ' design']), {status: 'decided', rest: 'design'});
  assert.equal(admonitionStatus('caution', 'Not a status'), undefined);
  assert.equal(admonitionStatus('caution', 'Plannedness'), undefined);
  const markup = renderToStaticMarkup(createElement(Admonition, {type: 'shipped', title: 'Claim evaluation'}, 'Body'));
  assert.match(markup, /b10x-admonition b10x-admonition--shipped/);
  assert.match(markup, /data-type="note"/);
  assert.match(markup, /b10x-status--shipped[\s\S]*Claim evaluation/);
  const config = withProductSite({title: 'X', presets: [['classic', {docs: {routeBasePath: 'docs'}, blog: false}]], plugins: [['@docusaurus/plugin-content-docs', {id: 'extra'}]]});
  const docs = config.presets[0][1].docs;
  assert.equal(docs.rehypePlugins.at(-1), rehypeSemanticChips);
  assert.deepEqual(docs.admonitions, {keywords: ['shipped', 'decided', 'planned'], extendDefaults: true});
  assert.equal(config.presets[0][1].blog, false);
  assert.equal(config.plugins[0][1].rehypePlugins.at(-1), rehypeSemanticChips);
});

test('P4: MDX chips and the empty state render glyph and word', () => {
  assert.match(renderToStaticMarkup(createElement(Truth, {value: 'unknown'})), /b10x-chip--unknown"[^>]*><span class="b10x-chip__glyph" aria-hidden="true">\?<\/span><span class="b10x-chip__text">UNKNOWN<\/span>/);
  assert.throws(() => renderToStaticMarkup(createElement(Truth, {value: 'maybe'})), /true, false or unknown/);
  assert.match(renderToStaticMarkup(createElement(Kind, {kind: 'evidence'})), /b10x-chip--kind b10x-chip--evidence/);
  const empty = renderToStaticMarkup(createElement(EmptyState, {title: 'No protocol yet', action: {label: 'Read more', href: '/docs/'}}, 'The first appears here.'));
  assert.match(empty, /<section class="b10x-empty-state">[\s\S]*<h3 class="b10x-empty-state__title">No protocol yet<\/h3>[\s\S]*href="\/docs\/"/);
});

test('P5: recorded tones, exit gutter, JSON tokens and summary; old sessions render as before', async () => {
  const session = JSON.parse(await fs.readFile(path.join(example, 'data/canon-validate.terminal.json'), 'utf8'));
  const markup = renderToStaticMarkup(createElement(Terminal, {session}));
  assert.equal((markup.match(/b10x-terminal__gutter--passed/g) ?? []).length, 2);
  assert.equal((markup.match(/b10x-terminal__gutter--failed/g) ?? []).length, 1);
  assert.match(markup, /b10x-terminal__tone--true">valid:</);
  assert.match(markup, /b10x-terminal__tone--false">error</);
  assert.match(markup, /b10x-terminal__json--key">&quot;supported&quot;</);
  assert.match(markup, /2\/3 exit 0 · 1 ✓ · 1 ✕/);
  assert.equal(terminalSummary([{command: 'a'}]), undefined);
  const plain = renderToStaticMarkup(createElement(Terminal, {session: {format: 'b10x-terminal/1', entries: [{command: 'echo', output: 'hi'}]}}));
  assert.doesNotMatch(plain, /b10x-terminal__gutter|b10x-terminal__summary/);
  assert.throws(() => parseTerminalSession({...session, tones: {'x:': 'green'}}), /must be one of true, false, unknown, muted/);
  const ajv = new Ajv2020({allErrors: true, strict: true});
  const validate = ajv.compile(JSON.parse(await fs.readFile(path.join(root, 'schema/b10x.terminal.v1.schema.json'), 'utf8')));
  assert.equal(validate(session), true, JSON.stringify(validate.errors));
  assert.equal(validate({...session, tones: {'x:': 'green'}}), false);
  const {tones: _ignored, ...withoutTones} = session;
  assert.equal(validate(withoutTones), true, 'tones stay optional');
});

test('P5: protocol/1 sources get kind sections; other YAML and ranged fences are untouched', async () => {
  const source = ('format: protocol/1\n\nprotocol:\n  id: x\n\nclaims:\n  a:\n    description: A.\n\nactions:\n  run:\n    may_produce:\n      - evidence: e\n');
  assert.equal(annotateProtocolSource(source), 'format: protocol/1\n\nprotocol:\n  id: x\n\n# b10x-kind-claim-start\n# b10x-kind-claim-head\nclaims:\n  a:\n    description: A.\n# b10x-kind-claim-end\n\n# b10x-kind-action-start\n# b10x-kind-action-head\nactions:\n  run:\n    may_produce:\n      - evidence: e\n# b10x-kind-action-end\n');
  assert.equal(annotateProtocolSource('name: other\nclaims:\n  a: 1\n'), 'name: other\nclaims:\n  a: 1\n');
  const fence = (meta) => ({type: 'root', children: [{type: 'element', tagName: 'pre', properties: {}, children: [{type: 'element', tagName: 'code', properties: {className: ['language-yaml'], metastring: meta}, children: [{type: 'text', value: source}]}]}]});
  const annotated = fence('title="p.yaml"');
  rehypeSemanticChips()(annotated);
  assert.match(annotated.children[0].children[0].children[0].value, /# b10x-kind-claim-start/);
  const ranged = fence('{2-3}');
  rehypeSemanticChips()(ranged);
  assert.equal(ranged.children[0].children[0].children[0].value, source);
  const config = withProductSite({title: 'X'});
  assert.equal(config.themeConfig.prism.magicComments[0].className, 'theme-code-block-highlighted-line', 'metastring ranges keep the highlight class');
  assert.deepEqual(config.themeConfig.prism.magicComments.slice(1), PROTOCOL_KIND_MAGIC_COMMENTS);
});

test('P6: Mermaid takes per-mode theme variables, only beside theme-mermaid', () => {
  assert.equal(mermaidThemeVariables('dark').darkMode, true);
  assert.equal(mermaidThemeVariables('light').darkMode, false);
  assert.equal(mermaidThemeVariables('dark').background, '#101a1b');
  assert.equal(mermaidThemeVariables('light').primaryColor, '#ffffff');
  const without = withProductSite({title: 'X'});
  assert.ok(!without.plugins.includes(productMermaidTheme) && without.themes === undefined);
  const withMermaid = withProductSite({title: 'X', themes: ['@docusaurus/theme-mermaid', 'other-theme']});
  assert.deepEqual(withMermaid.themes, ['@docusaurus/theme-mermaid', productMermaidTheme, 'other-theme']);
  assert.match(productMermaidTheme().getThemePath(), /dist[\\/]theme-mermaid$/);
});
