import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {register} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {essText, parseEssDocument, resolveEssTarget, safeEssUrl} from '../dist/ess-document.js';
register('./theme-loader.mjs', import.meta.url);
const {EssContractViewer} = await import('../dist/ess-contract-viewer.js');
const fixture = name => JSON.parse(readFileSync(new URL(`./fixtures/ess/${name}.json`, import.meta.url), 'utf8'));
const text = value => [{inline: 'text', text: value}];
const base = () => ({...fixture('mandate'), pages: [structuredClone(fixture('mandate').pages[0])]});

for (const [name, count] of [['mandate', 16], ['connectors', 26]]) {
  test(`real ESS 0.25.0 ${name} projection preserves all pages, provenance and resolvable links`, () => {
    const document = fixture(name); const index = parseEssDocument(document);
    assert.equal(index.pages.size, count);
    assert.equal(index.document, document);
    let links = 0;
    function visit(value) {
      if (!value || typeof value !== 'object') return;
      if (value.inline === 'link') { links++; assert.ok(resolveEssTarget(index, value.to), JSON.stringify(value.to)); }
      for (const child of Object.values(value)) if (Array.isArray(child)) child.forEach(visit); else visit(child);
    }
    visit(document);
    assert.ok(links > 100);
    assert.ok(index.search.some(entry => entry.kind === 'entity'));
    for (const page of document.pages) {
      assert.equal(essText(index.pages.get(page.id).title), essText(page.title));
      assert.deepEqual(index.pages.get(page.id).provenance, page.provenance);
    }
  });
}

test('renders every block and inline type without HTML execution or nested tables', () => {
  const d = base(); d.pages[0].blocks = [
    {block: 'section', level: 2, title: text('Types'), anchor: 'types', about: {kind: 'entity', name: 'sample.Item'}, blocks: [
      {block: 'prose', text: [{inline: 'strong', text: [{inline: 'emphasis', text: text('<script>bad()</script>')}]}, {inline: 'code', text: 'ItemId'}]},
      {block: 'code', language: 'rust', text: 'struct ItemId(String);'},
      {block: 'quote', blocks: [{block: 'prose', text: text('An authored constraint')}]},
      {block: 'list', ordered: true, items: [[{block: 'prose', text: text('First')}]]},
      {block: 'table', columns: [text('Field')], rows: [[text('id')]]}, {block: 'rule'},
      {block: 'diagram', kind: 'lifecycle', source: 'stateDiagram-v2\n Active --> Revoked'},
      {block: 'prose', text: [{inline: 'link', text: text('Self'), to: {target: 'construct', ref: {kind: 'entity', name: 'sample.Item'}}}]},
    ]},
  ];
  const markup = renderToStaticMarkup(createElement(EssContractViewer, {document: d, id: 'test'}));
  assert.match(markup, /&lt;script&gt;bad\(\)&lt;\/script&gt;/);
  assert.doesNotMatch(markup, /<script|dangerouslySetInnerHTML/);
  assert.match(markup, /struct ItemId/); assert.match(markup, /<blockquote>/); assert.match(markup, /<ol>/); assert.match(markup, /<hr/);
  assert.equal((markup.match(/<table/g) ?? []).length, 1);
  assert.match(markup, /href="#contract-test\/index\/types"/);
  assert.match(markup, /Declared|contract declarations/);
});

test('unpublished and ambiguous construct links remain visibly unresolved', () => {
  const d = base(); const section = {block: 'section', level: 2, title: text('A'), anchor: 'a', about: {kind: 'entity', name: 'sample.Item'}, blocks: []};
  d.pages[0].blocks = [section, {...section, anchor: 'b'}, {block: 'prose', text: [{inline: 'link', text: text('Missing'), to: {target: 'page', page: 'missing'}}]}];
  const index = parseEssDocument(d);
  assert.equal(resolveEssTarget(index, {target: 'construct', ref: section.about}), undefined);
  assert.equal(resolveEssTarget(index, {target: 'anchor', page: 'index', anchor: 'missing'}), undefined);
  assert.match(renderToStaticMarkup(createElement(EssContractViewer, {document: d})), /unresolved reference/);
});

test('rejects malformed identities, unsupported variants, ragged tables and active content', () => {
  const changes = [
    d => d.format = 'ess-docs/2',
    d => d.pages.push(structuredClone(d.pages[0])),
    d => d.pages[0].id = '../escape',
    d => d.pages[0].blocks = [{block: 'html', html: '<img src=x onerror=bad()> '}],
    d => d.pages[0].blocks = [{block: 'table', columns: [text('a')], rows: [[]]}],
    d => d.pages[0].blocks = [{block: 'diagram', kind: 'system', source: 'flowchart TD\n click A "https://example.com"'}],
    d => d.pages[0].blocks = [{block: 'diagram', kind: 'system', source: '%%{init: {securityLevel: "loose"}}%%\nflowchart TD\n A-->B'}],
    d => d.pages[0].blocks = [{block: 'diagram', kind: 'system', source: '---\nconfig:\n  securityLevel: loose\n---\nflowchart TD\n A-->B'}],
    d => d.pages[0].blocks = [{block: 'diagram', kind: 'system', source: 'flowchart TD\n A["<img src=https://example.com/track>"]'}],
    d => d.pages[0].blocks = [{block: 'diagram', kind: 'system', source: 'flowchart TD\n A@{ img: "https://example.com/track" }'}],
    d => d.pages[0].blocks = [{block: 'prose', text: [{inline: 'link', text: text('x'), to: {target: 'external', url: 'javascript:bad()'}}]}],
  ];
  for (const change of changes) { const d = base(); change(d); assert.throws(() => parseEssDocument(d)); }
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', '//evil.example', '\\evil.example', 'https://a:b@example.com', 'java\nscript:bad()']) assert.equal(safeEssUrl(url), false, url);
  for (const url of ['https://example.com/docs', '/docs/mandate/', '../source.json', '#part']) assert.equal(safeEssUrl(url), true, url);
});

test('bounded recursive structures fail before exhausting the render stack', () => {
  const d = base(); let node = {block: 'prose', text: text('deep')};
  for (let i = 0; i < 45; i++) node = {block: 'quote', blocks: [node]};
  d.pages[0].blocks = [node]; assert.throws(() => parseEssDocument(d), /limits/);
});
