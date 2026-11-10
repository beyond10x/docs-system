# R-02 report review

Verdict: not fit to send as is. Default action: fix the median column and the gate 2 sentence, add the aep and llm bot failures and the narrow-viewport bot timeouts, then send with the § 4 caveats.

Method: recomputed from the six `shots/sites/<repo>/round.json` files (views, bots, failures_gating), without running any build, browser or network call. Gating viewports 1366x768 and 1280x720, both themes. Tool source `src/ux/{round,run,checks,screen-only}.ts`.

## 1 Are the numbers right and meaningful?

Recomputed table, all columns equal the report except where marked.

| site | pages | gate failures | hidden | axe s+c nodes | overflow | truncated (all vp) | bot incomplete | pointer median |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ess | 14 | 15 | 8 | 0 | 0 | 6 | 1/12 | 7 reported; 11 at gating viewports; 6.5 in round.json |
| connectors | 14 | 86 | 86 | 0 | 0 | 4 | 0/6 | 3 |
| aep | 14 | 78 | 48 | 52 | 0 | 0 | 6/6 | "-" reported; 4 in round.json (all four are failed runs) |
| inference | 14 | 104 | 104 | 0 | 0 | 0 | 0/6 | 2 |
| llm | 14 | 110 | 104 | 0 | 0 | 0 | 6/6 | "-" reported; 17 in round.json (failed runs) |
| spindle | 12 | 0 | 0 | 0 | 0 | 0 | 0/6 | 2 reported; 1.5 at gating viewports |

Numbers that differ:

- Median, ess: report 7 = median of completed pointer runs at all 7 viewports. Gating-only it is 11 (find-format-version 15 to 16, find-install-command 6 to 7). round.json headline says 6.5 (includes four failed runs that count as 0 actions). Three definitions for one cell.
- Median, spindle: report 2 (all viewports); gating viewports 1.5.
- Median, aep and llm: report "-", round.json headline 4 and 17. Both are runs that never completed.
- Every other cell matches, including the 15, 86, 78, 104, 110 gate failures and 52 axe nodes.
- The table header says "Counts at 1366x768 and 1280x720" but truncated (stated "all viewports") and the median (all viewports, completed only) are not at gating viewports. Median scope is not stated.

Meaning:

- `hidden` is a count of entries, not elements. One sidebar fails once at load and once per scroll state, so each failing page counts about twice per view. ess has 1 failing page (/docs/guides), shown as 8. "Hidden 104" on inference is 13 pages, not 104 problems.
- All gate 2 failures in all six sites are the one `sidebar` rule (16, 212, 120, 260, 260 entries over all views). The report says gate 2 fails "on every docs page of ess, connectors, inference, llm and aep". By page: ess 1, aep 6, connectors 12, inference 13, llm 13 pages. The sentence is wrong for ess, aep and connectors.
- "bot runs incomplete 0/6" for connectors, inference, spindle is real; but the "completed" flag with a 16-action cap and card maxActions 6 means a pass can still fail gate 4 on length. ess: 6 of its 15 gate failures are pointer runs over the card's 6 actions, 1 is the keyboard failure, 8 are the sidebar. The report names only the keyboard failure.
- Gate 1 and gate 5 sit at 1366x768 and 1280x720 only, so overflow "0 (gating)" for aep hides 16 overflow entries at 390x844 and spindle/others are never gated on a phone. Not a number error; it makes "overflow 0" read cleaner than it is.

## 2 Findings the report misses

- aep: all 6 gating bot runs (and all 21) fail with "no visible link toward docs/getting-started from /aep" after 4 PageDowns. The landing page shows no link to getting started. The report has a "-" and no sentence; this is the card's whole result for aep.
- llm: the bot scrolls 17 times on the landing page and stops at the cap; it never reaches the bottom or a link. The report says the card "cannot find a getting-started path ... three landing actions"; the trail shows 17 PageDown and no click, so the cause is landing page length plus a cap of 16, not three actions.
- Narrow viewports: at 768x1024 and 390x844, every pointer run on ess (find-format-version), aep and llm times out in `page.click` (30 s, 0 actions, empty trail). 12 runs on ess, aep and llm. The cause (menu toggle not clickable) is unreported. Keyboard runs at the same viewports stop at 18 actions.
- ess has 12 incomplete runs at narrow viewports, reported as 7 in round.json's headline.
- The ess find-format-version card takes 15 to 16 pointer actions at gating viewports, of which 10 to 13 are PageDown on the landing page; the report names 15 actions but not that the landing page is the cost.
- connectors has 2 serious axe nodes at a non-gating viewport (UXF-018 named) and CLS 0.037 on connectors, the only site with layout shift besides spindle's 0.002; neither is in the table.
- Search: "absent 196" is the same optional rule 14 views x 14 pages; it adds no signal per site.

## 3 Tool defects

- T1 `src/ux/checks.ts` (always-visible `column` search): the loop starts at `element.parentElement`, so a sidebar that is itself the scrolling box is measured as its full 12,94..278,893 height. Input: ess /docs/guides, 1366x768, "sidebar: 12,94..278,893 outside 1366x768". It produces all 212+ false gate 2 failures (UXF-012 open).
- T2 `src/ux/run.ts` (gate 2 scroll loop, `facts.hidden.push`): the same element is reported once at load and once for the first scroll step, so one defect counts about twice per view and `hidden` counts states, not elements. Input: ess /docs/guides, 8 entries for 1 page.
- T3 `src/ux/round.ts` (`headline.screen_only_actions_median`): takes every pointer run at every viewport, completed or not, both cards; a caught error becomes 0 actions. Input: ess 6.5 against 7 (completed) and 11 (gating); aep 4 and llm 17 for runs that never finished.
- T4 `src/ux/round.ts` (headline): only all-view totals; no gating-only hidden, axe, truncated, bot or median, so the report's per-site table cannot be produced by the tool and was assembled by hand. Input: every round.json headline has `hidden_all` and no gating counterpart.
- T5 `src/ux/screen-only.ts` (`MAX_ACTIONS = 16`): hard-coded, while `card.expectations.maxActions` is 6 and is applied only in `gateFailures`; the reason "more than 16 actions" hides that a card over 6 already fails. Input: llm find-first-command 17 actions, card maxActions 6.
- T6 `src/ux/screen-only.ts` (menu open: `page.click(adapter.menuToggle)`): no timeout and no catch, so a toggle that cannot be clicked waits 30 s and throws; `run.ts` records 0 actions and an empty trail. Input: ess, aep, llm at 768x1024 and 390x844, "page.click: Timeout 30000ms exceeded".
- T7 `src/ux/screen-only.ts` (`words()` accessible-name rebuild): inline children are joined without a space, which can differ from the browser's name and fails the run on a name the browser accepts. Input: ess find-install-command keyboard 1366x768 light, "NextInstall ess" (UXF-014).
- T8 `src/ux/run.ts` (`metricsOf`, `screen_only.incomplete`): counts only pointer runs, so keyboard failures never reach the ratchet. Input: ess 1366x768 keyboard failure; `find-install-command@1366x768` `screen_only.incomplete` is 0.
- T9 `src/ux/round.ts` (`lastRound`, `appendTrend`): the previous round is only `R-nn` and rows are `R-\d+`, so a per-site round (name `ess`) gets "last round: –" for every metric and no trend row; `rows.sort()` also orders R-10 before R-2. Input: shots/sites/*/round.json `"round": "ess"`; ux/rounds/trend.md has R-01 only. The R-01 trend row says 2520 axe nodes while R-01's round.json and report say 70 (rule hits).

## 4 Caveats to send with the round

- Pre-change measurement; every site's gate 2 count is one sidebar rule (T1), not many defects.
- No people, recordings, questionnaire or L4 to L6; the bot is the only trial.
- Gating viewports are desktop only; 390x844 results (aep overflow, ess/aep/llm bot timeouts) are measured, not gated.
- Medians mix two cards (ess) and three definitions; read per scenario in each site's report.md.
- Commits are `-dirty` builds of each repo's origin/main with a docs-system tarball pin.
- Pages: first 14 of 12 to 166 sitemap pages per site, so site-wide claims are samples.
