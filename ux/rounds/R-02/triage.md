# R-02 triage

Applied by rule (SKILL § 3.3) by the session that ran the round, without a person.

## Caveats

- The report reviewer judged the first `report.md` not fit to send as is (`review-report.md`). Fixed in `report.md` before this triage: the median column (now gating viewports, completed pointer runs, stated), the gate 2 sentence (by failing page, not "every page"), the aep and llm bot failures and the 12 narrow-viewport timeouts (listed under the table).
- Tool defects the reviewer found: T1 (the sidebar column search skipped the element itself) and T7 (the bot's link name) are fixed in this change set with UXF-012 and UXF-014. Not fixed, left for R-03: T2 (`hidden` counts one element once per scroll state), T3 and T4 (round headline medians and totals are all-views, so the per-site gating table is made by a script outside the tool), T5 (the bot's 16-action cap is not the card's limit), T6 (the bot's menu click has no timeout: 12 runs on ess, aep and llm at 768x1024 and 390x844 report 30 s timeouts and no trail), T8 (`screen_only.incomplete` counts pointer runs only), T9 (the trend row rule accepts only `R-nn` names).
- The sites are measured on at most 14 pages each (12 to 166 in the sitemap), chosen by rule (landing, `/docs`, card targets, then one page per top-level section in turn). Frequencies below are sites over the six measured sites, or runs over runs.
- connectors builds only with `npx docusaurus build`: its `npm run build` runs `cargo` twice (the examples step before, a docs audit after), which stalled for more than 20 minutes on this host. The site content was the one in `website/` on origin/main; the audit was not run.
- The `aep` site does not use `withProductSite`; its defects (UXF-017) are its own styles.
- Every scenario result comes from the deterministic screen-only user. No people, recordings, questionnaire or paid levels (L4, L5, L6).

## Did the last change sets move their metrics?

| R-01 change | target metric | R-01 | R-02 (spindle, ess, connectors, inference, llm at gating viewports) |
| --- | --- | --- | --- |
| UXF-001 graph node names | `axe.serious_critical` | 252 nodes at gating views | 0 on all five sites that use `withProductSite` |
| UXF-002 chart marks | same | | 0 |
| UXF-003 prose links | same | | 0 on the five; aep (own styles) 52 |
| UXF-005 search | `layout.optional_missing` | 12 per view | unchanged, 12 per view on every site; decision unanswered, default no |
| UXF-007 type floor | key data under 14 px | open | decision requested again, see `decision.md` |

## Priority

`priority = severity weight x frequency x confidence / cost`. A finding that fails a hard gate at a gating viewport is S1.

| id | finding | sev | frequency | conf | cost | priority | decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UXF-012 | sidebar that scrolls in its own column reported hidden | S1 | 5/6 sites | 2 | S | 15 | in (S1) |
| UXF-014 | bot joins words of a block link | S1 | 1/6 sites | 2 | S | 3 | in (S1) |
| UXF-019 | hero primary action below the first screen | S2 | 6/6 | 1 | S | 3 | in |
| UXF-007 | key data under 14 px | S2 | 6/6 | 1 | M | 1.5 | in, waits for `decision.md` |
| UXF-013 | cards cut title and description | S3 | 2/6 | 2 | S | 0.67 | in |
| UXF-020 | phone: breadcrumb and "On this page" push the title down | S3 | 6/6 | 1 | M | 0.5 | later |
| UXF-004 | terminal title cut | S3 | 2/6 | 1 | S | 0.33 | later (change set full); fix and test were built and run, then taken out |
| UXF-018 | table scroll region not focusable at 390 px | S2 | 1/6 | 1 | M | 0.25 | later: no reproduction |
| UXF-021 | terminal block splits a token | S3 | 2/6 | 1 | M | 0.17 | later |
| UXF-022 | right column shrinks to 100 px at 1024 px | S3 | 1/6 | 1 | M | 0.17 | later: seen only on a contact sheet |
| UXF-011 | 90 key presses for a 12-click task | S3 | 6/6 | 2 | M | 1.0 | later: needs a design decision (skip links), one decision per round |
| UXF-005 | no search | S2 | 6/6 | 2 | L | 1.5 | waits on R-01's `decision.md`, default no |
| UXF-015 | ess landing links no reference page | S2 | input | | | | known loss (rule 5) |
| UXF-016 | llm landing has no "Get started" | S3 | input | | | | known loss (rule 5) |
| UXF-017 | aep own styles | S2 | input | | | | known loss (rule 5) |
| UXF-008 to UXF-010 | template content | S3 | input | | | | known loss (rule 5) |

UXF-007 and UXF-005 tie at 1.5; UXF-007 enters the set (it has this round's decision), UXF-005 stays on R-01's open decision.

## Change set

Five changes, one task: `task:ux-round-r02` under `story:ux-iteration-loop`. Acceptance: the regression assets below pass after failing on the 0.15.0 build, and the target metrics move as stated.

| # | finding | change | regression asset | target metric |
| --- | --- | --- | --- | --- |
| 1 | UXF-012 | the always-visible check measures the scrolling column that holds a tall sidebar | `tests/ux-checks.browser.mjs` check UXF-012 | gate 2 `layout.hidden` on ess, connectors, inference, llm, aep: 350 entries at gating views to 0 |
| 2 | UXF-014 | the screen-only user reads a link's rendered words | `tests/ux-checks.browser.mjs` check UXF-014 | ess `find-install-command` keyboard at 1366x768: failed to done |
| 3 | UXF-019 | the landing hero starts at the top of its block (`align-items: start`, top padding 6rem to 3.5rem) | `tests/ux-checks.browser.mjs` check UXF-019 | landing primary action bottom edge at 1024x768, ess 1148 px in the fixture to inside 768 px |
| 4 | UXF-013 | a documentation card wraps its title and description | `tests/ux-r02.test.mjs` UXF-013 | `layout.truncated` on ess and connectors category pages to 0 |
| 5 | UXF-007 | none until `decision.md` is answered; the default is yes | on yes: a computed-size assertion over the listed classes | type.key_data_under_14px |

Ratchet: `ux gate --update` on the example site passes (12 pages x 2 viewports x 2 themes, 18 screen-only runs) and leaves `ux/baseline.json` byte-identical: none of the five changes moves a template value, and none is worse.
