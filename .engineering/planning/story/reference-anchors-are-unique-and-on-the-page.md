---
format: aep.planning-md/3
id: story:reference-anchors-are-unique-and-on-the-page
kind: story
status: draft
title: OpenApiReference writes unique anchors and no link to a missing schema
revision: 1
---
## Outcome

Every anchor `OpenApiReference` writes is unique on its page, and every link it writes to a schema
points at an anchor that is on the page.

## Context

The adversary pass on story:reference-pages-for-openapi-asyncapi-and-cli (2026-11-22) found two
defects that `main` at `081e05f` has as well:

- `src/renderers.tsx`: an operation without an `operationId` gets the anchor
  `operation-<slug of method and path>`. The paths `/a/b` and `/a-b` both give
  `operation-get-a-b`, so the page carries one id twice and the second link opens the first
  operation.
- `src/renderers.tsx` and `src/api-common.tsx`: a `$ref` to a component schema that the document
  does not declare is written as a link to `#schema-<name>`, and no element has that id.

The same pass found both shapes in the new AsyncAPI and command-line renderers; those are fixed in
that story (a counter after a taken id, plain code where the target is missing).

## Acceptance

- Two operations whose method and path give the same slug get different anchors, and each index
  link opens its own operation.
- A `$ref` to a schema the document does not declare renders as code without a link.
- A test holds each of the two cases.
