// Adversary pass 1 on the reference pages (story reference-pages-for-openapi-asyncapi-and-cli).
// Each case asserts what the story's boundary or acceptance requires; they were written red.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AsyncApiReference, CliReference} from '../dist/renderers.js';
import {CLI_REFERENCE_FORMAT, parseCliReference} from '../dist/cli-reference.js';
import productSitePlugin from '../dist/product-site.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const render = (component, props) => renderToStaticMarkup(createElement(component, props));
const ids = (markup) => [...markup.matchAll(/ id="([^"]*)"/g)].map((match) => match[1]);
const fragmentLinks = (markup) => [...markup.matchAll(/ href="#([^"]*)"/g)].map((match) => match[1]);

async function cliSchema() {
  const ajv = new Ajv2020({allErrors: true, strict: true});
  return ajv.compile(JSON.parse(await fs.readFile(path.join(root, 'schema/b10x.cli-reference.v1.schema.json'), 'utf8')));
}

test('adversary: CliReference gives each command of a valid document its own anchor', async () => {
  // `key new` and `key-new` are different commands; schema and parser both accept the document.
  const document = {format: CLI_REFERENCE_FORMAT, binary: 'tool', commands: [
    {path: ['key', 'new'], about: 'Make a key.'},
    {path: ['key-new'], about: 'Another command.'},
    {path: ['a_b'], about: 'Underscore.'},
    {path: ['a.b'], about: 'Dot.'},
  ]};
  const validate = await cliSchema();
  assert.equal(validate(document), true, 'precondition: the JSON Schema accepts the document');
  assert.doesNotThrow(() => parseCliReference(document), 'precondition: parseCliReference accepts the document');
  const markup = render(CliReference, {document});
  const all = ids(markup);
  const repeated = [...new Set(all.filter((id, index) => all.indexOf(id) !== index))];
  assert.deepEqual(repeated, [], 'every id on the page is unique, so each index link opens its own command');
});

test('adversary: AsyncApiReference writes no link to an anchor that is not on the page', () => {
  // Story boundary: "Every link a renderer writes is an anchor on the page or the download of the source."
  const document = {
    asyncapi: '3.0.0',
    info: {title: 'Events', version: '1'},
    channels: {present: {address: 'present', messages: {m: {payload: {type: 'string'}}}}},
    operations: {publish: {action: 'send', channel: {$ref: '#/channels/missing'}}},
  };
  const markup = render(AsyncApiReference, {document});
  const onPage = new Set(ids(markup));
  assert.deepEqual(fragmentLinks(markup).filter((target) => !onPage.has(target)), [], 'an operation whose channel $ref does not resolve links to nothing that is absent');
});

test('adversary: a reference source the plugin cannot publish fails the build naming the id and the file', async () => {
  // A YAML recursive alias passes the kind and version check; publishing the data module then fails.
  const base = path.join(root, '.cache');
  await fs.mkdir(base, {recursive: true});
  const siteDir = await fs.mkdtemp(path.join(base, 'adversary-references-'));
  try {
    const file = path.join(siteDir, 'recursive.yaml');
    await fs.writeFile(file, 'openapi: 3.1.0\ninfo: {title: Recursive, version: "1"}\ncomponents:\n  schemas:\n    List: &list\n      type: array\n      items: *list\n');
    const plugin = productSitePlugin({siteDir, baseUrl: '/', generatedFilesDir: path.join(siteDir, '.docusaurus')}, {references: [{id: 'recursive-api', kind: 'openapi', source: 'recursive.yaml'}]});
    const createData = async (name, content) => { JSON.parse(content); return path.join(siteDir, '.docusaurus', name); };
    await assert.rejects(
      plugin.contentLoaded({content: null, actions: {createData, addRoute: () => {}, setGlobalData: () => {}}}),
      (error) => error.message.includes('"recursive-api"') && error.message.includes(file),
    );
  } finally {
    await fs.rm(siteDir, {recursive: true, force: true});
  }
});

test('adversary: the reference renderers name no product', async () => {
  // Story boundary: "The components are generic: nothing in them names the inbox".
  const files = ['src/api-common.tsx', 'src/asyncapi.tsx', 'src/cli-reference-view.tsx', 'src/renderers.tsx', 'src/cli-reference.ts', 'src/reference-data.ts'];
  const found = [];
  for (const name of files) {
    const lines = (await fs.readFile(path.join(root, name), 'utf8')).split('\n');
    lines.forEach((line, index) => { if (/\binbox\b/i.test(line)) found.push(`${name}:${index + 1}`); });
  }
  assert.deepEqual(found, []);
});
