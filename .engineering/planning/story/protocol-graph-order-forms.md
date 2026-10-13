---
format: aep.planning-md/3
id: story:protocol-graph-order-forms
kind: story
status: active
title: Carry Canon order forms in protocol graphs
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
  path: tests/product-site.test.mjs
revision: 4
transitions:
- {from: "draft", to: "proposed", at: "2026-10-13T02:47:53Z", actor: "human:timo", revision: 3}
- {from: "proposed", to: "active", at: "2026-10-13T02:47:53Z", actor: "human:timo", revision: 4}
---
# Carry Canon order forms in protocol graphs

## Outcome

A `b10x-protocol-graph/1` document can carry the two order-form predicate leaves Canon 0.3.0
added to `protocol/1`, and the `ProtocolGraph` component validates and shows them, so a protocol
whose obligations depend on the order of evidence renders as a graph. Every graph that validates
today still validates and renders the same.

Canon 0.3.0: https://github.com/beyond10x/canon/releases/tag/0.3.0 (`first: {kind, result}`,
`before: {first, then}`, each with an optional `subject`; scenario CANON-ORDER-001).

## Acceptance

Given a protocol graph whose predicates use a `first` leaf and a `before` leaf, with and without
a `subject`, when the schema, the component's validation and the component's text rendering read
it, then all three accept it and the rendered predicate lines name the kinds, the result and the
subject; given a `before` naming one kind twice or an order form with an unknown or missing field,
the component refuses it naming the path; and given every committed protocol-graph fixture and
example from before the change, the same checks accept them and render the same lines.

## Required observations

- Predicate leaf `{"first": {"kind": <kind>, "result": <result>, "subject": <artifact>?}}`, in the
  shape `canon-ir/1` writes: `kind` and `result` required non-empty strings, `subject` an optional
  non-empty string, written only when present; no other field.
- Predicate leaf `{"before": {"first": <kind>, "then": <kind>, "subject": <artifact>?}}`: `first`
  and `then` required non-empty strings, `subject` optional as above; no other field.
- Both join all/any/not/claim/evidence/input in the schema's predicate `oneOf` and in the
  component's `predicate` check; usable wherever a predicate is (node predicates, an obligation's
  `applicable_when`, nested in all/any/not).
- The component refuses a `before` whose `first` and `then` are the same kind, naming the path
  (Canon's `self-ordered-evidence`); the schema cannot compare the two and does not try.
- Predicate text: `first` reads as `first evidence = <result>: <kind>`; `before` reads as
  `evidence <first> before <then>`; either adds `about <subject>` when it names one. The kind
  stays the line's `reference`, as for an evidence leaf.
- Existing graphs: schema, validation and rendering output unchanged (regression test over the
  committed fixtures and examples, including the predicate-line snapshot).
- No new node or edge kind.

## Scope

- `schema/b10x.protocol-graph.v1.schema.json`: the contract, changed first.
- `src/product-graphs.ts`: types, validation, `predicateLines`.
- `src/charts.tsx` / `src/product.tsx` only if rendering needs a change beyond the lines.
- `examples/product-site/data/`: one example graph using both order forms.
- `tests/product-site.test.mjs`: new and regression cases.
- `dist/`: rebuilt by the gate; `README.md` and `CHANGELOG.md`: the new shapes.

## Verification

`npm ci --ignore-scripts` and `npm run gate` on the exact commit; the pull request's CI.

## Planning boundary

One story, one unit; no decomposition. The specification of this contract is the JSON Schema in
`schema/`: this repository is documentation tooling, which the workspace rule exempts from an ESS
domain, and it has no ESS specification. Emitting the forms from compiled protocols belongs to the
producing repository. A `subject` on an evidence leaf is not part of this story.
