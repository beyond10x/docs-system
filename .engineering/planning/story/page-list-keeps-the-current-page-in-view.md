---
format: aep.planning-md/3
id: story:page-list-keeps-the-current-page-in-view
kind: story
status: draft
title: The page list keeps the current page in view
summary: On a desktop screen the page list is taller than its box, the current page's link can be below it, and the list slides under the header at page bottom
tags:
- defect
- ux
revision: 1
---
# Story: the page list keeps the current page in view

## Outcome

On a docs page at desktop widths the link of the current page is inside the page list's visible
box when the page has loaded, and the list does not move under the header when the reader reaches
the bottom of the page.

## What was seen

Measured on Substrate's site (this package at `b2729c0`) on 2026-11-22, round R-02, both themes.

- At 1280x800 the page list is 226 px taller than its box on 21 of 21 docs pages (126 px at
  1440x900, 258 px at 1024x768); 5 of 21 links are below the box on load.
- The current page's link is outside the box on 5 of 21 pages (the last five of the list). It
  carries `aria-current`, so a test for the marker passes while the reader does not see it.
- At page bottom 194 to 201 px of the list are above the viewport on 21 of 21 docs pages at
  1280x800, 1440x900 and 1024x768.

Substrate's record: `website/ux/findings/UXF-010.md` in the repository `substrate`.

## Where the requirement comes from

The loop's rule that the always-visible elements are inside the viewport at every state change,
and its heuristic "focus follows the work". Stakeholder: the operator.

## What changes

The current link is scrolled into the list's box on load, and the list's top stays at the
header's lower edge for the whole page.

## Acceptance

On the fixture site at 1280x800: on every page the element with `aria-current="page"` is inside
the list's box on load, and at page bottom no part of the list is above the header's lower edge.
