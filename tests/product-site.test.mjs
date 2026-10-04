import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {register} from 'node:module';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {countCrossings, layeredLayout} from '../dist/graph-layout.js';
import {layoutDomainGraph, layoutProtocolGraph, parseDomainGraph, parseProtocolGraph, predicateLines, protocolLineage} from '../dist/product-graphs.js';
import {parseTerminalSession, parseTranscript} from '../dist/product-data.js';
import {decisionSteps, formatDuration, parseSessionComposition, sessionKpis} from '../dist/session-data.js';
import {productPrismDarkTheme, productPrismTheme} from '../dist/prism-themes.js';
import {activeNavbarItem, docItemLink, navbarItemScore} from '../dist/navbar-active.js';
import productSitePlugin, {readLanding, withProductSite} from '../dist/product-site.js';

register('./theme-loader.mjs', import.meta.url);
const {ProtocolGraph, DomainGraph} = await import('../dist/charts.js');
const {Terminal, FeatureGrid, Feature, Flow, StatusStrip, RelatedTools, ProductLanding, StatusBadge} = await import('../dist/product.js');
const {SessionTimeline, StepBars, CompositionGraph, SessionKpis} = await import('../dist/session-charts.js');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const example = path.join(root, 'examples/product-site');
const readJson = async (file) => JSON.parse(await fs.readFile(path.join(example, file), 'utf8'));
const protocols = ['software-change', 'incident-response', 'software-change-bugfix', 'investigation'];

async function validator() {
  const ajv = new Ajv2020({allErrors: true, strict: true});
  addFormats(ajv);
  for (const name of ['terminal.v1', 'protocol-graph.v1', 'domain-graph.v1', 'case.v1', 'code-pair.v1', 'status.v1', 'product-landing.v1', 'session-composition.v0']) {
    ajv.addSchema(JSON.parse(await fs.readFile(path.join(root, `schema/b10x.${name}.schema.json`), 'utf8')));
  }
  return (id, value) => {
    const validate = ajv.getSchema(`https://beyond10x.github.io/schema/b10x.${id}.json`);
    const valid = validate(value);
    return valid ? [] : validate.errors.map((error) => `${error.instancePath} ${error.message}`);
  };
}

test('example inputs satisfy the published JSON Schemas and the readers', async () => {
  const check = await validator();
  for (const name of protocols) {
    const data = await readJson(`data/${name}.protocol-graph.json`);
    assert.deepEqual(check('protocol-graph.v1', data), [], name);
    assert.equal(parseProtocolGraph(data), data);
  }
  const domain = await readJson('data/commission.domain-graph.json');
  assert.deepEqual(check('domain-graph.v1', domain), []);
  parseDomainGraph(domain);
  const terminal = await readJson('data/canon.terminal.json');
  assert.deepEqual(check('terminal.v1', terminal), []);
  parseTerminalSession(terminal);
  assert.deepEqual(check('product-landing.v1', await readJson('product.json')), []);
  const session = await readJson('data/session.json');
  assert.deepEqual(check('session-composition.v0', session), []);
  parseSessionComposition(session);
});

test('the readers refuse documents the renderers cannot draw honestly', async () => {
  const base = await readJson('data/investigation.protocol-graph.json');
  const clone = () => structuredClone(base);
  const unknown = clone(); unknown.edges.push({from: 'action:inspect', to: 'claim:missing', kind: 'produces'});
  assert.throws(() => parseProtocolGraph(unknown), /unknown node claim:missing/);
  const wrongEnds = clone(); wrongEnds.edges.push({from: 'action:inspect', to: 'claim:explanation.supported', kind: 'produces'});
  assert.throws(() => parseProtocolGraph(wrongEnds), /produces cannot join action to claim/);
  const duplicate = clone(); duplicate.nodes.push({...duplicate.nodes[0]});
  assert.throws(() => parseProtocolGraph(duplicate), /duplicates/);
  const badPredicate = clone(); badPredicate.nodes.find((node) => node.kind === 'claim').predicate = {all: [], any: []};
  assert.throws(() => parseProtocolGraph(badPredicate), /exactly one of/);
  assert.throws(() => parseProtocolGraph({...base, format: 'b10x-protocol-graph/2'}), /format must be/);
  const domain = await readJson('data/commission.domain-graph.json');
  const badState = structuredClone(domain); badState.entities[0].lifecycle.initial = 'Nowhere';
  assert.throws(() => parseDomainGraph(badState), /undeclared state Nowhere/);
  assert.throws(() => parseTerminalSession({format: 'b10x-terminal/1', entries: []}), /non-empty/);
});

test('protocol layout is deterministic, overlap-free and crossing-free on the real protocols', async () => {
  for (const name of protocols) {
    const data = await readJson(`data/${name}.protocol-graph.json`);
    const first = layoutProtocolGraph(data);
    assert.deepEqual(layoutProtocolGraph(structuredClone(data)), first, `${name} is deterministic`);
    assertNoOverlap(first.nodes.map((node) => ({id: node.node.id, ...node})));
    assert.equal(first.nodes.length, data.nodes.length);
    // incident.response has an unavoidable K2,2 (two outcomes share two claims).
    assert.ok(first.crossings <= (name === 'incident-response' ? 1 : 0), `${name} crossings ${first.crossings}`);
    for (const node of first.nodes) assert.ok(node.x >= 0 && node.y >= first.headerHeight && node.x + node.width <= first.width + 0.5 && node.y + node.height <= first.height + 0.5, `${node.node.id} inside the canvas`);
  }
});

test('the layered layout stays readable at 30 nodes with long edges and same-column edges', () => {
  const nodes = [];
  const edges = [];
  for (let layer = 0; layer < 5; layer += 1) for (let index = 0; index < 6; index += 1) nodes.push({id: `n${layer}-${index}`, layer, width: 180, height: 56});
  // A fixed pseudo-random edge set, so the test is stable.
  let seed = 7;
  const next = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
  for (let count = 0; count < 45; count += 1) {
    const from = Math.floor(next() * 4);
    const to = Math.min(4, from + 1 + Math.floor(next() * 2));
    edges.push({from: `n${from}-${Math.floor(next() * 6)}`, to: `n${to}-${Math.floor(next() * 6)}`});
  }
  edges.push({from: 'n2-0', to: 'n2-3'}, {from: 'n4-1', to: 'n0-2', constraint: false});
  const layout = layeredLayout(nodes, edges);
  assert.equal(layout.nodes.length, 30);
  assertNoOverlap(layout.nodes);
  const adjacent = edges.filter((edge) => edge.constraint !== false && Number(edge.to[1]) - Number(edge.from[1]) === 1);
  const inputOrder = Array.from({length: 5}, (_, layer) => nodes.filter((node) => node.layer === layer).map((node) => node.id));
  const naive = countCrossings(inputOrder, adjacent);
  const ordered = layeredLayout(nodes, adjacent).crossings;
  assert.ok(ordered < naive / 2, `ordering cut crossings from ${naive} to ${ordered}`);
  assert.equal(layout.edges.find((edge) => edge.from === 'n2-0' && edge.to === 'n2-3').route, 'same-layer');
  assert.equal(layout.edges.find((edge) => edge.from === 'n4-1').route, 'backward');
  for (const edge of layout.edges) assert.match(edge.path, /^M-?\d/);
  assert.throws(() => layeredLayout([{id: 'a', layer: 0, width: 1, height: 1}], [{from: 'a', to: 'b'}]), /unknown node/);
});

test('domain layout layers entities by relations without overlap', async () => {
  const layout = layoutDomainGraph(await readJson('data/commission.domain-graph.json'));
  assertNoOverlap(layout.nodes.map((node) => ({id: node.entity.id, ...node})));
  assert.equal(layout.crossings, 0);
  const column = (name) => layout.nodes.find((node) => node.entity.name === name).x;
  assert.ok(column('Commission') < column('Run') && column('Agent') < column('AgentRevision') && column('Evidence') < column('Observation'));
});

test('predicates read as nested lines and lineage follows both directions', async () => {
  const data = await readJson('data/software-change.protocol-graph.json');
  const verified = data.nodes.find((node) => node.id === 'claim:implementation.verified');
  assert.deepEqual(predicateLines(verified.predicate).map((line) => [line.depth, line.text, line.reference ?? null]), [[0, 'all of', null], [1, 'claim', 'coverage.not_degraded'], [1, 'claim', 'implementation.reviewed'], [1, 'claim', 'tests.pass']]);
  const lineage = protocolLineage(data, 'claim:implementation.verified');
  for (const id of ['action:tests.run', 'evidence:test_result', 'claim:release.proven', 'outcome:accepted', 'action:repository.merge']) assert.ok(lineage.has(id), id);
  assert.ok(!lineage.has('claim:deployment.healthy'));
});

test('ProtocolGraph and DomainGraph render accessible static SVG, and refuse bad data visibly', async () => {
  const markup = renderToStaticMarkup(createElement(ProtocolGraph, {data: await readJson('data/software-change.protocol-graph.json')}));
  assert.equal((markup.match(/class="b10x-graph__node /g) ?? []).length, 18);
  assert.match(markup, /role="button"[^>]*aria-label="Claim implementation\.verified\. Tested, reviewed and not reducing coverage\. This is the merge gate\."/);
  assert.match(markup, /<summary>Protocol as text<\/summary>/);
  assert.match(markup, /Evidence kinds<span class="b10x-graph__count">6<\/span>/);
  assert.doesNotMatch(markup, /<script|on[a-z]+="|foreignObject/i);
  assert.doesNotMatch(markup, /b10x-graph__edge--gates/, 'gates are traced on hover only');
  const domain = renderToStaticMarkup(createElement(DomainGraph, {data: await readJson('data/commission.domain-graph.json')}));
  assert.match(domain, /suspend · SuspendRun/);
  assert.match(domain, /<summary>Domain as text<\/summary>/);
  assert.equal((domain.match(/b10x-graph__node--entity/g) ?? []).length, 9);
  const refused = renderToStaticMarkup(createElement(ProtocolGraph, {data: {format: 'nope'}}));
  assert.match(refused, /role="alert"[\s\S]*Cannot render protocol graph/);
});

test('Terminal renders recorded and quoted sessions with a commands-only copy control', async () => {
  const session = await readJson('data/canon.terminal.json');
  const markup = renderToStaticMarkup(createElement(Terminal, {session}));
  assert.match(markup, /<button type="button" class="b10x-terminal__copy"/);
  assert.match(markup, /canon conform run/);
  assert.match(markup, /conform: 9 passed, 0 failed, 0 unreadable/);
  assert.match(markup, /canon 0\.0\.0 built from canon 8d1599e/);
  assert.doesNotMatch(markup, /b10x-terminal__pending">[^<]/, 'nothing is hidden without animation');
  assert.deepEqual(parseTranscript('# say why\n$ a --b\nout 1\n# not a comment\n\n$ c\n'), [
    {command: 'a --b', comment: 'say why', output: 'out 1\n# not a comment'},
    {command: 'c'},
  ]);
  const failed = renderToStaticMarkup(createElement(Terminal, {session: {format: 'b10x-terminal/1', entries: [{command: 'x', output: 'boom', exitCode: 2}]}}));
  assert.match(failed, /b10x-terminal__output--failed/);
});

test('product components render status honestly and keep the maturity badge unchanged', () => {
  const markup = renderToStaticMarkup(createElement('div', null,
    createElement(FeatureGrid, {items: [{title: 'One', description: 'First', status: 'shipped'}]}, createElement(Feature, {title: 'Two', status: 'planned'}, 'Second')),
    createElement(Flow, {steps: [{label: 'A', title: 'Author'}, {label: 'B', title: 'Build'}]}),
    createElement(StatusStrip, {items: [{label: 'x', status: 'planned'}, {label: 'y', status: 'shipped'}, {label: 'z', status: 'shipped'}]}),
    createElement(RelatedTools, {tools: [{name: 'ELS', description: 'Engineering protocols', href: 'https://beyond10x.github.io/els/'}]}),
  ));
  // Two cards default to two columns (P12: columns follow the card count).
  assert.match(markup, /<ol class="b10x-feature-grid b10x-feature-grid--2" aria-label="What it does">/);
  assert.match(markup, /--b10x-flow-count:2/);
  assert.match(markup, /aria-label="3 capabilities: 2 shipped, 1 planned"/);
  assert.ok(markup.indexOf('>y<') < markup.indexOf('>x<'), 'shipped items list first');
  assert.match(markup, /href="https:\/\/beyond10x\.github\.io\/els\/"/);
  assert.equal(renderToStaticMarkup(createElement(StatusBadge, {maturity: 'stable'})), '<span class="b10x-status b10x-status--stable">stable</span>');
  assert.equal(renderToStaticMarkup(createElement(StatusBadge, {status: 'decided'})), '<span class="b10x-status b10x-status--decided"><span class="b10x-status__glyph" aria-hidden="true">◐</span>Decided</span>');
});

test('the landing reader inlines referenced files and the page renders every section', async () => {
  const watched = new Set();
  const landing = await readLanding(path.join(example, 'product.json'), watched);
  assert.equal(typeof landing.product.art.session, 'object');
  assert.equal(landing.sections.find((section) => section.kind === 'protocol-graph').data.format, 'b10x-protocol-graph/1');
  assert.ok([...watched].some((file) => file.endsWith('software-change.protocol-graph.json')));
  const markup = renderToStaticMarkup(createElement(ProductLanding, {data: landing}));
  assert.match(markup, /<h1 id="b10x-hero-title">.*<em>What has been earned\.<\/em><\/h1>/);
  for (const id of ['what', 'how', 'protocol', 'status', 'related']) assert.match(markup, new RegExp(`<section class="b10x-product-section[^"]*" id="${id}"`));
  assert.match(markup, />01 \/ What it does</);
});

test('withProductSite adds one plugin, the matched Prism themes and a dark default', () => {
  const config = withProductSite({title: 'X', plugins: ['existing'], themeConfig: {prism: {additionalLanguages: ['zig']}, colorMode: {respectPrefersColorScheme: false}}}, {mark: 'X'});
  assert.equal(config.plugins.length, 2);
  assert.equal(config.plugins[0], 'existing');
  assert.equal(config.plugins[1][0], productSitePlugin);
  assert.equal(config.themeConfig.prism.theme, productPrismTheme);
  assert.equal(config.themeConfig.prism.darkTheme, productPrismDarkTheme);
  assert.ok(config.themeConfig.prism.additionalLanguages.includes('zig') && config.themeConfig.prism.additionalLanguages.includes('rust'));
  assert.deepEqual(config.themeConfig.colorMode, {defaultMode: 'dark', respectPrefersColorScheme: false});
  const plugin = productSitePlugin({siteDir: example, baseUrl: '/canon/', siteConfig: {title: 'Canon'}}, {});
  assert.deepEqual(plugin.injectHtmlTags().headTags, [{tagName: 'style', innerHTML: ':root{--b10x-product-mark:"C"}'}]);
  assert.ok(plugin.getClientModules().every((file) => file.endsWith('.css')));
  assert.throws(() => productSitePlugin({siteDir: example, baseUrl: '/'}, {mark: '"}<'}), /mark must be/);
});

test('session charts draw the reference figures from the role-named fixture', async () => {
  const session = await readJson('data/session.json');
  assert.doesNotMatch(JSON.stringify(session), /timo|b10x-next/i, 'the fixture names roles, not people');
  assert.deepEqual(sessionKpis(session).map((tile) => tile.value), ['13', '53s', '5m 36s', '9', '36m 35s']);
  assert.equal(decisionSteps(session)[2].total, 18 * 60 + 18);
  assert.equal(formatDuration(3725), '1h 02m');
  const timeline = renderToStaticMarkup(createElement(SessionTimeline, {data: session}));
  assert.equal((timeline.match(/b10x-timeline__bar--discarded/g) ?? []).length, 4);
  assert.match(timeline, /<summary>Table view<\/summary>/);
  assert.match(timeline, /aria-label="Approval at 03:55:00 UTC/);
  const bars = renderToStaticMarkup(createElement(StepBars, {data: session}));
  assert.match(bars, />18m 18s</);
  const graph = renderToStaticMarkup(createElement(CompositionGraph, {data: session}));
  assert.match(graph, />×13</);
  assert.match(graph, /human:operator/);
  assert.match(renderToStaticMarkup(createElement(SessionKpis, {data: session})), /<dd class="b10x-stat-tile__value">36m 35s<\/dd>/);
});

test('exactly one navbar item is active: the most specific route match', () => {
  const docs = {default: {path: '/loom/docs', versions: [{isLast: true, sidebars: {docs: {link: {path: '/loom/docs/', label: 'Overview'}}}, docs: [
    {id: 'index', path: '/loom/docs/', sidebar: 'docs'},
    {id: 'reference/ess', path: '/loom/docs/reference/ess', sidebar: 'docs'},
    {id: 'status', path: '/loom/docs/status', sidebar: 'docs'},
  ]}]}};
  // The adoption that showed two active items: a docs link and a deeper reference link.
  const links = [{to: '/docs/', label: 'Documentation'}, {to: '/docs/reference/ess', label: 'Specification'}, {to: '/docs/status', label: 'Status'}, {href: 'https://github.com/beyond10x/loom', label: 'GitHub'}];
  assert.equal(navbarItemScore(links[0], '/loom/docs/reference/ess', '/loom/', docs) > -1, true, 'Docusaurus would mark both');
  assert.equal(activeNavbarItem(links, '/loom/docs/reference/ess', '/loom/', docs), 1);
  assert.equal(activeNavbarItem(links, '/loom/docs/reference/ess/', '/loom/', docs), 1);
  assert.equal(activeNavbarItem(links, '/loom/docs/', '/loom/', docs), 0);
  assert.equal(activeNavbarItem(links, '/loom/docs/status', '/loom/', docs), 2);
  assert.equal(activeNavbarItem(links, '/loom/', '/loom/', docs), -1);
  assert.equal(activeNavbarItem(links, '/loom/docsearch', '/loom/', docs), -1, 'a prefix must end at a path segment');
  // The original configuration: a docSidebar item beside a link into the same sidebar.
  const sidebar = [{type: 'docSidebar', sidebarId: 'docs', label: 'Documentation'}, {to: '/docs/reference/ess', label: 'Specification'}];
  assert.equal(activeNavbarItem(sidebar, '/loom/docs/reference/ess', '/loom/', docs), 1);
  assert.equal(activeNavbarItem(sidebar, '/loom/docs/status', '/loom/', docs), 0);
  assert.deepEqual(docItemLink(sidebar[0], docs, '/loom/docs/status'), {path: '/loom/docs/', label: 'Overview'});
  assert.equal(activeNavbarItem([{to: '/x', activeBaseRegex: '^/loom/(docs|guides)/'}, {to: '/docs/'}], '/loom/docs/a', '/loom/', docs), 0, 'ties go to the earlier item');
});

test('graphs, legends and table identifiers never clip or break', async () => {
  const css = await fs.readFile(path.join(root, 'styles/product-components.css'), 'utf8');
  const theme = await fs.readFile(path.join(root, 'styles/product-theme.css'), 'utf8');
  const rule = (source, selector) => source.match(new RegExp(`(^|\\n)${selector.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\function assertNoOverlap(nodes) {')} \\{([^}]*)\\}`))?.[2] ?? '';
  for (const viewport of ['.b10x-graph__viewport', '.b10x-chart__viewport']) {
    assert.match(rule(css, viewport), /overflow-x: auto/, viewport);
    assert.match(rule(css, viewport), /contain: inline-size/, `${viewport} must not widen the docs column`);
  }
  assert.doesNotMatch(css, /\.b10x-graph__legend[^{]*\{[^}]*white-space: nowrap/, 'legend items wrap');
  assert.match(theme, /:is\(td, th\) code \{ overflow-wrap: normal; word-break: normal; white-space: nowrap; \}/);
  assert.match(theme, /\.markdown > table \{ display: block; max-inline-size: 100%; overflow-x: auto; \}/);
});

function assertNoOverlap(nodes) {
  for (let left = 0; left < nodes.length; left += 1) {
    for (let right = left + 1; right < nodes.length; right += 1) {
      const a = nodes[left];
      const b = nodes[right];
      const apart = a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
      assert.ok(apart, `${a.id} overlaps ${b.id}`);
    }
  }
}
