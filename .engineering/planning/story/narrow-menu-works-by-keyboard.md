---
format: aep.planning-md/3
id: story:narrow-menu-works-by-keyboard
kind: story
status: draft
title: The navigation menu on a narrow screen works by keyboard
summary: Below 997 px the opened menu leaves two focus stops covered and does not close on Escape
tags:
- defect
- ux
revision: 1
---
# Story: the navigation menu on a narrow screen works by keyboard

## Outcome

Below 997 px a reader who opens the navigation menu by keyboard has focus inside the menu, meets
no focus stop that the menu covers, and closes the menu with Escape.

## What was seen

Measured on Substrate's site (this package at `b2729c0`) on 2026-11-22, round R-02, at 390x844.

- After the menu is opened by keyboard, two focus stops are under the menu.
- Escape leaves the menu open.

Substrate's record: `website/ux/findings/UXF-021.md` in the repository `substrate`.

## Where the requirement comes from

Hard gate 5 of the loop: the task can be completed by keyboard alone. Stakeholder: the operator.

## What changes

Focus moves to the menu's close button when the menu opens, the page behind the menu takes no
focus while it is open, and Escape closes it and returns focus to the menu button.

## Acceptance

On the fixture site at 390x844 a keyboard run opens the menu, tabs through its links without a
covered stop, and closes it with Escape, held by a test of the gate.
