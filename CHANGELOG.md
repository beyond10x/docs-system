# Changelog

All notable changes to this project are documented in this file. From 0.11.0 the format follows
[Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.12.2] - 2026-10-23

### Fixed

- Short inline code with a space or hyphen (24 characters or fewer, such as `cargo install`) stays
  on one line instead of breaking at its space; longer spans still wrap at spaces, and code in a
  table cell is unchanged. The rehype chips plugin marks such spans `b10x-code-short`.
- A protocol kind written as inline code in prose, such as an `evidence` field in a type list,
  stays code instead of becoming a kind chip with a document-like glyph. Kind chips still come from
  a table cell whose whole text is the kind, and from `<Kind>` anywhere; truth and status chips are
  unchanged.
- The not-found page carries a meta description, as every other page does. A canonical link does
  not fit a page that has no address of its own, so the page is marked `robots: noindex` instead.

## [0.12.1] - 2026-10-22

### Fixed

- A hero protocol or domain graph always fits its column: the canvas scales down to the column
  width instead of stopping at 0.8 and overflowing into a card that cut its right edge.
  `HERO_MIN_SCALE` is still exported, deprecated, and no longer read.
- Inline code in a graph's description, an entity summary, a protocol node description or a case
  input renders as `<code>` instead of showing its Markdown backticks; aria-labels and tooltips
  drop the backticks.
- A ```` ```console ```` fence is a terminal: bare commands are highlighted as Bash with a drawn
  `$ ` prompt that cannot be selected and that the copy button leaves out; a transcript that
  writes its own prompts is highlighted as `shell-session`. The block is labelled Terminal.
- A code or plain-text line wider than its block wraps inside the block with a 2ch hanging indent,
  so no part of it sits behind the right edge or its fade. This applies to every fence styled by
  the shared tokens.

## [0.12.0] - 2026-10-22

### Added

- `a2a` is a product: `product: 'a2a'` gives the A2A mark and its signature (hue `#db6a98` light,
  `#c664a8` dark; ink `#8a3a64` at 7.32:1 on white, `#f7c8dd` at 10.95:1 on the dark surface), it
  joins the family strip after ESS, and a related section can name it. The hues pass the
  categorical checks in family order, which a new test runs on every signature.
- `favicon` option of `withProductSite`: a path under one of the site's static directories,
  passed to Docusaurus as `favicon`. A `favicon` already set in the config wins.

### Fixed

- A product site without a favicon serves a generated SVG at `<baseUrl>b10x-favicon.svg`: the
  mark in white on the product's ink, ringed with its hue, or on the family green without a
  product. Browsers had requested `/favicon.ico` and logged a 404.
- The build output always carries an empty `.nojekyll` at its root, so a GitHub Pages branch
  deployment does not run Jekyll, which drops every path that starts with `_`. A `.nojekyll`
  the site's static directory already provides is kept.

### Migration

- From a pin at 0.2.x or earlier: an `EcosystemRegistry` entry is a `RegistrySurface`, a union
  of the v1/v2 `DocumentationSurface` and the v3, v4 and v5 surface shapes, each with `key` and
  `repository`. Only the v1/v2 member carries `shell`, so code that types registry entries as
  `DocumentationSurface` fails to type-check with "Property 'shell' is missing". Type them as
  `RegistrySurface`. The union has been in place since 0.3.0.

## [0.11.1] - 2026-10-22

### Fixed

- A link inside an admonition takes the site's link colour in both themes. Infima's alert colour
  had made it the alert's near-text ink, so it read as plain text.
- Status badges (`shipped`, `decided`, `planned`) render at 12 px. They had rendered at 9.9 px.
- Code in a table header cell renders at 12 px and keeps its case. It had rendered at 9.6 px and
  uppercase.
- A code block with a line wider than the block shows an edge shadow on the side that is
  scrolled out of view, as a wide table does.
- A doc page with no table of contents (no `##` headings) takes the full row. The theme had
  reserved a quarter of it for a table of contents that never rendered unless the page set
  `hide_table_of_contents`.
- The ESS contract viewer leaves the reading pane 802, 642 and 652 px for text at 1440, 1280 and
  1024 px windows; it had left 453, 333 and 141 px. It stacks its contract list above the page
  when the viewer, not the window, is narrower than 44rem. The list is at most 15rem wide and
  stays in view while the page scrolls. Table cells no longer break identifiers mid-word, and the
  viewer's title no longer carries the doc `h2` rule and its top spacing.

## [0.11.0] - 2026-10-21

### Added

- `product.description` in `b10x-product-landing/1`: at most 160 characters, used as the home page's
  meta and `og:description` ([#25](https://github.com/beyond10x/docs-system/issues/25)).

### Fixed

- The hero terminal shows every command and output line at first paint, at every width and in both
  themes. It no longer types its commands out; `<Terminal animate>` in a page still does
  ([#19](https://github.com/beyond10x/docs-system/issues/19)).
- A hero action whose `href` opens a new tab (any scheme, `pathname://` or `//`) ends with `↗` and
  carries a visually hidden "(opens in new tab)" in its accessible name
  ([#20](https://github.com/beyond10x/docs-system/issues/20)).
- The home page `<title>` names the product once: when the site title contains the product name the
  landing title is the promise alone, read as `<promise> | <site title>`
  ([#21](https://github.com/beyond10x/docs-system/issues/21)).
- A Markdown table never widens the article column or overruns the table-of-contents gutter. A
  table wider than the column scrolls in its own frame, which becomes a labelled, focusable region
  with edge shadows on the hidden side and a line of guidance below it. Code in table cells wraps at
  spaces and never inside a word, at every width. The shadows' covers take the colour of the box the
  table sits in: an admonition, a graph or a chart sets `--b10x-table-surface`
  ([#22](https://github.com/beyond10x/docs-system/issues/22)).
- On a touch screen or a window up to 996 px wide, a code block's copy and wrap buttons sit in its
  caption bar and never cover the first line. They stay visible there, and a long title wraps
  instead of running under them ([#23](https://github.com/beyond10x/docs-system/issues/23)).
- In the table of contents, a heading written as code (a command, a path or an identifier) stays
  inside the rail. It wraps at spaces, after `/`, `_`, a joining `-` and `::`, before `.` and where a
  capital follows a lower-case letter. A word with more than 24 characters between those points breaks
  anywhere instead of overflowing. The theme's `TOCItems/Tree` is wrapped to mark those break points
  ([#24](https://github.com/beyond10x/docs-system/issues/24)).
- Every page has a share image: `withProductSite` serves a 1200 × 630 card at
  `<baseUrl>b10x-social/card.png` and sets it as `themeConfig.image` unless the site sets its own.
  Without `product.description`, the home page's meta description is the lede cut to 160
  characters at the last whole sentence or word, no longer the full lede
  ([#25](https://github.com/beyond10x/docs-system/issues/25)).
- The not-found page says the address has no page and links to the main doc of the latest docs
  version and to the home page, in place of the stock Docusaurus copy. The theme overrides
  `NotFound/Content`; a site's own override still wins
  ([#26](https://github.com/beyond10x/docs-system/issues/26)).
- The text tables under protocol and domain graphs, the session charts' table views, `StatusTable`
  and the OpenAPI responses table scroll in a named, focusable region with the guidance line when
  wider than the column, as Markdown tables do. `ScrollableTable` moved to its own module, so
  `./renderers` still loads without the Docusaurus theme
  ([#27](https://github.com/beyond10x/docs-system/issues/27)).
- A protocol graph whose claim predicate uses `input … in [...]` renders in the browser. The client
  build turned a copied `Set` into a one-element array, so the graph failed after hydration with
  "names value [object Set]" and React reported a hydration mismatch (React error 418)
  ([#28](https://github.com/beyond10x/docs-system/issues/28)).

## 0.10.0 — 2026-10-13

- `b10x-protocol-graph/1` carries Canon 0.3.0's order forms in the `canon-ir/1` shape: a `first`
  predicate leaf `{"first": {"kind": <kind>, "result": <result>, "subject"?: <artifact>}}` and a
  `before` predicate leaf `{"before": {"first": <kind>, "then": <kind>, "subject"?: <artifact>}}`,
  each with required non-empty strings, an optional non-empty `subject` and no other field. The
  schema and `parseProtocolGraph` refuse an unknown or missing field, and `parseProtocolGraph`
  refuses a `before` whose `first` and `then` are the same kind, naming the path. `predicateLines`
  reads `first` as `first evidence = <result>: <kind>` and `before` as `evidence <first> before
  <then>`, either ending `about <subject>` when it names one; the kind stays the line's `reference`.
  Existing graphs validate and render as before.

## 0.9.0 — 2026-10-12

- `b10x-protocol-graph/1` carries Canon case inputs in the `canon-ir/1` shape: an optional top-level
  `case: {inputs: {<id>: {description, values}}}`, an `input` predicate leaf
  `{"input": {"id": <id>, "in": [<value>, …]}}`, and `applicable_when` on `obligation` nodes only.
  The schema and `parseProtocolGraph` refuse an input leaf that names an undeclared input or value
  and `applicable_when` on any other node kind, naming the path. `predicateLines` reads an input
  leaf as `input <id> in <values>` (new `PredicateLine.suffix`, and `predicateLineText` for the
  plain-text form). `ProtocolGraph` lists the case inputs with their values under the caption and
  shows an obligation's "applicable when" lines before its discharge rule. Existing graphs validate
  and render as before.

## 0.8.0 — 2026-10-08

- The family member `els` is named "Engineering protocols" and links https://beyond10x.github.io/engineering-protocols/
  and https://github.com/beyond10x/engineering-protocols, after the repository rename. The product id
  and palette key stay `els`.
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

- Status glyphs (○ ◐ ●) in `StatusBadge`, KPI tiles and status chips are drawn as CSS masks
  (`StatusGlyph`, `.b10x-status-glyph`) instead of font text: the Inter subset carries ○ and ● but
  not ◐, which fell back to a system font and rendered as a clipped sliver. `chipMeaning` returns an
  empty glyph for status words.
- With `trailingSlash: false`, `x/index.html` is now a copy of `x.html` with a canonical link to `x`
  and a script that moves to `x` only when the path ends in `/`. The former meta-refresh stub looped
  forever under `docusaurus serve` and any server that resolves `/x` to `x/index.html` first.
- Hero protocol and domain graphs never scale below 0.8 (a wider graph is cropped and scrolls), drop
  label tracking and keep their own glyph spacing, so labels no longer shrink to about 6 px.
- The hero terminal wraps long commands with a hanging indent at every width, not only on phones.
- The page-header kicker drops "1 of 1" for a one-page category, and a front-matter `kicker`
  replaces the whole kicker.

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

[Unreleased]: https://github.com/beyond10x/docs-system/compare/0.12.2...HEAD
[0.12.2]: https://github.com/beyond10x/docs-system/compare/0.12.1...0.12.2
[0.12.1]: https://github.com/beyond10x/docs-system/compare/0.12.0...0.12.1
[0.12.0]: https://github.com/beyond10x/docs-system/compare/0.11.1...0.12.0
[0.11.1]: https://github.com/beyond10x/docs-system/compare/0.11.0...0.11.1
[0.11.0]: https://github.com/beyond10x/docs-system/compare/0.10.0...0.11.0
