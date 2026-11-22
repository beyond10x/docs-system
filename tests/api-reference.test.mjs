// Reference pages: OpenAPI 3.1, AsyncAPI 3.0 and b10x-cli-reference/1 renderers, the ESS CLI plan
// adapter and the product-site `references` option.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import YAML from 'yaml';
import {ApiReference, AsyncApiReference, CliReference, cliSynopsis, JsonSchemaViewer, OpenApiReference} from '../dist/renderers.js';
import {CLI_REFERENCE_FORMAT, cliReferenceFromEssPlan, parseCliReference} from '../dist/cli-reference.js';
import {checkReferenceOptions, readReference} from '../dist/reference-data.js';
import productSitePlugin, {PRODUCT_REFERENCE_ALIAS, PRODUCT_REFERENCE_STATIC, withProductSite} from '../dist/product-site.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = path.join(root, 'examples/product-site/data/reference');
const openapi = YAML.parse(await fs.readFile(path.join(data, 'inbox-service.openapi.yaml'), 'utf8'));
const asyncapi = YAML.parse(await fs.readFile(path.join(data, 'inbox-service.asyncapi.yaml'), 'utf8'));
const cli = JSON.parse(await fs.readFile(path.join(data, 'inbox-cli.json'), 'utf8'));
const plan = JSON.parse(await fs.readFile(path.join(root, 'tests/fixtures/reference/inbox-cli-plan.json'), 'utf8'));
const render = (component, props) => renderToStaticMarkup(createElement(component, props));
const count = (markup, pattern) => markup.match(new RegExp(pattern, 'g'))?.length ?? 0;

async function cliSchema() {
  const ajv = new Ajv2020({allErrors: true, strict: true});
  const validate = ajv.compile(JSON.parse(await fs.readFile(path.join(root, 'schema/b10x.cli-reference.v1.schema.json'), 'utf8')));
  return (value) => validate(value) ? [] : validate.errors.map((error) => `${error.instancePath} ${error.message}`);
}

test('OpenApiReference renders the inbox service: grouped operations, an index, request bodies, $ref links and schema cards', () => {
  const markup = render(OpenApiReference, {document: openapi, sourceUrl: '/site/reference/http-api.yaml', sourceName: 'inbox-service.openapi.yaml'});
  const operations = Object.values(openapi.paths).reduce((sum, item) => sum + Object.keys(item).filter((key) => ['get', 'post', 'put', 'patch', 'delete'].includes(key)).length, 0);
  assert.equal(operations, 18);
  assert.equal(count(markup, '<details class="b10x-api-operation"'), operations, 'one card per operation');
  assert.equal(count(markup, '<li><a href="#operation-'), operations, 'one index entry per operation');
  assert.match(markup, /<h3 id="openapi-inbox-service-tag-messaging">messaging<\/h3>/, 'grouped by the first tag');
  assert.match(markup, /One addressable inbox per agent or person/, 'with the tag description');
  assert.match(markup, /<span class="b10x-api-chip b10x-api-method b10x-api-method--post">POST<\/span><code class="b10x-api-path">\/<wbr\/>messaging\/<wbr\/>commands\/<wbr\/>answer<\/code><h4>Answer<\/h4>/);
  assert.match(markup, /<li><a href="#operation-inbox.messaging.Answer">/);
  assert.match(markup, /<details class="b10x-api-operation" id="operation-inbox.messaging.Answer">/, 'stable anchors from the operation id');
  assert.match(markup, /<h5>Request body <b class="b10x-schema-required">required<\/b><\/h5>/);
  assert.match(markup, /<a href="#schema-inbox.messaging.Answer.Input"><code>/, 'a $ref links to its schema card');
  assert.match(markup, /<details class="b10x-schema-card" id="schema-inbox.messaging.Answer.Input">/);
  assert.equal(count(markup, '<details class="b10x-schema-card"'), Object.keys(openapi.components.schemas).length);
  assert.match(markup, new RegExp(`<details class="b10x-api-all-schemas"><summary>Show all ${Object.keys(openapi.components.schemas).length} schemas</summary><div class="b10x-schema-grid">`), 'the schema cards sit in one closed disclosure');
  assert.match(markup, /<span class="b10x-api-chip b10x-api-status b10x-api-status--4xx">422<\/span>/);
  assert.match(markup, /One of, told apart by <code>outcome<\/code>/, 'a discriminated oneOf is labelled');
  assert.match(markup, /<td>query<\/td>/, 'query parameters are listed');
  assert.match(markup, /href="\/site\/reference\/http-api.yaml" download="inbox-service.openapi.yaml">Download OpenAPI source/);
  assert.match(markup, /<code>application\/json<\/code>/);
  assert.match(markup, /<code>inbox serve<\/code>/, 'backtick spans in descriptions are code');
  assert.doesNotMatch(markup, /read_your_writes|8e2e22d2/, 'x-* members are ignored');
  assert.doesNotMatch(markup, /<details[^>]* open/, 'every disclosure starts closed');
  assert.match(markup, /<div class="b10x-api-filter" hidden="">/, 'the filter is hidden until hydration, so the full list shows without JavaScript');
  const level3 = render(OpenApiReference, {document: openapi, headingLevel: 3});
  assert.match(level3, /<h3 id="openapi-inbox-service-title">inbox-service<\/h3>/);
  assert.match(level3, /<h4 id="openapi-inbox-service-tag-messaging">messaging<\/h4>/);
  assert.match(level3, /<h5>Answer<\/h5>/);
  assert.doesNotMatch(level3, /<h[12][ >]/);
});

test('OpenApiReference merges path-level parameters, resolves component refs, guards cycles and shows untagged operations under Other', () => {
  const document = {
    openapi: '3.1.0',
    info: {title: 'Shapes', version: '2', description: 'Plain <script>alert(1)</script> text.\n\nSecond `paragraph`.'},
    servers: [{url: 'https://api.example.test/v2', description: 'Production'}],
    tags: [{name: 'trees', description: 'Recursive things.'}],
    components: {
      securitySchemes: {token: {type: 'http', scheme: 'bearer', bearerFormat: 'JWT'}},
      parameters: {Id: {name: 'id', in: 'path', required: true, description: 'The id.', schema: {type: 'string', pattern: '^[a-z]+$'}}},
      schemas: {
        Node: {type: 'object', required: ['name'], properties: {name: {type: 'string', minLength: 1, examples: ['root']}, children: {type: 'array', items: {$ref: '#/components/schemas/Node'}}, kind: {enum: ['leaf', 'branch'], default: 'leaf'}}, additionalProperties: false},
        Remote: {$ref: 'https://example.test/schemas/remote.json'},
      },
    },
    paths: {
      '/trees/{id}': {
        parameters: [{$ref: '#/components/parameters/Id'}, {name: 'verbose', in: 'query', schema: {type: 'boolean'}}],
        get: {tags: ['trees'], summary: 'Get a tree', security: [{token: []}], parameters: [{name: 'verbose', in: 'query', description: 'Operation wins.', schema: {type: 'boolean'}}],
          responses: {'200': {description: 'The tree.', headers: {'X-Rate': {description: 'Calls left.', schema: {type: 'integer'}}}, content: {'application/json': {schema: {$ref: '#/components/schemas/Node'}, examples: {small: {summary: 'A leaf', value: {name: 'root'}}}}}}, '404': {description: 'None.'}}},
        delete: {summary: 'Remove a tree', responses: {'204': {description: 'Gone.'}}},
      },
      '/ping': {get: {summary: 'Ping', 'x-internal': true, responses: {'500': {description: 'Down.'}}}},
    },
  };
  const markup = render(OpenApiReference, {document});
  assert.doesNotMatch(markup, /<script/);
  assert.match(markup, /Plain &lt;script&gt;alert\(1\)&lt;\/script&gt; text\.<\/p><p>Second <code>paragraph<\/code>\.<\/p>/, 'descriptions are text with paragraphs and code');
  assert.match(markup, /<h3 id="openapi-shapes-tag-trees">trees<\/h3>[\s\S]*<h3 id="openapi-shapes-tag-other">Other<\/h3>/, 'untagged operations come last, under Other');
  assert.equal(count(markup, '<tr><td><code>id</code></td><td>path</td>'), 2, 'the path-level parameter reaches both operations');
  assert.match(markup, /Operation wins\./);
  assert.equal(count(markup, '<code>verbose</code>'), 2);
  assert.match(markup, /Pattern <code>\^\[a-z\]\+\$<\/code>/);
  assert.match(markup, /<code>X-Rate<\/code>/, 'response headers are listed');
  assert.match(markup, /Example: <span>A leaf<\/span>[\s\S]*\{\n  &quot;name&quot;: &quot;root&quot;\n\}/);
  assert.match(markup, /b10x-api-method--delete">DELETE</);
  assert.match(markup, /b10x-api-status--5xx">500</);
  assert.match(markup, /<code>https:\/<wbr\/>\/<wbr\/>api.<wbr\/>example.<wbr\/>test\/<wbr\/>v2<\/code>/, 'servers are listed');
  assert.match(markup, /<td><code>token<\/code><\/td><td>http<\/td><td><span><code>bearer<\/code> \(JWT\)<\/span><\/td>/, 'security schemes are listed read-only');
  assert.match(markup, /Security: <span class="b10x-api-requirement__item"><span><code>token<\/code><\/span><\/span>/);
  assert.doesNotMatch(markup, /<input[^>]*type="password"|<button/, 'no credential input and no request button');
  assert.match(markup, /Recursive: <code>Node<\/code> again/, 'a cycle stops with a link to the card');
  assert.match(markup, /Length ≥ <code>1<\/code>[\s\S]*Example <code>root<\/code>/);
  assert.match(markup, /One of <code>leaf<\/code> <code>branch<\/code><\/li><li>Default <code>leaf<\/code>/);
  assert.match(markup, /No other properties\./);
  assert.match(markup, /b10x-schema-ref--external" title="External reference, not fetched"><code>https:/, 'an external $ref stays text');
  assert.throws(() => render(OpenApiReference, {document: {...document, openapi: '3.0.3'}}), /OpenApiReference supports OpenAPI 3\.1, received 3\.0\.3/);
  assert.match(render(JsonSchemaViewer, {schema: {$ref: '#/components/schemas/Node'}}), /<a href="#schema-Node"><code>Node<\/code><\/a>/, 'the viewer alone keeps its card links');
});

test('AsyncApiReference renders the inbox events: operations, channels, messages and payload schemas', () => {
  const markup = render(AsyncApiReference, {document: asyncapi, sourceUrl: '/site/reference/events.yaml'});
  assert.match(markup, /^<section class="b10x-asyncapi b10x-api"/);
  assert.match(markup, /<p class="b10x-eyebrow">ASYNCAPI 3\.0\.0<\/p><h2 id="asyncapi-inbox-service-title">inbox-service<\/h2>/);
  assert.equal(count(markup, '<details class="b10x-api-operation"'), Object.keys(asyncapi.operations).length);
  assert.equal(count(markup, '<details class="b10x-schema-card" id="channel-'), Object.keys(asyncapi.channels).length);
  assert.equal(count(markup, '<details class="b10x-schema-card" id="message-'), Object.keys(asyncapi.components.messages).length);
  assert.equal(count(markup, '<details class="b10x-schema-card" id="schema-'), Object.keys(asyncapi.components.schemas).length);
  assert.match(markup, /<span class="b10x-api-chip b10x-api-action b10x-api-action--send">send<\/span>/);
  assert.match(markup, /<h4>Publish MessagePosted<\/h4>/);
  assert.match(markup, /<a href="#channel-inbox.messaging.MessagePosted"><code>/, 'an operation links its channel');
  assert.match(markup, /<a href="#message-inbox.messaging.MessagePosted"><code>/, 'a channel message links the component message card');
  assert.match(markup, /<a href="#schema-event.inbox.messaging.MessagePosted"><code>/, 'a payload $ref links its schema card');
  assert.match(markup, /href="\/site\/reference\/events.yaml" download="">Download AsyncAPI source/);
  assert.doesNotMatch(markup, /x-ess-event|qualified-name/);
  assert.match(render(AsyncApiReference, {document: asyncapi, headingLevel: 3}), /<h3 id="asyncapi-inbox-service-title">[\s\S]*<h4 id="asyncapi-inbox-service-operations">Operations<\/h4>[\s\S]*<h5>Publish/);
  assert.throws(() => render(AsyncApiReference, {document: {...asyncapi, asyncapi: '2.6.0'}}), /AsyncApiReference supports AsyncAPI 3\.0, received 2\.6\.0/);
});

test('CliReference renders the inbox command line: index by first word, synopsis, arguments, globals, environment and exit statuses', async () => {
  assert.deepEqual(await cliSchema().then((check) => check(cli)), [], 'the example satisfies the JSON Schema');
  const document = parseCliReference(cli);
  const post = document.commands.find((command) => command.path.join(' ') === 'post');
  assert.match(cliSynopsis(document, post), /^inbox post --to <TO> \[--kind <KIND>\] \(--body <BODY> \| --body-file <BODY_FILE>\) \[--thread <THREAD>\] .* \[--option <OPTIONS>\.\.\.\] .* \[--outbox <OUTBOX>\]$/);
  assert.equal(cliSynopsis(document, document.commands.find((command) => command.path.join(' ') === 'read')), 'inbox read [--url <URL>] [--secret-key-file <SECRET_KEY_FILE>] [--outbox <OUTBOX>] <MESSAGE_ID>');
  const markup = render(CliReference, {document: cli, sourceUrl: '/site/reference/cli.json', sourceName: 'inbox-cli.json'});
  assert.match(markup, /<p class="b10x-eyebrow">COMMAND LINE<\/p><h2 id="cli-inbox-title"><code>inbox<\/code><\/h2>/);
  assert.equal(count(markup, '<section class="b10x-cli-command"'), 9);
  assert.match(markup, /<li class="b10x-cli-index__group"><span><code>key<\/code><\/span><ul><li><a href="#command-key-new"><code>key new<\/code><\/a>/, 'commands are grouped by their first word');
  assert.match(markup, /<li><a href="#command-serve"><code>serve<\/code><\/a>/);
  assert.match(markup, /<h4 id="command-post-title"><code>inbox post<\/code><\/h4>/);
  assert.match(markup, /<pre class="b10x-cli-synopsis"><code><span class="b10x-cli-part"><span class="b10x-cli-atom">inbox post<\/span><\/span>/);
  assert.match(markup, /<th scope="col">Argument<\/th><th scope="col">Required or default<\/th><th scope="col">Environment<\/th><th scope="col">Description<\/th>/);
  assert.match(markup, /<code class="b10x-cli-flag">--adapter<\/code><span class="b10x-cli-value"><code>&lt;ADAPTER&gt;<\/code><\/span><\/td><td>default <code>terminal<\/code><\/td>/, 'the value sits under its flag');
  assert.match(markup, /<code class="b10x-cli-flag">--operator-public-key<\/code>[\s\S]*?<b class="b10x-schema-required">required<\/b><\/td><td><code>INBOX_OPERATOR_PUBLIC_KEY<\/code>/);
  assert.match(markup, /Needs <code>--principal<\/code>\./, 'requires names the flag');
  assert.match(markup, /One of <code>--body<\/code>, <code>--body-file<\/code> is required\./);
  assert.match(markup, /<h3 id="cli-inbox-globals">Global options<\/h3>[\s\S]*<code class="b10x-cli-flag">--json<\/code><span class="b10x-cli-value"><span class="b10x-schema-note">switch<\/span><\/span><\/td>/);
  assert.match(markup, /<td><code>INBOX_BACKEND<\/code><\/td><td>By <code>inbox serve<\/code><\/td>/);
  assert.match(markup, /<td><code>INBOX_URL<\/code><\/td><td>In place of <code>--url<\/code><\/td>/);
  assert.equal(count(markup, 'b10x-cli-exit-code b10x-cli-exit-code--'), 5);
  assert.match(markup, /href="\/site\/reference\/cli.json" download="inbox-cli.json">/);
  assert.match(render(CliReference, {document: cli, headingLevel: 3}), /<h3 id="cli-inbox-title">[\s\S]*<h4 id="cli-inbox-commands">Commands<\/h4>[\s\S]*<h5 id="command-serve-title">/);
});

test('parseCliReference refuses unknown formats and malformed documents and names the path', () => {
  const broken = (change) => { const copy = structuredClone(cli); change(copy); return () => parseCliReference(copy); };
  assert.throws(() => parseCliReference({...cli, format: 'b10x-cli-reference/2'}), /format must be b10x-cli-reference\/1, received "b10x-cli-reference\/2"/);
  assert.throws(() => parseCliReference([]), /the document must be an object/);
  assert.throws(broken((copy) => { copy.commands[4].arguments[1].kind = 'flag'; }), /commands\[4\]\.arguments\[1\]\.kind must be one of positional, option, switch, received "flag"/);
  assert.throws(broken((copy) => { copy.commands[0].arguments[0].long = undefined; }), /commands\[0\]\.arguments\[0\] is an option and needs a long or a short flag/);
  assert.throws(broken((copy) => { copy.commands[1].arguments[1].requires = ['nobody']; }), /commands\[1\]\.arguments\[1\]\.requires\[0\] names "nobody", which is not an argument of "key new"/);
  assert.throws(broken((copy) => { copy.commands.push({path: ['post']}); }), /commands\[9\]\.path repeats "post" of commands\[4\]/);
  assert.throws(broken((copy) => { copy.commands[3].arguments[1].long = 'adapter'; }), /commands\[3\]\.arguments uses --adapter for both adapter and url/);
  assert.throws(broken((copy) => { copy.exitStatuses[0].code = 300; }), /exitStatuses\[0\]\.code must be an integer from 0 to 255/);
  assert.throws(broken((copy) => { copy.commands[0].usage = 'x'; }), /commands\[0\]\.usage is not a member of commands\[0\]/);
  assert.throws(() => render(CliReference, {document: {format: CLI_REFERENCE_FORMAT, binary: 'x', commands: []}}), /b10x-cli-reference\/1: commands must be a non-empty array/);
  assert.throws(broken((copy) => { copy.commands[4].groups = [{name: 'none', arguments: []}]; }), /commands\[4\]\.groups\[0\]\.arguments must name at least one argument/);
});

test('a clap-shaped document with every member a generator writes, and a group of one, is accepted', async () => {
  const document = {
    format: CLI_REFERENCE_FORMAT, binary: 'tool', about: 'A tool.', description: 'Longer text.',
    globalOptions: [{name: 'verbose', kind: 'switch', long: 'verbose', short: 'v', repeatable: true, help: 'More output.'}],
    commands: [{path: ['run'], about: 'Run it.', arguments: [
      {name: 'target', kind: 'positional', valueName: 'TARGET', required: true, help: 'What to run.'},
      {name: 'jobs', kind: 'option', long: 'jobs', short: 'j', valueName: 'N', default: '4', env: 'TOOL_JOBS', help: 'Parallel jobs.'},
      {name: 'profile', kind: 'option', long: 'profile', valueName: 'NAME', repeatable: true},
    ], groups: [{name: 'how', arguments: ['profile'], required: true, multiple: false}]}],
    environment: [{name: 'TOOL_HOME', description: 'Where state lives.', commands: [['run']]}],
    exitStatuses: [{code: 0, meaning: 'Success.'}, {code: 2, meaning: 'Usage error.'}],
  };
  assert.deepEqual(await cliSchema().then((check) => check(document)), []);
  const parsed = parseCliReference(document);
  assert.equal(cliSynopsis(parsed, parsed.commands[0]), 'tool run [--jobs <N>] --profile <NAME>... <TARGET>', 'a required group of one makes its member required');
  const markup = render(CliReference, {document});
  assert.doesNotMatch(markup, /One of <code>--profile<\/code>/, 'a group of one carries no group note');
  assert.equal(count(markup, '<b class="b10x-schema-required">required</b>'), 2);
});

test('cliReferenceFromEssPlan turns an ess-cli-plan/2 into a valid b10x-cli-reference/1 document', async () => {
  const document = cliReferenceFromEssPlan(plan);
  assert.deepEqual(await cliSchema().then((check) => check(document)), []);
  assert.equal(document.binary, 'inbox');
  assert.equal(document.about, plan.about);
  assert.deepEqual(document.commands.map((command) => command.path.join(' ')), ['close', 'open', 'pending', 'post', 'completions']);
  assert.deepEqual(document.globalOptions.map((option) => `--${option.long}`), ['--state-dir', '--output']);
  assert.deepEqual(document.globalOptions[1].values, ['human', 'json']);
  assert.deepEqual(document.exitStatuses.map((status) => status.code), [0, 1, 2, 130]);
  const post = document.commands[3];
  assert.deepEqual(post.groups, [{name: 'body', arguments: ['body_inline', 'body_file', 'body_stdin'], required: true, multiple: false}]);
  assert.deepEqual(post.arguments.find((argument) => argument.name === 'kind'), {name: 'kind', kind: 'option', long: 'kind', valueName: 'KIND', required: true, values: ['note', 'request', 'decision']});
  assert.equal(post.arguments.find((argument) => argument.name === 'thread').required, undefined, 'an optional field is an optional flag');
  assert.match(cliSynopsis(document, post), /^inbox post --to <TO> --kind <KIND> \(--body <BODY> \| --body-file <PATH> \| --body-stdin\) \[--thread <THREAD>\]/);
  const extended = structuredClone(plan);
  extended.globals.config = 'config';
  extended.callables.post.input.shape.fields.secret = {kind: 'string'};
  extended.callables.post.input.shape.fields.rest = {kind: 'list', of: {kind: 'string'}};
  extended.callables.post.input.shape.fields.first = {kind: 'string'};
  extended.commands[3].arguments.push({field: 'secret', source: {kind: 'protected', file: 'secret-file', stdin: 'secret-stdin', hidden_tty: 'secret-tty'}}, {field: 'first', source: {kind: 'positional', index: 1}}, {field: 'rest', source: {kind: 'trailing'}});
  const more = cliReferenceFromEssPlan(extended);
  assert.equal(more.globalOptions[0].long, 'config');
  assert.match(cliSynopsis(more, more.commands[3]), /\(--secret-file <PATH> \| --secret-stdin \| --secret-tty\) <FIRST> -- <REST>\.\.\.$/);
  assert.throws(() => cliReferenceFromEssPlan({...plan, format: 'ess-cli-plan/1'}), /format must be ess-cli-plan\/2, received "ess-cli-plan\/1"/);
  const unknown = structuredClone(plan);
  unknown.commands[0].arguments[0].source = {kind: 'env', name: 'X'};
  assert.throws(() => cliReferenceFromEssPlan(unknown), /commands\[0\]\.arguments\[0\]\.source\.kind "env" is not one of/);
  assert.match(render(CliReference, {document}), /<code>inbox completions<\/code>/);
});

test('ApiReference dispatches on kind and refuses an unknown kind', () => {
  assert.match(render(ApiReference, {reference: {id: 'http', kind: 'openapi', document: openapi}}), /^<section class="b10x-openapi/);
  assert.match(render(ApiReference, {reference: {id: 'events', kind: 'asyncapi', document: asyncapi}}), /^<section class="b10x-asyncapi/);
  assert.match(render(ApiReference, {reference: {id: 'cli', kind: 'cli', title: 'The inbox CLI', document: cli, sourceUrl: '/r/cli.json', sourceName: 'inbox-cli.json'}}), /<h2 id="cli-inbox-title">The inbox CLI<\/h2>[\s\S]*download="inbox-cli.json"/);
  assert.throws(() => render(ApiReference, {reference: {id: 'x', kind: 'graphql', document: {}}}), /ApiReference "x": kind must be one of openapi, asyncapi, cli, received "graphql"/);
});

async function scratchSite(files) {
  const base = path.join(root, '.cache');
  await fs.mkdir(base, {recursive: true});
  const siteDir = await fs.mkdtemp(path.join(base, 'references-'));
  for (const [name, content] of Object.entries(files)) {
    await fs.mkdir(path.dirname(path.join(siteDir, name)), {recursive: true});
    await fs.writeFile(path.join(siteDir, name), content);
  }
  return siteDir;
}

test('the references option reads, checks, publishes and serves each source', async () => {
  const openapiText = '# a comment the download keeps\nopenapi: 3.1.0\ninfo: {title: Tiny, version: "1"}\npaths: {}\n';
  const siteDir = await scratchSite({'api/tiny.yaml': openapiText, 'api/events.json': JSON.stringify({asyncapi: '3.0.0', info: {title: 'Tiny events', version: '1'}}), 'cli.json': JSON.stringify(cli)});
  try {
    const references = [{id: 'http', kind: 'openapi', source: './api/tiny.yaml'}, {id: 'events', kind: 'asyncapi', source: 'api/events.json', title: 'Events'}, {id: 'cli', kind: 'cli', source: 'cli.json'}];
    const plugin = productSitePlugin({siteDir, baseUrl: '/site/', generatedFilesDir: path.join(siteDir, '.docusaurus')}, {references});
    assert.deepEqual(plugin.getPathsToWatch().sort(), ['api/events.json', 'api/tiny.yaml', 'cli.json'].map((name) => path.join(siteDir, name)).sort(), 'sources are watched in dev');
    const modules = new Map();
    const createData = async (name, content) => {
      const file = path.join(siteDir, '.docusaurus', 'b10x-product-site', 'default', name);
      await fs.mkdir(path.dirname(file), {recursive: true});
      await fs.writeFile(file, content);
      modules.set(name, name.endsWith('.json') ? JSON.parse(content) : content);
      return file;
    };
    await plugin.contentLoaded({content: null, actions: {createData, addRoute: () => assert.fail('no route for references'), setGlobalData: () => {}}});
    assert.deepEqual([...modules.keys()], ['http', 'events', 'cli'].flatMap((id) => [`reference/${id}.data.json`, `reference/${id}.js`]));
    assert.deepEqual(modules.get('reference/http.data.json'), {id: 'http', kind: 'openapi', title: 'Tiny', document: {openapi: '3.1.0', info: {title: 'Tiny', version: '1'}, paths: {}}, sourceUrl: '/site/reference/http.yaml', sourceName: 'tiny.yaml'});
    assert.equal(modules.get('reference/events.data.json').title, 'Events');
    assert.equal(modules.get('reference/cli.data.json').sourceUrl, '/site/reference/cli.json');
    assert.equal(modules.get('reference/cli.js'), `import reference from "./cli.data.json";\nimport {withReferenceRenderers} from ${JSON.stringify(path.join(root, 'dist/reference-preload.js'))};\n\nexport default withReferenceRenderers(reference);\n`, 'the data module brings the renderers into the page that imports it');
    const served = path.join(siteDir, PRODUCT_REFERENCE_STATIC, 'reference');
    assert.deepEqual((await fs.readdir(served)).sort(), ['cli.json', 'events.json', 'http.yaml']);
    assert.equal(await fs.readFile(path.join(served, 'http.yaml'), 'utf8'), openapiText, 'the download is the unchanged source');
    const mdxRule = {module: {rules: [{test: path.join(root, 'dist/theme/MDXComponents.js'), type: 'javascript/auto'}]}};
    const generatedReference = (id) => path.join(siteDir, '.docusaurus', 'b10x-product-site', 'default', 'reference', `${id}.js`);
    assert.deepEqual(plugin.configureWebpack(), {...mdxRule, resolve: {alias: {[`${PRODUCT_REFERENCE_ALIAS}/http.json$`]: generatedReference('http'), [`${PRODUCT_REFERENCE_ALIAS}/events.json$`]: generatedReference('events'), [`${PRODUCT_REFERENCE_ALIAS}/cli.json$`]: generatedReference('cli')}}});
    assert.deepEqual(productSitePlugin({siteDir, baseUrl: '/'}, {}).configureWebpack(), mdxRule, 'no alias without references');
    const config = withProductSite({title: 'Tiny', staticDirectories: ['static']}, {references});
    assert.deepEqual(config.staticDirectories.filter((directory) => !path.isAbsolute(directory)), ['static', PRODUCT_REFERENCE_STATIC]);
    assert.equal(withProductSite({title: 'Tiny'}).staticDirectories.includes(PRODUCT_REFERENCE_STATIC), false);
    const fewer = productSitePlugin({siteDir, baseUrl: '/site/'}, {references: references.slice(0, 1)});
    await fewer.contentLoaded({content: null, actions: {createData, addRoute: () => {}, setGlobalData: () => {}}});
    assert.deepEqual(await fs.readdir(served), ['http.yaml'], 'a removed reference stops being served');
  } finally {
    await fs.rm(siteDir, {recursive: true, force: true});
  }
});

test('the references option fails the build naming the id and the file', async () => {
  const siteDir = await scratchSite({'events.yaml': 'asyncapi: 3.0.0\ninfo: {title: E, version: "1"}\n', 'old.yaml': 'openapi: 3.0.3\ninfo: {title: Old, version: "1"}\n', 'broken.json': '{"format": "b10x-cli-reference/1", "binary": "x", "commands": [{"path": []}]}', 'bad.yaml': 'openapi: [1\n'});
  try {
    const load = (reference) => readReference(reference, siteDir, '/');
    await assert.rejects(load({id: 'gone', kind: 'openapi', source: 'missing.yaml'}), new RegExp(`product-site reference "gone" \\(${path.join(siteDir, 'missing.yaml').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\): cannot read the source: ENOENT`));
    await assert.rejects(load({id: 'http', kind: 'openapi', source: 'events.yaml'}), /product-site reference "http" \(.*events\.yaml\): kind openapi needs an OpenAPI 3\.1 document, this one declares asyncapi: 3\.0\.0/);
    await assert.rejects(load({id: 'http', kind: 'openapi', source: 'old.yaml'}), /reference "http" \(.*old\.yaml\): kind openapi needs an OpenAPI 3\.1 document, this one declares openapi: 3\.0\.3/);
    await assert.rejects(load({id: 'events', kind: 'asyncapi', source: 'old.yaml'}), /reference "events" \(.*old\.yaml\): kind asyncapi needs an AsyncAPI 3\.0 document/);
    await assert.rejects(load({id: 'cli', kind: 'cli', source: 'broken.json'}), /reference "cli" \(.*broken\.json\): b10x-cli-reference\/1: commands\[0\]\.path must be a non-empty array/);
    await assert.rejects(load({id: 'bad', kind: 'openapi', source: 'bad.yaml'}), /reference "bad" \(.*bad\.yaml\): not valid YAML/);
    assert.throws(() => checkReferenceOptions([{id: 'x', kind: 'graphql', source: 'x.json'}]), /product-site reference "x": kind must be one of openapi, asyncapi, cli, received "graphql"/);
    assert.throws(() => checkReferenceOptions([{id: 'Bad Id', kind: 'cli', source: 'x.json'}]), /references\[0\]\.id must be lower-case letters, digits and hyphens/);
    assert.throws(() => checkReferenceOptions([{id: 'x', kind: 'cli', source: 'x.json'}, {id: 'x', kind: 'cli', source: 'y.json'}]), /references\[1\]\.id repeats "x"/);
    assert.throws(() => checkReferenceOptions([{id: 'x', kind: 'cli', source: 'x.txt'}]), /reference "x": source x\.txt must end in \.json, \.yaml, \.yml/);
    assert.throws(() => withProductSite({title: 'T'}, {references: [{id: 'x', kind: 'rest', source: 'x.json'}]}), /kind must be one of openapi, asyncapi, cli/);
    const plugin = productSitePlugin({siteDir, baseUrl: '/'}, {references: [{id: 'gone', kind: 'cli', source: 'missing.json'}]});
    await assert.rejects(plugin.contentLoaded({content: null, actions: {createData: async () => '', addRoute: () => {}, setGlobalData: () => {}}}), /product-site reference "gone" \(.*missing\.json\): cannot read the source/);
  } finally {
    await fs.rm(siteDir, {recursive: true, force: true});
  }
});
