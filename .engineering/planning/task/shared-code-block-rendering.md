---
format: aep.planning-md/1
id: task:shared-code-block-rendering
kind: task
status: implemented
title: Polish shared code-block rendering
summary: Make supported documentation fences readable, resilient, and consistent across light, dark, and narrow layouts.
owner: docs-system
tags:
- code
- presentation
refs:
- provider: repository
  reference: https://github.com/beyond10x/website
- provider: website-artifact
  reference: story:site-wide-code-fence-rendering-audit
revision: 5
---
# Polish shared code-block rendering

## Responsibility split

The Website-owned `story:site-wide-code-fence-rendering-audit` audits source fences and the integrated site. This Docs System task owns only the reusable language normalization, shared CodeBlock wrappers, and design tokens consumed by Website and future Docusaurus surfaces.

## Acceptance

- Canonical and aliased languages retain one stable presentation label and semantic kind.
- Shared examples expose that metadata without changing source bytes or copy payloads.
- Docusaurus Prism fences remain readable in light and dark themes, preserve horizontal scrolling for long lines, and keep controls usable on touch and narrow viewports.
- Focused component and CSS contract tests cover the shared behavior.
