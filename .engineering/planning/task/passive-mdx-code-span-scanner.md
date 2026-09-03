---
format: aep.planning-md/1
id: task:passive-mdx-code-span-scanner
kind: task
status: implemented
title: Parse Markdown code spans before passive MDX checks
summary: Prevent legal backtick code spans from shifting passive-MDX tag detection into later prose.
owner: docs-system
tags:
- collector
- markdown
refs:
- provider: website-artifact
  reference: story:site-wide-code-fence-rendering-audit
revision: 6
---
# Parse Markdown code spans before passive MDX checks

## Failure

The passive-MDX collector removes inline code with a single-backtick regular expression. A legal code span that displays a longer backtick run, such as a fenced marker inside inline code, shifts the regex pairing and makes a later shell placeholder such as `<MODEL>` look like an undeclared component.

## Acceptance

- Only parser-confirmed CommonMark `inlineCode` nodes are masked before passive-MDX validation.
- Code spans containing shorter backtick runs or legal line breaks are recognized according to Markdown block structure.
- Unmatched or escaped opening backticks do not hide subsequent executable MDX.
- Backticks inside HTML or MDX attributes are not mistaken for Markdown delimiters.
- The exact AEP reference-page pattern no longer produces a false component finding, while existing passive-MDX refusals remain enforced.
