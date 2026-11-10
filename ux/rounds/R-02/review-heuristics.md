# R-02 heuristic review (six documentation sites)

6 pass, 6 partial, 1 fail (3 not observed). Judged together over ess, connectors, aep, inference, llm and spindle; shots are under `shots/sites/<repo>/`. No recordings, no extra shots.

| # | heuristic | verdict | evidence |
| --- | --- | --- | --- |
| 1 | One next thing | partial | Hero button on or under the first screen at 1024x768 and 1280x720: ess/page-index-1024x768-light.png, connectors/page-index-1366x768-light.png (UXF-019). llm has no "Get started" (UXF-016) |
| 2 | State in words | pass | "shipped, runs today" / "planned" under the counts: spindle, inference, llm contact-sheet-light.png (landing, 390x844) |
| 3 | Nothing required hidden | partial | Search absent on all six sites, 196 views each (UXF-005); ess sidebar categories collapsed, ess/page-docs-1366x768-dark.png |
| 4 | Stable layout | pass | CLS max 0.037 (connectors) and 0 elsewhere: each site's report.md, Metrics |
| 5 | Provenance of every value | pass | "every command below was run in a checkout of main on 2026-11-04" on spindle getting-started (spindle/contact-sheet-light.png, 390x844); version numbers on aep quickstart |
| 6 | Errors cheap | not observed | no form, no search, no failing input in any shot |
| 7 | Words the user can say | partial | navbar "CLI", "Releases" vs the page the format-version task needs (UXF-015, UXF-008); llm landing names no getting-started page (UXF-016) |
| 8 | Reader's time respected | partial | phone docs page puts the H1 at y 220 of 844 (UXF-020); ess format-version 12 to 16 pointer actions (UXF-015); llm 17 PageDowns, not completed (llm/report.md) |
| 9 | Keyboard and pointer parity | fail | ess find-format-version 90 to 93 key presses against 12 to 15 pointer actions, install 46 against 5 (ess/report.md); connectors 13 against 3 (UXF-011) |
| 10 | Recognition over recall | pass | breadcrumb, active sidebar item and underlined active navbar item in every docs frame (llm/worst-1.png, connectors/worst-1.png) |
| 11 | Calm by default | not observed | static shots only; no motion or alert visible in any frame |
| 12 | One state vocabulary | pass | "shipped / planned" and "START HERE - n OF 3" cards identical across llm, inference, spindle contact sheets |
| 13 | A wrong cue recovered in one action | partial | aep and llm phone trails loop `open menu > Escape > PageDown` six times and end incomplete at 768x1024 and 390x844 (aep/report.md, llm/report.md); cause is site content (UXF-016, UXF-017); search that would recover it absent (UXF-005) |
| 14 | Unmistakable end state | not observed | no task end screen in a shot |
| 15 | Readable in every theme; key data 14 px or more | partial | both themes legible in all 12 contact sheets; sizes under 14 px (UXF-007); TOC column at 1024 (UXF-022, ess/contact-sheet-light.png); aep prose links by colour alone (UXF-017); wrapped terminals (UXF-021) |
| 16 | Focus follows the work | pass | navbar active item and sidebar current page track the open page in all six sites' docs frames (aep, llm, ess contact-sheet-light.png) |

## Existing findings cited, not refiled

UXF-004 and UXF-013 (truncation), UXF-005 (search), UXF-006 (sidebar leaves with its column), UXF-007 (type under 14 px), UXF-008 (labels), UXF-011 (keyboard cost), UXF-012 and UXF-014 (engine, closed), UXF-015 to UXF-018.

## Findings filed

| id | title | severity | class | sessions | cost |
| --- | --- | --- | --- | --- | --- |
| UXF-019 | Landing hero centred in a tall block, primary action at or below the first screen | S2 | layout | six landings at 1024x768 and 1280x720 | S |
| UXF-020 | Phone docs page: wrapped breadcrumb and "On this page" bar push the H1 down | S3 | layout | docs pages at 390x844, five sites | S |
| UXF-021 | Terminal blocks break a command mid-token and wrap aligned comments | S3 | layout | connectors, ess, inference | S |
| UXF-022 | At 1024 px the "On this page" column is squeezed to about 100 px | S3 | layout | ess 1024x768 both themes | S |
