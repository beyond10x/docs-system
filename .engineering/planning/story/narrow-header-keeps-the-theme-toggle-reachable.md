---
format: aep.planning-md/3
id: story:narrow-header-keeps-the-theme-toggle-reachable
kind: story
status: draft
title: The theme toggle on a narrow screen is where a reader finds it
summary: Below 997 px the theme toggle is not displayed until the menu is opened; Substrate recorded it as a known loss of the shared header
tags:
- defect
- ux
revision: 1
---
# Story: the theme toggle on a narrow screen is where a reader finds it

## Outcome

Below 997 px a reader can change the theme without first guessing that the toggle is inside the
navigation menu, or the package states that one action through the menu is the intended cost.

## What was seen

Measured on Substrate's site (this package at `b2729c0`) on 2026-11-22, round R-02.

- No theme toggle is displayed on load on 21 of 21 docs pages at 390x844 and 768x1024, in both
  themes. One action, the menu button, shows it.
- The five header links are behind the same menu at those widths.

Substrate's record: `website/ux/findings/UXF-020.md` in the repository `substrate`, status
`known-loss`: that round took the menu button as the always-visible control below 997 px.

## Where the requirement comes from

The loop's rule that the adapter's always-visible elements are inside the viewport at every state
change; for a docs site the theme toggle is one of them. Stakeholder: the operator.

## What changes

A decision first: the toggle beside the menu button below 997 px, or the menu as the stated
place. Then the header follows it.

## Acceptance

The decision is recorded in this story, and the fixture site at 390x844 holds it by a test.
