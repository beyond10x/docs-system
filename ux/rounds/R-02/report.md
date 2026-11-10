# R-02 report

Date 2026-11-10. Measured against docs-system origin/main (81a87b1, 0.15.0, which holds R-01's fixes). Each product site was built from its own origin/main sources with the docs-system pin replaced by a tarball of that commit. Gating viewports 1366x768 and 1280x720; measured-only 1440x900, 1280x800, 1024x768, 768x1024, 390x844; themes light and dark; at most 14 pages per site, taken from the site's sitemap (landing page, `/docs`, each card's target page, then one page per top-level section in turn); the sites have 12 to 166 pages.

Scenario cards: the template's two anchors (`find-adopt-config`, `find-install-command`) keep running on the example site through `ux gate`. The rotating card for R-02 is one task per real site (`ux/sites/<repo>/scenarios/`; ess has two). The user is the deterministic screen-only bot, no person. Skipped: L4 and L5 (paid, no operator approval sought), L6 (no person), L8.

## Per site, gating viewports

Counts at 1366x768 and 1280x720, both themes. `hidden` is gate 2, `axe` gate 5, `bot runs incomplete` gates 4 and 5 (pointer and keyboard).

| site | pages | gate failures (gating) | hidden (gating) | axe serious+critical nodes (gating) | overflow (gating) | truncated (all viewports) | bot runs incomplete (gating) | pointer actions median (gating, completed runs) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ess | 14 | 15 | 8 | 0 | 0 | 6 | 1/12 | 15 |
| connectors | 14 | 86 | 86 | 0 | 0 | 4 | 0/6 | 3 |
| aep | 14 | 78 | 48 | 52 | 0 | 0 | 6/6 | - |
| inference | 14 | 104 | 104 | 0 | 0 | 0 | 0/6 | 2 |
| llm | 14 | 110 | 104 | 0 | 0 | 0 | 6/6 | - |
| spindle | 12 | 0 | 0 | 0 | 0 | 0 | 0/6 | 2 |

Per-site reports, round files, failing checks, contact sheets, worst moments and page shots: `shots/sites/<repo>/`.

## What the numbers say

- Gate 2 fails on docs pages of ess (1 page), aep (6), connectors (12), inference (13) and llm (13) at both gating viewports, always the one `sidebar` rule: `sidebar: ... outside 1366x768`. The sidebar is taller than the screen and scrolls inside its own sticky column, so the check measured the wrong box (UXF-012, S1, engine). `hidden` counts entries (a page fails once at load and once per scroll step), not pages.
- ess: one keyboard run fails on a pagination link the bot named "NextInstall ess" (UXF-014, S1, engine); the format-version card needs 15 actions because the landing page links no reference page (UXF-015, input).
- llm: the bot scrolled 17 times on the landing page and stopped at its action cap; the landing offers "Read the documentation", "What ships today" and no link named for getting started (UXF-016, input).
- aep: every bot run (21 over all viewports) fails with `no visible link toward docs/getting-started from /aep` after 3 to 4 PageDowns: the landing links no getting-started page (UXF-017 covers its styles; the landing is the same input class).
- ess, aep and llm: at 768x1024 and 390x844, 12 pointer runs end with a 30 s click timeout, no trail and 0 actions (the bot's menu click has no timeout; tool defect T6, left for R-03).
- The pointer median column is over completed pointer runs at the gating viewports; `-` means no run completed. The truncated column counts all viewports.
- aep does not use `withProductSite`: its own `custom.css` leaves prose links told apart by colour alone (axe `link-in-text-block`) and lets code run past a 390 px viewport (UXF-017, input).
- Terminal titles and documentation cards cut text with an ellipsis (UXF-004, UXF-013); a table wrapper at 390 px is a scroll region axe finds unfocusable on connectors (UXF-018).
- Search is absent on all six sites; it stays optional (UXF-005, R-01's decision unanswered, default no).

## Template anchors (example site, same tool and CSS after the change set)

Gate passes; the only ratchet lines are improvements (`layout.truncated` 1 to 0 at 390x844 in both themes). Anchor action counts equal R-01's baseline.

## After the change set

The same sites, built the same way against this change set (0.15.1), pages and adapters unchanged, measured with `ux gate` at the two gating viewports in both themes.

| site | pages | gate failures (gating) | hidden (gating) | axe serious+critical nodes (gating) | overflow (gating) | bot runs incomplete (gating) | pointer actions median (gating, completed runs) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ess | 14 | 4 | 0 | 0 | 0 | 0/12 | 14 |
| connectors | 14 | 0 | 0 | 0 | 0 | 0/6 | 3 |
| aep | 14 | 30 | 0 | 52 | 0 | 6/6 | - |
| inference | 14 | 0 | 0 | 0 | 0 | 0/6 | 1 |
| llm | 14 | 0 | 0 | 0 | 0 | 0/6 | 4 |
| spindle | 12 | 0 | 0 | 0 | 0 | 0/6 | 2 |

Headline, gating viewports, six sites: gate failures 393 to 34; gate 2 `hidden` entries 350 to 0; axe serious and critical nodes 52 to 52; overflow 0 to 0; incomplete bot runs 13 to 6. The 34 failures left are all site content: ess's format-version card needs 14 to 15 actions where the card allows 6 (UXF-015, 4), aep's prose links (52 axe nodes, UXF-017) and its landing that links no getting-started page (UXF-017). Truncated text and the missing search are all-viewport counts in the pre-change table and not measured after (the gate visits the gating viewports only).

Target metrics: gate 2 on ess, connectors, inference, llm and aep to 0 (UXF-012); ess `find-install-command` keyboard run at 1366x768 completes (UXF-014); the hero's primary action inside the first screen in the fixture (UXF-019, red at 1148 px of 768, green after). The R-02 effect on the hero and the cards on the six real sites is by the regression assets and the template gate, not re-shot: the after run did not take new page shots.

## Template anchors (example site, same tool and CSS after the change set)

`ux gate --update` passes (12 pages x 2 viewports x 2 themes, 18 screen-only runs) and leaves `ux/baseline.json` unchanged: `find-adopt-config` 2 actions at 1024x768 and 3 at 390x844, `find-install-command` 6 at 390x844, every value as in R-01's baseline.

## Findings

UXF-012 to UXF-022 are filed (`ux/findings/`): 2 S1 (UXF-012, UXF-014), 3 S2 as findings of the product (UXF-018, UXF-019 plus UXF-007 still open from R-01), the rest S3; site-content findings (class input): UXF-015 (ess), UXF-016 (llm), UXF-017 (aep). Triage and the change set: `triage.md`. Reviews: `review-heuristics.md`, `review-report.md`. Decision: `decision.md` (UXF-007, default yes).

## Levels run and skipped

- Run: L1, L2 layout contract and axe-core, L3 screen-only user (pointer and keyboard), L7 heuristic review (two review agents, screenshots of the six sites).
- Skipped: L0 and gate 6 (no guidance cue); gate 3.
- Skipped, paid: L4 and L5. No operator approval for paid APIs was sought.
- Skipped, people: L6 and the questionnaire; L8 is not in a round.
- Missing inputs: no rrweb recordings (the bot's trail is the trial), no questionnaire.
