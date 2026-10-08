---
format: aep.planning-md/3
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
revision: 8
transitions:
- {from: "draft", to: "proposed", at: "2026-09-03T14:07:55Z", actor: "human:timo", revision: 2, imported: true}
- {from: "proposed", to: "active", at: "2026-09-03T14:07:55Z", actor: "human:timo", revision: 3, imported: true}
- {from: "active", to: "implemented", at: "2026-09-03T14:08:28Z", actor: "human:timo", revision: 4, decided_on: {"recorded":{"test_result":1}}, imported: true}
---
# Keep passive MDX checks conservative at block boundaries

## Failure

Equal-length backticks on different lines are not enough to prove one CommonMark code span. Markdown block structure can end the paragraph and parse intervening uppercase tags as executable MDX. A scanner that removes the whole range creates a false negative.

## Acceptance

- Parse `.md` as Markdown plus GFM and `.mdx` as MDX plus GFM, matching the Website's Docusaurus format split.
- Only parser-confirmed `code` and `inlineCode` nodes are masked before passive validation; frontmatter is removed separately.
- Legal HTML comments in Markdown remain inert, while malformed would-be fences, block boundaries, and backticks inside attributes cannot hide executable MDX.
- Every parser-confirmed MDX JSX name that is not a plain lowercase HTML name is checked against the declared shared-component vocabulary, including `_`, `$`, Unicode, and member names.
- The AEP CLI page and Agent Platform README validate; existing executable-MDX refusals and the full Docs System suite pass.
