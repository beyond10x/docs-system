---
format: aep.planning-md/3
id: story:shared-syntax-palette-and-presets
kind: story
status: draft
title: One syntax palette for code and terminals, with language presets
summary: One palette owns every token, terminal, diff and highlighted-line colour at 4.5:1 in light and dark; language presets name fence, label, accent and grammar once.
owner: docs-system
tags:
- code
- presentation
relations:
- decomposes: epic:shared-terminal-and-code-views
scope:
- confidence: cited
  path: CHANGELOG.md
- confidence: cited
  path: README.md
- confidence: cited
  path: dist/code.js
- confidence: cited
  path: dist/index.js
- confidence: cited
  path: dist/prism-themes.js
- confidence: cited
  path: dist/product-site.js
- confidence: cited
  path: examples/product-site/docs/code.mdx
- confidence: cited
  path: src/code.ts
- confidence: cited
  path: src/index.ts
- confidence: cited
  path: src/prism-themes.ts
- confidence: cited
  path: src/product-site.ts
- confidence: cited
  path: styles/product-components.css
- confidence: cited
  path: styles/product-theme.css
- confidence: cited
  path: styles/tokens.css
- confidence: cited
  path: tests/presentation.test.mjs
- confidence: cited
  path: tests/product-site.browser.mjs
revision: 4
---
# One syntax palette for code and terminals, with language presets

## Outcome

One palette, defined once, holds every colour the terminal and code views draw: syntax tokens,
terminal output, tone and JSON colours, diff added/removed line backgrounds and gutter marks, and the
highlighted-line tone, in light and dark, each reading at 4.5:1 or better on the ground it is drawn
on. A small set of language presets names, for each language the ecosystem documents, its canonical
fence name, aliases, label, kind, accent and grammar, so every consumer loads and labels them the
same way. This story owns every colour (coordinator decision D1); the terminal and code-view stories
only consume the palette's custom properties.

## Builds on

- `src/prism-themes.ts:10-71`: the palette shape and both themes; the 4.5:1 claim in its header
  (`src/prism-themes.ts:1-5`) has no test of its own.
- `src/product-site.ts:344-349`: the only place the themes are wired; the generic shell leaves the
  theme to each consumer (`README.md:215-226` names only the grammar list).
- `styles/product-components.css:225-238`: terminal output, tone and JSON colours hard-coded as
  copies of the dark palette. This story rewires them to read the palette.
- `styles/product-theme.css:131` (`--docusaurus-highlighted-code-line-bg`) and
  `styles/product-theme.css:272` (the highlighted-line inset): the highlighted-line tone.
- `styles/tokens.css:347`: the `diff` accent; no added/removed line colours exist yet.
- `src/code.ts:9-41` (grammar lists), `src/code.ts:58-85` (labels and kinds), `src/code.ts:87-108`
  (aliases), `styles/tokens.css:318-349` (labels and accents duplicated in CSS).
- `tests/presentation.test.mjs:245`: the existing WCAG contrast helper.

## Acceptance

1. Given the palette, when `npm run gate` runs the palette contrast test, then every syntax token
   colour, every terminal output, tone and JSON colour, and both diff gutter-mark colours measure at
   least 4.5:1 against each ground they are drawn on (code ground, terminal ground, inserted-line,
   deleted-line and highlighted-line backgrounds) in light and in dark, and a failure names the
   colour, theme and ground.
2. Given the reference site with one fence per preset (`rust`, `toml`, `yaml`, `json`, `bash`,
   `shell-session`, `typescript`, `vue`, `diff`) in `examples/product-site/docs/code.mdx`, when
   `npm run test:browser` renders that page in light and in dark, then each fence shows at least two
   distinct computed token colours.
3. Given `src/` and `styles/`, when `npm run gate` runs the single-definition test, then each palette
   colour value occurs exactly once across those trees, and a second occurrence fails naming its
   file and line.

## Required observations

- The Prism themes, the `--b10x-syntax-*`, `--b10x-terminal-*`, `--b10x-diff-*` and highlighted-line
  custom properties are generated from the one palette or read it.
- `styles/product-components.css:225-238` reads the palette's custom properties instead of hex values.
- Presets: `rust`, `toml`, `yaml`, `json`, `bash` with `shell-session`, `typescript`, `vue`, `diff`.
  Each preset carries canonical name, aliases, label, kind, accent and grammar, and the existing
  `PRISM_LANGUAGES`, labels and CSS label rules derive from it rather than repeat it.
- `vue` gets a registered grammar (prismjs 1.30.0 ships none), never a silent fall back to plain text.
- `console` stays refused as ambiguous (`src/code.ts:142-143`).
- The generic shell exports the themes so a non-product Docusaurus consumer can load them in one
  line; README documents that line.
- Existing languages outside the presets keep working; nothing that passes `check-source` today fails.

## Scope

- `src/prism-themes.ts`, `src/code.ts`, `src/product-site.ts`, `src/index.ts`
- `styles/tokens.css`, `styles/product-theme.css`, `styles/product-components.css`
- `tests/presentation.test.mjs`, `tests/product-site.browser.mjs`
- `examples/product-site/docs/code.mdx` (one fence per preset)
- `dist/prism-themes.js`, `dist/code.js`, `dist/product-site.js`, `dist/index.js` (committed build)
- `README.md`, `CHANGELOG.md`

## Verification

Run `npm run gate` (statements 1 and 3) and `npm run test:browser` (statement 2).
