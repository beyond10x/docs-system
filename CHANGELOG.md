# Changelog

## Unreleased

- Add the family registry (`@beyond10x/docs-system/family`): related tools may be named
  `{id, relation, via?}` and take name, unique mark (C, El, L, Co, Es), signature hue, description
  and link from it. With `product` set, the footer shows a family strip with the current product
  highlighted, a "This build" line names the docs-system revision, and the navbar wordmark gets a
  product switcher.
- Add `b10x-status/1`: a landing status section may name a status file (`"items": "data/status.json"`)
  and `<StatusTable data={…}/>` renders the same file on the status page, grouped by `area`.
- Add hero art from data: `product.art` with kinds `terminal`, `protocol-graph`, `domain-graph`,
  `case` (`b10x-case/1`) and `code-pair` (`b10x-code-pair/1`), and `product.kpis`, a KPI row counted
  from the art, the graphs and the status section. `ProtocolGraph` and `DomainGraph` take
  `variant="hero"`. `product.terminal` still works.
- Documentation pages with `status`, `lede` or `source` front matter open with a page header
  (kicker "Category · n of m" from the sidebar, title, lede, status badge, source line).
- Graph and status sections sit on the alternate ground, cards carry light-mode depth, feature grids
  take their columns from the card count (4 → 2 × 2), and protocol kinds have glyphs reused in kind
  chips, graph legends and feature `icon`s.
- Motion only under `prefers-reduced-motion: no-preference`: hero graph edges draw once, the hero
  terminal types once, the status bar grows.
- Top-level sidebar categories read as kickers. With `trailingSlash: false` the build writes a
  redirect at `x/index.html` for every `x.html`, so `/docs/x/` no longer 404s on static hosts.
- At phone width the hero terminal wraps long commands with a hanging indent, and graphs wider than
  their frame offer a "Fit to width" toggle.

- Self-host Inter (variable) and Fira Code as latin-subset woff2 with `font-display: swap` and
  preload; `withProductSite` serves them under `<baseUrl>b10x-fonts/` with their OFL licences.
- Fail the product-site build when a raw `:::kind Title` line reaches a page, and refuse
  `^:::[a-z]+ +\S` outside fenced code in `check-source`.
- Add semantic colour roles validated with the dataviz checks: an ordinal status ramp with ○ ◐ ●
  glyphs (no longer the site accent), truth tokens (✓ ? ✕), and a product signature hue chosen with
  `withProductSite(config, {product})`. `StatusStrip` groups items by state.
- Turn exact TRUE/FALSE/UNKNOWN, shipped/decided/planned and protocol kinds in docs table cells and
  inline code into chips; `:::shipped`, `:::decided`, `:::planned` and status-titled admonitions take
  the status tone. Add `Truth`, `Kind` and `EmptyState`.
- `b10x-terminal/1` gains optional `tones`; the terminal shows an exit gutter, coloured outcome words,
  JSON tokens and a summary. protocol/1 code blocks get a kind gutter. Mermaid takes per-mode theme
  variables from the tokens.

- Add the product-site layer: `withProductSite(config, options)` from
  `@beyond10x/docs-system/product-site` adds a data-driven landing page (`b10x-product-landing/1`),
  product tokens light and dark mapped onto Infima, matched Prism themes, and a global MDX
  vocabulary: `Terminal`, `FeatureGrid`/`Feature`, `Flow`/`FlowStep`, `StatusStrip`,
  `RelatedTools`, `ProtocolGraph`, `DomainGraph`, `SessionTimeline`, `StepBars`,
  `CompositionGraph`, `StatTiles` and `SessionKpis`. Sites that do not opt in are unchanged.
- Add spec-driven graphs on a dependency-free, synchronous layered layout
  (`@beyond10x/docs-system/graph-layout`) so pages prerender finished SVG, and JSON Schemas for
  `b10x-protocol-graph/1`, `b10x-domain-graph/1`, `b10x-terminal/1`, `b10x-product-landing/1` and the
  provisional `session-composition-instance/0-dummy`.
- `StatusBadge` also accepts `status` (`shipped`, `decided`, `planned`); `maturity` renders as before.

- Add the additive `b10x-docs/v5` contract: a serialized sidebar of categories whose leaves are
  published document paths, a landing document, menu-withheld documents (`menuWithheld`) and
  declared built assets (`builtAssets`). Validation refuses a sidebar leaf, landing or withheld
  path the surface does not publish.
  v1-v4 remain accepted unchanged.

## 0.7.0 — 2026-09-10

- Add the immutable `b10x-docs-bundle/v1` schema, Rust builder and validator, deterministic source
  and `changes/**/*.yaml` inventory, credential-free composite producer action, and consumer-first
  compatibility rule for fast aggregate Website publication.
- Fix passive-MDX validation to mask only parser-confirmed MDX code blocks and spans and validate
  component names structurally, preventing legal examples from shifting tag detection without
  hiding executable markup near malformed fences, stray backticks, or non-letter component names.
  Markdown and MDX inputs now use their matching Docusaurus grammar with GFM enabled.
- Label every canonical Prism fence consistently and refine the shared code surface with semantic
  accents, light/dark chrome, visible touch controls, keyboard focus, and narrow-screen scrolling.
- Share one readable, keyboard-scrollable viewport between full-size diagrams and wide tables, and
  measure a percentage-width diagram from its `viewBox` so the first layout still establishes a
  readable canvas.

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
