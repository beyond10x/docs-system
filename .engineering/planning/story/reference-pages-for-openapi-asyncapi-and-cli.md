---
format: aep.planning-md/3
id: story:reference-pages-for-openapi-asyncapi-and-cli
kind: story
status: implemented
title: Render OpenAPI, AsyncAPI and a command-line reference inside a product site's docs layout
scope:
- confidence: cited
  path: CHANGELOG.md
- confidence: cited
  path: README.md
- confidence: cited
  path: dist
- confidence: cited
  path: examples/product-site
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
revision: 5
transitions:
- {from: "draft", to: "proposed", at: "2026-11-22T02:03:00Z", actor: "agent:inbox", revision: 2}
- {from: "proposed", to: "active", at: "2026-11-22T02:03:00Z", actor: "agent:inbox", revision: 3}
- {from: "active", to: "implemented", at: "2026-11-22T09:59:54Z", actor: "agent:inbox", revision: 5, decided_on: {"recorded":{"test_result":1}}}
---
## Outcome

A product site renders an OpenAPI 3.1 document, an AsyncAPI 3.0 document and a command-line
reference inside its docs layout, each from a source file its repository generates, with a link
that downloads the unchanged source.

- `withProductSite(config, {references: [{id, kind, source, title?}]})` reads and checks each
  source at build time, publishes it as the data module `@b10x-reference/<id>.json` and serves
  the bytes at `<baseUrl>reference/<id>.<ext>`.
- `<ApiReference reference={...} />` in an MDX page renders the module by its kind:
  `OpenApiReference`, `AsyncApiReference` or `CliReference`.
- The command-line reference has its own format, `b10x-cli-reference/1`, with a JSON Schema. A
  repository writes it from its argument parser; `cliReferenceFromEssPlan` converts a compiled
  ESS `ess-cli-plan/2`.

## Acceptance

Given the example product site with the three documents of the inbox service, when the site is
built with webpack and with rspack, then the pages `reference/http-api`, `reference/events` and
`reference/cli` render every operation, event and command of their documents, the three sources
are served byte for byte, and a source of another kind or version fails the build with a message
that names the reference id and the file, where before this story the package rendered only an
OpenAPI document passed as a prop and had no AsyncAPI or command-line renderer.

## Boundary

The renderers only read. No request is sent, no credential is taken, no "try it" control exists.
Every link a renderer writes is an anchor on the page or the download of the source. The
components are generic: nothing in them names the inbox, which is the first consumer and the
example.

## Context

The operator, 2026-11-22: the shared docs system "should have the capability of rendering an
open API" document "so that it fits the layout of our docs. And the same should be true for the
async API", with the inbox service API as the example; and rendering command-line documentation
"can also be something from the shared" docs system.

## Scope

- `src/renderers.tsx`, `src/api-common.tsx`, `src/asyncapi.tsx`, `src/cli-reference.ts`,
  `src/cli-reference-view.tsx`, `src/reference-data.ts`, `src/product-site.ts`,
  `src/theme/MDXComponents.tsx`, `src/types.ts`, `src/index.ts`
- `schema/b10x.cli-reference.v1.schema.json`, `schema/b10x.docs.v5.schema.json`
- `styles/tokens.css`, `dist`, `package.json`
- `examples/product-site`, `tests`, `README.md`, `CHANGELOG.md`
