---
format: aep.planning-md/3
id: task:ux-round-r02
kind: task
status: draft
title: UX round R-02 change set
summary: UXF-012, UXF-014, UXF-019 and UXF-013 built failing-first; UXF-007 waits on R-02's decision. R-02 measured six real product sites.
tags:
- ux
relations:
- decomposes: story:ux-iteration-loop
revision: 1
---

# Task: UX round R-02 change set

## What

The five changes of round R-02 (`ux/rounds/R-02/triage.md`): the always-visible check measures the scrolling column of a tall sidebar (UXF-012), the screen-only user reads a link's rendered words (UXF-014), the landing hero starts at the top of its block (UXF-019), documentation cards wrap their text (UXF-013), and the type-floor decision for UXF-007.

## Why

Serves `story:ux-iteration-loop`: R-02 ran the loop on the ess, connectors, aep, inference, llm and spindle sites, and the changes go into the shared theme and tool so every site benefits.

## Done When

The regression assets (`tests/ux-checks.browser.mjs` UXF-012, UXF-014, UXF-019; `tests/ux-r02.test.mjs` UXF-013) pass after failing on the 0.15.0 build, `npm run gate` and `npm run test:browser` are green, and the target metrics in `ux/rounds/R-02/report.md` move as stated in `triage.md`.

## Notes

Round files are in `ux/rounds/R-02/`. UXF-007 waits for `decision.md`; its default is yes.
