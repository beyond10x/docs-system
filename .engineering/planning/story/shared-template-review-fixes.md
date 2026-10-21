---
format: aep.planning-md/3
id: story:shared-template-review-fixes
kind: story
status: implemented
title: Fix the shared template's review findings (#19-#28)
scope:
- confidence: inferred
  path: CHANGELOG.md
- confidence: inferred
  path: README.md
- confidence: inferred
  path: dist
- confidence: inferred
  path: examples/product-site
- confidence: inferred
  path: package.json
- confidence: inferred
  path: schema
- confidence: inferred
  path: src/components.tsx
- confidence: inferred
  path: src/product-site.ts
- confidence: inferred
  path: src/product.tsx
- confidence: inferred
  path: src/theme
- confidence: inferred
  path: styles
- confidence: inferred
  path: tests
revision: 8
transitions:
- {from: "draft", to: "proposed", at: "2026-10-21T20:07:29Z", actor: "human:timo", revision: 3}
- {from: "proposed", to: "active", at: "2026-10-21T20:07:29Z", actor: "human:timo", revision: 4}
- {from: "active", to: "implemented", at: "2026-10-21T21:36:58Z", actor: "human:timo", revision: 8, decided_on: {"recorded":{"test_result":1}}}
---
# Fix the shared template's review findings (#19-#28)

## Outcome

A reader of any product site built on `withProductSite` sees the hero terminal's output, knows
which hero action opens a new tab, reads tables and code on a phone, follows long code headings
in the table of contents, gets a short page description and a card image when the home page is
shared, finds a way back to the docs from a missing page, reads chart and graph text tables on a
phone, and sees protocol graphs with input predicates render in the browser.

Source: the screened review of the modelspec site, filed as issues #19-#26 on 2026-10-21
(https://github.com/beyond10x/docs-system/issues/19 to /issues/26). #27 (chart and graph text
tables) was added to the wave by the monitor; #28 (a client-side `Set` copy) came from the
adversarial pass over the wave and was added the same way.

## Acceptance

Given the example product site built from this commit and opened in headless Chromium at 1440,
1280, 996 and 390 px in light and dark theme, when each issue's check runs, then:

- #19: every hero terminal output line is visible at first paint, at every width, in both themes.
- #20: a hero action whose target opens a new tab carries "(opens in new tab)" in its accessible
  name; an internal action does not.
- #21: the home page `<title>` contains the product name once.
- #22: at 1280 px no table's right edge passes the article's; at 390 px a table wider than the
  column scrolls inside a labelled, focusable region with a visible cue, and inline code in a cell
  does not force the table wider than its longest word. A table inside an admonition, graph or
  chart shows no edge band at rest.
- #23: on a touch device at 390 px the copy and wrap buttons do not overlap the first code line.
- #24: a TOC entry for a long code heading, including kebab-case, CamelCase, `::` paths and a word
  with no separator, stays inside the TOC column and breaks only at its separators.
- #25: the home page meta description is at most 160 code points, and the home page has
  `og:image` and `twitter:image` pointing at a file the build emitted.
- #26: the 404 page links to the docs root and the home page.
- #27: at 390 px every chart or graph text table wider than its frame is a named, focusable
  region with visible guidance.
- #28: `docs/reference`, which holds a protocol graph with an `input … in` predicate, shows no
  graph error, page error or console error after hydration.

Every check fails at 48afe6a and passes at the release commit; `npm run gate` passes.

## Required observations

- #19: the hero terminal no longer waits for an IntersectionObserver before it shows output.
- #20: external detection uses the same rule as Docusaurus `Link` (an href with a scheme, or
  protocol-relative); the label is visually hidden text, the glyph is `aria-hidden`.
- #25: `product.json` (`b10x-product-landing/1`) gains an optional `description`; without it the
  description is the lede cut at a sentence or word boundary, at most 160 code points. The default
  card image ships in the package and is overridable through the theme config or site config.
- #22: Markdown tables render through the existing `ScrollableTable`.
- #28: client code copies a `Set` with `Array.from`, never a spread.
- Existing sites keep building without content or config changes.

## Scope

- `src/product.tsx`, `src/product-site.ts`, `src/product-data.ts`, `src/product-graphs.ts`,
  `src/components.tsx`, `src/scrollable-table.tsx`, `src/charts.tsx`, `src/session-charts.tsx`,
  `src/renderers.tsx`, `src/toc.ts`, `src/not-found.ts`
- `src/theme/ProductLandingPage.tsx`, `src/theme/MDXComponents.tsx`, new `src/theme/NotFound/`
  and `src/theme/TOCItems/` overrides
- `schema/` product-landing schema, `styles/*.css`, `styles/social/`
- `examples/product-site/`, `tests/`, `dist/`, `README.md`, `CHANGELOG.md`, `package.json`

## Verification

`npm ci --ignore-scripts`, `npm run gate` and `npm run test:browser` on the exact commit; the pull
request's CI; an adversarial pass over the whole diff at 390 px and in the dark theme.

## Planning boundary

One story, ten units worked one at a time (one per issue), plus follow-ups from the adversarial
pass. No consumer pin moves, Website or Atlas changes, façade redeploys or npm publishing. This
repository is documentation tooling and has no ESS specification; the contract for
`product.json` is its JSON Schema.
