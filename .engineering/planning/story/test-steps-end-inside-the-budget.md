---
format: aep.planning-md/3
id: story:test-steps-end-inside-the-budget
kind: story
status: draft
title: The test steps end inside the test budget and the runner ends a test at 60 s
revision: 2
---
## Outcome

The test steps of this repository end inside the organization's test budget: the test step of the
gate within 120 s, no single test over 60 s, and the runner ends a test that runs longer.

## Context

Measured on a shared workstation at a load average between 55 and 78, on `main` at `081e05f` and
on the branch `feat/api-reference` (2026-11-22):

- `npm test` (`node --test tests/*.test.mjs`): 124 s on `main`, 161 s on the branch (228 tests).
- The example site build (`tests/ux/build-example.mjs`): 390 s and 508 s on `main`, 376 s on the
  branch.
- `tests/ess-viewer.browser.mjs`: up to 298 s on `main`, 410 s on the branch. It builds a site of
  its own.
- `npm run ux:gate`: 236 s on `main`.
- `tests/product-site.browser.mjs`: 89 s on `main` with the site already built, 196 s on the
  branch.

`npm run test:browser` runs the four browser parts in series and CI gives the job 15 minutes
(`.github/workflows/gate.yml`). No runner in this repository ends a test at a bound: `node --test`
runs without `--test-timeout`, and the browser files set no limit per check.

Three checks of `tests/product-site.browser.mjs` read state an effect sets after a fixed wait of
200 to 300 ms and failed on `main` at this load: #22 (twice), #26 and #27 (twice each, in two
runs). The branch `feat/api-reference` makes these three wait for `data-has-hydrated`. Other
checks of the file still wait a fixed time (`waitForTimeout`).

The ux run has the same wait: `settle` in `src/ux/checks.ts` waits for the fonts and then 400 ms.
One `npm run ux:gate` on the branch at a load average of 130 ran 1,221 s and reported 27 problems.
A run of the same branch at a lower load 6 hours earlier reported 8. The 19 others: 2 lines of
`scrollable-region-focusable` on 10 tables that get their region from an effect (8 on one page in
the dark theme, where the light theme of the same page passed) and the 2 `axe.serious_critical`
values they give, 2 screen-only runs that did not complete, 12 scenario values and 1 layout shift
of 0.011.

## Acceptance

- `npm test` ends within 120 s on the shared workstation, and `node --test` runs with a
  `--test-timeout` of 60 s.
- The example site is built once per browser run and every browser file reads that build;
  `tests/ess-viewer.browser.mjs` builds no second site.
- Each browser check has a limit of 60 s and a check over the limit counts as failed.
- The browser step prints its ten slowest checks.
- No check of `tests/product-site.browser.mjs` reads state an effect sets after a fixed wait.
- The ux run reads a page after it hydrated where the page says so (`data-has-hydrated`), and
  gives the same metrics at a load average of 100 as on an idle machine.
