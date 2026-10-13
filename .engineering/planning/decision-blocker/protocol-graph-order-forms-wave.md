---
format: aep.planning-md/3
id: decision-blocker:protocol-graph-order-forms-wave
kind: decision-blocker
status: cleared
title: Approve wave protocol-graph-order-forms
relations:
- blocks: story:protocol-graph-order-forms
revision: 2
transitions:
- {from: "open", to: "cleared", at: "2026-10-13T02:47:53Z", actor: "human:timo", revision: 2}
---
# Approve wave protocol-graph-order-forms

## Question

Approve wave `protocol-graph-order-forms`: one unit, `story:protocol-graph-order-forms`, one
integration branch `wave/protocol-graph-order-forms` and one pull request, followed by a minor
release (0.10.0) for the new accepted shapes.

## Units

| unit | tree | gate | expected build size |
|---|---|---|---|
| story:protocol-graph-order-forms | one managed tree off `main` | `npm ci --ignore-scripts`, `npm run gate` | under 2G (node_modules and one Rust test crate) |

One implementor, no adversary: an additive schema change with a regression test.

## Resolution

Approved up front: one story, additive schema leaves `first` and `before` in the canon-ir/1
shape, rendered by `ProtocolGraph`, release 0.10.0 as a minor for new accepted shapes.
