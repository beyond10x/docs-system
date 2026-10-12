---
format: aep.planning-md/3
id: decision-blocker:protocol-graph-inputs-wave
kind: decision-blocker
status: cleared
title: Approve wave protocol-graph-case-inputs
relations:
- blocks: story:protocol-graph-case-inputs
revision: 3
transitions:
- {from: "open", to: "cleared", at: "2026-10-12T21:35:45Z", actor: "human:timo", revision: 3}
---
# Approve wave protocol-graph-case-inputs

## Question

Approve wave `protocol-graph-case-inputs`: one unit, `story:protocol-graph-case-inputs`, one
integration branch and one pull request, followed by a minor release (0.9.0).

## Open point

The input predicate leaf takes the `canon-ir/1` form `{"input": {"id": …, "in": [...]}}`, which
matches how the format already writes claim and evidence leaves. A flat form
`{"input": <id>, "in": [...]}` was also requested; the nested form is the proposal.

## Resolution

Approved: wave protocol-graph-case-inputs, one unit, input leaf in the canon-ir/1 form `{"input": {"id": …, "in": [...]}}`, followed by release 0.9.0. One implementor, no adversary.
