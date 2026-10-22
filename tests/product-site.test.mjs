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
import {layoutDomainGraph, layoutProtocolGraph, parseDomainGraph, parseProtocolGraph, predicateLineText, predicateLines, protocolLineage} from '../dist/product-graphs.js';
import {landingDescription, landingTitle, parseTerminalSession, parseTranscript} from '../dist/product-data.js';
import {breakableToc, breakableTocLabel} from '../dist/toc.js';
import {docsEntry} from '../dist/not-found.js';
import {decisionSteps, formatDuration, parseSessionComposition, sessionKpis} from '../dist/session-data.js';
import {productPrismDarkTheme, productPrismTheme} from '../dist/prism-themes.js';
import {activeNavbarItem, docItemLink, navbarItemScore} from '../dist/navbar-active.js';
import productSitePlugin, {readLanding, withProductSite} from '../dist/product-site.js';

register('./theme-loader.mjs', import.meta.url);
const {ProtocolGraph, DomainGraph} = await import('../dist/charts.js');
const {Terminal, FeatureGrid, Feature, Flow, StatusStrip, RelatedTools, ProductLanding, ProductHero, StatusBadge, opensInNewTab} = await import('../dist/product.js');
const {SessionTimeline, StepBars, CompositionGraph, SessionKpis} = await import('../dist/session-charts.js');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const example = path.join(root, 'examples/product-site');
const readJson = async (file) => JSON.parse(await fs.readFile(path.join(example, file), 'utf8'));
const protocols = ['software-change', 'incident-response', 'software-change-bugfix', 'investigation', 'software-change-profiled', 'software-change-ordered'];

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

const lineTuples = (lines) => lines.map((line) => [line.depth, line.text, line.reference ?? null, line.suffix ?? null]);

test('a protocol graph carries case inputs, input leaves and an obligation applicable_when', async () => {
  const check = await validator();
  const data = await readJson('data/software-change-profiled.protocol-graph.json');
  assert.deepEqual(check('protocol-graph.v1', data), []);
  assert.equal(parseProtocolGraph(data), data);
  const edit = data.nodes.find((node) => node.id === 'action:implementation.edit');
  assert.deepEqual(lineTuples(predicateLines(edit.predicate)), [
    [0, 'any of', null, null],
    [1, 'not', null, null],
    [2, 'input', 'change_kind', 'in bugfix'],
    [1, 'claim', 'regression.reproduced', null],
  ]);
  const obligation = data.nodes.find((node) => node.id === 'obligation:reproduce_first');
  assert.deepEqual(predicateLines(obligation.applicable_when).map(predicateLineText), ['input change_kind in bugfix, feature']);
  assert.deepEqual(predicateLines(edit.predicate).map(predicateLineText), ['any of', 'not', 'input change_kind in bugfix', 'claim regression.reproduced']);
});

test('the reader refuses input leaves and applicable_when it cannot honour, naming the path', async () => {
  const base = await readJson('data/software-change-profiled.protocol-graph.json');
  const clone = () => structuredClone(base);
  const node = (document, id) => document.nodes.find((entry) => entry.id === id);
  const indexOf = (id) => base.nodes.findIndex((entry) => entry.id === id);
  const obligationPath = `nodes\\[${indexOf('obligation:reproduce_first')}\\]`;
  const editPath = `nodes\\[${indexOf('action:implementation.edit')}\\]`;
  const claimPath = `nodes\\[${indexOf('claim:tests.pass')}\\]`;

  const onClaim = clone(); node(onClaim, 'claim:tests.pass').applicable_when = {input: {id: 'change_kind', in: ['bugfix']}};
  assert.throws(() => parseProtocolGraph(onClaim), new RegExp(`${claimPath}\\.applicable_when is allowed only on an obligation`));

  const undeclared = clone(); node(undeclared, 'obligation:reproduce_first').applicable_when = {input: {id: 'change_size', in: ['small']}};
  assert.throws(() => parseProtocolGraph(undeclared), new RegExp(`${obligationPath}\\.applicable_when\\.input\\.id names undeclared input change_size`));

  const value = clone(); node(value, 'action:implementation.edit').predicate.any[0].not.input.in = ['bugfix', 'refactor'];
  assert.throws(() => parseProtocolGraph(value), new RegExp(`${editPath}\\.predicate\\.any\\[0\\]\\.not\\.input\\.in\\[1\\] names value refactor that input change_kind does not declare`));

  const noCase = clone(); delete noCase.case;
  assert.throws(() => parseProtocolGraph(noCase), new RegExp(`${editPath}\\.predicate\\.any\\[0\\]\\.not\\.input\\.id names undeclared input change_kind`));

  const empty = clone(); node(empty, 'obligation:reproduce_first').applicable_when.input.in = [];
  assert.throws(() => parseProtocolGraph(empty), new RegExp(`${obligationPath}\\.applicable_when\\.input\\.in must be a non-empty array`));

  const repeated = clone(); node(repeated, 'obligation:reproduce_first').applicable_when.input.in = ['bugfix', 'bugfix'];
  assert.throws(() => parseProtocolGraph(repeated), new RegExp(`${obligationPath}\\.applicable_when\\.input\\.in\\[1\\] duplicates bugfix`));

  const extra = clone(); node(extra, 'obligation:reproduce_first').applicable_when.input.is = 'true';
  assert.throws(() => parseProtocolGraph(extra), new RegExp(`${obligationPath}\\.applicable_when\\.input has unknown field is`));

  const badApplicable = clone(); node(badApplicable, 'obligation:reproduce_first').applicable_when = {all: [], input: {id: 'change_kind', in: ['bugfix']}};
  assert.throws(() => parseProtocolGraph(badApplicable), /applicable_when must have exactly one of all, any, not, claim, evidence, input/);

  const badCase = clone(); badCase.case.inputs.change_kind.values = [];
  assert.throws(() => parseProtocolGraph(badCase), /case\.inputs\.change_kind\.values must be a non-empty array/);
  const badDescription = clone(); badDescription.case.inputs.change_kind.description = '';
  assert.throws(() => parseProtocolGraph(badDescription), /case\.inputs\.change_kind\.description must be a non-empty string or null/);
  const nullDescription = clone(); nullDescription.case.inputs.change_kind.description = null;
  assert.equal(parseProtocolGraph(nullDescription), nullDescription);
  const repeatedValue = clone(); repeatedValue.case.inputs.change_kind.values = ['bugfix', 'docs', 'bugfix'];
  assert.throws(() => parseProtocolGraph(repeatedValue), /case\.inputs\.change_kind\.values\[2\] duplicates bugfix/);
  const caseExtra = clone(); caseExtra.case.profiles = {};
  assert.throws(() => parseProtocolGraph(caseExtra), /case has unknown field profiles/);

  const legacy = await readJson('data/investigation.protocol-graph.json');
  const message = structuredClone(legacy); message.nodes.find((entry) => entry.kind === 'claim').predicate = {all: [], any: []};
  assert.throws(() => parseProtocolGraph(message), /must have exactly one of all, any, not, claim, evidence, input/);
});

test('the protocol-graph schema accepts the input form only as canon-ir/1 writes it, and applicable_when only on obligations', async () => {
  const check = await validator();
  const base = await readJson('data/software-change-profiled.protocol-graph.json');
  const clone = () => structuredClone(base);
  const node = (document, id) => document.nodes.find((entry) => entry.id === id);
  const refused = (document, label) => assert.notDeepEqual(check('protocol-graph.v1', document), [], label);

  const onClaim = clone(); node(onClaim, 'claim:tests.pass').applicable_when = {input: {id: 'change_kind', in: ['bugfix']}};
  refused(onClaim, 'applicable_when on a claim');
  const onAction = clone(); node(onAction, 'action:tests.run').applicable_when = {claim: {id: 'tests.pass'}};
  refused(onAction, 'applicable_when on an action');
  const flat = clone(); node(flat, 'obligation:reproduce_first').applicable_when = {input: 'change_kind', in: ['bugfix']};
  refused(flat, 'flat input form');
  const empty = clone(); node(empty, 'obligation:reproduce_first').applicable_when.input.in = [];
  refused(empty, 'empty in');
  const repeated = clone(); node(repeated, 'obligation:reproduce_first').applicable_when.input.in = ['bugfix', 'bugfix'];
  refused(repeated, 'repeated in');
  const blankId = clone(); node(blankId, 'obligation:reproduce_first').applicable_when.input.id = '';
  refused(blankId, 'blank input id');
  const extraLeaf = clone(); node(extraLeaf, 'obligation:reproduce_first').applicable_when.input.is = 'true';
  refused(extraLeaf, 'extra input field');
  const caseExtra = clone(); caseExtra.case.profiles = {};
  refused(caseExtra, 'extra case field');
  const emptyValues = clone(); emptyValues.case.inputs.change_kind.values = [];
  refused(emptyValues, 'empty values');
  const repeatedValues = clone(); repeatedValues.case.inputs.change_kind.values = ['docs', 'docs'];
  refused(repeatedValues, 'repeated values');
  const inputExtra = clone(); inputExtra.case.inputs.change_kind.default = 'docs';
  refused(inputExtra, 'extra input declaration field');
  const nullDescription = clone(); nullDescription.case.inputs.change_kind.description = null;
  assert.deepEqual(check('protocol-graph.v1', nullDescription), [], 'null description');
});

test('every committed protocol graph from before case inputs validates and reads the same lines', async () => {
  const check = await validator();
  const snapshot = JSON.parse(await fs.readFile(path.join(root, 'tests/fixtures/protocol-graph/predicate-lines.snapshot.json'), 'utf8'));
  const committed = (await fs.readdir(path.join(example, 'data'))).filter((file) => file.endsWith('.protocol-graph.json')).sort();
  const later = ['software-change-profiled.protocol-graph.json', 'software-change-ordered.protocol-graph.json'];
  assert.deepEqual(committed.filter((file) => !later.includes(file)), Object.keys(snapshot).sort());
  for (const file of committed) {
    const data = await readJson(`data/${file}`);
    assert.deepEqual(check('protocol-graph.v1', data), [], file);
    assert.equal(parseProtocolGraph(data), data, file);
  }
  for (const [file, expected] of Object.entries(snapshot)) {
    const data = await readJson(`data/${file}`);
    const actual = Object.fromEntries(data.nodes.filter((node) => node.predicate).map((node) => [node.id, predicateLines(node.predicate)]));
    const recorded = Object.fromEntries(Object.entries(expected).map(([id, lines]) => [id, lines.map(([depth, text, reference]) => reference === null ? {depth, text} : {depth, text, reference})]));
    assert.deepEqual(actual, recorded, file);
    const markup = renderToStaticMarkup(createElement(ProtocolGraph, {data}));
    assert.doesNotMatch(markup, /b10x-graph__inputs|applicable when/i, file);
  }
});

test('ProtocolGraph lists case inputs near the caption and shows applicability before the discharge rule', async () => {
  const data = await readJson('data/software-change-profiled.protocol-graph.json');
  const markup = renderToStaticMarkup(createElement(ProtocolGraph, {data, caption: 'One protocol, three kinds of change.'}));
  assert.match(markup, /<div class="b10x-graph__inputs" role="group" aria-label="Case inputs">/);
  assert.match(markup, /<dt><code>change_kind<\/code><\/dt><dd><span class="b10x-graph__inputs-values"><code>bugfix<\/code><code>feature<\/code><code>docs<\/code><\/span><span class="b10x-graph__inputs-text">What kind of change the case is\.<\/span><\/dd>/);
  const caption = markup.indexOf('b10x-graph__caption');
  const inputs = markup.indexOf('b10x-graph__inputs');
  assert.ok(caption > 0 && inputs > caption && inputs < markup.indexOf('Protocol as text'), 'inputs sit after the caption, before the text table');
  assert.match(markup, /<td>applicable when\n {2}input change_kind in bugfix, feature\nclaim regression\.reproduced<\/td>/);
  assert.match(markup, /<td>any of\n {2}not\n {4}input change_kind in bugfix\n {2}claim regression\.reproduced\nneeds implementation\.write\neffect write<\/td>/);
  assert.equal((markup.match(/class="b10x-graph__node /g) ?? []).length, data.nodes.length);
  assert.doesNotMatch(markup, /<script|on[a-z]+="|foreignObject/i);
  const hero = renderToStaticMarkup(createElement(ProtocolGraph, {data, variant: 'hero'}));
  assert.doesNotMatch(hero, /b10x-graph__inputs/, 'the compact hero art keeps no text blocks');
});

test('a protocol graph carries the first and before order forms, with and without a subject', async () => {
  const check = await validator();
  const data = await readJson('data/software-change-ordered.protocol-graph.json');
  assert.deepEqual(check('protocol-graph.v1', data), []);
  assert.equal(parseProtocolGraph(data), data);
  const lines = Object.fromEntries(data.nodes.filter((node) => node.predicate).map((node) => [node.id, lineTuples(predicateLines(node.predicate))]));
  assert.deepEqual(lines, {
    'claim:regression.reproduced': [[0, 'first evidence = fail:', 'test_result', null]],
    'claim:test.precedes.fix': [
      [0, 'all of', null, null],
      [1, 'evidence', 'test_result', 'before implementation_change about regression_test'],
      [1, 'not', null, null],
      [2, 'evidence', 'implementation_change', 'before test_result'],
    ],
    'claim:tests.pass': [[0, 'evidence = pass:', 'test_result', null]],
    'outcome:accepted': [[0, 'all of', null, null], [1, 'claim', 'tests.pass', null], [1, 'claim', 'test.precedes.fix', null]],
    'obligation:reproduce_first': [[0, 'first evidence = fail:', 'test_result', 'about regression_test']],
  });
  assert.deepEqual(predicateLines({first: {kind: 'review', result: 'approved'}}).map(predicateLineText), ['first evidence = approved: review']);
  assert.deepEqual(predicateLines({before: {first: 'review', then: 'merge', subject: 'change'}}).map(predicateLineText), ['evidence review before merge about change']);

  const inApplicability = {
    format: 'b10x-protocol-graph/1',
    protocol: {id: 'order.applicability', revision: 1},
    nodes: [
      {id: 'evidence:review', kind: 'evidence', name: 'review'},
      {id: 'obligation:second_review', kind: 'obligation', name: 'second_review', applicable_when: {any: [{first: {kind: 'review', result: 'rejected', subject: 'change'}}, {before: {first: 'merge', then: 'review'}}]}, predicate: {evidence: {kind: 'review', result: 'approved'}}},
    ],
    edges: [{from: 'evidence:review', to: 'obligation:second_review', kind: 'requires'}],
  };
  assert.deepEqual(check('protocol-graph.v1', inApplicability), []);
  assert.equal(parseProtocolGraph(inApplicability), inApplicability);
  assert.deepEqual(predicateLines(inApplicability.nodes[1].applicable_when).map(predicateLineText), ['any of', 'first evidence = rejected: review about change', 'evidence merge before review']);

  const markup = renderToStaticMarkup(createElement(ProtocolGraph, {data}));
  assert.match(markup, /<td>all of\n {2}evidence test_result before implementation_change about regression_test\n {2}not\n {4}evidence implementation_change before test_result<\/td>/);
  assert.match(markup, /<td>first evidence = fail: test_result about regression_test<\/td>/);
  assert.match(markup, /<td>first evidence = fail: test_result<\/td>/);
  assert.equal((markup.match(/class="b10x-graph__node /g) ?? []).length, data.nodes.length);
  assert.doesNotMatch(markup, /<script|on[a-z]+="|foreignObject/i);
});

test('the reader refuses order forms it cannot honour, naming the path', async () => {
  const base = await readJson('data/software-change-ordered.protocol-graph.json');
  const clone = () => structuredClone(base);
  const node = (document, id) => document.nodes.find((entry) => entry.id === id);
  const at = (id) => `nodes\\[${base.nodes.findIndex((entry) => entry.id === id)}\\]`;
  const precedes = at('claim:test.precedes.fix');
  const reproduced = at('claim:regression.reproduced');
  const obligation = at('obligation:reproduce_first');

  const selfOrdered = clone(); node(selfOrdered, 'claim:test.precedes.fix').predicate.all[0].before.then = 'test_result';
  assert.throws(() => parseProtocolGraph(selfOrdered), new RegExp(`${precedes}\\.predicate\\.all\\[0\\]\\.before orders evidence test_result before itself`));
  const nestedSelf = clone(); node(nestedSelf, 'claim:test.precedes.fix').predicate.all[1].not.before.then = 'implementation_change';
  assert.throws(() => parseProtocolGraph(nestedSelf), new RegExp(`${precedes}\\.predicate\\.all\\[1\\]\\.not\\.before orders evidence implementation_change before itself`));

  const firstExtra = clone(); node(firstExtra, 'claim:regression.reproduced').predicate.first.is = 'true';
  assert.throws(() => parseProtocolGraph(firstExtra), new RegExp(`${reproduced}\\.predicate\\.first has unknown field is`));
  const beforeExtra = clone(); node(beforeExtra, 'claim:test.precedes.fix').predicate.all[0].before.result = 'pass';
  assert.throws(() => parseProtocolGraph(beforeExtra), new RegExp(`${precedes}\\.predicate\\.all\\[0\\]\\.before has unknown field result`));
  const noResult = clone(); delete node(noResult, 'claim:regression.reproduced').predicate.first.result;
  assert.throws(() => parseProtocolGraph(noResult), new RegExp(`${reproduced}\\.predicate\\.first\\.result must be a non-empty string`));
  const noKind = clone(); delete node(noKind, 'claim:regression.reproduced').predicate.first.kind;
  assert.throws(() => parseProtocolGraph(noKind), new RegExp(`${reproduced}\\.predicate\\.first\\.kind must be a non-empty string`));
  const nullResult = clone(); node(nullResult, 'claim:regression.reproduced').predicate.first.result = null;
  assert.throws(() => parseProtocolGraph(nullResult), new RegExp(`${reproduced}\\.predicate\\.first\\.result must be a non-empty string`));
  const noThen = clone(); delete node(noThen, 'claim:test.precedes.fix').predicate.all[0].before.then;
  assert.throws(() => parseProtocolGraph(noThen), new RegExp(`${precedes}\\.predicate\\.all\\[0\\]\\.before\\.then must be a non-empty string`));
  const noFirst = clone(); delete node(noFirst, 'claim:test.precedes.fix').predicate.all[0].before.first;
  assert.throws(() => parseProtocolGraph(noFirst), new RegExp(`${precedes}\\.predicate\\.all\\[0\\]\\.before\\.first must be a non-empty string`));
  const blankSubject = clone(); node(blankSubject, 'claim:test.precedes.fix').predicate.all[0].before.subject = '';
  assert.throws(() => parseProtocolGraph(blankSubject), new RegExp(`${precedes}\\.predicate\\.all\\[0\\]\\.before\\.subject must be a non-empty string`));
  const nullSubject = clone(); node(nullSubject, 'obligation:reproduce_first').predicate.first.subject = null;
  assert.throws(() => parseProtocolGraph(nullSubject), new RegExp(`${obligation}\\.predicate\\.first\\.subject must be a non-empty string`));
  const notObject = clone(); node(notObject, 'claim:regression.reproduced').predicate = {first: 'test_result'};
  assert.throws(() => parseProtocolGraph(notObject), new RegExp(`${reproduced}\\.predicate\\.first must be an object`));

  const two = clone(); node(two, 'claim:regression.reproduced').predicate = {first: {kind: 'test_result', result: 'fail'}, before: {first: 'test_result', then: 'implementation_change'}};
  assert.throws(() => parseProtocolGraph(two), /must have exactly one of all, any, not, claim, evidence, input, first, before/);
});

test('the protocol-graph schema accepts the order forms only as canon-ir/1 writes them', async () => {
  const check = await validator();
  const base = await readJson('data/software-change-ordered.protocol-graph.json');
  const clone = () => structuredClone(base);
  const node = (document, id) => document.nodes.find((entry) => entry.id === id);
  const refused = (document, label) => assert.notDeepEqual(check('protocol-graph.v1', document), [], label);
  assert.deepEqual(check('protocol-graph.v1', base), [], 'the order-form example itself');
  const selfOrdered = clone(); node(selfOrdered, 'claim:test.precedes.fix').predicate.all[0].before.then = 'test_result';
  assert.deepEqual(check('protocol-graph.v1', selfOrdered), [], 'the schema cannot compare first and then, and does not try');

  const firstExtra = clone(); node(firstExtra, 'claim:regression.reproduced').predicate.first.is = 'true';
  refused(firstExtra, 'extra first field');
  const beforeExtra = clone(); node(beforeExtra, 'claim:test.precedes.fix').predicate.all[0].before.result = 'pass';
  refused(beforeExtra, 'extra before field');
  const noResult = clone(); delete node(noResult, 'claim:regression.reproduced').predicate.first.result;
  refused(noResult, 'first without result');
  const noKind = clone(); delete node(noKind, 'claim:regression.reproduced').predicate.first.kind;
  refused(noKind, 'first without kind');
  const nullResult = clone(); node(nullResult, 'claim:regression.reproduced').predicate.first.result = null;
  refused(nullResult, 'first with a null result');
  const noThen = clone(); delete node(noThen, 'claim:test.precedes.fix').predicate.all[0].before.then;
  refused(noThen, 'before without then');
  const noFirst = clone(); delete node(noFirst, 'claim:test.precedes.fix').predicate.all[0].before.first;
  refused(noFirst, 'before without first');
  const blankThen = clone(); node(blankThen, 'claim:test.precedes.fix').predicate.all[0].before.then = '';
  refused(blankThen, 'blank then');
  const blankSubject = clone(); node(blankSubject, 'claim:test.precedes.fix').predicate.all[0].before.subject = '';
  refused(blankSubject, 'blank subject');
  const nullSubject = clone(); node(nullSubject, 'obligation:reproduce_first').predicate.first.subject = null;
  refused(nullSubject, 'null subject');
  const flat = clone(); node(flat, 'claim:regression.reproduced').predicate = {first: 'test_result', result: 'fail'};
  refused(flat, 'flat first form');
  const two = clone(); node(two, 'claim:regression.reproduced').predicate = {first: {kind: 'test_result', result: 'fail'}, before: {first: 'test_result', then: 'implementation_change'}};
  refused(two, 'two leaves in one predicate');
});

test('every committed protocol graph from before order forms validates and reads the same lines', async () => {
  const check = await validator();
  const snapshot = JSON.parse(await fs.readFile(path.join(root, 'tests/fixtures/protocol-graph/predicate-lines.snapshot.json'), 'utf8'));
  const committed = (await fs.readdir(path.join(example, 'data'))).filter((file) => file.endsWith('.protocol-graph.json')).sort();
  const before = committed.filter((file) => file !== 'software-change-ordered.protocol-graph.json');
  assert.deepEqual(before, [...Object.keys(snapshot), 'software-change-profiled.protocol-graph.json'].sort());
  for (const file of before) {
    const data = await readJson(`data/${file}`);
    assert.deepEqual(check('protocol-graph.v1', data), [], file);
    assert.equal(parseProtocolGraph(data), data, file);
    const markup = renderToStaticMarkup(createElement(ProtocolGraph, {data}));
    assert.doesNotMatch(markup, /first evidence|evidence <code>[^<]*<\/code> before /, file);
  }
  for (const [file, expected] of Object.entries(snapshot)) {
    const data = await readJson(`data/${file}`);
    const actual = Object.fromEntries(data.nodes.filter((node) => node.predicate).map((node) => [node.id, lineTuples(predicateLines(node.predicate))]));
    const recorded = Object.fromEntries(Object.entries(expected).map(([id, lines]) => [id, lines.map(([depth, text, reference]) => [depth, text, reference, null])]));
    assert.deepEqual(actual, recorded, file);
  }
  const profiled = await readJson('data/software-change-profiled.protocol-graph.json');
  const rules = Object.fromEntries(profiled.nodes.flatMap((node) => [
    ...(node.applicable_when ? [[`${node.id} applicable_when`, lineTuples(predicateLines(node.applicable_when))]] : []),
    ...(node.predicate ? [[node.id, lineTuples(predicateLines(node.predicate))]] : []),
  ]));
  assert.deepEqual(rules, {
    'action:implementation.edit': [[0, 'any of', null, null], [1, 'not', null, null], [2, 'input', 'change_kind', 'in bugfix'], [1, 'claim', 'regression.reproduced', null]],
    'claim:regression.reproduced': [[0, 'evidence = fail:', 'test_result', null]],
    'claim:tests.pass': [[0, 'evidence = pass:', 'test_result', null]],
    'outcome:accepted': [[0, 'claim', 'tests.pass', null]],
    'obligation:reproduce_first applicable_when': [[0, 'input', 'change_kind', 'in bugfix, feature']],
    'obligation:reproduce_first': [[0, 'claim', 'regression.reproduced', null]],
  });
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

test('s2-02: a graph description written in Markdown renders its code spans instead of backticks', async () => {
  const data = await readJson('data/commission.domain-graph.json');
  const domain = renderToStaticMarkup(createElement(DomainGraph, {data}));
  assert.match(domain, /<p class="b10x-graph__description">[^<]*returns a <code>frontier<\/code>; a run/);
  assert.doesNotMatch(domain, /`/, 'no backtick reaches the page');
  const spans = renderToStaticMarkup(createElement(DomainGraph, {data: {...data,
    domain: {...data.domain, summary: 'Reads ``a `b` c`` and `` ` `` and \\`not code\\`; a lone ` stays.'},
    entities: data.entities.map((entity, index) => index ? entity : {...entity, summary: 'Owns the `frontier`.'})}}));
  assert.match(spans, /Reads <code>a `b` c<\/code> and <code>`<\/code> and `not code`; a lone ` stays\./);
  assert.match(spans, /aria-label="Entity Agent\. Owns the frontier\."/);
  const graph = await readJson('data/software-change.protocol-graph.json');
  const protocol = renderToStaticMarkup(createElement(ProtocolGraph, {data: {...graph,
    nodes: graph.nodes.map((node, index) => index ? node : {...node, description: 'Change `src/` on a branch.'})}}));
  assert.match(protocol, /<td>Change <code>src\/<\/code> on a branch\.<\/td>/);
  assert.match(protocol, /aria-label="Action repository\.edit\. Change src\/ on a branch\."/);
  const prose = renderToStaticMarkup(createElement(DomainGraph, {data, description: 'Given `as is`.'}));
  assert.match(prose, /Given `as is`\./, 'a description the page passes in is the author\'s and renders unchanged');
});

test('s2-01: a hero graph is never wider than its column; it scales down instead of being cut', async () => {
  for (const [component, file] of [[DomainGraph, 'data/commission.domain-graph.json'], [ProtocolGraph, 'data/software-change.protocol-graph.json']]) {
    const hero = renderToStaticMarkup(createElement(component, {data: await readJson(file), variant: 'hero'}));
    assert.match(hero, /class="b10x-graph__canvas" style="max-width:\d+px;min-width:0px"/, `${file}: the hero canvas has no minimum width`);
  }
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
  assert.equal(renderToStaticMarkup(createElement(StatusBadge, {status: 'decided'})), '<span class="b10x-status b10x-status--decided"><span class="b10x-status__glyph b10x-status-glyph b10x-status-glyph--decided" aria-hidden="true"></span>Decided</span>');
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

test('#20: a hero action Docusaurus opens in a new tab carries a visually hidden label', () => {
  for (const href of ['https://example.org/', 'pathname:///pitch/', '//example.org/x', 'mailto:a@example.org']) assert.equal(opensInNewTab(href), true, href);
  for (const href of ['/docs/', '#protocol', 'docs/x', './x']) assert.equal(opensInNewTab(href), false, href);
  const markup = renderToStaticMarkup(createElement(ProductHero, {promise: ['P.'], lede: 'L', actions: [{label: 'Docs', href: '/docs/', kind: 'primary'}, {label: 'Deck', href: 'pathname:///deck/'}]}));
  assert.match(markup, /Deck <span aria-hidden="true">↗<\/span><span class="b10x-sr-only"> \(opens in new tab\)<\/span>/);
  assert.equal(markup.match(/opens in new tab/g).length, 1);
});

test('#21: the landing title leaves the product name to the site title when that carries it', () => {
  const product = {name: 'ModelSpec', promise: ['Specify models.', 'Check shapes.']};
  assert.equal(landingTitle(product, 'ModelSpec'), 'Specify models. Check shapes.');
  assert.equal(landingTitle(product, 'ModelSpec docs'), 'Specify models. Check shapes.');
  assert.equal(landingTitle(product, 'Beyond10x'), 'ModelSpec — Specify models. Check shapes.');
  assert.equal(landingTitle(product, undefined), 'ModelSpec — Specify models. Check shapes.');
});

test('#25: the landing description fits a search result', () => {
  const lede = 'Canon is a formal language and a deterministic calculus for evidence-governed protocols. For one case under one protocol it answers what is known, what is unknown, which obligations remain open.';
  assert.equal(landingDescription({lede}), 'Canon is a formal language and a deterministic calculus for evidence-governed protocols.');
  assert.equal(landingDescription({lede, description: 'Evidence-governed protocols.'}), 'Evidence-governed protocols.');
  assert.equal(landingDescription({lede: 'Short lede.'}), 'Short lede.');
  const run = `${'word '.repeat(40)}end.`;
  const cut = landingDescription({lede: run});
  assert.ok(cut.length <= 160 && cut.endsWith('word…'), cut);
  const late = `A tiny start. ${'longer clause '.repeat(14)}done.`;
  assert.match(landingDescription({lede: late}), /clause…$/, 'a first sentence under a third of the limit is not enough');
  const points = text => Array.from(text).length;
  const unspaced = landingDescription({lede: 'x'.repeat(200)});
  assert.equal(points(unspaced), 160, 'a lede with no space is cut to the limit, ellipsis included');
  assert.ok(unspaced.endsWith('x…'), unspaced);
  const emoji = landingDescription({lede: '😀'.repeat(170)});
  assert.equal(points(emoji), 160);
  assert.doesNotMatch(emoji, /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/, 'no lone surrogate');
  const fits = `${'a'.repeat(150)}${'😀'.repeat(10)}`;
  assert.equal(landingDescription({lede: 'Lede.', description: fits}), fits, 'the schema counts code points, so 160 of them fit');
});

test('#25: withProductSite serves a default share card unless the site sets one', () => {
  const plain = withProductSite({title: 'X'}, {mark: 'X'});
  assert.equal(plain.themeConfig.image, 'b10x-social/card.png');
  assert.ok(plain.staticDirectories.some(directory => directory.endsWith(path.join('styles', 'social'))));
  assert.ok(plain.staticDirectories.includes('static'));
  const own = withProductSite({title: 'X', favicon: 'img/own.svg', themeConfig: {image: 'img/own.png'}}, {mark: 'X', fonts: false});
  assert.equal(own.themeConfig.image, 'img/own.png');
  assert.equal(own.staticDirectories, undefined);
  const unset = withProductSite({title: 'X', themeConfig: {image: undefined}}, {mark: 'X', fonts: false});
  assert.equal(unset.themeConfig.image, 'b10x-social/card.png', 'an image key set to undefined gets the card it serves');
});

test('#24: a code heading in the table of contents breaks only at separators', () => {
  const word = text => `<span class="b10x-toc-word">${text}</span>`;
  assert.equal(breakableTocLabel('Plain words/and paths'), 'Plain words/and paths');
  assert.equal(breakableTocLabel('<code>check a/two_layer.mspec --stage</code>'), `<code>${word('check')} ${word('a/<wbr>two_<wbr>layer<wbr>.mspec')} ${word('--stage')}</code>`);
  assert.equal(breakableTocLabel('Run <code>a/b</code> then c/d'), `Run <code>${word('a/<wbr>b')}</code> then c/d`);
  assert.equal(breakableTocLabel('<code>.env ../up a.b&amp;c</code>'), `<code>${word('.env')} ${word('../<wbr>up')} ${word('a<wbr>.b&amp;c')}</code>`);
  assert.equal(breakableTocLabel('<code>check-every-surface --stage a-</code>'), `<code>${word('check-<wbr>every-<wbr>surface')} ${word('--stage')} ${word('a-')}</code>`);
  assert.equal(breakableTocLabel('<code>std::collections::HashMap</code>'), `<code>${word('std::<wbr>collections::<wbr>Hash<wbr>Map')}</code>`);
  assert.equal(breakableTocLabel('<code>ProductLanding2Value</code>'), `<code>${word('Product<wbr>Landing2<wbr>Value')}</code>`);
  assert.equal(breakableTocLabel(`<code>${'a'.repeat(25)} ${'b'.repeat(24)}</code>`), `<code>${'a'.repeat(25)} ${word('b'.repeat(24))}</code>`);
  assert.equal(breakableTocLabel(`<code>${'&amp;'.repeat(24)}</code>`), `<code>${word('&amp;'.repeat(24))}</code>`);
  const [heading] = breakableToc([{id: 'x', level: 2, value: '<code>a/b</code>', children: [{id: 'y', level: 3, value: '<code>c_d</code>', children: []}]}]);
  assert.equal(heading.value, `<code>${word('a/<wbr>b')}</code>`);
  assert.equal(heading.children[0].value, `<code>${word('c_<wbr>d')}</code>`);
});

test('#26: the not-found page links to the main doc of the latest docs version', () => {
  const version = (name, isLast, mainDocId, docs) => ({name, isLast, path: `/x/docs/${name}`, mainDocId, docs});
  const docs = {path: '/x/docs', versions: [version('next', false, 'a', [{id: 'a', path: '/x/docs/next/a'}]), version('1', true, 'intro', [{id: 'b', path: '/x/docs/b'}, {id: 'intro', path: '/x/docs/intro'}])]};
  assert.equal(docsEntry({default: docs}), '/x/docs/intro');
  assert.equal(docsEntry({api: {...docs, path: '/x/api'}, default: docs}), '/x/docs/intro');
  assert.equal(docsEntry({api: {path: '/x/api', versions: [version('only', false, 'gone', [])]}}), '/x/docs/only');
  assert.equal(docsEntry({api: {path: '/x/api', versions: []}}), '/x/api');
  assert.equal(docsEntry({}), undefined);
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
  assert.match(theme, /:is\(td, th\) code \{ overflow-wrap: normal; word-break: normal; white-space: normal; \}/);
  assert.match(rule(theme, String.raw`\.markdown \.b10x-table-wrap`), /contain: inline-size/, 'a markdown table must not widen the docs column');
  assert.doesNotMatch(theme, /\.markdown > table \{ display: block/, 'a table keeps its table layout');
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
