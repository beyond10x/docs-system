---
format: aep.planning-md/3
id: story:shared-terminal-window
kind: story
status: draft
title: Show commands and their output in one shared terminal window
summary: Terminal moves to the generic layer so every consumer has it; CommandExample renders it; copy yields commands only.
owner: docs-system
tags:
- code
- presentation
relations:
- decomposes: epic:shared-terminal-and-code-views
- depends_on: story:shared-syntax-palette-and-presets
scope:
- confidence: cited
  path: CHANGELOG.md
- confidence: cited
  path: dist/components.js
- confidence: cited
  path: dist/index.js
- confidence: cited
  path: dist/product-data.js
- confidence: cited
  path: dist/product.js
- confidence: inferred
  path: dist/terminal.js
- confidence: cited
  path: examples/product-site/docs/meaning.mdx
- confidence: cited
  path: src/components.tsx
- confidence: cited
  path: src/index.ts
- confidence: cited
  path: src/product-data.ts
- confidence: cited
  path: src/product.tsx
- confidence: inferred
  path: src/terminal.tsx
- confidence: cited
  path: styles/product-components.css
- confidence: cited
  path: styles/tokens.css
- confidence: cited
  path: tests/ess-viewer.browser.mjs
- confidence: cited
  path: tests/node-exports.test.mjs
- confidence: cited
  path: tests/product-site.browser.mjs
- confidence: cited
  path: tests/product-site.test.mjs
- confidence: inferred
  path: tests/viewer-site/src/pages/terminal.tsx
revision: 8
---
# Show commands and their output in one shared terminal window

## Outcome

Whenever a page shows commands someone types, or what they printed, it shows one terminal window
whose copy button copies the commands and nothing else. The window lives in the generic layer, so
every docs-system consumer has it, not only product sites (coordinator decision D2), and
`CommandExample` renders it.

## Builds on

- `src/product.tsx:36-107`: `Terminal` already has the title bar, the prompt as an `aria-hidden`
  span (`src/product.tsx:103`) and a copy button that writes only `entry.command`
  (`src/product.tsx:67`, `src/product.tsx:72-80`). It lives in the product layer and is exported
  from there (`src/index.ts:21`).
- `src/product-data.ts:8-86`: the `b10x-terminal/1` session types, `parseTerminalSession` and
  `parseTranscript`, which reads `$ ` and `# ` lines and treats a continuation line as output.
- `src/components.tsx:243-247`: `CommandExample` renders through `CodeBlock` with `$ ` inside the
  text, so its copy carries the prompt and the output.
- `styles/product-components.css:173-252`: the terminal rules, product layer only.
- `tests/viewer-site/docusaurus.config.cjs:6`: a generic site that loads only `styles/tokens.css`,
  exercised by `tests/ess-viewer.browser.mjs`.

## Design (D2)

- `Terminal`, its session types and transcript parsing move to `src/terminal.tsx`.
  `src/components.tsx` re-exports `Terminal`; `src/product.tsx` and `src/product-data.ts` re-export
  what they exported before, so no import path breaks. The generic layer no longer reaches into the
  product layer for `CommandExample`.
- The `.b10x-terminal` rules move from `styles/product-components.css` to `styles/tokens.css`. Their
  colours are the palette's custom properties as `story:shared-syntax-palette-and-presets` leaves
  them; this story changes no colour.
- A `shell-session` fence keeps the shared code surface labelled "Terminal" (`styles/tokens.css:334`);
  rendering fences as the window is out of this epic (D3).

## Acceptance

1. Given a `<Terminal>` transcript with two commands, each followed by output, on a reference-site
   page, when `npm run test:browser` clicks its copy button, then the clipboard holds exactly the two
   commands, one per line, with no prompt and no output.
2. Given a `<CommandExample command="…" output="…">` on a reference-site page, when
   `npm run test:browser` clicks its copy button, then the clipboard holds exactly the command.
3. Given a transcript whose command ends in a backslash and continues on the next line, when
   `npm run gate` runs the transcript test, then the parsed entry's command holds both lines and the
   copy text equals them, with the continuation not counted as output.
4. Given a `Terminal` on a page of the generic `tests/viewer-site`, which loads only
   `styles/tokens.css`, when `npm run test:browser` clicks its copy button, then the clipboard holds
   exactly its commands and the window's title bar is rendered with the `.b10x-terminal__bar` rules
   from `styles/tokens.css`.
5. Given the built package, when `npm run gate` runs the export test, then `Terminal` imported from
   `@beyond10x/docs-system/components`, from `@beyond10x/docs-system/product` and from the package
   root is the same function.

## Required observations

- `b10x-terminal/1` sessions render as before; the schema does not change.
- Keyboard: the copy button is reachable and announces success through the existing status region.
- The hero terminal checks in `tests/product-site.browser.mjs:26-54` stay green.

## Scope

- `src/terminal.tsx` (new), `src/components.tsx`, `src/product.tsx`, `src/product-data.ts`, `src/index.ts`
- `styles/tokens.css`, `styles/product-components.css`
- `tests/product-site.test.mjs`, `tests/node-exports.test.mjs`, `tests/product-site.browser.mjs`,
  `tests/ess-viewer.browser.mjs`, `tests/viewer-site/src/pages/terminal.tsx` (new)
- `examples/product-site/docs/meaning.mdx` (already holds a `Terminal`, line 52)
- `dist/terminal.js` (new), `dist/components.js`, `dist/product.js`, `dist/product-data.js`, `dist/index.js`
- `CHANGELOG.md`

## Verification

Run `npm run gate` (statements 3 and 5) and `npm run test:browser` (statements 1, 2 and 4).
