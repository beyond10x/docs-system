---
format: aep.planning-md/3
id: story:article-code-and-table-text-is-at-least-14-px
kind: story
status: draft
title: Code, table headers and status chips in articles are at least 14 px
summary: 'Commands and table headers render under 14 px on a product site: code 13.12 px, chips 11.23 px, table headers 10.88 px'
tags:
- defect
- ux
revision: 1
---
# Story: code, table headers and status chips in articles are at least 14 px

## Outcome

Text a reader has to read or copy inside an article is set at 14 px or more: code blocks, table
headers and the chips that state a verdict.

## What was seen

Measured on Substrate's site (this package at `b2729c0`) on 2026-11-22, round R-02, at 1280x800.

- Code blocks: 13.12 px, 2,911 words on 10 pages.
- Table headers: 10.88 px, 172 words on 14 pages.
- Verdict chips in matrices: 11.23 px, 336 words.
- The section list: 12.8 px on 20 pages.

Substrate's record: `website/ux/findings/UXF-015.md` in the repository `substrate`. Substrate
raises code blocks and table headers in its own stylesheet as of that round; that override goes
when this story is done.

## Where the requirement comes from

Heuristic 15 of the loop: readable in every theme, 14 px. Stakeholder: the operator.

## What changes

The sizes of code blocks, table headers and chips. Wider chips widen a matrix: Substrate's fact
matrix already has 269 px outside its scroll region at 1280x800, so the chip size is decided
together with the matrix's layout.

## Acceptance

On the fixture site no text node inside an article's code block, table header or chip computes
under 14 px, and no fixture table is wider than before.
