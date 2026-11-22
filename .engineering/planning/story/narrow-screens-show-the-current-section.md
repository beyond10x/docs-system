---
format: aep.planning-md/3
id: story:narrow-screens-show-the-current-section
kind: story
status: draft
title: A narrow screen shows which section the reader is in
summary: Below 997 px a reader deep in a long page sees no page title, no section name and no section list; decided by the operator as this package's to fix
tags:
- defect
- ux
revision: 1
---
# Story: a narrow screen shows which section the reader is in

## Outcome

Below 997 px, a reader anywhere in a docs page can see which section they are in and reach the
page's section list in one action.

## What was seen

Measured on Substrate's site (this package at `b2729c0`) on 2026-11-22, round R-02, at 390x844 (a
narrow Chromium window, no touch).

- "On this page" is a closed disclosure at the top of the article. Further down nothing names the
  page or the section.
- The loop's screen-only bot needs 2 extra actions to reach a task's section on 4 of 7 tasks.
- Page heights at that width: 25 screens (guides/confinement-profiles), 24.4 (guides/deployment),
  20.4 (reference/contract). One task's section starts 13,137 px down.

Substrate's record: `website/ux/findings/UXF-011.md` in the repository `substrate`.

## Where the requirement comes from

The operator's decision of 2026-11-22, 22:48 CET, relayed by session `host-operator`, to the
question whether Substrate should carry its own copy of the section-list component with a bar:
"No: Docs System fixes it". Substrate keeps no copy; the finding is this package's.

## What changes

Below 997 px "On this page" stays under the header as a bar that shows the current section and
opens the section list. The exact form is this story's design step.

## Acceptance

On the fixture site at 390x844, scrolled to the middle of its longest page: the current section's
name is in the viewport, and one action opens the section list.
