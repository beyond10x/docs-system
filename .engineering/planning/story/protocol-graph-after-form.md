---
format: aep.planning-md/3
id: story:protocol-graph-after-form
kind: story
status: active
title: Carry Canon's after order form in protocol graphs
summary: b10x-protocol-graph/1 and ProtocolGraph accept and show Canon 0.7.0's after leaf; existing shapes unchanged
revision: 3
transitions:
- {from: "draft", to: "proposed", at: "2026-10-29T00:54:13Z", actor: "human:timo", revision: 2}
- {from: "proposed", to: "active", at: "2026-10-29T00:54:13Z", actor: "human:timo", revision: 3}
---
# Carry Canon's after order form in protocol graphs

## Outcome

A `b10x-protocol-graph/1` document can carry the `after` order-form predicate leaf Canon 0.7.0
added to `protocol/1`, and the `ProtocolGraph` component validates and shows it, so a protocol
whose rule reads a later record renders as a graph. Every graph that validates today still
validates and renders the same; no existing predicate shape changes.

Canon 0.7.0: https://github.com/beyond10x/canon/releases/tag/0.7.0 (`after: {first, then: {kind,
result}}`, with an optional `subject`; requirement CANON-ORDER-002).

## Acceptance

Given a protocol graph whose predicates use an `after` leaf, with and without a `subject`, nested
in `all` and `not`, with the two kinds the same, and in an obligation's `applicable_when`, when the
schema, the component's validation and its text rendering read it, then all three accept it and the
rendered line reads `evidence = <result>: <kind> after <first>`, with `about <subject>` when it names
one; given an `after` with an unknown or missing field, a `then` that is not an object, or a blank or
null value, the schema refuses it and the component refuses it naming the path; and every committed
protocol-graph fixture and example from before the change still validates and renders the same lines.

## Required observations

- Predicate leaf `{"after": {"first": <kind>, "then": {"kind": <kind>, "result": <result>},
  "subject": <artifact>?}}`, in the shape `canon-ir/1` writes: `first`, `then.kind` and
  `then.result` required non-empty strings, `subject` an optional non-empty string; no other field
  at either level.
- It joins the schema's predicate `oneOf` and the component's `predicate` check, usable wherever a
  predicate is.
- `first` and `then.kind` may name the same kind: Canon allows it (a record is not later than
  itself), so neither the schema nor the component refuses it.
- Existing graphs: schema, validation and rendering output unchanged.
- No new node or edge kind.

## Scope

- `schema/b10x.protocol-graph.v1.schema.json`
- `src/product-graphs.ts` and the built `dist/product-graphs.*`
- `tests/protocol-graph-after.test.mjs`
- `CHANGELOG.md`, `README.md`, `package.json`, `package-lock.json` for the release
