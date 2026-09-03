import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {register} from 'node:module';
import test from 'node:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {deriveEcosystemNavigation} from '../dist/navigation.js';
import {OpenApiReference} from '../dist/renderers.js';
import {
  describeMarkdownFenceLanguage,
  normalizeMarkdownFenceLanguage,
  PRISM_ADDITIONAL_LANGUAGES,
  PRISM_LANGUAGES,
  PRISM_LANGUAGE_PRESENTATIONS,
} from '../dist/code.js';

register('./theme-loader.mjs', import.meta.url);
const {
  AdoptionCard,
  BoundaryNotice,
  Callout,
  CardGrid,
  CodeExample,
  CommandExample,
  ContentCard,
  DependencyGraph,
  Diagram,
  EcosystemFamilyGateway,
  FactGrid,
  FilterChipGroup,
  PageHeader,
  ProjectCard,
  SearchField,
  SectionHeader,
} = await import('../dist/components.js');

test('shared page, section, fact, callout, search, filter, and card primitives render semantic contracts', () => {
  const markup = renderToStaticMarkup(createElement('main', null,
    createElement(PageHeader, {
      eyebrow: 'Foundation',
      title: 'Build with beyond10x',
      description: createElement('p', null, 'Choose a path.'),
      actions: createElement('a', {href: '/docs/'}, 'Explore'),
    }, createElement('span', null, 'Public ecosystem')),
    createElement(SectionHeader, {eyebrow: 'Adopt', title: 'Choose a journey', description: 'Start with an outcome.', action: createElement('a', {href: '/journeys/'}, 'All journeys'), headingLevel: 3, id: 'journeys'}),
    createElement(FactGrid, {items: [{label: 'Projects', value: '19'}, {label: 'Status', value: 'Public', detail: 'Verified from Atlas', url: '/status/'}]}),
    createElement(Callout, {tone: 'success', title: 'Verified'}, createElement('p', null, 'All gates pass.')),
    createElement(BoundaryNotice, null, createElement('p', null, 'Preview only.')),
    createElement(SearchField, {name: 'query', placeholder: 'Search the ecosystem', hint: 'Try “agents”.'}),
    createElement(FilterChipGroup, {label: 'Families', selected: ['build'], options: [{value: 'foundation', label: 'Foundation', count: 4}, {value: 'build', label: 'Build', count: 7}]}),
    createElement(CardGrid, {columns: 2, label: 'Journeys'},
      createElement(ContentCard, {eyebrow: 'Journey', title: 'Build agents', titleUrl: '/journeys/build-agents/', description: 'Compose reliable agents.', actionUrl: '/journeys/build-agents/', actionLabel: 'Start building'}),
    ),
  ));
  assert.match(markup, /<header class="b10x-page-header">[\s\S]*?<h1>Build with beyond10x<\/h1>/);
  assert.match(markup, /<h3 id="journeys">Choose a journey<\/h3>/);
  assert.match(markup, /<dl class="b10x-fact-grid" aria-label="Key facts">/);
  assert.match(markup, /class="b10x-callout b10x-callout--success"/);
  assert.match(markup, /class="b10x-callout b10x-callout--warning b10x-boundary"/);
  assert.match(markup, /<label for="b10x-search-/);
  assert.match(markup, /type="search"/);
  assert.match(markup, /aria-describedby="b10x-search-[^"]+-hint"/);
  assert.match(markup, /<fieldset class="b10x-filter-chips"><legend>Families<\/legend>/);
  assert.match(markup, /aria-pressed="true"[^>]*><span>Build<\/span><small>7<\/small>/);
  assert.match(markup, /class="b10x-card-grid b10x-card-grid--2" aria-label="Journeys"/);
  assert.match(markup, /class="b10x-content-card"/);
  assert.match(markup, /<h3><a href="\/journeys\/build-agents\/">Build agents<\/a><\/h3>/);
  assert.match(markup, />Start building <span aria-hidden="true">→<\/span><\/a>/);
});

test('project and adoption cards preserve defaults and accept heading, title, and action overrides', () => {
  const project = surface('build/harness', 'Harness', 'documentation', {group: 'Build', order: 10});
  const defaults = renderToStaticMarkup(createElement(ProjectCard, {surface: project}));
  assert.match(defaults, /<h3><a href="https:\/\/example\.test\/build\/harness\/">Harness<\/a><\/h3>/);
  assert.match(defaults, /href="https:\/\/example\.test\/build\/harness\/">Open Harness/);

  const projectOverride = renderToStaticMarkup(createElement(ProjectCard, {
    surface: project,
    headingLevel: 2,
    title: 'Agent Harness',
    titleUrl: '/ecosystem/harness/',
    actionUrl: '/journeys/build-agents/',
    actionLabel: 'Build an agent',
  }));
  assert.match(projectOverride, /<h2><a href="\/ecosystem\/harness\/">Agent Harness<\/a><\/h2>/);
  assert.match(projectOverride, /href="\/journeys\/build-agents\/">Build an agent/);

  const adoptionDefault = renderToStaticMarkup(createElement(AdoptionCard, {surface: project}));
  assert.match(adoptionDefault, /<h3>Harness<\/h3>/);
  const adoptionOverride = renderToStaticMarkup(createElement(AdoptionCard, {
    surface: project,
    headingLevel: 4,
    title: 'Compose an agent',
    titleUrl: '/ecosystem/harness/',
    actionUrl: '/docs/harness/quickstart/',
    actionLabel: 'Open quickstart',
  }));
  assert.match(adoptionOverride, /<h4><a href="\/ecosystem\/harness\/">Compose an agent<\/a><\/h4>/);
  assert.match(adoptionOverride, /href="\/docs\/harness\/quickstart\/">Open quickstart/);
});

test('canonical Prism languages normalize Markdown aliases without discarding extensions', () => {
  assert.equal(new Set(PRISM_LANGUAGES).size, PRISM_LANGUAGES.length, 'canonical Prism languages must be unique');
  assert.ok(PRISM_ADDITIONAL_LANGUAGES.every((language) => PRISM_LANGUAGES.includes(language)), 'every loaded grammar must be canonical');
  assert.deepEqual(Object.keys(PRISM_LANGUAGE_PRESENTATIONS).sort(), [...PRISM_LANGUAGES].sort(), 'every canonical grammar needs presentation metadata');
  for (const language of ['toml', 'http', 'shell-session', 'rust', 'go', 'python', 'c', 'cpp', 'bash']) {
    assert.ok(PRISM_ADDITIONAL_LANGUAGES.includes(language), `${language} must be loaded by Docusaurus`);
    assert.ok(PRISM_LANGUAGES.includes(language), `${language} must be accepted in shared examples`);
    assert.equal(normalizeMarkdownFenceLanguage(language), language);
  }
  assert.equal(normalizeMarkdownFenceLanguage('console'), 'shell-session');
  assert.equal(normalizeMarkdownFenceLanguage('sh'), 'bash');
  assert.equal(normalizeMarkdownFenceLanguage('YML'), 'yaml');
  assert.equal(normalizeMarkdownFenceLanguage('language-rs'), 'rust');
  assert.equal(normalizeMarkdownFenceLanguage(), 'text');
  assert.equal(normalizeMarkdownFenceLanguage('project-dsl'), 'project-dsl');
  assert.deepEqual(describeMarkdownFenceLanguage('language-sh'), {language: 'bash', label: 'Bash', kind: 'command', canonical: true});
  assert.deepEqual(describeMarkdownFenceLanguage('console'), {language: 'shell-session', label: 'Terminal', kind: 'transcript', canonical: true});
  assert.deepEqual(describeMarkdownFenceLanguage(), {language: 'text', label: 'Plain text', kind: 'output', canonical: true});
  assert.deepEqual(describeMarkdownFenceLanguage('project-dsl'), {language: 'project-dsl', label: 'project-dsl', kind: 'source', canonical: false});

  const code = renderToStaticMarkup(createElement(CodeExample, {language: 'sh'}, 'cargo test'));
  const transcript = renderToStaticMarkup(createElement(CommandExample, {command: 'cargo test', output: 'ok'}));
  assert.match(code, /class="b10x-code" data-b10x-code-language="bash" data-b10x-code-kind="command" data-b10x-code-label="Bash"/);
  assert.match(code, /data-language="bash"/);
  assert.match(transcript, /class="b10x-command" data-b10x-code-language="shell-session" data-b10x-code-kind="transcript" data-b10x-code-label="Terminal"/);
  assert.match(transcript, /data-language="shell-session"/);
  assert.match(transcript, /\$ cargo test\nok/);
});

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
  assert.match(markup, /class="b10x-diagram__guidance"/);
  assert.match(markup, /<strong>Pan the full-size diagram:<\/strong> swipe or scroll, or focus the canvas and use the arrow keys/);
  assert.doesNotMatch(markup, /b10x-sr-only[^>]*>Scrollable diagram/);
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
    assert.ok(contrast(palette['code-control-text'], palette['code-control']) >= 4.5, 'code controls must reach 4.5:1');
    assert.ok(contrast(palette['color-muted'], palette['code-chrome']) >= 4.5, 'code labels must reach 4.5:1');
  }
  assert.ok(contrast(light['footer-text'], light['footer-background']) >= 4.5);
  assert.ok(contrast(light['footer-accent'], light['footer-background']) >= 4.5);
  assert.match(css, /--b10x-touch-target:\s*2\.75rem/);
  assert.equal((css.match(/\{/g) ?? []).length, (css.match(/\}/g) ?? []).length, 'shared CSS blocks must be balanced');
  assert.match(css, /max-block-size:\s*min\(70vh, 44rem\)/);
  assert.match(css, /\.b10x-diagram__canvas \{[\s\S]*?inline-size:\s*max\(100%, var\(--b10x-diagram-min-width/);
  assert.match(css, /\.b10x-project-card :is\(h2, h3, h4\)/);
  assert.match(css, /\.b10x-page-header \{/);
  assert.match(css, /\.b10x-content-card \{/);
  assert.match(css, /\.b10x-filter-chips button\[aria-pressed='true'\]/);
  assert.match(css, /pre\[class\*='language-'\]/);
  for (const [language, presentation] of Object.entries(PRISM_LANGUAGE_PRESENTATIONS)) {
    assert.match(css, new RegExp(`\\.theme-code-block\\.language-${escapeRegExp(language)} \\{ --b10x-code-label: '${escapeRegExp(presentation.label)}'; \\}`), `${language} needs its canonical visible label`);
  }
  assert.match(css, /\.theme-code-block\[class\*='language-'\]::before \{[\s\S]*?content: var\(--b10x-code-label\);/);
  assert.match(css, /pre\[class\*='language-'\] \{[\s\S]*?overflow-x: auto;[\s\S]*?overscroll-behavior-inline: contain;[\s\S]*?touch-action: pan-x pan-y;/);
  assert.match(css, /\.theme-code-block pre:focus-visible \{ outline: 2px solid var\(--b10x-color-focus\); outline-offset: -2px; \}/);
  assert.match(css, /@media \(hover: none\), \(pointer: coarse\) \{[\s\S]*?min-inline-size: var\(--b10x-touch-target\);[\s\S]*?opacity: 0\.9;/);
  assert.match(css, /\.b10x-diagram__guidance \{/);
});

test('v3 passive component vocabulary includes the shared presentation primitives', async () => {
  const schema = JSON.parse(await fs.readFile(new URL('../schema/b10x.docs.v3.schema.json', import.meta.url), 'utf8'));
  const vocabulary = schema.$defs.source.properties.components.items.enum;
  for (const component of ['Callout', 'CardGrid', 'ContentCard', 'EcosystemFamilyGateway', 'EcosystemSwitcher', 'FactGrid', 'FilterChipGroup', 'PageHeader', 'SearchField', 'SectionHeader']) {
    assert.ok(vocabulary.includes(component), `${component} must be allowed by v3 source manifests`);
  }
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
