---
format: aep.planning-md/1
id: task:conservative-code-span-boundaries
kind: task
status: implemented
title: Keep passive MDX checks conservative at block boundaries
summary: Never infer an inline-code span across a line boundary where Markdown may parse executable flow MDX.
owner: docs-system
tags:
- collector
- security
refs:
- provider: website-artifact
  reference: story:site-wide-code-fence-rendering-audit
relations:
- derived_from: task:passive-mdx-code-span-scanner
revision: 7
---
# Keep passive MDX checks conservative at block boundaries

## Failure

Equal-length backticks on different lines are not enough to prove one CommonMark code span. Markdown block structure can end the paragraph and parse intervening uppercase tags as executable MDX. A scanner that removes the whole range creates a false negative.

## Acceptance

- Only parser-confirmed MDX `code` and `inlineCode` nodes are masked before passive-MDX validation; frontmatter is removed separately.
- A legal line break inside one code span is masked, but delimiter runs interrupted by an MDX flow element or block boundary cannot hide that element.
- Malformed would-be fences and backticks inside HTML or MDX attributes cannot hide executable components.
- Every parser-confirmed MDX JSX name that is not a plain lowercase HTML name is checked against the declared shared-component vocabulary, including `_`, `$`, Unicode, and member names.
- The legal AEP backtick-in-code pattern and its later `<MODEL>` shell placeholder pass; existing executable-MDX refusals and the full Docs System suite pass.
