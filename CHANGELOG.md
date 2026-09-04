# Changelog

## Unreleased

- Add the immutable `b10x-docs-bundle/v1` schema, Rust builder and validator, deterministic source
  and `changes/**/*.yaml` inventory, credential-free composite producer action, and consumer-first
  compatibility rule for fast aggregate Website publication.
- Fix passive-MDX validation to mask only parser-confirmed MDX code blocks and spans and validate
  component names structurally, preventing legal examples from shifting tag detection without
  hiding executable markup near malformed fences, stray backticks, or non-letter component names.
  Markdown and MDX inputs now use their matching Docusaurus grammar with GFM enabled.
- Label every canonical Prism fence consistently and refine the shared code surface with semantic
  accents, light/dark chrome, visible touch controls, keyboard focus, and narrow-screen scrolling.

## 0.6.0 — 2026-09-03

- Add the additive `b10x-docs/v4`, `b10x-experiences/v1`, and `b10x-doc-page/v1`
  contracts so publication, reader access, support status, artifact availability, experience paths,
  and effective per-page audiences can be represented without changing v1-v3.
- Evaluate adoption calls to action from the most restrictive path/artifact access, actionable
  support state, complete artifact availability, and an explicit URL; legacy manifests normalize
  to non-actionable compatibility experiences with unspecified access and support.
- Validate page metadata inside ordinary Markdown/MDX `b10x:` frontmatter and emit a separate
  normalized document index while preserving `b10x-sources/v1` and `b10x-docs-collection/v1`.

## 0.5.0 — 2026-09-01

- Add shared page and section headers, fact grids, callouts, search fields, filter chips, card grids,
  and content cards so discovery pages can use one responsive, accessible visual language.
- Let project and adoption cards opt into page-appropriate headings and internal profile/action URLs
  without duplicating their rendering in the Website.
- Publish a Node-safe Prism language contract and normalize fence aliases while distinguishing
  copyable Bash from shell transcripts; load Go, Rust, TOML, HTTP, C/C++, Python, and other public
  documentation grammars consistently.
- Standardize fenced code styling, light/dark interaction states, elevation and radius tokens, and
  visible keyboard/touch guidance for full-size diagrams.

## 0.4.0 — 2026-09-01

- Make `OpenApiReference` an embeddable section with configurable h2/h3 roots, coherent subordinate
  headings, and no nested `main` or component-owned h1.
- Add deterministic, accessible `EcosystemFamilyGateway` and Node-safe navigation derivation driven
  by each surface's declared navigation group/order plus shell-owned family order.
- Keep diagrams full-size in one keyboard-scrollable viewport, add configurable minimum width, and
  expose complete prose/node/relationship alternatives; dependency graphs provide those lists by
  default.
- Strengthen semantic light/dark colors, component boundaries, touch targets, focus treatment, card
  rhythm, command/code framing, and shared footer tokens with automated WCAG contrast coverage.

## 0.3.3 — 2026-09-01

- Admit syntactically closed, whole-line MDX comment expressions as inert source markers so
  repository-owned Docusaurus field notes and generated status boundaries remain passive inputs.
- Admit validated trailing explicit heading ids while continuing to reject inline, unterminated,
  multiline, attribute-bearing, adjacent, and executable MDX expressions.
- Preserve every accepted marker byte in collected and staged output; the exception exists only in
  the collector's validation projection.

## 0.3.2 — 2026-09-01

- Export `@beyond10x/docs-system/manifest` as a Node-safe entry point for manifest, source-lock,
  registry, and change-ledger operations without loading Docusaurus theme aliases from the UI root.
- Exercise every documented Node-safe JavaScript and JSON Schema subpath from plain Node so server
  orchestration cannot regress to importing the browser/Docusaurus component graph.

## 0.3.1 — 2026-09-01

- Add a typed `source.data` channel so repository-owned JSON, YAML, and other passive datasets can
  feed the unified site without being treated as MDX, assets, or executable repository code.
- Add generic `DataCatalog` and `DependencyGraph` shared components and include data inputs in the
  same deterministic collection, digest, copy, and source-lock boundary as other declared inputs.

## 0.3.0 — 2026-09-01

- Add the additive `b10x-docs/v3` contract for repository-owned, data-only sources delivered by the
  unified website, including display names, canonical route bases, primary journeys, typed feeds,
  safe source selections, API/schema declarations, and central delivery metadata.
- Add deterministic source locking and collection with content digests, traversal and executable
  MDX rejection, optional byte-for-byte staging, and typed v2 ecosystem-change targets.
- Add GitHub Pages compatibility route generation, byte-preserving machine aliases, scoped impact
  and release feeds, and generated README discovery blocks with drift checking.

## 0.2.0 — 2026-09-01

- Add the dual-read `b10x-docs/v2` contract with explicit adoption actions, the planning journey,
  and the section and relationship vocabulary already needed by Agent Plugins.
- Add repository-owned `b10x-change/v1` impact records and deterministic registry, change-ledger,
  RSS, and JSON Feed snapshot generation with optional verified release facts.
- Add shared adoption and ecosystem-change components plus standard Docusaurus navigation helpers.

## 0.1.3 — 2026-09-01

- Upgrade the manifest validator and YAML parser to patched releases so consumer dependency audits
  do not inherit the resolved advisories from 0.1.2.

## 0.1.2 — 2026-09-01

- Separate browser-safe component and renderer exports from Node-only manifest tooling.
- Accept loopback HTTP URLs for internal local-only documentation surfaces.

## 0.1.0 — 2026-09-01

- Introduce the public manifest contract, deterministic registry CLI, Docusaurus integration,
  shared tokens, generic React components and read-only schema/diagram renderers.
