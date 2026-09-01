import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {register} from 'node:module';
import test from 'node:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {deriveEcosystemNavigation} from '../dist/navigation.js';
import {OpenApiReference} from '../dist/renderers.js';

register('./theme-loader.mjs', import.meta.url);
const {DependencyGraph, Diagram, EcosystemFamilyGateway} = await import('../dist/components.js');

test('OpenApiReference embeds as a section with configurable coherent headings', () => {
  const document = {
    openapi: '3.1.1',
    info: {title: 'Example API', version: '1.4.0', description: 'A small example.'},
    paths: {'/widgets': {get: {operationId: 'listWidgets', summary: 'List widgets', responses: {'200': {description: 'Widgets'}}}}},
    components: {schemas: {Widget: {type: 'object', properties: {id: {type: 'string'}}}}},
  };
  const markup = renderToStaticMarkup(createElement(OpenApiReference, {document, headingLevel: 3}));
  assert.match(markup, /^<section class="b10x-openapi"/);
  assert.doesNotMatch(markup, /<(?:main|h1)(?:\s|>)/);
  assert.match(markup, /<h3 id="openapi-example-api-title">Example API<\/h3>/);
  assert.match(markup, /<h4>List widgets<\/h4>/);
  assert.match(markup, /<h4 id="openapi-example-api-schemas">Schemas<\/h4>/);
  assert.match(markup, /<th scope="col">Status<\/th>/);

  const defaultMarkup = renderToStaticMarkup(createElement(OpenApiReference, {document}));
  assert.match(defaultMarkup, /<h2 id="openapi-example-api-title">Example API<\/h2>/);
  assert.match(defaultMarkup, /<h3>List widgets<\/h3>/);
});

test('DependencyGraph keeps one full-size keyboard viewport and a complete edge-list alternative', () => {
  const markup = renderToStaticMarkup(createElement(DependencyGraph, {
    nodes: [{id: 'atlas', label: 'Atlas'}, {id: 'website', label: 'Website'}],
    edges: [{from: 'atlas', to: 'website', label: 'publishes registry'}],
    title: 'Delivery architecture',
    description: 'Atlas supplies Website.',
    minWidth: '112rem',
  }));
  assert.match(markup, /class="b10x-diagram__viewport"[^>]*style="--b10x-diagram-min-width:112rem"[^>]*tabindex="0"[^>]*role="region"/);
  assert.match(markup, /Scrollable diagram\. Focus this region and use the arrow keys/);
  assert.match(markup, /<summary>Diagram as text<\/summary>/);
  assert.match(markup, /<strong>Atlas<\/strong> <code>atlas<\/code>/);
  assert.match(markup, /<strong>Atlas<\/strong> to <strong>Website<\/strong>: publishes registry/);
  assert.match(markup, /aria-details="[^"]+-alternative"/);
  assert.match(markup, /data-source="flowchart LR/);
});

test('Diagram validates a caller-supplied edge alternative', () => {
  assert.throws(() => renderToStaticMarkup(createElement(Diagram, {
    kind: 'svg',
    src: '/architecture.svg',
    title: 'Architecture',
    description: 'Architecture diagram.',
    alternative: {nodes: [{id: 'known', label: 'Known'}], edges: [{from: 'known', to: 'missing'}]},
  })), /references an unknown node/);
  assert.throws(() => renderToStaticMarkup(createElement(DependencyGraph, {
    nodes: [{id: 'duplicate', label: 'First'}, {id: 'duplicate', label: 'Second'}],
    edges: [],
  })), /duplicate node duplicate/);
});

test('ecosystem families derive only from navigation metadata and honor caller order', () => {
  const surfaces = [
    surface('website/docs', 'Start', 'front-door'),
    surface('product/z', 'Zulu', 'documentation', {group: 'Products', order: 20}),
    surface('build/b', 'Beta', 'documentation', {group: 'Build', order: 20}),
    surface('service/s', 'Service', 'service-docs', {group: 'Services', order: 10}),
    surface('foundation/f', 'Foundation', 'documentation', {group: 'Foundation', order: 10}),
    surface('build/a', 'Alpha', 'documentation', {group: 'Build', order: 10, label: 'A labelled project'}),
    surface('legacy/docs', 'Legacy', 'documentation'),
  ];
  const order = ['Foundation', 'Build', 'Services', 'Products'];
  const navigation = deriveEcosystemNavigation(surfaces, {familyOrder: order});
  assert.deepEqual(navigation.frontDoors.map((surface) => surface.key), ['website/docs']);
  assert.deepEqual(navigation.families.map((family) => family.name), order);
  assert.deepEqual(navigation.families[1].surfaces.map((surface) => surface.key), ['build/a', 'build/b']);
  assert.deepEqual(navigation.ungrouped.map((surface) => surface.key), ['legacy/docs']);

  const registry = {schema: 'b10x-docs-registry/v2', surfaces};
  const markup = renderToStaticMarkup(createElement(EcosystemFamilyGateway, {registry, familyOrder: order, current: 'build/a'}));
  assert.equal((markup.match(/class="b10x-family-card"/g) ?? []).length, 4);
  assert.ok(markup.indexOf('Start') < markup.indexOf('Foundation'));
  assert.ok(markup.indexOf('Foundation') < markup.indexOf('Build'));
  assert.ok(markup.indexOf('A labelled project') < markup.indexOf('Beta'));
  assert.match(markup, /aria-current="page" href="https:\/\/example\.test\/build\/a\/"/);
  assert.doesNotMatch(markup, />Legacy</);

  const surfacesMarkup = renderToStaticMarkup(createElement(EcosystemFamilyGateway, {surfaces, familyOrder: order}));
  assert.equal((surfacesMarkup.match(/class="b10x-family-card"/g) ?? []).length, 4);
});

test('semantic color pairs meet WCAG text and component contrast thresholds', async () => {
  const css = await fs.readFile(new URL('../styles/tokens.css', import.meta.url), 'utf8');
  const light = variables(css.match(/:root,\n\[data-theme='light'\] \{([\s\S]*?)\n\}/)?.[1]);
  const dark = variables(css.match(/\[data-theme='dark'\] \{([\s\S]*?)\n\}/)?.[1]);
  for (const palette of [light, dark]) {
    for (const foreground of ['heading', 'text', 'muted', 'link', 'focus', 'success', 'warning', 'danger']) {
      assert.ok(contrast(palette[`color-${foreground}`], palette['color-canvas']) >= 4.5, `${foreground} on canvas must reach 4.5:1`);
      assert.ok(contrast(palette[`color-${foreground}`], palette['color-surface']) >= 4.5, `${foreground} on surface must reach 4.5:1`);
    }
    assert.ok(contrast(palette['color-line'], palette['color-canvas']) >= 3, 'line on canvas must reach 3:1');
    assert.ok(contrast(palette['color-line'], palette['color-surface']) >= 3, 'line on surface must reach 3:1');
  }
  assert.ok(contrast(light['footer-text'], light['footer-background']) >= 4.5);
  assert.ok(contrast(light['footer-accent'], light['footer-background']) >= 4.5);
  assert.match(css, /--b10x-touch-target:\s*2\.75rem/);
  assert.match(css, /max-block-size:\s*min\(70vh, 44rem\)/);
  assert.match(css, /\.b10x-diagram__canvas \{[\s\S]*?inline-size:\s*max\(100%, var\(--b10x-diagram-min-width/);
  assert.match(css, /\.b10x-project-card h2,\n\.b10x-project-card h3/);
});

test('v3 passive component vocabulary includes the family gateway', async () => {
  const schema = JSON.parse(await fs.readFile(new URL('../schema/b10x.docs.v3.schema.json', import.meta.url), 'utf8'));
  assert.ok(schema.$defs.source.properties.components.items.enum.includes('EcosystemFamilyGateway'));
  assert.ok(schema.$defs.source.properties.components.items.enum.includes('EcosystemSwitcher'));
});

function surface(key, name, kind, navigation) {
  const [repositoryId, id] = key.split('/');
  return {
    key,
    repository: {id: repositoryId, url: `https://github.com/beyond10x/${repositoryId}`, displayName: name},
    id,
    name,
    summary: `${name} summary.`,
    kind,
    canonicalUrl: `https://example.test/${key}/`,
    maturity: 'stable',
    availability: 'published',
    discoverability: 'public',
    audiences: ['developer'],
    primaryJourney: 'build-agents',
    journeys: ['build-agents'],
    capabilities: [],
    sections: [],
    adoption: {label: `Open ${name}`, url: `https://example.test/${key}/`, mode: 'browser', estimatedMinutes: 1, outcome: `Read ${name}.`},
    routeBase: `/${key}/`,
    source: {root: '.', ...(navigation ? {navigation: {...navigation, sidebar: 'flat'}} : {})},
  };
}

function variables(block) {
  assert.ok(block, 'palette block must exist');
  return Object.fromEntries([...block.matchAll(/--b10x-([\w-]+):\s*(#[\da-fA-F]{6});/g)].map((match) => [match[1], match[2]]));
}

function contrast(left, right) {
  assert.ok(left && right, `contrast colors must exist: ${left}, ${right}`);
  const [lighter, darker] = [luminance(left), luminance(right)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(hex) {
  const channels = hex.match(/[\da-f]{2}/gi).map((channel) => Number.parseInt(channel, 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
