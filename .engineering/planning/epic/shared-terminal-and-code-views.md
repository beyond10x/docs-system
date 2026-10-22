---
format: aep.planning-md/3
id: epic:shared-terminal-and-code-views
kind: epic
status: draft
title: Shared terminal and code views for documentation
summary: One terminal window, one code view and one syntax palette with language presets for every docs-system surface, plus a check that reports unhighlighted or inconsistent blocks.
owner: docs-system
tags:
- code
- presentation
relations:
- informed_by: task:shared-code-block-rendering
revision: 2
---
# Shared terminal and code views for documentation

## Outcome

Every documentation surface built on docs-system shows commands and their output in one terminal
window, and source in one code view, both coloured by one syntax palette that reads in light and
dark. A review can see from a report whether a page's code and terminal blocks are highlighted, and
highlighted the same way as everywhere else.

## Operator request

Verbatim, 2026-10-22: "So make it a general UI thing with our shared UX for these documentations,
that we have a proper nice looking terminal window when we want to show output or commands which we
type, and we also want to have a nice edit views on code. Yeah, so that should also contain syntax
highlighting then. Make this also a check in the review whether there is some color and syntax
highlighting and whether it's done in a consistent way. You might even in the shared thing create
some presets. Of course, stuff like model spec is specific to model spec, so it should not be in the
shared one."

## What already exists (each story extends it)

- `Terminal` with title bar, traffic lights, a separate `aria-hidden` prompt and a copy button that
  copies only commands: `src/product.tsx:36-107`, in the product layer; transcript parsing
  `src/product-data.ts:69`; recorded sessions `schema/b10x.terminal.v1.schema.json`; styles with
  hard-coded output colours `styles/product-components.css:173-252`.
- `CodeExample`, `CommandExample` and `CodeTabs` on Docusaurus `CodeBlock`: `src/components.tsx:236-252`.
  `CommandExample` puts `$ ` inside the copied text (`src/components.tsx:246`), so its copy button
  copies the prompt and the output.
- `CodePair` (source and what it generates): `src/product.tsx:586`.
- Prism themes claiming 4.5:1 per token: `src/prism-themes.ts:1-71`, wired only into the
  product-site preset (`src/product-site.ts:344-349`).
- Language list, labels, aliases and the fence contract: `src/code.ts:9-153`; enforced by
  `b10x-docs check-source` (`src/source-check.ts:410`, `src/cli.ts:29`).
- Shared code surface CSS: `styles/tokens.css:284-390`, `styles/product-theme.css:241-273`.
- `task:shared-code-block-rendering` (implemented) owns language normalization, CodeBlock wrappers
  and code tokens; these stories build on it and do not redo it.

## Ownership (coordinator decisions D1-D5, 2026-10-22)

- D1: `story:shared-syntax-palette-and-presets` owns every colour: syntax tokens, terminal output,
  tone and JSON colours, diff added/removed line backgrounds and gutter marks, and the
  highlighted-line tone, each contrast-checked in light and dark. The other stories only consume.
- D2: `story:shared-terminal-window` moves `Terminal` into the generic layer (`src/terminal.tsx`,
  re-exported by `src/components.tsx` and `src/product.tsx`) with its rules in `styles/tokens.css`,
  so every docs-system consumer gets it, not only product sites.
- D3: `story:shared-code-view` keeps line numbers on by default and gives a `diff` fence its line
  treatment in `styles/tokens.css`. There is no swizzled `CodeBlock`; a `shell-session` fence
  rendering as the terminal window is dropped from this epic.
- D4: order, with the shared files as the reason: palette, then terminal, then code view
  (`src/components.tsx`, `dist/components.js`, `tests/product-site.browser.mjs`, `CHANGELOG.md`);
  the consistency check after the palette; the gallery after the check (`README.md`, `CHANGELOG.md`).
- D5: the consistency check is a report. It never changes an exit status. docs-system provides it;
  wiring it into the documentation-site review procedure is outside this repository.

## Out of scope

- Model-specific views, for example a model-spec IR SVG gallery, stay in their own repositories.
  A project-specific view moves here only after a second consumer establishes the shared contract
  (`AGENTS.md`, Boundary).
- Adopting the components in Website or any consumer repository, and bumping consumer pins.
- Wiring `--code-report` into the documentation-site review procedure: a follow-up for whoever owns
  that review.
- Executing commands from a terminal window: it shows recorded or authored text only.

## Findings from the survey

- docs-system has no documentation site of its own. Its published documents are `README.md` and
  `CHANGELOG.md` (`b10x.docs.yaml`, `source.documents`); `examples/product-site` is the reference
  site the browser suite builds (`README.md:419`), and `tests/viewer-site` is a generic site that
  loads only `styles/tokens.css` (`tests/viewer-site/docusaurus.config.cjs:6`).
- prismjs 1.30.0 ships no Vue grammar (its `components/` directory has no `prism-vue*`, read in a
  local Website install), so the `vue` preset needs a registered grammar.
- `console` is refused as ambiguous today (`src/code.ts:142-143`) while its alias maps to
  `shell-session` (`src/code.ts:88`). The operator's "bash/console" preset is read as `bash` for
  commands and `shell-session` for transcripts; the refusal stays.
- `npm run gate` does not run the browser suite (`package.json:78-79`); each acceptance statement
  names the command that runs it.
- The store holds no `vision` artifact, so none of these stories carries a `serves` edge yet.
