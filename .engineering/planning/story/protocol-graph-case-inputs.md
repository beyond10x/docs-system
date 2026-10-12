---
format: aep.planning-md/3
id: story:protocol-graph-case-inputs
kind: story
status: active
title: Carry Canon case inputs in protocol graphs
scope:
- confidence: inferred
  path: CHANGELOG.md
- confidence: inferred
  path: README.md
- confidence: inferred
  path: dist
- confidence: inferred
  path: examples/product-site/data
- confidence: inferred
  path: schema/b10x.protocol-graph.v1.schema.json
- confidence: inferred
  path: src/charts.tsx
- confidence: inferred
  path: src/product-graphs.ts
- confidence: inferred
  path: src/product.tsx
- confidence: inferred
  path: tests/product-site.test.mjs
revision: 4
transitions:
- {from: "draft", to: "proposed", at: "2026-10-12T21:35:45Z", actor: "human:timo", revision: 3}
- {from: "proposed", to: "active", at: "2026-10-12T21:35:45Z", actor: "human:timo", revision: 4}
---
# Carry Canon case inputs in protocol graphs

## Outcome

A `b10x-protocol-graph/1` document can carry the case inputs Canon 0.2.0 added to `protocol/1`,
and the `ProtocolGraph` component validates and shows them, so one compiled protocol rendered as a
graph can describe several profiles. Every graph that validates today still validates and renders
the same.

Canon 0.2.0: https://github.com/beyond10x/canon/releases/tag/0.2.0 (`case: inputs:`, the `input`
predicate leaf, an obligation's `applicable_when`).

## Acceptance

Given a protocol graph that declares a case input, tests it with an `input` predicate leaf and
gives an obligation an `applicable_when` predicate, when the schema, the component's validation
and the component's text rendering read it, then all three accept it and the rendered predicate
lines name the input and its values; and given every committed protocol-graph fixture and example
from before the change, the same checks accept them and render the same lines.

## Required observations

- Predicate leaf in the shape `canon-ir/1` writes: `{"input": {"id": <input id>, "in": [<value>, ...]}}`,
  beside the existing all/any/not/claim/evidence forms; `in` is a non-empty list of distinct
  strings.
- An optional top-level `case` section, as in `canon-ir/1`:
  `{"inputs": {<id>: {"description": <string or null>, "values": [<value>, ...]}}}`.
- An optional `applicable_when` predicate on nodes of kind `obligation` only; any other kind
  carrying it is refused.
- Reference check in the component: an input leaf names a declared input and only its declared
  values; a refusal names the path and the input or value.
- Predicate text: an input leaf reads as `input <id> in <values>`; an obligation's applicability
  is shown as "applicable when" lines before its discharge predicate in the node's tooltip and
  text listing; a graph with case inputs lists them with their values.
- Existing graphs: schema, validation and rendering output unchanged (regression test over the
  committed fixtures and examples).
- No new node or edge kind.

## Scope

- `schema/b10x.protocol-graph.v1.schema.json`: the contract, changed first.
- `src/product-graphs.ts`: types, validation, `predicateLines`, layout text.
- `src/charts.tsx` / `src/product.tsx` where the `ProtocolGraph` renders tooltips and listings.
- `styles/product-components.css` only if a new line style is needed.
- `examples/product-site/data/`: one example graph with a case input and an `applicable_when`.
- `tests/product-site.test.mjs`, `tests/node-exports.test.mjs`: new and regression cases.
- `dist/`: rebuilt by the gate; `README.md` and `CHANGELOG.md`: the new shapes.

## Verification

`npm ci --ignore-scripts` and `npm run gate` on the exact commit; the pull request's CI.

## Planning boundary

One story, one unit; no decomposition. The specification of this contract is the JSON Schema in
`schema/`: this repository is documentation tooling, which the workspace rule exempts from an ESS
domain, and it has no ESS specification. Emitting the new shapes from compiled protocols belongs
to the producing repository, not here. Outcome `decision` requirements are out of scope.
