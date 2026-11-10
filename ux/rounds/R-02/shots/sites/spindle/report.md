# spindle report

Commit 244fb60e-dirty, 2026-11-10. Site: 12 pages from the build's sitemap, 7 viewports (1440x900, 1280x800, 1024x768, 768x1024, 390x844, 1366x768, 1280x720), themes light and dark. Gating viewports: 1366x768, 1280x720. Scenario cards: find-build-command (rotating).

## Metrics

All lower is better. Only the first row is gated (bar 0, gating viewports); the other rows count every measured viewport and are reported, not gated. The baseline is `ux/baseline.json` (gating viewports only).

| metric | value | bar | last round |
| --- | --- | --- | --- |
| Hard-gate failures, gating viewports | 0 | 0 | – |
| Hard-gate checks failing at any measured viewport | 0 | – | – |
| Elements past their box or the viewport (all views) | 0 | – | – |
| Always-visible elements missing, clipped or covered (all views) | 0 | – | – |
| axe serious or critical failing nodes (all views) | 0 | – | – |
| axe moderate or minor failing nodes (all views) | 0 | – | – |
| Optional always-visible elements absent (search) | 168 | – | – |
| Screen-only runs not completed | 0 | – | – |
| Screen-only actions, median of pointer runs | 2 | – | – |
| Largest layout shift on load | 0.002 | – | – |

Baseline entries: 0 values over 0 scenario views.

## Per viewport

| viewport | theme | overflow | hidden | axe serious+critical nodes | axe moderate+minor nodes | truncated | search absent | CLS max |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | light | 0 | 0 | 0 | 0 | 0 | 12 | 0 |
| 1440x900 | dark | 0 | 0 | 0 | 0 | 0 | 12 | 0 |
| 1280x800 | light | 0 | 0 | 0 | 0 | 0 | 12 | 0.002 |
| 1280x800 | dark | 0 | 0 | 0 | 0 | 0 | 12 | 0 |
| 1024x768 | light | 0 | 0 | 0 | 0 | 0 | 12 | 0 |
| 1024x768 | dark | 0 | 0 | 0 | 0 | 0 | 12 | 0 |
| 768x1024 | light | 0 | 0 | 0 | 0 | 0 | 12 | 0 |
| 768x1024 | dark | 0 | 0 | 0 | 0 | 0 | 12 | 0 |
| 390x844 | light | 0 | 0 | 0 | 0 | 0 | 12 | 0 |
| 390x844 | dark | 0 | 0 | 0 | 0 | 0 | 12 | 0 |
| 1366x768 (gating) | light | 0 | 0 | 0 | 0 | 0 | 12 | 0 |
| 1366x768 (gating) | dark | 0 | 0 | 0 | 0 | 0 | 12 | 0 |
| 1280x720 (gating) | light | 0 | 0 | 0 | 0 | 0 | 12 | 0 |
| 1280x720 (gating) | dark | 0 | 0 | 0 | 0 | 0 | 12 | 0 |

## Screen-only user

| scenario | viewport | theme | mode | done | actions | looks | steers | trail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| find-build-command | 1440x900 | light | pointer | yes | 2 | 3 | 0 | click "Get started" > PageDown |
| find-build-command | 1440x900 | light | keyboard | yes | 11 | 2 | 0 | Tab x10 > Enter "Get started" |
| find-build-command | 1440x900 | dark | pointer | yes | 1 | 2 | 0 | click "Get started" |
| find-build-command | 1280x800 | light | pointer | yes | 1 | 2 | 0 | click "Get started" |
| find-build-command | 1280x800 | light | keyboard | yes | 12 | 3 | 0 | Tab x10 > Enter "Get started" > PageDown |
| find-build-command | 1280x800 | dark | pointer | yes | 2 | 3 | 0 | click "Get started" > PageDown |
| find-build-command | 1024x768 | light | pointer | yes | 2 | 3 | 0 | click "Get started" > PageDown |
| find-build-command | 1024x768 | light | keyboard | yes | 12 | 3 | 0 | Tab x10 > Enter "Get started" > PageDown |
| find-build-command | 1024x768 | dark | pointer | yes | 2 | 3 | 0 | click "Get started" > PageDown |
| find-build-command | 768x1024 | light | pointer | yes | 1 | 2 | 0 | click "Get started" |
| find-build-command | 768x1024 | light | keyboard | yes | 5 | 2 | 0 | Tab x4 > Enter "Get started" |
| find-build-command | 768x1024 | dark | pointer | yes | 1 | 2 | 0 | click "Get started" |
| find-build-command | 390x844 | light | pointer | yes | 2 | 3 | 0 | click "Get started" > PageDown |
| find-build-command | 390x844 | light | keyboard | yes | 6 | 3 | 0 | Tab x4 > Enter "Get started" > PageDown |
| find-build-command | 390x844 | dark | pointer | yes | 2 | 3 | 0 | click "Get started" > PageDown |
| find-build-command | 1366x768 | light | pointer | yes | 1 | 2 | 0 | click "Get started" |
| find-build-command | 1366x768 | light | keyboard | yes | 11 | 2 | 0 | Tab x10 > Enter "Get started" |
| find-build-command | 1366x768 | dark | pointer | yes | 1 | 2 | 0 | click "Get started" |
| find-build-command | 1280x720 | light | pointer | yes | 2 | 3 | 0 | click "Get started" > PageDown |
| find-build-command | 1280x720 | light | keyboard | yes | 12 | 3 | 0 | Tab x10 > Enter "Get started" > PageDown |
| find-build-command | 1280x720 | dark | pointer | yes | 2 | 3 | 0 | click "Get started" > PageDown |

## Worst moments

None.

Contact sheets: [shots/contact-sheet-light.png](shots/contact-sheet-light.png), [shots/contact-sheet-dark.png](shots/contact-sheet-dark.png).

## Failing checks at any measured viewport

None.

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
