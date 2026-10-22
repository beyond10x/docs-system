---
format: aep.planning-md/3
id: story:code-highlighting-consistency-check
kind: story
status: draft
title: Report code and terminal blocks that skip the shared highlighting
summary: check-source --code-report lists blocks outside the presets or the shared components and site Prism configs missing presets or themes, without changing the exit status.
owner: docs-system
tags:
- code
- review
relations:
- decomposes: epic:shared-terminal-and-code-views
- depends_on: story:shared-syntax-palette-and-presets
scope:
- confidence: cited
  path: CHANGELOG.md
- confidence: cited
  path: README.md
- confidence: cited
  path: dist/cli.js
- confidence: cited
  path: dist/docusaurus.js
- confidence: cited
  path: dist/product-site.js
- confidence: cited
  path: dist/source-check.js
- confidence: cited
  path: src/cli.ts
- confidence: cited
  path: src/docusaurus.ts
- confidence: cited
  path: src/product-site.ts
- confidence: cited
  path: src/source-check.ts
- confidence: inferred
  path: tests/fixtures/code-report
- confidence: cited
  path: tests/source-check.test.mjs
revision: 7
---
# Report code and terminal blocks that skip the shared highlighting

## Outcome

A reviewer runs one report on a repository's documentation and reads, block by block, where code or
terminal output uses a language outside the shared presets or bypasses the shared terminal and code
components, and whether the site's Prism configuration loads the presets and the shared themes. The
operator asked for this to be part of review.

## Builds on

- `src/code.ts:136-153`: `markdownFenceProblems` already fails a fence with no language, the
  ambiguous `console`, and a language outside `PRISM_LANGUAGES`. Those failures stay as they are and
  are not repeated by the report.
- `src/source-check.ts:176-198` (fence inventory, MDX-aware at line 179) and
  `src/source-check.ts:410-423` (`checkFenceContract`), reached through `b10x-docs check-source`
  (`src/cli.ts:29-38`).
- `src/docusaurus.ts:5` (the generic plugin) and `src/product-site.ts:92-133` (the product-site
  plugin, which reads `context.siteConfig`; its `SiteContext` type at line 72 does not yet name `themeConfig`): where a plugin sees the site Prism configuration.
- `tests/source-check.test.mjs`: the existing check's tests and fixtures.

## Design (D5)

- `b10x-docs check-source --code-report <root>` adds the report to the existing check. It never
  changes the exit status: with or without the flag, the command exits as `check-source` does today.
  There is no `--strict`.
- Block finding kinds: `outside-presets` (a language `check-source` accepts that is not a preset of
  `story:shared-syntax-palette-and-presets`), `raw-pre` (a `<pre>` element in MDX),
  `direct-codeblock` (MDX importing `@theme/CodeBlock` instead of the shared components),
  `transcript-in-bash-fence` (a `bash` fence whose lines start with `$ `).
- Site finding kind `prism-config`: the generic and product-site plugins read the site
  configuration Docusaurus hands them and report, in the same format, every preset grammar missing
  from `themeConfig.prism.additionalLanguages` and a `theme` or `darkTheme` that is not the shared
  one. The build does not fail.
- The preset list is read from the presets, never copied into the report.
- Narrowing: docs-system provides the report. Wiring it into the documentation-site review procedure
  is outside this repository and is a follow-up for whoever owns that review.

## Acceptance

Each statement runs under `npm run gate`. The fixture under `tests/fixtures/code-report/` contains no
fence that `check-source` already fails.

1. Given the fixture with a `go` fence, a `<pre>` element in MDX, an MDX page importing
   `@theme/CodeBlock`, and a `bash` fence whose lines start with `$ `, when
   `b10x-docs check-source --code-report <fixture>` runs, then it prints exactly four findings, one
   per block, each with file, line and kind (`outside-presets`, `raw-pre`, `direct-codeblock`,
   `transcript-in-bash-fence`).
2. Given the fixture and an existing failing check-source fixture, when `check-source` runs on each
   with and without `--code-report`, then the exit status is the same with and without the flag, and
   the output without the flag is byte-for-byte what it is before this change.
3. Given the fixture, when `check-source --code-report` runs, then its summary line counts the blocks
   per finding kind and per language.
4. Given the fixture with a `<pre>` element shown inside an `mdx` fence, when
   `check-source --code-report` runs, then that block produces no finding.
5. Given a site configuration whose `themeConfig.prism` omits the `vue` grammar and sets a theme
   other than the shared one, when the generic docs-system plugin and the product-site plugin load
   with it, then each reports one `prism-config` finding naming `vue` and the theme, and loading
   does not throw.

## Scope

- `src/source-check.ts`, `src/cli.ts`, `src/docusaurus.ts`, `src/product-site.ts`
- `tests/source-check.test.mjs`, `tests/fixtures/code-report/` (new)
- `dist/source-check.js`, `dist/cli.js`, `dist/docusaurus.js`, `dist/product-site.js`
- `README.md`, `CHANGELOG.md`

## Ordering

After `story:shared-syntax-palette-and-presets`, whose presets the report reads. It needs neither
the terminal nor the code-view component to exist.

## Verification

Run `npm run gate` (statements 1-5).
