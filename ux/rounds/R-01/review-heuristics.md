# R-01 heuristic review

8 pass, 5 partial, 1 fail, 2 not observed

Inputs: report.md, round.json, shots/ (both contact sheets, worst-1..6, page shots), the three
scenario cards, extra Playwright shots `shots/review-*.png` against `.cache/product-site-build`. No
recordings, questionnaire or operator notes exist in R-01; the bot trails in report.md stand in for
recordings, so no evidence cites a recording second.

| # | heuristic | verdict | evidence |
| --- | --- | --- | --- |
| 1 | One next thing | pass | contact-sheet-light.png and -dark.png, landing at every viewport: one filled button "Read the components", two text links beside it |
| 2 | State in words | pass | review-status-full-1024-light.png: Shipped / Decided / Planned written on every badge and strip, icon beside the word; truth values written as TRUE / UNKNOWN (reference, heroes) |
| 3 | Nothing required hidden | partial | review-phone-menu-390-light.png: sidebar reachable in one tap at phone width; but at 1440x900 /docs/adopt one screen down the sidebar is covered by the navbar (UXF-006, already filed) |
| 4 | Stable layout | pass | report.md Metrics: largest layout shift on load 0 in all 120 views; round.json views: no overflow |
| 5 | Provenance of every value | pass | worst-1.png "Recorded from canon evaluate and ess generate on 2026-10-04"; review-landing-full-1024-light.png terminal "Recorded from canon at 323038d"; review-status-full-1024-light.png "data/status.json, a b10x-status/1 document", "As of 2026-10-04" |
| 6 | Errors cheap | not observed | report.md: 0 steers in all 45 bot runs; no wrong turn to recover from |
| 7 | Words the user can say | partial | worst-1.png, page-docs-code-1024x768-light.png: navbar "Code" opens "Code blocks", "Meaning" opens "Meaning in docs", "Status" opens "Where this stands", "Heroes" opens a page titled "Hero art" (UXF-008) |
| 8 | Reader's time respected | partial | report.md find-install-command 3 to 6 actions, find-not-built 4 to 5 at 768x1024 and 390x844; review-code-full-1024-light.png install command at y 2159 px; review-status-full-1024-light.png target at y 2047 px of 3610 (UXF-009, UXF-010) |
| 9 | Keyboard and pointer parity | pass | report.md: keyboard runs match pointer action counts at every viewport and card; review-keyboard-focus-1024-light.png: visible 2 px focus ring, skip link first in tab order |
| 10 | Recognition over recall | partial | review-landing-full-1024-light.png: no "install" or "get started" anywhere on the landing, navbar, sidebar or page list; the reader must guess "Code" (UXF-009) |
| 11 | Calm by default | pass | round.json views: motion [] everywhere; Playwright: the only animation is the status strip, 700 ms, once, and none under prefers-reduced-motion |
| 12 | One state vocabulary | pass | review-landing-full-1024-light.png and review-status-full-1024-light.png: the same three words Shipped / Decided / Planned with the same glosses on landing strip and status page |
| 13 | Wrong cue recovered in one action | not observed | report.md: 0 steers; no wrong cue taken. No search to recover with (UXF-005, already filed) |
| 14 | Unmistakable end state | pass | contact-sheet-light.png /docs/adopt: "One config line" heading over the config block; review-install-command-390-light.png: command in a TERMINAL block with copy button; review-status-full-1024-light.png: "Only what is not built yet" heading |
| 15 | Readable in every theme; key data at 14 px or more | fail | Both contact sheets readable in light and dark; but computed sizes at 1024x768: status badges 12 px, KPI labels 10.6 px (worst-6.png), graph kickers 9.5 px, table and sidebar group headers 10.9 px, navbar 13.4 px (UXF-007) |
| 16 | Focus follows the work | partial | on /docs/art the navbar marks "Components" active while the sidebar marks "Hero art" (worst-1.png, UXF-008); no search (UXF-005, already filed) |

## Findings filed

| id | title | severity | class | sessions | cost |
| --- | --- | --- | --- | --- | --- |
| UXF-007 | Key data is set below 14 px on every page | S2 | layout | all 120 views | M |
| UXF-008 | Navbar labels differ from the pages they open, and Hero art lights up Components | S3 | copy | all views; 6 find-install-command runs at 768x1024, 390x844 | S |
| UXF-009 | The install command exists only as a code-fence demo, unnamed anywhere above it | S3 | cue | all 15 find-install-command runs | S |
| UXF-010 | The "not built yet" list sits below the full status table | S3 | layout | 6 find-not-built runs at 768x1024, 390x844 | S |
