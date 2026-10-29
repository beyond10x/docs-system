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

const reads = (document) => {
  try {
    parseProtocolGraph(document);
    return 'accepted';
  } catch (error) {
    return error.message;
  }
};

/** One obligation whose predicate (or applicable_when) is the given predicate, round-tripped through JSON text. */
function single(predicate, field = 'predicate') {
  return JSON.parse(JSON.stringify({
    format: 'b10x-protocol-graph/1',
    protocol: {id: 'adversary', revision: 1},
    nodes: [{id: 'obligation:o', kind: 'obligation', name: 'o', [field]: predicate}],
    edges: [],
  }));
}

/** Like single, but the predicate is given as JSON text, so keys such as __proto__ stay own keys. */
function singleText(predicateText, field = 'predicate') {
  return JSON.parse(`{"format":"b10x-protocol-graph/1","protocol":{"id":"adversary","revision":1},"nodes":[{"id":"obligation:o","kind":"obligation","name":"o","${field}":${predicateText}}],"edges":[]}`);
}

const leaf = (after) => ({after});
const base = () => ({first: 'tests_change', then: {kind: 'test_result', result: 'fail'}, subject: 'implementation'});

/** Each predicate holding an after leaf that both the schema and the reader must refuse. */
function hostile() {
  const edit = (change) => { const after = base(); change(after); return leaf(after); };
  return [
    ['an empty then', edit((after) => { after.then = {}; })],
    ['a then that is an array', edit((after) => { after.then = [{kind: 'test_result', result: 'fail'}]; })],
    ['a then that is an empty array', edit((after) => { after.then = []; })],
    ['a null then', edit((after) => { after.then = null; })],
    ['a then that is a number', edit((after) => { after.then = 1; })],
    ['a null first', edit((after) => { after.first = null; })],
    ['a first that is a number', edit((after) => { after.first = 0; })],
    ['a first that is an array', edit((after) => { after.first = ['tests_change']; })],
    ['a first that is an object', edit((after) => { after.first = {kind: 'tests_change'}; })],
    ['a null later kind', edit((after) => { after.then.kind = null; })],
    ['a later kind that is an array', edit((after) => { after.then.kind = ['test_result']; })],
    ['a result that is a boolean', edit((after) => { after.then.result = true; })],
    ['a subject that is a number', edit((after) => { after.subject = 7; })],
    ['a subject that is an object', edit((after) => { after.subject = {id: 'implementation'}; })],
    ['a subject that is an array', edit((after) => { after.subject = ['implementation']; })],
    ['a subject that is a boolean', edit((after) => { after.subject = false; })],
    ['a subject inside then', edit((after) => { delete after.subject; after.then.subject = 'implementation'; })],
    ['a first inside then', edit((after) => { after.then.first = 'tests_change'; })],
    ['a kind beside first', edit((after) => { after.kind = 'test_result'; })],
    ['a result beside first', edit((after) => { after.result = 'fail'; })],
    ['an after that is an array', leaf([base()])],
    ['an after that is null', leaf(null)],
    ['an after that is an empty object', leaf({})],
    ['an after that is a number', leaf(1)],
    ['an after beside a first leaf', {after: base(), first: {kind: 'test_result', result: 'fail'}}],
    ['an after beside a not', {after: base(), not: {claim: {id: 'c'}}}],
  ];
}

/** The same refusals for keys that only JSON text can make own keys. */
const hostileText = [
  ['a __proto__ key in after', '{"after":{"__proto__":{"x":1},"first":"tests_change","then":{"kind":"test_result","result":"fail"}}}'],
  ['a __proto__ key in then', '{"after":{"first":"tests_change","then":{"__proto__":{"kind":"x"},"kind":"test_result","result":"fail"}}}'],
  ['a __proto__ predicate holding an after', '{"__proto__":{"after":{"first":"tests_change","then":{"kind":"test_result","result":"fail"}}}}'],
  ['a constructor key in then', '{"after":{"first":"tests_change","then":{"constructor":"x","kind":"test_result","result":"fail"}}}'],
  ['a toString key in after', '{"after":{"toString":"x","first":"tests_change","then":{"kind":"test_result","result":"fail"}}}'],
  ['an after beside a __proto__ key', '{"__proto__":{},"after":{"first":"tests_change","then":{"kind":"test_result","result":"fail"}}}'],
];

const wrappers = [
  ['alone', (predicate) => predicate],
  ['under not', (predicate) => ({not: predicate})],
  ['in any', (predicate) => ({any: [{claim: {id: 'c'}}, predicate]})],
  ['in all under not under any', (predicate) => ({any: [{not: {all: [{evidence: {kind: 'k'}}, predicate]}}]})],
];

test('adversary: the schema and the reader both refuse every hostile after leaf, at every depth and in applicable_when', async () => {
  const check = await protocolGraphSchema();
  for (const field of ['predicate', 'applicable_when']) {
    for (const [where, wrap] of wrappers) {
      for (const [label, predicate] of hostile()) {
        const document = single(wrap(predicate), field);
        assert.notEqual(reads(document), 'accepted', `reader accepted ${label} ${where} in ${field}`);
        assert.notDeepEqual(check(document), [], `schema accepted ${label} ${where} in ${field}`);
      }
      for (const [label, text] of hostileText) {
        const document = singleText(JSON.stringify(wrap({placeholder: 0})).replace('{"placeholder":0}', text), field);
        assert.notEqual(reads(document), 'accepted', `reader accepted ${label} ${where} in ${field}`);
        assert.notDeepEqual(check(document), [], `schema accepted ${label} ${where} in ${field}`);
      }
    }
  }
});

test('adversary: the reader names the path of a hostile after leaf nested in any and in applicable_when', () => {
  assert.throws(() => parseProtocolGraph(single({any: [{claim: {id: 'c'}}, {after: {...base(), then: []}}]})), /^Error: nodes\[0\]\.predicate\.any\[1\]\.after\.then must be an object$/);
  assert.throws(() => parseProtocolGraph(single({not: {after: {...base(), subject: 7}}}, 'applicable_when')), /^Error: nodes\[0\]\.applicable_when\.not\.after\.subject must be a non-empty string$/);
  assert.throws(() => parseProtocolGraph(singleText('{"after":{"first":"a","then":{"__proto__":{},"kind":"b","result":"c"}}}')), /^Error: nodes\[0\]\.predicate\.after\.then has unknown field __proto__$/);
  assert.throws(() => parseProtocolGraph(single({after: {...base(), then: {}}})), /^Error: nodes\[0\]\.predicate\.after\.then\.kind must be a non-empty string$/);
});

test('adversary: the schema and the reader both accept the after forms canon-ir/1 can write, at every depth', async () => {
  const check = await protocolGraphSchema();
  const accepted = [
    ['the same kind twice, with a subject', {first: 'test_result', then: {kind: 'test_result', result: 'fail'}, subject: 'implementation'}],
    ['then written before first, as Canon orders the keys', {subject: 'a', then: {result: 'r', kind: 'k'}, first: 'f'}],
    ['one astral character in every field', {first: '\u{1F600}', then: {kind: '\u{1F600}', result: '\u{1F600}'}, subject: '\u{1F600}'}],
    ['blank-looking but non-empty strings', {first: ' ', then: {kind: ' ', result: ' '}, subject: ' '}],
  ];
  for (const field of ['predicate', 'applicable_when']) {
    for (const [where, wrap] of wrappers) {
      for (const [label, after] of accepted) {
        const document = single(wrap({after}), field);
        assert.equal(reads(document), 'accepted', `reader refused ${label} ${where} in ${field}`);
        assert.deepEqual(check(document), [], `schema refused ${label} ${where} in ${field}`);
      }
    }
  }
});

test('adversary: an after leaf reads as literal lines inside any, not and an applicable_when', () => {
  const lines = (predicate, depth) => predicateLines(predicate, depth).map((line) => [line.depth, predicateLineText(line)]);
  assert.deepEqual(lines({any: [{claim: {id: 'c'}}, {after: {first: 'a', then: {kind: 'b', result: 'r'}}}]}), [[0, 'any of'], [1, 'claim c'], [1, 'evidence = r: b after a']]);
  assert.deepEqual(lines({not: {after: {first: 'a', then: {kind: 'a', result: 'r'}, subject: 's'}}}, 1), [[1, 'not'], [2, 'evidence = r: a after a about s']]);
  assert.deepEqual(lines({all: [{after: {first: 'a', then: {kind: 'b', result: 'r'}, subject: 's'}}]}), [[0, 'evidence = r: b after a about s']]);
  const [line] = predicateLines({after: {first: 'a', then: {kind: 'b', result: 'r'}}});
  assert.deepEqual(line, {depth: 0, text: 'evidence = r:', reference: 'b', suffix: 'after a'});
});

test('adversary: markup in every after field renders as text, never as an element or a handler', () => {
  const payloads = {
    first: '<script>alert(1)</script>',
    kind: '"><img src=x onerror=alert(1)>',
    result: '<foreignObject><div onmouseover="alert(1)">x</div></foreignObject>',
    subject: '</td><svg onload=alert(1)>',
  };
  const after = {first: payloads.first, then: {kind: payloads.kind, result: payloads.result}, subject: payloads.subject};
  const data = {
    format: 'b10x-protocol-graph/1',
    protocol: {id: 'adversary', revision: 1},
    nodes: [
      {id: 'claim:c', kind: 'claim', name: 'c', predicate: {after}},
      {id: 'obligation:o', kind: 'obligation', name: 'o', applicable_when: {not: {after}}, predicate: {claim: {id: 'c'}}},
    ],
    edges: [{from: 'claim:c', to: 'obligation:o', kind: 'requires'}],
  };
  assert.equal(parseProtocolGraph(data), data);
  const markup = renderToStaticMarkup(createElement(ProtocolGraph, {data}));
  assert.doesNotMatch(markup, /<script|<img|<svg onload|<foreignObject|<div onmouseover/i);
  assert.doesNotMatch(markup, /<[^>]*\son[a-z]+=/i);
  assert.match(markup, /<td>evidence = &lt;foreignObject&gt;/);
  assert.match(markup, /after &lt;script&gt;alert\(1\)&lt;\/script&gt; about &lt;\/td&gt;&lt;svg onload=alert\(1\)&gt;<\/td>/);
  assert.match(markup, /<td>applicable when\n {2}not\n {4}evidence = &lt;foreignObject&gt;/);
});
