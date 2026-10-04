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
import {buildHref, buildLabel, FAMILY, FAMILY_ORDER, parseFamilyRelatedTool, relationPhrase} from '../dist/family.js';
import {docHeaderFields, docKicker, sidebarPosition} from '../dist/doc-header.js';
import {PRODUCT_SIGNATURES} from '../dist/product-palette.js';
import {landingKpis, parseCaseDocument, parseCodePairDocument, parseStatusDocument} from '../dist/product-data.js';
import productSitePlugin, {docsSystemBuild, readLanding, writeTrailingSlashRedirects} from '../dist/product-site.js';

register('./theme-loader.mjs', import.meta.url);
const {CaseCard, CodePair, FamilyStrip, featureColumns, FeatureGrid, HeroArt, KpiRow, LandingHero, ProductLanding, ProductSwitcher, RelatedTools, StatusTable} = await import('../dist/product.js');
const {ProtocolGraph, DomainGraph} = await import('../dist/charts.js');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const example = path.join(root, 'examples/product-site');
const readJson = async (file) => JSON.parse(await fs.readFile(path.join(example, file), 'utf8'));
const css = async (name) => fs.readFile(path.join(root, 'styles', name), 'utf8');
const render = (element) => renderToStaticMarkup(element);

test('P9: one family registry with unique marks, validated hues in CSS, and ELS never beside ESS', async () => {
  assert.deepEqual(FAMILY_ORDER, ['canon', 'els', 'loom', 'commission', 'ess']);
  const marks = FAMILY_ORDER.map((id) => FAMILY[id].mark);
  assert.deepEqual(marks, ['C', 'El', 'L', 'Co', 'Es']);
  assert.equal(new Set(marks).size, marks.length);
  assert.ok(Math.abs(FAMILY_ORDER.indexOf('els') - FAMILY_ORDER.indexOf('ess')) > 1);
  const components = await css('product-components.css');
  for (const id of FAMILY_ORDER) {
    const {hue, ink} = PRODUCT_SIGNATURES[id];
    assert.ok(components.includes(`.b10x-family--${id} { --b10x-family-hue: ${hue.light}; --b10x-family-ink: ${ink.light}; }`), `${id} light`);
    assert.ok(components.includes(`[data-theme='dark'] .b10x-family--${id} { --b10x-family-hue: ${hue.dark}; --b10x-family-ink: ${ink.dark}; }`), `${id} dark`);
  }
});

test('P9: related tools from ids and a relation word; the written-out form renders as before', () => {
  const markup = render(createElement(RelatedTools, {current: 'canon', tools: [{id: 'els', relation: 'uses', via: 'protocol/1'}, {id: 'ess', relation: 'specifies'}, {name: 'Other', description: 'Hand-written', href: 'https://example.org/'}]}));
  assert.match(markup, /b10x-family--els[\s\S]*>El<[\s\S]*>ELS<[\s\S]*Engineering protocols written in Canon[\s\S]*uses Canon[\s\S]*protocol\/1/);
  assert.match(markup, /href="https:\/\/beyond10x\.github\.io\/ess\/"[\s\S]*specifies Canon/);
  assert.match(markup, /<a class="b10x-related__card" href="https:\/\/example\.org\/"><span class="b10x-mark" aria-hidden="true">O<\/span>/);
  assert.equal(relationPhrase('used-by'), 'used by');
  assert.throws(() => parseFamilyRelatedTool({id: 'els', relation: 'uses', description: 'mine'}, 'tools[0]'), /not allowed beside a family id/);
  assert.throws(() => parseFamilyRelatedTool({id: 'aep', relation: 'uses'}, 'tools[0]'), /id must be one of/);
  assert.throws(() => parseFamilyRelatedTool({id: 'els', relation: 'likes'}, 'tools[0]'), /relation must be one of/);
});

test('P9: footer strip and navbar switcher mark the current product; the build line names the revision', async () => {
  const strip = render(createElement(FamilyStrip, {current: 'loom'}));
  assert.equal((strip.match(/b10x-family-chip /g) ?? []).length, 5);
  assert.match(strip, /b10x-family--loom is-current" href="https:\/\/beyond10x\.github\.io\/loom\/" aria-current="true"/);
  assert.match(strip, /\(this site\)/);
  const switcher = render(createElement(ProductSwitcher, {current: 'canon'}));
  assert.match(switcher, /<details class="b10x-product-switcher">/);
  assert.match(switcher, /is-current[^>]*>[\s\S]*You are here/);
  assert.equal(buildLabel({revision: 'b64ddf60b056981a66d13da7cbbc3b96d0af7e11', kind: 'commit'}), 'docs-system b64ddf6');
  assert.equal(buildLabel({revision: '0.7.0', kind: 'version'}), 'docs-system 0.7.0');
  assert.equal(buildHref({revision: '0.7.0', kind: 'version'}), undefined);
  const build = await docsSystemBuild(example);
  assert.ok(build.kind === 'commit' ? /^[0-9a-f]{40}$/.test(build.revision) : build.revision === JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8')).version);
  const site = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-lock-'));
  try {
    await fs.writeFile(path.join(site, 'package-lock.json'), JSON.stringify({packages: {'node_modules/@beyond10x/docs-system': {resolved: 'git+ssh://git@github.com/beyond10x/docs-system.git#929f9653d14212d0595e8dbc704a4e6a61cabd9e'}}}));
    assert.deepEqual(await docsSystemBuild(site), {revision: '929f9653d14212d0595e8dbc704a4e6a61cabd9e', kind: 'commit'});
  } finally {
    await fs.rm(site, {recursive: true, force: true});
  }
});

test('P9: the plugin publishes the product and build as global data', async () => {
  let published;
  const plugin = productSitePlugin({siteDir: example, baseUrl: '/'}, {product: 'commission'});
  await plugin.contentLoaded({content: null, actions: {createData: async () => '', addRoute: () => {}, setGlobalData: (data) => { published = data; }}});
  assert.equal(published.product, 'commission');
  assert.ok(published.build.revision);
});

async function validator() {
  const ajv = new Ajv2020({allErrors: true, strict: true});
  for (const name of ['terminal.v1', 'protocol-graph.v1', 'domain-graph.v1', 'case.v1', 'code-pair.v1', 'status.v1', 'product-landing.v1']) ajv.addSchema(JSON.parse(await fs.readFile(path.join(root, `schema/b10x.${name}.schema.json`), 'utf8')));
  return (id, value) => {
    const validate = ajv.getSchema(`https://beyond10x.github.io/schema/b10x.${id}.json`);
    return validate(value) ? [] : validate.errors.map((error) => `${error.instancePath} ${error.message}`);
  };
}

test('P10: one b10x-status/1 file feeds the landing strip and StatusTable', async () => {
  const check = await validator();
  const status = await readJson('data/status.json');
  assert.deepEqual(check('status.v1', status), []);
  parseStatusDocument(status);
  assert.throws(() => parseStatusDocument({...status, items: [...status.items, status.items[0]]}), /listed twice/);
  assert.throws(() => parseStatusDocument({...status, asOf: '4 Oct'}), /asOf must be a date/);
  const landing = await readLanding(path.join(example, 'product.json'));
  const section = landing.sections.find((entry) => entry.kind === 'status');
  assert.deepEqual(section.items, status.items);
  assert.equal(section.asOf, '2026-10-04');
  const strip = render(createElement(ProductLanding, {data: landing, current: 'canon'}));
  assert.match(strip, /As of 2026-10-04 · Canon status as of 2026-10-04/);
  const table = render(createElement(StatusTable, {data: status}));
  assert.match(table, /aria-label="12 capabilities: 5 shipped, 2 decided, 5 planned"/);
  assert.deepEqual([...table.matchAll(/scope="rowgroup" colSpan="3">([^<]+)</g)].map((match) => match[1]), ['Language', 'Evaluation', 'Design']);
  assert.match(table, /<th scope="row"><a href="\/docs\/meaning">Three-valued claim evaluation<\/a><\/th><td><span class="b10x-status b10x-status--shipped">/);
  const filtered = render(createElement(StatusTable, {data: status, only: ['decided']}));
  assert.match(filtered, /aria-label="2 capabilities: 2 decided"/);
  assert.match(render(createElement(StatusTable, {data: {format: 'nope'}})), /Cannot render status table/);
});

test('P8: hero art kinds render from data; the KPI row is counted, never typed', async () => {
  const check = await validator();
  const caseCard = await readJson('data/stale-revision.case.json');
  const codePair = await readJson('data/money.code-pair.json');
  assert.deepEqual(check('case.v1', caseCard), []);
  assert.deepEqual(check('code-pair.v1', codePair), []);
  assert.deepEqual(check('product-landing.v1', await readJson('product.json')), []);
  parseCaseDocument(caseCard);
  parseCodePairDocument(codePair);
  assert.throws(() => parseCaseDocument({...caseCard, frames: [{label: 'a', claims: [{name: 'x', value: 'maybe'}]}]}), /value must be one of true, false, unknown/);
  assert.throws(() => parseCaseDocument({...caseCard, frames: [{label: 'a', current: true}, {label: 'b', current: true}]}), /at most one frame current/);

  const landing = await readLanding(path.join(example, 'product.json'));
  const kpis = landingKpis(landing);
  const protocol = landing.sections.find((section) => section.kind === 'protocol-graph').data;
  assert.deepEqual(kpis.map((kpi) => [kpi.count, kpi.value, kpi.tone]), [
    ['claims', protocol.nodes.filter((node) => node.kind === 'claim').length, 'product'],
    ['evidence', protocol.nodes.filter((node) => node.kind === 'evidence').length, 'product'],
    ['shipped', 5, 'shipped'], ['decided', 2, 'decided'], ['planned', 5, 'planned'],
  ]);
  const commission = await readJson('data/commission.domain-graph.json');
  const domainLanding = {format: 'b10x-product-landing/1', product: {name: 'D', promise: ['p'], lede: 'l', actions: [], art: {kind: 'domain-graph', data: commission}, kpis: ['entities', {count: 'relations', label: 'links'}]}, sections: []};
  assert.deepEqual(landingKpis(domainLanding).map((kpi) => [kpi.value, kpi.label]), [[commission.entities.length, 'entities in the domain'], [commission.relations.length, 'links']]);
  assert.throws(() => landingKpis({...domainLanding, product: {...domainLanding.product, kpis: ['shipped']}}), /counts shipped, but the landing has no status section/);

  const hero = render(createElement(LandingHero, {data: landing}));
  assert.match(hero, /b10x-hero-art--terminal[\s\S]*b10x-terminal--tilt/);
  assert.match(hero, /<dl class="b10x-kpis" aria-label="Key figures"/);
  assert.match(hero, /b10x-kpi--decided"><dt class="b10x-kpi__label"><span class="b10x-kpi__index" aria-hidden="true">04<\/span><span class="b10x-kpi__glyph b10x-status-glyph b10x-status-glyph--decided" aria-hidden="true"><\/span>decided, not built<\/dt><dd class="b10x-kpi__value">2<\/dd>/);

  const card = render(createElement(CaseCard, {data: caseCard, caption: 'note'}));
  assert.match(card, /b10x-case__frame is-current/);
  assert.match(card, /b10x-chip--true[\s\S]*b10x-chip--unknown/);
  assert.match(card, /b10x-chip--state"><span class="b10x-chip__glyph" aria-hidden="true">⊘<\/span><span class="b10x-chip__text">blocked/);
  const pair = render(createElement(CodePair, {data: codePair}));
  assert.match(pair, /data-language="yaml"[\s\S]*<code>ess generate --kind openapi<\/code>[\s\S]*data-language="yaml"/);
  const graph = render(createElement(HeroArt, {art: {kind: 'domain-graph', data: commission}}));
  assert.match(graph, /b10x-hero-art--domain-graph[\s\S]*b10x-graph--hero/);
  assert.doesNotMatch(graph, /Domain as text|b10x-graph__tooltip|b10x-lifecycles/);
  assert.match(graph, /pathLength="1"/);
});

test('P8: a landing without art or kpis renders as before; the older terminal still becomes the aside', async () => {
  const session = await readJson('data/canon.terminal.json');
  const older = {format: 'b10x-product-landing/1', product: {name: 'X', promise: ['One.', 'Two.'], lede: 'L', actions: [], terminal: session, terminalCaption: 'cap'}, sections: []};
  const markup = render(createElement(ProductLanding, {data: older}));
  assert.match(markup, /class="b10x-hero"/);
  assert.match(markup, /b10x-hero-art--terminal[\s\S]*cap/);
  assert.doesNotMatch(markup, /b10x-kpis/);
  const solo = render(createElement(ProductLanding, {data: {...older, product: {name: 'X', promise: ['One.'], lede: 'L', actions: []}}}));
  assert.match(solo, /class="b10x-hero b10x-hero--solo"/);
  assert.doesNotMatch(solo, /b10x-hero__aside|b10x-kpis/);
  assert.equal(render(createElement(KpiRow, {items: []})).includes('b10x-kpi '), false);
});

test('P11: the page header turns on with status, lede or source and counts the page in its sidebar category', () => {
  assert.equal(docHeaderFields({title: 'x', description: 'y'}), undefined);
  assert.deepEqual(docHeaderFields({status: 'shipped', source: ' gen ', kicker: 'Concepts'}), {status: 'shipped', source: 'gen', kicker: 'Concepts'});
  assert.throws(() => docHeaderFields({status: 'done'}), /status must be one of/);
  const sidebar = [
    {type: 'link', label: 'Intro', href: '/docs'},
    {type: 'category', label: 'Concepts', items: [{type: 'link', label: 'A', href: '/docs/a'}, {type: 'link', label: 'B', href: '/docs/b'}, {type: 'html'}, {type: 'category', label: 'Deep', items: [{type: 'link', href: '/docs/c'}]}]},
    {type: 'category', label: 'Reference', href: '/docs/reference', items: [{type: 'link', href: '/docs/reference/x'}]},
  ];
  assert.equal(docKicker(sidebarPosition(sidebar, '/docs/b/')), 'Concepts · 2 of 3');
  assert.equal(docKicker(sidebarPosition(sidebar, '/docs/c')), 'Deep', 'a one-page category drops "1 of 1"');
  assert.equal(docKicker(sidebarPosition(sidebar, '/docs')), '1 of 3');
  assert.equal(docKicker(sidebarPosition(sidebar, '/docs/reference')), 'Reference · 1 of 2');
  assert.equal(docKicker(sidebarPosition(sidebar, '/docs/reference/x')), 'Reference · 2 of 2');
  assert.equal(docKicker(sidebarPosition(sidebar, '/elsewhere'), 'Guides'), 'Guides');
  assert.equal(docKicker(sidebarPosition(sidebar, '/docs/b'), 'Project status'), 'Project status', 'a front-matter kicker is the whole kicker');
  assert.equal(docKicker({index: 1, total: 1}), undefined);
  assert.equal(docKicker(undefined), undefined);
});

test('P12: feature columns follow the card count; graph and status sections take the alternate ground', async () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9].map(featureColumns), [2, 2, 3, 2, 3, 3, 4, 4, 3]);
  assert.match(render(createElement(FeatureGrid, {items: [1, 2, 3, 4].map((n) => ({title: `T${n}`, description: 'd'}))})), /b10x-feature-grid--2/);
  assert.match(render(createElement(FeatureGrid, {columns: 4, items: [{title: 'T', description: 'd', icon: 'claim'}]})), /b10x-feature-grid--4[\s\S]*b10x-kind-icon b10x-kind-icon--claim/);
  const landing = await readLanding(path.join(example, 'product.json'));
  const markup = render(createElement(ProductLanding, {data: landing}));
  assert.match(markup, /class="b10x-product-section b10x-product-section--protocol-graph" id="protocol"/);
  assert.match(markup, /class="b10x-product-section b10x-product-section--status" id="status"/);
  const components = await css('product-components.css');
  for (const kind of ['action', 'evidence', 'claim', 'outcome', 'obligation']) assert.match(components, new RegExp(`--b10x-glyph-${kind}: url\\("data:image/svg\\+xml,`));
  assert.doesNotMatch(components.match(/--b10x-glyph-action:[^;]+;/)[0], /script|onload|href=|foreignObject/i);
});

test('P13: every animation sits inside prefers-reduced-motion: no-preference', async () => {
  for (const name of ['product-components.css', 'product-theme.css']) {
    const text = await css(name);
    const block = text.indexOf('@media (prefers-reduced-motion: no-preference)');
    const outside = block < 0 ? text : text.slice(0, block) + text.slice(text.indexOf('@keyframes', block));
    assert.doesNotMatch(outside.replace(/@keyframes[^{]+\{(?:[^{}]*\{[^}]*\})*[^}]*\}/g, ''), /(^|[;{\s])animation(-name)?\s*:/, name);
  }
});

test('P14: trailing-slash routes get a loop-free copy when trailingSlash is false, never over a real page', async () => {
  const out = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-slash-'));
  try {
    await fs.mkdir(path.join(out, 'docs', 'reference'), {recursive: true});
    for (const file of ['index.html', '404.html', 'docs.html', 'docs/charts.html', 'docs/reference.html', 'docs/reference/ess.html']) await fs.writeFile(path.join(out, file), '<p>page</p>');
    await fs.mkdir(path.join(out, 'docs', 'kept'));
    await fs.writeFile(path.join(out, 'docs', 'kept.html'), '<p>page</p>');
    await fs.writeFile(path.join(out, 'docs', 'kept', 'index.html'), '<p>real</p>');
    const written = await writeTrailingSlashRedirects(out, '/canon/', 'https://beyond10x.github.io');
    assert.deepEqual(written.sort(), ['docs/charts/index.html', 'docs/index.html', 'docs/reference/ess/index.html', 'docs/reference/index.html']);
    const stub = await fs.readFile(path.join(out, 'docs', 'charts', 'index.html'), 'utf8');
    assert.doesNotMatch(stub, /http-equiv="refresh"/, 'no meta refresh: a server that prefers the directory must not loop');
    assert.match(stub, /<link rel="canonical" href="https:\/\/beyond10x\.github\.io\/canon\/docs\/charts">/);
    assert.match(stub, /<script>if\(location\.pathname\.endsWith\("\/"\)\)location\.replace\("\/canon\/docs\/charts"\+location\.search\+location\.hash\)<\/script>/);
    assert.ok(stub.endsWith('<p>page</p>'), 'the page itself is served at x/index.html');
    assert.equal(await fs.readFile(path.join(out, 'docs', 'kept', 'index.html'), 'utf8'), '<p>real</p>');

    // A full page: the copy keeps the page, swaps its canonical, and is refreshed on a second run.
    await fs.writeFile(path.join(out, 'docs', 'charts.html'), '<!doctype html><html><head><meta charset="utf-8"><link data-rh="true" rel="canonical" href="https://beyond10x.github.io/canon/docs/charts/"></head><body>v2</body></html>');
    await writeTrailingSlashRedirects(out, '/canon/', 'https://beyond10x.github.io');
    const copy = await fs.readFile(path.join(out, 'docs', 'charts', 'index.html'), 'utf8');
    assert.ok(copy.startsWith('<!doctype html><html><head><!-- b10x-trailing-slash-copy --><script>'), 'doctype stays first; the script runs before the page');
    assert.equal(copy.match(/rel="canonical"/g).length, 1);
    assert.match(copy, /<body>v2<\/body>/);

    const plain = await fs.mkdtemp(path.join(os.tmpdir(), 'b10x-slash-'));
    await fs.mkdir(path.join(plain, 'docs'));
    await fs.writeFile(path.join(plain, 'docs', 'x.html'), '<p>page</p>');
    await productSitePlugin({siteDir: example, baseUrl: '/', siteConfig: {}}, {}).postBuild({outDir: plain});
    await assert.rejects(fs.access(path.join(plain, 'docs', 'x', 'index.html')));
    await productSitePlugin({siteDir: example, baseUrl: '/', siteConfig: {trailingSlash: false, url: 'http://localhost'}}, {}).postBuild({outDir: plain});
    await fs.access(path.join(plain, 'docs', 'x', 'index.html'));
    await fs.rm(plain, {recursive: true, force: true});
  } finally {
    await fs.rm(out, {recursive: true, force: true});
  }
});

test('P15: the fit toggle is client-only, hero graphs scale to fit, and the hero terminal wraps at every width', async () => {
  const protocol = await readJson('data/software-change.protocol-graph.json');
  const full = render(createElement(ProtocolGraph, {data: protocol}));
  assert.match(full, /b10x-graph__tools/);
  assert.doesNotMatch(full, /b10x-graph__fit/);
  assert.match(full, /min-width:\d+px/);
  const hero = render(createElement(ProtocolGraph, {data: protocol, variant: 'hero'}));
  // The hero scales to fit but never below 0.8, so labels stay legible; a wider graph scrolls.
  const [, max, min] = hero.match(/b10x-graph__canvas" style="max-width:(\d+)px;min-width:(\d+)px"/).map(Number);
  assert.equal(min, Math.ceil(max * 0.8));
  assert.doesNotMatch(hero, /Protocol as text/);
  assert.match(render(createElement(DomainGraph, {data: await readJson('data/commission.domain-graph.json')})), /Domain as text/);
  const components = await css('product-components.css');
  assert.match(components, /\.b10x-graph--hero \.b10x-graph__viewport \{[^}]*overflow-x: auto/);
  assert.match(components, /\.b10x-graph--hero :is\(\.b10x-graph__node-kicker, \.b10x-graph__column-label, \.b10x-graph__entity-name\) \{ letter-spacing: 0; \}/);
  assert.match(components, /\n\.b10x-graph--hero \{ text-rendering: geometricPrecision; \}/);
  // The hero terminal wraps with a hanging indent at every width, not only inside the phone query.
  const allWidths = components.slice(0, components.lastIndexOf('@media (max-width: 720px)'));
  assert.match(allWidths, /\n\.b10x-hero-art--terminal pre\.b10x-terminal__body \{[^}]*white-space: pre-wrap/);
  assert.match(allWidths, /\n\.b10x-hero-art--terminal \.b10x-terminal__output > span \{[^}]*text-indent: calc\(-1 \* var\(--b10x-hang\)\)/);
  assert.match(components, /\.b10x-terminal__gutter \{[^}]*text-indent: 0/);
});
