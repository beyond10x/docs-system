# ess report

Commit bfd980fa42-dirty, 2026-11-10. Site: 14 pages from the build's sitemap, 7 viewports (1440x900, 1280x800, 1024x768, 768x1024, 390x844, 1366x768, 1280x720), themes light and dark. Gating viewports: 1366x768, 1280x720. Scenario cards: find-format-version (rotating), find-install-command (rotating).

## Metrics

All lower is better. Only the first row is gated (bar 0, gating viewports); the other rows count every measured viewport and are reported, not gated. The baseline is `ux/baseline.json` (gating viewports only).

| metric | value | bar | last round |
| --- | --- | --- | --- |
| Hard-gate failures, gating viewports | 15 | 0 | – |
| Hard-gate checks failing at any measured viewport | 37 | – | – |
| Elements past their box or the viewport (all views) | 0 | – | – |
| Always-visible elements missing, clipped or covered (all views) | 16 | – | – |
| axe serious or critical failing nodes (all views) | 0 | – | – |
| axe moderate or minor failing nodes (all views) | 0 | – | – |
| Optional always-visible elements absent (search) | 196 | – | – |
| Screen-only runs not completed | 7 | – | – |
| Screen-only actions, median of pointer runs | 6.5 | – | – |
| Largest layout shift on load | 0 | – | – |

Baseline entries: 0 values over 0 scenario views.

## Per viewport

| viewport | theme | overflow | hidden | axe serious+critical nodes | axe moderate+minor nodes | truncated | search absent | CLS max |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | light | 0 | 0 | 0 | 0 | 0 | 14 | 0 |
| 1440x900 | dark | 0 | 0 | 0 | 0 | 0 | 14 | 0 |
| 1280x800 | light | 0 | 2 | 0 | 0 | 0 | 14 | 0 |
| 1280x800 | dark | 0 | 2 | 0 | 0 | 0 | 14 | 0 |
| 1024x768 | light | 0 | 2 | 0 | 0 | 0 | 14 | 0 |
| 1024x768 | dark | 0 | 2 | 0 | 0 | 0 | 14 | 0 |
| 768x1024 | light | 0 | 0 | 0 | 0 | 0 | 14 | 0 |
| 768x1024 | dark | 0 | 0 | 0 | 0 | 0 | 14 | 0 |
| 390x844 | light | 0 | 0 | 0 | 0 | 3 | 14 | 0 |
| 390x844 | dark | 0 | 0 | 0 | 0 | 3 | 14 | 0 |
| 1366x768 (gating) | light | 0 | 2 | 0 | 0 | 0 | 14 | 0 |
| 1366x768 (gating) | dark | 0 | 2 | 0 | 0 | 0 | 14 | 0 |
| 1280x720 (gating) | light | 0 | 2 | 0 | 0 | 0 | 14 | 0 |
| 1280x720 (gating) | dark | 0 | 2 | 0 | 0 | 0 | 14 | 0 |

## Screen-only user

| scenario | viewport | theme | mode | done | actions | looks | steers | trail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| find-format-version | 1440x900 | light | pointer | yes | 12 | 13 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > click "CLI reference" > click "Format version history" |
| find-format-version | 1440x900 | light | keyboard | yes | 90 | 13 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > Tab x55 > Enter "CLI reference" > Tab x23 > Enter "Format version history" |
| find-install-command | 1440x900 | light | pointer | yes | 5 | 6 | 0 | click "Get started" > click "Install ess" > PageDown > PageDown > PageDown |
| find-install-command | 1440x900 | light | keyboard | yes | 46 | 6 | 0 | Tab x12 > Enter "Get started" > Tab x29 > Enter "Install ess" > PageDown > PageDown > PageDown |
| find-format-version | 1440x900 | dark | pointer | yes | 12 | 13 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > click "CLI reference" > click "Format version history" |
| find-install-command | 1440x900 | dark | pointer | yes | 5 | 6 | 0 | click "Get started" > click "Install ess" > PageDown > PageDown > PageDown |
| find-format-version | 1280x800 | light | pointer | yes | 14 | 15 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > click "CLI reference" > click "Format version history" |
| find-format-version | 1280x800 | light | keyboard | yes | 92 | 15 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > Tab x55 > Enter "CLI reference" > Tab x23 > Enter "Format version history" |
| find-install-command | 1280x800 | light | pointer | yes | 6 | 7 | 0 | PageDown > click "Get started" > click "Install ess" > PageDown > PageDown > PageDown |
| find-install-command | 1280x800 | light | keyboard | yes | 47 | 7 | 0 | PageDown > Tab x12 > Enter "Get started" > Tab x29 > Enter "Install ess" > PageDown > PageDown > PageDown |
| find-format-version | 1280x800 | dark | pointer | yes | 14 | 15 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > click "CLI reference" > click "Format version history" |
| find-install-command | 1280x800 | dark | pointer | yes | 6 | 7 | 0 | PageDown > click "Get started" > click "Install ess" > PageDown > PageDown > PageDown |
| find-format-version | 1024x768 | light | pointer | yes | 15 | 16 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > click "CLI reference" > click "Format version history" |
| find-format-version | 1024x768 | light | keyboard | yes | 93 | 16 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > Tab x55 > Enter "CLI reference" > Tab x23 > Enter "Format version history" |
| find-install-command | 1024x768 | light | pointer | yes | 7 | 8 | 0 | PageDown > click "Get started" > click "Install ess" > PageDown > PageDown > PageDown > PageDown |
| find-install-command | 1024x768 | light | keyboard | yes | 48 | 8 | 0 | PageDown > Tab x12 > Enter "Get started" > Tab x29 > Enter "Install ess" > PageDown > PageDown > PageDown > PageDown |
| find-format-version | 1024x768 | dark | pointer | yes | 15 | 16 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > click "CLI reference" > click "Format version history" |
| find-install-command | 1024x768 | dark | pointer | yes | 7 | 8 | 0 | PageDown > click "Get started" > click "Install ess" > PageDown > PageDown > PageDown > PageDown |
| find-format-version | 768x1024 | light | pointer | no: page.click: Timeout 30000ms exceeded. | 0 | 0 | 0 |  |
| find-format-version | 768x1024 | light | keyboard | no: more than 16 actions | 18 | 12 | 0 | open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown |
| find-install-command | 768x1024 | light | pointer | yes | 4 | 5 | 0 | click "Get started" > click "Install ess" > PageDown > PageDown |
| find-install-command | 768x1024 | light | keyboard | yes | 15 | 5 | 0 | Tab x5 > Enter "Get started" > Tab x6 > Enter "Install ess" > PageDown > PageDown |
| find-format-version | 768x1024 | dark | pointer | no: page.click: Timeout 30000ms exceeded. | 0 | 0 | 0 |  |
| find-install-command | 768x1024 | dark | pointer | yes | 4 | 5 | 0 | click "Get started" > click "Install ess" > PageDown > PageDown |
| find-format-version | 390x844 | light | pointer | no: page.click: Timeout 30000ms exceeded. | 0 | 0 | 0 |  |
| find-format-version | 390x844 | light | keyboard | no: more than 16 actions | 18 | 12 | 0 | open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown |
| find-install-command | 390x844 | light | pointer | yes | 6 | 7 | 0 | click "Get started" > click "Install ess" > PageDown > PageDown > PageDown > PageDown |
| find-install-command | 390x844 | light | keyboard | yes | 17 | 7 | 0 | Tab x5 > Enter "Get started" > Tab x6 > Enter "Install ess" > PageDown > PageDown > PageDown > PageDown |
| find-format-version | 390x844 | dark | pointer | no: page.click: Timeout 30000ms exceeded. | 0 | 0 | 0 |  |
| find-install-command | 390x844 | dark | pointer | yes | 6 | 7 | 0 | click "Get started" > click "Install ess" > PageDown > PageDown > PageDown > PageDown |
| find-format-version | 1366x768 | light | pointer | yes | 15 | 16 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > click "CLI reference" > click "Format version history" |
| find-format-version | 1366x768 | light | keyboard | yes | 93 | 16 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > Tab x55 > Enter "CLI reference" > Tab x23 > Enter "Format version history" |
| find-install-command | 1366x768 | light | pointer | yes | 6 | 7 | 0 | PageDown > click "Get started" > click "Install ess" > PageDown > PageDown > PageDown |
| find-install-command | 1366x768 | light | keyboard | no: link "NextInstall ess" on screen has a different accessible name | 15 | 4 | 0 | PageDown > Tab x12 > Enter "Get started" > PageDown |
| find-format-version | 1366x768 | dark | pointer | yes | 16 | 17 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > click "CLI reference" > PageDown > click "Format version history" |
| find-install-command | 1366x768 | dark | pointer | yes | 6 | 7 | 0 | PageDown > click "Get started" > click "Install ess" > PageDown > PageDown > PageDown |
| find-format-version | 1280x720 | light | pointer | yes | 15 | 16 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > click "CLI reference" > click "Format version history" |
| find-format-version | 1280x720 | light | keyboard | yes | 93 | 16 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > Tab x55 > Enter "CLI reference" > Tab x23 > Enter "Format version history" |
| find-install-command | 1280x720 | light | pointer | yes | 7 | 8 | 0 | PageDown > click "Get started" > click "Install ess" > PageDown > PageDown > PageDown > PageDown |
| find-install-command | 1280x720 | light | keyboard | yes | 48 | 8 | 0 | PageDown > Tab x12 > Enter "Get started" > Tab x29 > Enter "Install ess" > PageDown > PageDown > PageDown > PageDown |
| find-format-version | 1280x720 | dark | pointer | yes | 15 | 16 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > click "CLI reference" > click "Format version history" |
| find-install-command | 1280x720 | dark | pointer | yes | 7 | 8 | 0 | PageDown > click "Get started" > click "Install ess" > PageDown > PageDown > PageDown > PageDown |

## Worst moments

1. `/docs/guides` 1366x768 light: sidebar: 12,94..278,893 outside 1366x768; scrolled to 384px, sidebar: 12,94..278,893 outside 1366x768. Shot: [shots/worst-1.png](shots/worst-1.png)
2. `/` 390x844 light: span: "ess / the billing example"; span: "ess / generate and synthesize". Shot: [shots/worst-2.png](shots/worst-2.png)
3. `/docs/visualise` 390x844 light: span: "ess / the billing example". Shot: [shots/worst-3.png](shots/worst-3.png)

Contact sheets: [shots/contact-sheet-light.png](shots/contact-sheet-light.png), [shots/contact-sheet-dark.png](shots/contact-sheet-dark.png).

## Failing checks at any measured viewport

- gate 2 always visible: 1280x800 light /docs/guides sidebar: 12,94..278,893 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/guides scrolled to 400px, sidebar: 12,94..278,893 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/guides sidebar: 12,94..278,893 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/guides scrolled to 400px, sidebar: 12,94..278,893 outside 1280x800
- gate 2 always visible: 1024x768 light /docs/guides sidebar: 12,94..278,893 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/guides scrolled to 384px, sidebar: 12,94..278,893 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/guides sidebar: 12,94..278,893 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/guides scrolled to 384px, sidebar: 12,94..278,893 outside 1024x768
- gate 2 always visible: 1366x768 light /docs/guides sidebar: 12,94..278,893 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/guides scrolled to 384px, sidebar: 12,94..278,893 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/guides sidebar: 12,94..278,893 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/guides scrolled to 384px, sidebar: 12,94..278,893 outside 1366x768
- gate 2 always visible: 1280x720 light /docs/guides sidebar: 12,94..278,893 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/guides scrolled to 360px, sidebar: 12,94..278,893 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/guides sidebar: 12,94..278,893 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/guides scrolled to 360px, sidebar: 12,94..278,893 outside 1280x720
- gate 4 screen-only user: 1440x900 light find-format-version (pointer) took 12 actions, card allows 6
- gate 4 screen-only user: 1440x900 dark find-format-version (pointer) took 12 actions, card allows 6
- gate 4 screen-only user: 1280x800 light find-format-version (pointer) took 14 actions, card allows 6
- gate 4 screen-only user: 1280x800 dark find-format-version (pointer) took 14 actions, card allows 6
- gate 4 screen-only user: 1024x768 light find-format-version (pointer) took 15 actions, card allows 6
- gate 4 screen-only user: 1024x768 light find-install-command (pointer) took 7 actions, card allows 6
- gate 4 screen-only user: 1024x768 dark find-format-version (pointer) took 15 actions, card allows 6
- gate 4 screen-only user: 1024x768 dark find-install-command (pointer) took 7 actions, card allows 6
- gate 4 screen-only user: 768x1024 light find-format-version (pointer) did not complete: page.click: Timeout 30000ms exceeded.
- gate 5 keyboard only: 768x1024 light find-format-version (keyboard) did not complete: more than 16 actions
- gate 4 screen-only user: 768x1024 dark find-format-version (pointer) did not complete: page.click: Timeout 30000ms exceeded.
- gate 4 screen-only user: 390x844 light find-format-version (pointer) did not complete: page.click: Timeout 30000ms exceeded.
- gate 5 keyboard only: 390x844 light find-format-version (keyboard) did not complete: more than 16 actions
- gate 4 screen-only user: 390x844 dark find-format-version (pointer) did not complete: page.click: Timeout 30000ms exceeded.
- gate 4 screen-only user: 1366x768 light find-format-version (pointer) took 15 actions, card allows 6
- gate 5 keyboard only: 1366x768 light find-install-command (keyboard) did not complete: link "NextInstall ess" on screen has a different accessible name
- gate 4 screen-only user: 1366x768 dark find-format-version (pointer) took 16 actions, card allows 6
- gate 4 screen-only user: 1280x720 light find-format-version (pointer) took 15 actions, card allows 6
- gate 4 screen-only user: 1280x720 light find-install-command (pointer) took 7 actions, card allows 6
- gate 4 screen-only user: 1280x720 dark find-format-version (pointer) took 15 actions, card allows 6
- gate 4 screen-only user: 1280x720 dark find-install-command (pointer) took 7 actions, card allows 6

## Findings on file

None yet.

## Levels run and skipped

- Run: L1 (metric functions), L2 layout contract and axe-core, L3 screen-only user (pointer and keyboard), L7 heuristic review (two review agents).
- Skipped: L0 and gate 6 (a docs site has no guidance cue); gate 3 (no completion state beyond the task's target text, which gate 4 covers).
- Skipped, paid: L4 keyed replay and L5 discoverability probe. Not run in this round; no operator approval for paid APIs was sought.
- Skipped, people: L6 live rounds and the 90-second questionnaire. No person ran the cards; questionnaire scores: none.
- L8 real-user sessions: not in a round.

## Missing inputs

- No rrweb recordings: the trial is the scripted screen-only user, whose trail is listed above.
- No questionnaire, no L5 probe results.
