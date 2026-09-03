---
format: aep.planning-md/1
id: task:code-span-closer-safety
kind: task
status: implemented
title: Keep MDX visible after escaped-looking code-span closers
summary: Match exact closing backtick runs even when code-span content ends in a backslash.
owner: docs-system
tags:
- collector
- security
refs:
- provider: website-artifact
  reference: story:site-wide-code-fence-rendering-audit
relations:
- derived_from: task:passive-mdx-code-span-scanner
revision: 4
---
# Keep MDX visible after escaped-looking code-span closers

## Failure

The first equal-run scanner treated a backslash before a possible closing delimiter as an escape. CommonMark treats backslashes inside an open code span literally, so that delimiter closes the span and any following component remains executable MDX. Ignoring it can mask an undeclared component from validation.

## Acceptance

- A backslash may keep a prose backtick run from opening a code span.
- Once a span is open, its first equal-length run closes it regardless of a preceding backslash.
- One- and two-backtick adversarial cases leave the following undeclared component visible to the validator.
- The exact AEP reference page and the full Docs System suite remain valid.
