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
 * A graph whose predicates use the canon-ir/1 `after` order form (Canon 0.7.0): with a subject, as
 * the only leaf of a claim; without one, nested in `all` and `not`; with the earlier and the later
 * kind the same; and in an obligation's `applicable_when`.
 */
function graph() {
  return {
    format: 'b10x-protocol-graph/1',
    protocol: {id: 'story.delivery', revision: 2},
    nodes: [
      {id: 'action:implementation.edit', kind: 'action', name: 'implementation.edit', effect: 'write', predicate: {all: [{after: {first: 'tests_change', then: {kind: 'test_result', result: 'fail'}, subject: 'implementation'}}, {claim: {id: 'tests.pass'}}]}},
      {id: 'evidence:test_result', kind: 'evidence', name: 'test_result'},
      {id: 'evidence:tests_change', kind: 'evidence', name: 'tests_change'},
      {id: 'claim:tests.pass', kind: 'claim', name: 'tests.pass', predicate: {evidence: {kind: 'test_result', result: 'pass'}}},
      {id: 'claim:tests.red.after.written', kind: 'claim', name: 'tests.red.after.written', predicate: {after: {first: 'tests_change', then: {kind: 'test_result', result: 'fail'}, subject: 'implementation'}}},
      {id: 'claim:tests.unsettled', kind: 'claim', name: 'tests.unsettled', predicate: {all: [{not: {after: {first: 'test_result', then: {kind: 'test_result', result: 'fail'}}}}, {evidence: {kind: 'test_result'}}]}},
      {id: 'obligation:rerun', kind: 'obligation', name: 'rerun', applicable_when: {after: {first: 'tests_change', then: {kind: 'test_result', result: 'pass'}}}, predicate: {evidence: {kind: 'test_result', result: 'pass'}}},
    ],
    edges: [
      {from: 'evidence:tests_change', to: 'claim:tests.red.after.written', kind: 'establishes'},
      {from: 'evidence:test_result', to: 'claim:tests.red.after.written', kind: 'establishes'},
      {from: 'evidence:test_result', to: 'claim:tests.pass', kind: 'establishes'},
      {from: 'evidence:test_result', to: 'claim:tests.unsettled', kind: 'establishes'},
      {from: 'claim:tests.pass', to: 'action:implementation.edit', kind: 'gates'},
      {from: 'evidence:test_result', to: 'obligation:rerun', kind: 'requires'},
    ],
  };
}

const node = (document, id) => document.nodes.find((entry) => entry.id === id);
const at = (id) => `nodes\\[${graph().nodes.findIndex((entry) => entry.id === id)}\\]`;

test('a protocol graph carries the after order form, with and without a subject', async () => {
  const check = await protocolGraphSchema();
  const data = graph();
  assert.deepEqual(check(data), []);
  assert.equal(parseProtocolGraph(data), data);
  assert.deepEqual(predicateLines(node(data, 'claim:tests.red.after.written').predicate).map(predicateLineText), ['evidence = fail: test_result after tests_change about implementation']);
  assert.deepEqual(predicateLines(node(data, 'claim:tests.unsettled').predicate).map(predicateLineText), ['all of', 'not', 'evidence = fail: test_result after test_result', 'any evidence: test_result']);
  assert.deepEqual(predicateLines(node(data, 'obligation:rerun').applicable_when).map(predicateLineText), ['evidence = pass: test_result after tests_change']);
  const [line] = predicateLines({after: {first: 'tests_change', then: {kind: 'test_result', result: 'fail'}, subject: 'implementation'}});
  assert.deepEqual([line.text, line.reference, line.suffix], ['evidence = fail:', 'test_result', 'after tests_change about implementation']);

  const markup = renderToStaticMarkup(createElement(ProtocolGraph, {data}));
  assert.match(markup, /<td>evidence = fail: test_result after tests_change about implementation<\/td>/);
  assert.match(markup, /<td>all of\n {2}evidence = fail: test_result after tests_change about implementation\n {2}claim tests\.pass\neffect write<\/td>/);
  assert.equal((markup.match(/class="b10x-graph__node /g) ?? []).length, data.nodes.length);
  assert.doesNotMatch(markup, /<script|on[a-z]+="|foreignObject/i);
});

/** Each document the schema and the reader refuse, with the path and message the reader names. */
function refusals() {
  const red = at('claim:tests.red.after.written');
  const nested = at('claim:tests.unsettled');
  const change = (id, edit) => {
    const document = graph();
    edit(node(document, id));
    return document;
  };
  const leaf = (edit) => change('claim:tests.red.after.written', (entry) => edit(entry.predicate.after, entry));
  return [
    ['an extra after field', leaf((after) => { after.result = 'fail'; }), `${red}\\.predicate\\.after has unknown field result`],
    ['an extra then field', leaf((after) => { after.then.subject = 'implementation'; }), `${red}\\.predicate\\.after\\.then has unknown field subject`],
    ['no first', leaf((after) => { delete after.first; }), `${red}\\.predicate\\.after\\.first must be a non-empty string`],
    ['a blank first', leaf((after) => { after.first = ''; }), `${red}\\.predicate\\.after\\.first must be a non-empty string`],
    ['no then', leaf((after) => { delete after.then; }), `${red}\\.predicate\\.after\\.then must be an object`],
    ['a then that is a kind', leaf((after) => { after.then = 'test_result'; }), `${red}\\.predicate\\.after\\.then must be an object`],
    ['no later kind', leaf((after) => { delete after.then.kind; }), `${red}\\.predicate\\.after\\.then\\.kind must be a non-empty string`],
    ['a blank later kind', leaf((after) => { after.then.kind = ''; }), `${red}\\.predicate\\.after\\.then\\.kind must be a non-empty string`],
    ['no result', leaf((after) => { delete after.then.result; }), `${red}\\.predicate\\.after\\.then\\.result must be a non-empty string`],
    ['a null result', leaf((after) => { after.then.result = null; }), `${red}\\.predicate\\.after\\.then\\.result must be a non-empty string`],
    ['a blank result', leaf((after) => { after.then.result = ''; }), `${red}\\.predicate\\.after\\.then\\.result must be a non-empty string`],
    ['a blank subject', leaf((after) => { after.subject = ''; }), `${red}\\.predicate\\.after\\.subject must be a non-empty string`],
    ['a null subject', leaf((after) => { after.subject = null; }), `${red}\\.predicate\\.after\\.subject must be a non-empty string`],
    ['an after that is a kind', change('claim:tests.red.after.written', (entry) => { entry.predicate = {after: 'tests_change'}; }), `${red}\\.predicate\\.after must be an object`],
    ['a nested extra field', change('claim:tests.unsettled', (entry) => { entry.predicate.all[0].not.after.is = 'true'; }), `${nested}\\.predicate\\.all\\[0\\]\\.not\\.after has unknown field is`],
    ['after beside another leaf', change('claim:tests.red.after.written', (entry) => { entry.predicate.before = {first: 'tests_change', then: 'test_result'}; }), 'must have exactly one of all, any, not, claim, evidence, input, first, before, after'],
  ];
}

test('the reader refuses an after form it cannot honour, naming the path', () => {
  for (const [label, document, message] of refusals()) {
    assert.throws(() => parseProtocolGraph(document), new RegExp(message), label);
  }
});

test('the protocol-graph schema accepts the after form only as canon-ir/1 writes it', async () => {
  const check = await protocolGraphSchema();
  for (const [label, document] of refusals()) {
    assert.notDeepEqual(check(document), [], label);
  }
});
