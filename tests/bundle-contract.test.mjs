import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import Ajv2020Module from 'ajv/dist/2020.js';
import {parse as parseYaml} from 'yaml';

const Ajv2020 = Ajv2020Module.default ?? Ajv2020Module;

test('bundle v1 schema admits the canonical manifest shape and rejects partial artifact provenance', async () => {
  const schema = JSON.parse(await fs.readFile(new URL('../schema/b10x.docs.bundle.v1.schema.json', import.meta.url), 'utf8'));
  const validate = new Ajv2020({allErrors: true, strict: true, validateFormats: false}).compile(schema);
  const document = {
    schema: 'b10x-docs-bundle/v1',
    repository: {id: 'fixture', url: 'https://github.com/beyond10x/fixture'},
    commit: '0123456789abcdef0123456789abcdef01234567',
    producer: {runId: 4242},
    manifestSha256: 'a'.repeat(64),
    collectionSha256: 'b'.repeat(64),
    contentSha256: 'c'.repeat(64),
    files: [
      {path: 'changes/fixture.yaml', sha256: 'd'.repeat(64), size: 196},
      {path: 'docs/guide.md', sha256: 'e'.repeat(64), size: 77},
    ],
  };
  assert.equal(validate(document), true, JSON.stringify(validate.errors));
  document.producer.artifactId = 17;
  assert.equal(validate(document), false);
});

test('composite producer action is credential-free and delegates collection and bundling to pinned Docs System tools', async () => {
  const text = await fs.readFile(new URL('../.github/actions/bundle/action.yml', import.meta.url), 'utf8');
  const action = parseYaml(text);
  assert.equal(action.runs.using, 'composite');
  assert.deepEqual(Object.keys(action.inputs), ['repository-root', 'output', 'run-id', 'commit']);
  assert.equal(
    action.runs.steps[0].env.DOCS_SYSTEM_ACTION_ROOT,
    '${{ github.action_path }}/../../..',
  );
  assert.equal(
    action.runs.steps[1].env.DOCS_SYSTEM_ACTION_ROOT,
    '${{ github.action_path }}/../../..',
  );
  assert.match(text, /dist\/cli\.js" collect/);
  assert.match(text, /--locked/);
  assert.match(text, /--bin b10x-docs-bundle/);
  assert.match(text, /--producer-run-id/);
  assert.doesNotMatch(text, /secrets\.|GH_TOKEN|github\.token/);
});
