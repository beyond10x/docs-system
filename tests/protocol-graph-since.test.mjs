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
import {parseProtocolGraph, predicateLineText, predicateLines} from '../dist/product-graphs.js';

register('./theme-loader.mjs', import.meta.url);
const {ProtocolGraph} = await import('../dist/charts.js');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function protocolGraphSchema() {
  const ajv = new Ajv2020({allErrors: true, strict: true});
  addFormats(ajv);
  ajv.addSchema(JSON.parse(await fs.readFile(path.join(root, 'schema/b10x.protocol-graph.v1.schema.json'), 'utf8')));
  const validate = ajv.getSchema('https://beyond10x.github.io/schema/b10x.protocol-graph.v1.json');
  return (value) => (validate(value) ? [] : validate.errors.map((error) => `${error.instancePath} ${error.message}`));
}

/**
 * A graph whose predicates use the canon-ir/1 `since` order form (Canon 0.8.0): with a subject, as
 * the only leaf of a claim; without one, nested in `all` and `not`; with the latest and the later
 * kind the same; and in an obligation's `applicable_when`.
 */
function graph() {
  return {
    format: 'b10x-protocol-graph/1',
    protocol: {id: 'story.delivery', revision: 3},
    nodes: [
      {id: 'action:implementation.edit', kind: 'action', name: 'implementation.edit', effect: 'write', predicate: {all: [{since: {last: 'tests_change', then: {kind: 'test_result', result: 'fail'}, subject: 'implementation'}}, {claim: {id: 'tests.pass'}}]}},
      {id: 'evidence:test_result', kind: 'evidence', name: 'test_result'},
      {id: 'evidence:tests_change', kind: 'evidence', name: 'tests_change'},
      {id: 'claim:tests.pass', kind: 'claim', name: 'tests.pass', predicate: {evidence: {kind: 'test_result', result: 'pass'}}},
      {id: 'claim:tests.red.since.changed', kind: 'claim', name: 'tests.red.since.changed', predicate: {since: {last: 'tests_change', then: {kind: 'test_result', result: 'fail'}, subject: 'implementation'}}},
      {id: 'claim:tests.unsettled', kind: 'claim', name: 'tests.unsettled', predicate: {all: [{not: {since: {last: 'test_result', then: {kind: 'test_result', result: 'fail'}}}}, {evidence: {kind: 'test_result'}}]}},
      {id: 'obligation:rerun', kind: 'obligation', name: 'rerun', applicable_when: {since: {last: 'tests_change', then: {kind: 'test_result', result: 'pass'}}}, predicate: {evidence: {kind: 'test_result', result: 'pass'}}},
    ],
    edges: [
      {from: 'evidence:tests_change', to: 'claim:tests.red.since.changed', kind: 'establishes'},
      {from: 'evidence:test_result', to: 'claim:tests.red.since.changed', kind: 'establishes'},
      {from: 'evidence:test_result', to: 'claim:tests.pass', kind: 'establishes'},
      {from: 'evidence:test_result', to: 'claim:tests.unsettled', kind: 'establishes'},
      {from: 'claim:tests.pass', to: 'action:implementation.edit', kind: 'gates'},
      {from: 'evidence:test_result', to: 'obligation:rerun', kind: 'requires'},
    ],
  };
}

const node = (document, id) => document.nodes.find((entry) => entry.id === id);
const at = (id) => `nodes\\[${graph().nodes.findIndex((entry) => entry.id === id)}\\]`;

test('a protocol graph carries the since order form, with and without a subject', async () => {
  const check = await protocolGraphSchema();
  const data = graph();
  assert.deepEqual(check(data), []);
  assert.equal(parseProtocolGraph(data), data);
  assert.deepEqual(predicateLines(node(data, 'claim:tests.red.since.changed').predicate).map(predicateLineText), ['evidence = fail: test_result since tests_change about implementation']);
  assert.deepEqual(predicateLines(node(data, 'claim:tests.unsettled').predicate).map(predicateLineText), ['all of', 'not', 'evidence = fail: test_result since test_result', 'any evidence: test_result']);
  assert.deepEqual(predicateLines(node(data, 'obligation:rerun').applicable_when).map(predicateLineText), ['evidence = pass: test_result since tests_change']);
  const [line] = predicateLines({since: {last: 'tests_change', then: {kind: 'test_result', result: 'fail'}, subject: 'implementation'}});
  assert.deepEqual([line.text, line.reference, line.suffix], ['evidence = fail:', 'test_result', 'since tests_change about implementation']);

  const markup = renderToStaticMarkup(createElement(ProtocolGraph, {data}));
  assert.match(markup, /<td>evidence = fail: test_result since tests_change about implementation<\/td>/);
  assert.match(markup, /<td>all of\n {2}evidence = fail: test_result since tests_change about implementation\n {2}claim tests\.pass\neffect write<\/td>/);
  assert.equal((markup.match(/class="b10x-graph__node /g) ?? []).length, data.nodes.length);
  assert.doesNotMatch(markup, /<script|on[a-z]+="|foreignObject/i);
});

/** Each document the schema and the reader refuse, with the path and message the reader names. */
function refusals() {
  const red = at('claim:tests.red.since.changed');
  const nested = at('claim:tests.unsettled');
  const change = (id, edit) => {
    const document = graph();
    edit(node(document, id));
    return document;
  };
  const leaf = (edit) => change('claim:tests.red.since.changed', (entry) => edit(entry.predicate.since, entry));
  return [
    ['an extra since field', leaf((since) => { since.result = 'fail'; }), `${red}\\.predicate\\.since has unknown field result`],
    ['a first in place of last', leaf((since) => { since.first = since.last; delete since.last; }), `${red}\\.predicate\\.since has unknown field first`],
    ['an extra then field', leaf((since) => { since.then.subject = 'implementation'; }), `${red}\\.predicate\\.since\\.then has unknown field subject`],
    ['no last', leaf((since) => { delete since.last; }), `${red}\\.predicate\\.since\\.last must be a non-empty string`],
    ['a blank last', leaf((since) => { since.last = ''; }), `${red}\\.predicate\\.since\\.last must be a non-empty string`],
    ['no then', leaf((since) => { delete since.then; }), `${red}\\.predicate\\.since\\.then must be an object`],
    ['a then that is a kind', leaf((since) => { since.then = 'test_result'; }), `${red}\\.predicate\\.since\\.then must be an object`],
    ['no later kind', leaf((since) => { delete since.then.kind; }), `${red}\\.predicate\\.since\\.then\\.kind must be a non-empty string`],
    ['a blank later kind', leaf((since) => { since.then.kind = ''; }), `${red}\\.predicate\\.since\\.then\\.kind must be a non-empty string`],
    ['no result', leaf((since) => { delete since.then.result; }), `${red}\\.predicate\\.since\\.then\\.result must be a non-empty string`],
    ['a null result', leaf((since) => { since.then.result = null; }), `${red}\\.predicate\\.since\\.then\\.result must be a non-empty string`],
    ['a blank result', leaf((since) => { since.then.result = ''; }), `${red}\\.predicate\\.since\\.then\\.result must be a non-empty string`],
    ['a blank subject', leaf((since) => { since.subject = ''; }), `${red}\\.predicate\\.since\\.subject must be a non-empty string`],
    ['a null subject', leaf((since) => { since.subject = null; }), `${red}\\.predicate\\.since\\.subject must be a non-empty string`],
    ['a since that is a kind', change('claim:tests.red.since.changed', (entry) => { entry.predicate = {since: 'tests_change'}; }), `${red}\\.predicate\\.since must be an object`],
    ['a nested extra field', change('claim:tests.unsettled', (entry) => { entry.predicate.all[0].not.since.is = 'true'; }), `${nested}\\.predicate\\.all\\[0\\]\\.not\\.since has unknown field is`],
    ['since beside another leaf', change('claim:tests.red.since.changed', (entry) => { entry.predicate.after = {first: 'tests_change', then: {kind: 'test_result', result: 'fail'}}; }), 'must have exactly one of all, any, not, claim, evidence, input, first, before, after, since$'],
  ];
}

test('the reader refuses a since form it cannot honour, naming the path', () => {
  for (const [label, document, message] of refusals()) {
    assert.throws(() => parseProtocolGraph(document), new RegExp(message), label);
  }
});

test('the protocol-graph schema accepts the since form only as canon-ir/1 writes it', async () => {
  const check = await protocolGraphSchema();
  for (const [label, document] of refusals()) {
    assert.notDeepEqual(check(document), [], label);
  }
});
