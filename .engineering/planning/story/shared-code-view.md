---
format: aep.planning-md/3
id: story:shared-code-view
kind: story
status: draft
title: Show source in one shared code view with file tabs, line marks and diffs
summary: CodeExample keeps line numbers by default with an option to turn them off, gains highlighted lines; CodeDiff and diff fences mark added and removed lines; copy yields source only.
owner: docs-system
tags:
- code
- presentation
relations:
- decomposes: epic:shared-terminal-and-code-views
- depends_on: story:shared-syntax-palette-and-presets
- depends_on: story:shared-terminal-window
scope:
- confidence: cited
  path: CHANGELOG.md
- confidence: cited
  path: dist/components.js
- confidence: cited
  path: dist/index.js
- confidence: cited
  path: examples/product-site/docs/code.mdx
- confidence: cited
  path: src/components.tsx
- confidence: cited
  path: src/index.ts
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
# Show source in one shared code view with file tabs, line marks and diffs

## Outcome

Source shown on a page looks like an editor view: a tab with the file name, line numbers unless the
author turns them off, highlighted lines, and a diff view that shows what changed between two
versions of a file. Copy always yields source, never line numbers or diff markers.

## Builds on

- `src/components.tsx:236-241`: `CodeExample` passes `title` as the file tab and always sets
  `showLineNumbers` (`src/components.tsx:239`); it has no option to turn them off, no
  highlighted-line prop and no diff view.
- `src/components.tsx:250-252`: `CodeTabs`; `src/product.tsx:586-599`: `CodePair`, which already
  shows two files side by side.
- `examples/product-site/docs/code.mdx:9,39`: fences with `title="…"` and `{…}` line ranges, which
  Docusaurus renders through the shared surface.
- `styles/tokens.css:284-390` and `styles/product-theme.css:241-273`: the code surface, title bar
  and highlighted-line rule (`styles/product-theme.css:272`).
- `styles/tokens.css:347`: `diff` has its own accent, but no added/removed line treatment.

## Design (D3)

- Line numbers stay on by default, as today; `CodeExample` gains `lineNumbers={false}` to turn them
  off, and `highlight` (a range string as in fences).
- `CodeDiff` takes `before` and `after` and the file's language, and shows the code highlighted in
  that language with each added or removed line marked.
- A `diff` fence gets its line treatment from `styles/tokens.css`, keyed on the classes Prism's
  diff grammar puts on inserted and deleted lines (inferred; the implementation confirms the class
  names). There is no swizzled `src/theme/CodeBlock`, so the treatment reaches every consumer that
  loads `tokens.css`.
- Colours are the palette's custom properties as `story:shared-syntax-palette-and-presets` defines
  them; this story writes no colour value.

## Acceptance

Each statement runs under `npm run test:browser` on a reference-site page.

1. Given `<CodeExample title="src/lib.rs">`, when the page renders, then the code view's tab shows
   `src/lib.rs`.
2. Given `<CodeExample lineNumbers={false}>` beside a `<CodeExample>` without the prop, when the page
   renders, then the first shows no line-number cells and the second shows one per line.
3. Given `<CodeExample highlight="2-4">` over six lines, when the page renders, then lines 2, 3 and 4
   carry the highlighted-line class and lines 1, 5 and 6 do not.
4. Given a `<CodeDiff>` that adds one line and removes one line, and a `diff` fence with one `+` and
   one `-` line, when the page renders, then each added line shows a `+` gutter mark on the inserted
   background and each removed line a `-` gutter mark on the deleted background.
5. Given a `<CodeExample>` with line numbers, when the copy button is clicked, then the clipboard
   holds the source exactly, with no line numbers.
6. Given a `<CodeDiff>`, when the copy button is clicked, then the clipboard holds the `after`
   source exactly, with no `+` or `-` markers.

## Required observations

- Existing `CodeExample` calls render as before.
- Long lines scroll horizontally; the tab and copy button stay usable at phone width.

## Scope

- `src/components.tsx`, `src/index.ts`
- `styles/tokens.css`, `styles/product-theme.css`
- `tests/presentation.test.mjs`, `tests/product-site.browser.mjs`
- `examples/product-site/docs/code.mdx`
- `dist/components.js`, `dist/index.js`
- `CHANGELOG.md`

## Ordering

After `story:shared-terminal-window` (D4): both change `src/components.tsx`, `dist/components.js`,
`tests/product-site.browser.mjs` and `CHANGELOG.md`.

## Verification

Run `npm run gate` and `npm run test:browser` (statements 1-6).
