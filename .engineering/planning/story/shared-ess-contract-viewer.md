---
format: aep.planning-md/1
id: story:shared-ess-contract-viewer
kind: story
status: active
title: Explore ESS contracts through shared documentation UI
scope:
- confidence: cited
  path: .gitignore
- confidence: cited
  path: README.md
- confidence: cited
  path: dist
- confidence: cited
  path: package-lock.json
- confidence: cited
  path: package.json
- confidence: cited
  path: schema
- confidence: cited
  path: src
- confidence: cited
  path: styles
- confidence: cited
  path: tests
revision: 6
---
# Explore ESS contracts through the shared documentation UI

## Outcome

Readers can navigate Mandate and other ESS contracts with one reusable documentation viewer, using the existing ess-docs/1 projection that Connectors already renders.

## Acceptance

Given valid Mandate and Connectors ess-docs/1 projections, when the shared viewer interaction and security suite exercises navigation, search, links and diagrams, then the suite passes.

## Required observations

Render every supported block/inline variant, indexed pages and sections, lifecycle and topology diagrams, searchable declarations, typed cross references, exact provenance and downloadable source. Reject unsupported document formats, invalid identity/reference structures and unsafe URL schemes. No contract execution or credential entry. Reuse shared code, diagram, table and token primitives. Render unknown targets as explicit unresolved references, never fabricate destinations. Keyboard/mobile navigation and browser history must work. Distinguish contract declarations from runtime enforcement.

## Scope

- src/ess-document.ts and src/ess-contract-viewer.tsx: existing ESS document wire types, validation, indexing and shared presentation.
- src/index.ts, package.json, styles/tokens.css and dist: exports and reusable styles.
- tests and README.md: two real source fixtures, interaction/security coverage and adoption instructions.
- Website integration is coordinated in its managed checkout; Mandate owns authored overview, roadmap and generated inputs.

## Verification

Run npm run gate, validate actual projections from both consumers, and exercise a local browser preview. Open the Mandate development preview in Brave and wait for operator review before website publication.

## Planning boundary

One implementation story; no decomposition panel is needed because there are no sibling artifacts to compare. This work neither implements Mandate runtime semantics nor starts its Wave/Drive tasks.

## Local verification, 2026-09-17

- `npm run gate`: 46 Node tests, 7 Rust bundle tests, deterministic distribution and fixture validation passed.
- `B10X_CHROME_BIN=<installed Chromium browser> npm run test:browser`: standalone production Docusaurus build plus Mandate and Connectors navigation passed. Checked declaration search, absent results, links, history/reload, focus, diagrams, keyboard navigation, mobile width and dark theme.
- Rendered contract diagrams contained no scripts, external hrefs/images, event attributes or foreign objects. Hosts use strict Mermaid settings with HTML labels disabled.
- The Website fetch wrapper and generated MDX path passed the Mandate browser interaction suite. Website unit tests (102), type checking, production site build and source/build code rendering checks passed against its retained source roster. Final dependency pin and new-source publication remain coordinated work.
- Real fixtures retain all 16 Mandate pages and 26 Connectors pages, exact projection bytes and provenance. Mandate's fixture is byte-identical to its generated documentation projection.

The viewer is implemented locally. Source publication and the user's website review remain pending; no service enforcement or website delivery is claimed. The v3 manifest schema stays byte-identical. Only v4 adds the optional named viewer component; existing v3 data selection already supports automatic Website rendering.
