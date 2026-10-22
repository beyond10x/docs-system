---
format: aep.planning-md/3
id: story:terminal-and-code-gallery
kind: story
status: draft
title: Document the terminal and code views with MDX usage and a gallery page
summary: README usage section and a gallery page in the reference product site showing every terminal and code-view variant in light and dark.
owner: docs-system
tags:
- code
- documentation
relations:
- decomposes: epic:shared-terminal-and-code-views
- depends_on: story:shared-syntax-palette-and-presets
- depends_on: story:shared-terminal-window
- depends_on: story:shared-code-view
- depends_on: story:code-highlighting-consistency-check
scope:
- confidence: cited
  path: CHANGELOG.md
- confidence: cited
  path: README.md
- confidence: inferred
  path: examples/product-site/docs/terminal-and-code.mdx
- confidence: cited
  path: examples/product-site/sidebars.mjs
- confidence: cited
  path: tests/product-site.browser.mjs
- confidence: cited
  path: tests/product-site.test.mjs
revision: 4
---
# Document the terminal and code views with MDX usage and a gallery page

## Outcome

An author learns how to show a terminal session, a source file or a diff from one usage section, and
sees every variant rendered on one gallery page in light and dark.

## Builds on

- docs-system has no documentation site of its own: its published documents are `README.md` and
  `CHANGELOG.md` (`b10x.docs.yaml`, `source.documents`). The reference site the browser suite
  builds is `examples/product-site` (`README.md:419`), so the gallery lives there and the usage
  section lives in the README.
- `README.md:200` and `README.md:215-236`: the current component list and code-block paragraph.
- `examples/product-site/sidebars.mjs`: the Showcase category, which already lists `code` and `meaning`.
- `examples/product-site/docs/code.mdx` and `examples/product-site/docs/meaning.mdx:52`: today's code
  and terminal examples.

## Variants and their fixed ids

Each variant on `examples/product-site/docs/terminal-and-code.mdx` is wrapped in an element with one
of these ids, and the browser test holds the same list:

`terminal-transcript`, `terminal-session`, `command-example`, `code-example-file-tab`,
`code-example-no-line-numbers`, `code-example-highlighted`, `code-diff`, `diff-fence`, `code-pair`,
`preset-rust`, `preset-toml`, `preset-yaml`, `preset-json`, `preset-bash`, `preset-shell-session`,
`preset-typescript`, `preset-vue`, `preset-diff`.

## Acceptance

1. Given the reference site, when `npm run test:browser` opens the gallery page in light and in
   dark, then an element with each id in the fixed list is present and visible, and no other
   variant id appears.
2. Given the README usage section and the gallery page, when `npm run gate` runs the drift test,
   then every MDX snippet in the usage section occurs byte-for-byte in the gallery page, and a
   snippet missing from the page fails the test by name.

## Required observations

- The usage section also says how to load the palette and presets in a non-product Docusaurus site
  and how to run `b10x-docs check-source --code-report`.
- The gallery has a Showcase sidebar entry and holds no model-specific view.

## Scope

- `README.md`
- `examples/product-site/docs/terminal-and-code.mdx` (new), `examples/product-site/sidebars.mjs`
- `tests/product-site.test.mjs`, `tests/product-site.browser.mjs`
- `CHANGELOG.md`

## Ordering

After the palette, terminal and code-view stories, whose variants it shows, and after
`story:code-highlighting-consistency-check` (D4): both change `README.md` and `CHANGELOG.md`.

## Verification

Run `npm run gate` (statement 2) and `npm run test:browser` (statement 1).
