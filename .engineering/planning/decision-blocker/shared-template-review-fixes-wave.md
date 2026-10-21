---
format: aep.planning-md/3
id: decision-blocker:shared-template-review-fixes-wave
kind: decision-blocker
status: cleared
title: Approve wave shared-template-review-fixes
relations:
- blocks: story:shared-template-review-fixes
revision: 3
transitions:
- {from: "open", to: "cleared", at: "2026-10-21T20:07:29Z", actor: "human:timo", revision: 3}
---
# Approve wave shared-template-review-fixes

## Question

Approve wave `shared-template-review-fixes`: one story, `story:shared-template-review-fixes`,
eight units (#19-#26) on one integration branch `wave/shared-template-fixes`, one pull request,
and a minor release 0.11.0 (new optional `product.json` field and new theme overrides).

## Units

| unit | issue | surface |
|---|---|---|
| hero terminal visible | #19 | `src/product.tsx` |
| new-tab label on hero actions | #20 | `src/product.tsx` |
| home title names the product once | #21 | `src/theme/ProductLandingPage.tsx` |
| tables scroll inside their column | #22 | `src/theme/MDXComponents.tsx`, `styles/` |
| code toolbar clear of first line | #23 | `styles/` |
| TOC code headings | #24 | `src/theme/TOCItems/`, `styles/` |
| description and card image | #25 | `src/product-site.ts`, schema, `styles/static/` |
| 404 links | #26 | `src/theme/NotFound/` |

One tree off `main`, gate `npm ci --ignore-scripts && npm run gate`, units one at a time, one
adversarial pass over the whole diff.

## Resolution

Approved by session `b10x-chef-orchestrator` on 2026-10-21 under exception 6 of the workspace
rules: the wave fixing #19-#26, its commits, push, pull request and merge through the bot route,
and release 0.11.0 through this repository's process. Not covered: consumer pin moves, Website or
Atlas changes, façade redeploys, npm publishing.
