---
format: aep.planning-md/3
id: approval-record:shared-ess-contract-viewer-wave-2026-10-29
kind: approval-record
status: approved
title: 'Wave approved: shared ESS contract viewer at ESS 0.77.0'
tags:
- non-interactive
relations:
- decides: story:shared-ess-contract-viewer
revision: 2
transitions:
- {from: "draft", to: "approved", at: "2026-10-29T20:51:38Z", actor: "human:timo", revision: 2}
---
# Wave approval: shared ESS contract viewer at ESS 0.77.0

## Decision

The orchestrator session approved this wave under the operator's standing grant for class-C items
(decision D221, 2026-10-29 20:39Z). Its words: "implement the active story
story:shared-ess-contract-viewer as one wave through /aep:implementing. Add any other accepted,
unblocked docs-system stories that fit, up to 4 units. Move ESS to 0.77.0 in the same wave if the
repository pins it. Release through the repository's own process."

## Units

- story:shared-ess-contract-viewer. The viewer itself shipped in 0.8.0 (commit 03986fa). What its
  acceptance still lacked was a run against the projections the consumers generate today: the
  fixtures were ESS 0.25.0 output. The unit regenerates both fixtures with ESS 0.77.0 and runs the
  unit and browser suites against them.

No other story is accepted: the five other stories and the epic are draft. The repository pins no
ESS release (no `b10x.toml`, no ESS crate); the ESS move is the fixture regeneration above.

## Commits this approval covers

One unit commit, one release commit (store records, CHANGELOG, version 0.14.1), one pull request
merged through the bot, one annotated tag and one GitHub Release, all as b10x-bot. No registry
publishing: the package is not published to npm.

The run is non-interactive: the approval came from the orchestrator, no operator turn.
