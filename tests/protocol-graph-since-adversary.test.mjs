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

const leaf = (since) => ({since});
const base = () => ({last: 'tests_change', then: {kind: 'test_result', result: 'fail'}, subject: 'implementation'});
const after = () => ({first: 'tests_change', then: {kind: 'test_result', result: 'fail'}});

/** Each predicate holding a since leaf that both the schema and the reader must refuse. */
function hostile() {
  const edit = (change) => { const since = base(); change(since); return leaf(since); };
  return [
    ['an empty then', edit((since) => { since.then = {}; })],
    ['a then that is an array', edit((since) => { since.then = [{kind: 'test_result', result: 'fail'}]; })],
    ['a then that is an empty array', edit((since) => { since.then = []; })],
    ['a null then', edit((since) => { since.then = null; })],
    ['a then that is a number', edit((since) => { since.then = 1; })],
    ['a then that is a string', edit((since) => { since.then = 'test_result'; })],
    ['a then that is a boolean', edit((since) => { since.then = true; })],
    ['a null last', edit((since) => { since.last = null; })],
    ['an empty last', edit((since) => { since.last = ''; })],
    ['a last that is a number', edit((since) => { since.last = 0; })],
    ['a last that is an array', edit((since) => { since.last = ['tests_change']; })],
    ['a last that is an object', edit((since) => { since.last = {kind: 'tests_change'}; })],
    ['no last', edit((since) => { delete since.last; })],
    ['no then', edit((since) => { delete since.then; })],
    ['an empty later kind', edit((since) => { since.then.kind = ''; })],
    ['a null later kind', edit((since) => { since.then.kind = null; })],
    ['a later kind that is an array', edit((since) => { since.then.kind = ['test_result']; })],
    ['an empty result', edit((since) => { since.then.result = ''; })],
    ['a result that is a boolean', edit((since) => { since.then.result = true; })],
    ['a result that is a number', edit((since) => { since.then.result = 0; })],
    ['no result', edit((since) => { delete since.then.result; })],
    ['an empty subject', edit((since) => { since.subject = ''; })],
    ['a null subject', edit((since) => { since.subject = null; })],
    ['a subject that is a number', edit((since) => { since.subject = 7; })],
    ['a subject that is an object', edit((since) => { since.subject = {id: 'implementation'}; })],
    ['a subject that is an array', edit((since) => { since.subject = ['implementation']; })],
    ['a subject that is a boolean', edit((since) => { since.subject = false; })],
    ['a subject inside then', edit((since) => { delete since.subject; since.then.subject = 'implementation'; })],
    ['a last inside then', edit((since) => { since.then.last = 'tests_change'; })],
    ['a first beside last, as after writes it', edit((since) => { since.first = 'tests_change'; })],
    ['a first in place of last, an after under the since key', leaf(after())],
    ['a kind beside last', edit((since) => { since.kind = 'test_result'; })],
    ['a result beside last', edit((since) => { since.result = 'fail'; })],
    ['an extra field beside last', edit((since) => { since.revision = 'same'; })],
    ['a since that is an array', leaf([base()])],
    ['a since that is null', leaf(null)],
    ['a since that is an empty object', leaf({})],
    ['a since that is a number', leaf(1)],
    ['a since that is a string', leaf('tests_change')],
    ['a since beside an after', {since: base(), after: after()}],
    ['an after beside a since, after written first', {after: after(), since: base()}],
    ['a since beside a first leaf', {since: base(), first: {kind: 'test_result', result: 'fail'}}],
    ['a since beside a not', {since: base(), not: {claim: {id: 'c'}}}],
    ['a last-shaped key under an after', {after: {last: 'tests_change', then: {kind: 'test_result', result: 'fail'}}}],
  ];
}

/** The same refusals for keys that only JSON text can make own keys. */
const hostileText = [
  ['a __proto__ key in since', '{"since":{"__proto__":{"x":1},"last":"tests_change","then":{"kind":"test_result","result":"fail"}}}'],
  ['a __proto__ key in then', '{"since":{"last":"tests_change","then":{"__proto__":{"kind":"x"},"kind":"test_result","result":"fail"}}}'],
  ['a __proto__ predicate holding a since', '{"__proto__":{"since":{"last":"tests_change","then":{"kind":"test_result","result":"fail"}}}}'],
  ['a constructor key in then', '{"since":{"last":"tests_change","then":{"constructor":"x","kind":"test_result","result":"fail"}}}'],
  ['a toString key in since', '{"since":{"toString":"x","last":"tests_change","then":{"kind":"test_result","result":"fail"}}}'],
  ['a since beside a __proto__ key', '{"__proto__":{},"since":{"last":"tests_change","then":{"kind":"test_result","result":"fail"}}}'],
  ['a since key written twice, the second malformed', '{"since":{"last":"tests_change","then":{"kind":"test_result","result":"fail"}},"since":{"last":""}}'],
];

const wrappers = [
  ['alone', (predicate) => predicate],
  ['under not', (predicate) => ({not: predicate})],
  ['in any', (predicate) => ({any: [{claim: {id: 'c'}}, predicate]})],
  ['beside an after in all', (predicate) => ({all: [{after: after()}, predicate]})],
  ['in all under not under any', (predicate) => ({any: [{not: {all: [{evidence: {kind: 'k'}}, predicate]}}]})],
];

test('adversary: the schema and the reader both refuse every hostile since leaf, at every depth and in applicable_when', async () => {
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

test('adversary: the reader names the exact path of a hostile since leaf', () => {
  const exactly = 'must have exactly one of all, any, not, claim, evidence, input, first, before, after, since';
  assert.throws(() => parseProtocolGraph(single({any: [{claim: {id: 'c'}}, {since: {...base(), then: []}}]})), /^Error: nodes\[0\]\.predicate\.any\[1\]\.since\.then must be an object$/);
  assert.throws(() => parseProtocolGraph(single({not: {since: {...base(), subject: 7}}}, 'applicable_when')), /^Error: nodes\[0\]\.applicable_when\.not\.since\.subject must be a non-empty string$/);
  assert.throws(() => parseProtocolGraph(singleText('{"since":{"last":"a","then":{"__proto__":{},"kind":"b","result":"c"}}}')), /^Error: nodes\[0\]\.predicate\.since\.then has unknown field __proto__$/);
  assert.throws(() => parseProtocolGraph(single({since: {...base(), then: {}}})), /^Error: nodes\[0\]\.predicate\.since\.then\.kind must be a non-empty string$/);
  assert.throws(() => parseProtocolGraph(single({since: after()})), /^Error: nodes\[0\]\.predicate\.since has unknown field first$/);
  assert.throws(() => parseProtocolGraph(single({since: {last: 'a', then: {kind: 'b', result: 'c', is: 'true'}}})), /^Error: nodes\[0\]\.predicate\.since\.then has unknown field is$/);
  assert.throws(() => parseProtocolGraph(single({since: {last: '', then: {kind: 'b', result: 'c'}}})), /^Error: nodes\[0\]\.predicate\.since\.last must be a non-empty string$/);
  assert.throws(() => parseProtocolGraph(single({all: [{after: after()}, {since: {last: 'a', then: {kind: 'b', result: ''}}}]})), /^Error: nodes\[0\]\.predicate\.all\[1\]\.since\.then\.result must be a non-empty string$/);
  assert.throws(() => parseProtocolGraph(single({since: base(), after: after()})), new RegExp(`^Error: nodes\\[0\\]\\.predicate ${exactly}$`));
  assert.throws(() => parseProtocolGraph(single({})), new RegExp(`^Error: nodes\\[0\\]\\.predicate ${exactly}$`));
});

test('adversary: the schema and the reader both accept the since forms canon-ir/1 can write, at every depth and beside after', async () => {
  const check = await protocolGraphSchema();
  const accepted = [
    ['the same kind twice, with a subject', {last: 'test_result', then: {kind: 'test_result', result: 'fail'}, subject: 'implementation'}],
    ['without a subject', {last: 'tests_change', then: {kind: 'test_result', result: 'pass'}}],
    ['then written before last, as Canon may order the keys', {subject: 'a', then: {result: 'r', kind: 'k'}, last: 'l'}],
    ['one astral character in every field', {last: '\u{1F600}', then: {kind: '\u{1F600}', result: '\u{1F600}'}, subject: '\u{1F600}'}],
    ['blank-looking but non-empty strings', {last: ' ', then: {kind: ' ', result: ' '}, subject: ' '}],
  ];
  for (const field of ['predicate', 'applicable_when']) {
    for (const [where, wrap] of wrappers) {
      for (const [label, since] of accepted) {
        const document = single(wrap({since}), field);
        assert.equal(reads(document), 'accepted', `reader refused ${label} ${where} in ${field}`);
        assert.deepEqual(check(document), [], `schema refused ${label} ${where} in ${field}`);
      }
    }
  }
});

test('adversary: a since leaf reads as literal lines inside any, not and beside an after', () => {
  const lines = (predicate, depth) => predicateLines(predicate, depth).map((line) => [line.depth, predicateLineText(line)]);
  assert.deepEqual(lines({any: [{claim: {id: 'c'}}, {since: {last: 'a', then: {kind: 'b', result: 'r'}}}]}), [[0, 'any of'], [1, 'claim c'], [1, 'evidence = r: b since a']]);
  assert.deepEqual(lines({not: {since: {last: 'a', then: {kind: 'a', result: 'r'}, subject: 's'}}}, 1), [[1, 'not'], [2, 'evidence = r: a since a about s']]);
  assert.deepEqual(lines({all: [{since: {last: 'a', then: {kind: 'b', result: 'r'}, subject: 's'}}]}), [[0, 'evidence = r: b since a about s']]);
  assert.deepEqual(lines({all: [{after: {first: 'a', then: {kind: 'b', result: 'r'}}}, {since: {last: 'a', then: {kind: 'b', result: 'r'}}}]}), [[0, 'all of'], [1, 'evidence = r: b after a'], [1, 'evidence = r: b since a']]);
  const [line] = predicateLines({since: {last: 'a', then: {kind: 'b', result: 'r'}}});
  assert.deepEqual(line, {depth: 0, text: 'evidence = r:', reference: 'b', suffix: 'since a'});
  const [about] = predicateLines({since: {last: 'a', then: {kind: 'b', result: 'r'}, subject: 's'}});
  assert.deepEqual(about, {depth: 0, text: 'evidence = r:', reference: 'b', suffix: 'since a about s'});
});

test('adversary: markup in every since field renders as text, never as an element or a handler', () => {
  const payloads = {
    last: '<script>alert(1)</script>',
    kind: '"><img src=x onerror=alert(1)>',
    result: '<foreignObject><div onmouseover="alert(1)">x</div></foreignObject>',
    subject: '</td><svg onload=alert(1)>',
  };
  const since = {last: payloads.last, then: {kind: payloads.kind, result: payloads.result}, subject: payloads.subject};
  const data = {
    format: 'b10x-protocol-graph/1',
    protocol: {id: 'adversary', revision: 1},
    nodes: [
      {id: 'claim:c', kind: 'claim', name: 'c', predicate: {since}},
      {id: 'obligation:o', kind: 'obligation', name: 'o', applicable_when: {not: {since}}, predicate: {claim: {id: 'c'}}},
    ],
    edges: [{from: 'claim:c', to: 'obligation:o', kind: 'requires'}],
  };
  assert.equal(parseProtocolGraph(data), data);
  const markup = renderToStaticMarkup(createElement(ProtocolGraph, {data}));
  assert.doesNotMatch(markup, /<script|<img|<svg onload|<foreignObject|<div onmouseover/i);
  assert.doesNotMatch(markup, /<[^>]*\son[a-z]+=/i);
  assert.match(markup, /<td>evidence = &lt;foreignObject&gt;/);
  assert.match(markup, /since &lt;script&gt;alert\(1\)&lt;\/script&gt; about &lt;\/td&gt;&lt;svg onload=alert\(1\)&gt;<\/td>/);
  assert.match(markup, /<td>applicable when\n {2}not\n {4}evidence = &lt;foreignObject&gt;/);
});
