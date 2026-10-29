---
format: aep.planning-md/3
id: story:protocol-graph-reader-closed-leaves
kind: story
status: draft
title: The graph reader and schema agree on claim and evidence leaves
summary: 'pre-existing: the reader accepts extra fields in claim and evidence leaves that the schema refuses'
revision: 1
---
## Outcome

The `ProtocolGraph` reader and the `b10x-protocol-graph/1` schema agree on the `claim` and
`evidence` predicate leaves: both refuse an unknown field, or both accept the fields `canon-ir/1`
writes on an evidence leaf (`subject`, `independent_on`).

## Context

The adversary pass on story:protocol-graph-after-form (2026-10-29) found two disagreements that
predate it. In `src/product-graphs.ts` the reader's `claim` branch has no `onlyFields`, so it accepts
`{claim: {id, extra}}`, which the schema refuses. Its `evidence` branch has the same gap, so it
accepts `{evidence: {kind, result, subject}}`, which the schema refuses. Canon's IR writes `subject`
and `independent_on` on evidence leaves, so a generator that copies them through passes the reader
and fails the schema. origin/main at `b2729c0` behaves the same way. Closing either gap changes
what an existing shape accepts, so it needs its own decision and was kept out of the additive
`after` release.

## Acceptance

- The reader and the schema give the same verdict on a claim leaf and on an evidence leaf with an
  extra field, at any depth and in `applicable_when`.
- Every committed protocol graph still validates and renders the same lines.
