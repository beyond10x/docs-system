---
format: aep.planning-md/3
id: story:article-links-are-told-from-their-text-without-colour
kind: story
status: draft
title: Links in article text are told from the text around them without colour
summary: 'A link in running text differs from its sentence by colour alone on a product site: contrast 1.03:1 to 2.19:1, no underline'
tags:
- defect
- ux
revision: 1
---
# Story: links in article text are told from the text around them without colour

## Outcome

On a product site built with `withProductSite`, a link inside a paragraph, a list item or a table
cell of an article can be told from the text around it without relying on colour, in the dark and
in the light theme.

## What was seen

Measured on Substrate's site (repository `substrate`, `website/`, this package pinned at
`b2729c0`) on 2026-11-22, round R-02 of its UI iteration loop: Playwright 1.65.0, headless
Chromium, axe-core 4.14.1 with the tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa.

- axe `link-in-text-block` (serious): 73 links on 18 of 22 routes, at 5 viewports, in both themes.
- Contrast of a link with its surrounding text: 1.18:1 and 1.48:1 in the dark theme, 2.19:1 and
  1.03:1 in the light theme. WCAG 1.4.1 needs 3:1 or another cue. The links have no underline.
- The site's own stylesheet was three lines and did not touch link colour, so the values are this
  package's.

Substrate's record: `website/ux/findings/UXF-008.md` in the repository `substrate`. Substrate
underlines article links in its own stylesheet as of that round; that override goes when this
story is done.

## Where the requirement comes from

Hard gate 5 of the UI iteration loop: 0 serious or critical axe violations in every theme. The
operator started the loop on Substrate's site on 2026-11-22. The defect is in this package, so it
is on every site built on it. Stakeholder: the operator.

## What changes

Links in article text carry an underline (or the link colours reach 3:1 against body text in both
themes). The page list, the header, the footer, the section list and pagination cards are not
article text.

## Acceptance

axe `link-in-text-block` reports 0 nodes on the fixture site of this repository in both themes,
held by a test of the gate; a consumer site without a link rule of its own shows the same.
