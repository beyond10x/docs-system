---
format: aep.planning-md/3
id: story:protocol-graph-since-leaf
kind: story
status: implemented
title: Carry Canon's since order form in protocol graphs
summary: b10x-protocol-graph/1 and ProtocolGraph accept and show Canon 0.8.0's since leaf; existing shapes unchanged
scope:
- confidence: cited
  path: CHANGELOG.md
- confidence: cited
  path: README.md
- confidence: cited
  path: dist/product-graphs.d.ts
- confidence: cited
  path: dist/product-graphs.js
- confidence: cited
  path: examples/product-site/docs/reference.mdx
- confidence: cited
  path: schema/b10x.protocol-graph.v1.schema.json
- confidence: cited
  path: src/product-graphs.ts
- confidence: cited
  path: tests/protocol-graph-since-adversary.test.mjs
- confidence: cited
  path: tests/protocol-graph-since.test.mjs
revision: 5
transitions:
- {from: "draft", to: "proposed", at: "2026-10-29T07:15:28Z", actor: "human:timo", revision: 2}
- {from: "proposed", to: "active", at: "2026-10-29T07:15:28Z", actor: "human:timo", revision: 3}
- {from: "active", to: "implemented", at: "2026-10-29T07:22:20Z", actor: "human:timo", revision: 5, decided_on: {"recorded":{"test_result":2}}}
---
# Carry Canon's since order form in protocol graphs

## Outcome

A `b10x-protocol-graph/1` document can carry the `since` order-form predicate leaf Canon 0.8.0
writes in `canon-ir/1`, and the `ProtocolGraph` component validates and shows it, so a protocol
whose rule reads a record observed since the latest record of a kind renders as a graph. Every
graph that validates today still validates and renders the same; no existing predicate shape
changes.

Canon 0.8.0 (not yet released when this story was written) writes `since: {last, then: {kind,
result}}`, with an optional `subject`.

## Acceptance

Given a protocol graph whose predicates use a `since` leaf, with and without a `subject`, nested
in `all` and `not`, with the two kinds the same, and in an obligation's `applicable_when`, when the
schema, the component's validation and its text rendering read it, then all three accept it and the
rendered line reads `evidence = <result>: <kind> since <last>`, with `about <subject>` when it names
one; given a `since` with an unknown or missing field, a `then` that is not an object, or a blank or
null value, the schema refuses it and the component refuses it naming the path; and every committed
protocol-graph fixture and example from before the change still validates and renders the same lines.

## Required observations

- Predicate leaf `{"since": {"last": <kind>, "then": {"kind": <kind>, "result": <result>},
  "subject": <artifact>?}}`, in the shape `canon-ir/1` writes: `last`, `then.kind` and
  `then.result` required non-empty strings, `subject` an optional non-empty string; no other field
  at either level.
- Meaning: true when a record of kind `then.kind` with result `then.result`, at the same subject
  revision as the latest record of kind `last` (about `subject`, when named), was observed after
  that record.
- It joins the schema's predicate `oneOf` and the component's `predicate` check, usable wherever a
  predicate is; the "exactly one of" message lists `since` last.
- `last` and `then.kind` may name the same kind, so neither the schema nor the component refuses it.
- Existing graphs: schema, validation and rendering output unchanged.
- No new node or edge kind.

## Scope

- `schema/b10x.protocol-graph.v1.schema.json`
- `src/product-graphs.ts` and the built `dist/product-graphs.*`
- `tests/protocol-graph-since.test.mjs`, `tests/protocol-graph-since-adversary.test.mjs`
- `README.md`, `examples/product-site/docs/reference.mdx`, the `[Unreleased]` section of
  `CHANGELOG.md`
