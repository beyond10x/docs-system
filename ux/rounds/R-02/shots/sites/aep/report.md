# aep report

Commit 26544d326-dirty, 2026-11-10. Site: 14 pages from the build's sitemap, 7 viewports (1440x900, 1280x800, 1024x768, 768x1024, 390x844, 1366x768, 1280x720), themes light and dark. Gating viewports: 1366x768, 1280x720. Scenario cards: find-install-command (rotating).

## Metrics

All lower is better. Only the first row is gated (bar 0, gating viewports); the other rows count every measured viewport and are reported, not gated. The baseline is `ux/baseline.json` (gating viewports only).

| metric | value | bar | last round |
| --- | --- | --- | --- |
| Hard-gate failures, gating viewports | 78 | 0 | – |
| Hard-gate checks failing at any measured viewport | 243 | – | – |
| Elements past their box or the viewport (all views) | 16 | – | – |
| Always-visible elements missing, clipped or covered (all views) | 120 | – | – |
| axe serious or critical failing nodes (all views) | 178 | – | – |
| axe moderate or minor failing nodes (all views) | 0 | – | – |
| Optional always-visible elements absent (search) | 196 | – | – |
| Screen-only runs not completed | 21 | – | – |
| Screen-only actions, median of pointer runs | 4 | – | – |
| Largest layout shift on load | 0 | – | – |

Baseline entries: 0 values over 0 scenario views.

## Per viewport

| viewport | theme | overflow | hidden | axe serious+critical nodes | axe moderate+minor nodes | truncated | search absent | CLS max |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | light | 0 | 12 | 12 | 0 | 0 | 14 | 0 |
| 1440x900 | dark | 0 | 12 | 12 | 0 | 0 | 14 | 0 |
| 1280x800 | light | 0 | 12 | 13 | 0 | 0 | 14 | 0 |
| 1280x800 | dark | 0 | 12 | 13 | 0 | 0 | 14 | 0 |
| 1024x768 | light | 0 | 12 | 13 | 0 | 0 | 14 | 0 |
| 1024x768 | dark | 0 | 12 | 13 | 0 | 0 | 14 | 0 |
| 768x1024 | light | 0 | 0 | 12 | 0 | 0 | 14 | 0 |
| 768x1024 | dark | 0 | 0 | 12 | 0 | 0 | 14 | 0 |
| 390x844 | light | 8 | 0 | 13 | 0 | 0 | 14 | 0 |
| 390x844 | dark | 8 | 0 | 13 | 0 | 0 | 14 | 0 |
| 1366x768 (gating) | light | 0 | 12 | 13 | 0 | 0 | 14 | 0 |
| 1366x768 (gating) | dark | 0 | 12 | 13 | 0 | 0 | 14 | 0 |
| 1280x720 (gating) | light | 0 | 12 | 13 | 0 | 0 | 14 | 0 |
| 1280x720 (gating) | dark | 0 | 12 | 13 | 0 | 0 | 14 | 0 |

## Screen-only user

| scenario | viewport | theme | mode | done | actions | looks | steers | trail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| find-install-command | 1440x900 | light | pointer | no: no visible link toward docs/getting-started from /aep | 3 | 4 | 0 | PageDown > PageDown > PageDown |
| find-install-command | 1440x900 | light | keyboard | no: no visible link toward docs/getting-started from /aep | 3 | 4 | 0 | PageDown > PageDown > PageDown |
| find-install-command | 1440x900 | dark | pointer | no: no visible link toward docs/getting-started from /aep | 3 | 4 | 0 | PageDown > PageDown > PageDown |
| find-install-command | 1280x800 | light | pointer | no: no visible link toward docs/getting-started from /aep | 4 | 5 | 0 | PageDown > PageDown > PageDown > PageDown |
| find-install-command | 1280x800 | light | keyboard | no: no visible link toward docs/getting-started from /aep | 4 | 5 | 0 | PageDown > PageDown > PageDown > PageDown |
| find-install-command | 1280x800 | dark | pointer | no: no visible link toward docs/getting-started from /aep | 4 | 5 | 0 | PageDown > PageDown > PageDown > PageDown |
| find-install-command | 1024x768 | light | pointer | no: no visible link toward docs/getting-started from /aep | 4 | 5 | 0 | PageDown > PageDown > PageDown > PageDown |
| find-install-command | 1024x768 | light | keyboard | no: no visible link toward docs/getting-started from /aep | 4 | 5 | 0 | PageDown > PageDown > PageDown > PageDown |
| find-install-command | 1024x768 | dark | pointer | no: no visible link toward docs/getting-started from /aep | 4 | 5 | 0 | PageDown > PageDown > PageDown > PageDown |
| find-install-command | 768x1024 | light | pointer | no: page.click: Timeout 30000ms exceeded. | 0 | 0 | 0 |  |
| find-install-command | 768x1024 | light | keyboard | no: more than 16 actions | 18 | 12 | 0 | open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown |
| find-install-command | 768x1024 | dark | pointer | no: page.click: Timeout 30000ms exceeded. | 0 | 0 | 0 |  |
| find-install-command | 390x844 | light | pointer | no: page.click: Timeout 30000ms exceeded. | 0 | 0 | 0 |  |
| find-install-command | 390x844 | light | keyboard | no: more than 16 actions | 18 | 12 | 0 | open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown |
| find-install-command | 390x844 | dark | pointer | no: page.click: Timeout 30000ms exceeded. | 0 | 0 | 0 |  |
| find-install-command | 1366x768 | light | pointer | no: no visible link toward docs/getting-started from /aep | 4 | 5 | 0 | PageDown > PageDown > PageDown > PageDown |
| find-install-command | 1366x768 | light | keyboard | no: no visible link toward docs/getting-started from /aep | 4 | 5 | 0 | PageDown > PageDown > PageDown > PageDown |
| find-install-command | 1366x768 | dark | pointer | no: no visible link toward docs/getting-started from /aep | 4 | 5 | 0 | PageDown > PageDown > PageDown > PageDown |
| find-install-command | 1280x720 | light | pointer | no: no visible link toward docs/getting-started from /aep | 4 | 5 | 0 | PageDown > PageDown > PageDown > PageDown |
| find-install-command | 1280x720 | light | keyboard | no: no visible link toward docs/getting-started from /aep | 4 | 5 | 0 | PageDown > PageDown > PageDown > PageDown |
| find-install-command | 1280x720 | dark | pointer | no: no visible link toward docs/getting-started from /aep | 4 | 5 | 0 | PageDown > PageDown > PageDown > PageDown |

## Worst moments

1. `/docs` 1366x768 light: sidebar: 12,72..278,1594 outside 1366x768; scrolled to 384px, sidebar: 12,72..278,1594 outside 1366x768; link-in-text-block (2): li:nth-child(4) > a[href$="governance"], p:nth-child(12) > a[target="_blank"][rel="noopener noreferrer"]. Shot: [shots/worst-1.png](shots/worst-1.png)
2. `/docs/concepts/artifacts` 1366x768 light: sidebar: 12,72..278,1594 outside 1366x768; scrolled to 384px, sidebar: 12,72..278,1594 outside 1366x768; link-in-text-block (1): p:nth-child(22) > a. Shot: [shots/worst-2.png](shots/worst-2.png)
3. `/docs/getting-started` 1366x768 light: sidebar: 12,72..278,1594 outside 1366x768; scrolled to 384px, sidebar: 12,72..278,1594 outside 1366x768; link-in-text-block (6): p:nth-child(15) > a:nth-child(2), p:nth-child(39) > a, .theme-doc-markdown > ul > li:nth-child(1) > a[href$="plan-work"]. Shot: [shots/worst-3.png](shots/worst-3.png)
4. `/docs/guides/check-a-transcript` 1366x768 light: sidebar: 12,72..278,1594 outside 1366x768; scrolled to 384px, sidebar: 12,72..278,1594 outside 1366x768; link-in-text-block (1): p:nth-child(48) > a:nth-child(8). Shot: [shots/worst-4.png](shots/worst-4.png)
5. `/docs/reference/artifact-file` 1366x768 light: sidebar: 12,72..278,1594 outside 1366x768; scrolled to 384px, sidebar: 12,72..278,1594 outside 1366x768; link-in-text-block (2): td:nth-child(3) > a[href$="artifacts"], li:nth-child(1) > a[href$="reviews"]. Shot: [shots/worst-5.png](shots/worst-5.png)
6. `/docs/examples/governed-task` 1366x768 light: sidebar: 12,72..278,1594 outside 1366x768; scrolled to 384px, sidebar: 12,72..278,1594 outside 1366x768. Shot: [shots/worst-6.png](shots/worst-6.png)

Contact sheets: [shots/contact-sheet-light.png](shots/contact-sheet-light.png), [shots/contact-sheet-dark.png](shots/contact-sheet-dark.png).

## Failing checks at any measured viewport

- gate 2 always visible: 1440x900 light /docs sidebar: 12,72..278,1594 outside 1440x900
- gate 2 always visible: 1440x900 light /docs scrolled to 450px, sidebar: 12,72..278,1594 outside 1440x900
- gate 5 accessibility: 1440x900 light /docs axe link-in-text-block (1): p:nth-child(12) > a[target="_blank"][rel="noopener noreferrer"]
- gate 2 always visible: 1440x900 light /docs/concepts/artifacts sidebar: 12,72..278,1594 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/concepts/artifacts scrolled to 450px, sidebar: 12,72..278,1594 outside 1440x900
- gate 5 accessibility: 1440x900 light /docs/concepts/artifacts axe link-in-text-block (1): p:nth-child(22) > a
- gate 2 always visible: 1440x900 light /docs/examples/governed-task sidebar: 12,72..278,1594 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/examples/governed-task scrolled to 450px, sidebar: 12,72..278,1594 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/getting-started sidebar: 12,72..278,1594 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/getting-started scrolled to 450px, sidebar: 12,72..278,1594 outside 1440x900
- gate 5 accessibility: 1440x900 light /docs/getting-started axe link-in-text-block (6): p:nth-child(15) > a:nth-child(2), p:nth-child(39) > a, .theme-doc-markdown > ul > li:nth-child(1) > a[href$="plan-work"]
- gate 2 always visible: 1440x900 light /docs/guides/check-a-transcript sidebar: 12,72..278,1594 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/guides/check-a-transcript scrolled to 450px, sidebar: 12,72..278,1594 outside 1440x900
- gate 5 accessibility: 1440x900 light /docs/guides/check-a-transcript axe link-in-text-block (1): p:nth-child(48) > a:nth-child(8)
- gate 2 always visible: 1440x900 light /docs/reference/artifact-file sidebar: 12,72..278,1594 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/reference/artifact-file scrolled to 450px, sidebar: 12,72..278,1594 outside 1440x900
- gate 5 accessibility: 1440x900 light /docs/reference/artifact-file axe link-in-text-block (2): td:nth-child(3) > a[href$="artifacts"], li:nth-child(1) > a[href$="reviews"]
- gate 5 accessibility: 1440x900 light /releases/a-repository-that-already-exists axe link-in-text-block (1): p:nth-child(19) > a[href$="cli"]
- gate 2 always visible: 1440x900 dark /docs sidebar: 12,72..278,1594 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs scrolled to 450px, sidebar: 12,72..278,1594 outside 1440x900
- gate 5 accessibility: 1440x900 dark /docs axe link-in-text-block (1): p:nth-child(12) > a[target="_blank"][rel="noopener noreferrer"]
- gate 2 always visible: 1440x900 dark /docs/concepts/artifacts sidebar: 12,72..278,1594 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/concepts/artifacts scrolled to 450px, sidebar: 12,72..278,1594 outside 1440x900
- gate 5 accessibility: 1440x900 dark /docs/concepts/artifacts axe link-in-text-block (1): p:nth-child(22) > a
- gate 2 always visible: 1440x900 dark /docs/examples/governed-task sidebar: 12,72..278,1594 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/examples/governed-task scrolled to 450px, sidebar: 12,72..278,1594 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/getting-started sidebar: 12,72..278,1594 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/getting-started scrolled to 450px, sidebar: 12,72..278,1594 outside 1440x900
- gate 5 accessibility: 1440x900 dark /docs/getting-started axe link-in-text-block (6): p:nth-child(15) > a:nth-child(2), p:nth-child(39) > a, .theme-doc-markdown > ul > li:nth-child(1) > a[href$="plan-work"]
- gate 2 always visible: 1440x900 dark /docs/guides/check-a-transcript sidebar: 12,72..278,1594 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/guides/check-a-transcript scrolled to 450px, sidebar: 12,72..278,1594 outside 1440x900
- gate 5 accessibility: 1440x900 dark /docs/guides/check-a-transcript axe link-in-text-block (1): p:nth-child(48) > a:nth-child(8)
- gate 2 always visible: 1440x900 dark /docs/reference/artifact-file sidebar: 12,72..278,1594 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/reference/artifact-file scrolled to 450px, sidebar: 12,72..278,1594 outside 1440x900
- gate 5 accessibility: 1440x900 dark /docs/reference/artifact-file axe link-in-text-block (2): td:nth-child(3) > a[href$="artifacts"], li:nth-child(1) > a[href$="reviews"]
- gate 5 accessibility: 1440x900 dark /releases/a-repository-that-already-exists axe link-in-text-block (1): p:nth-child(19) > a[href$="cli"]
- gate 2 always visible: 1280x800 light /docs sidebar: 12,72..278,1594 outside 1280x800
- gate 2 always visible: 1280x800 light /docs scrolled to 400px, sidebar: 12,72..278,1594 outside 1280x800
- gate 5 accessibility: 1280x800 light /docs axe link-in-text-block (2): li:nth-child(4) > a[href$="governance"], p:nth-child(12) > a[target="_blank"][rel="noopener noreferrer"]
- gate 2 always visible: 1280x800 light /docs/concepts/artifacts sidebar: 12,72..278,1594 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/concepts/artifacts scrolled to 400px, sidebar: 12,72..278,1594 outside 1280x800
- gate 5 accessibility: 1280x800 light /docs/concepts/artifacts axe link-in-text-block (1): p:nth-child(22) > a
- gate 2 always visible: 1280x800 light /docs/examples/governed-task sidebar: 12,72..278,1594 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/examples/governed-task scrolled to 400px, sidebar: 12,72..278,1594 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/getting-started sidebar: 12,72..278,1594 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/getting-started scrolled to 400px, sidebar: 12,72..278,1594 outside 1280x800
- gate 5 accessibility: 1280x800 light /docs/getting-started axe link-in-text-block (6): p:nth-child(15) > a:nth-child(2), p:nth-child(39) > a, .theme-doc-markdown > ul > li:nth-child(1) > a[href$="plan-work"]
- gate 2 always visible: 1280x800 light /docs/guides/check-a-transcript sidebar: 12,72..278,1594 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/guides/check-a-transcript scrolled to 400px, sidebar: 12,72..278,1594 outside 1280x800
- gate 5 accessibility: 1280x800 light /docs/guides/check-a-transcript axe link-in-text-block (1): p:nth-child(48) > a:nth-child(8)
- gate 2 always visible: 1280x800 light /docs/reference/artifact-file sidebar: 12,72..278,1594 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/reference/artifact-file scrolled to 400px, sidebar: 12,72..278,1594 outside 1280x800
- gate 5 accessibility: 1280x800 light /docs/reference/artifact-file axe link-in-text-block (2): td:nth-child(3) > a[href$="artifacts"], li:nth-child(1) > a[href$="reviews"]
- gate 5 accessibility: 1280x800 light /releases/a-repository-that-already-exists axe link-in-text-block (1): p:nth-child(19) > a[href$="cli"]
- gate 2 always visible: 1280x800 dark /docs sidebar: 12,72..278,1594 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs scrolled to 400px, sidebar: 12,72..278,1594 outside 1280x800
- gate 5 accessibility: 1280x800 dark /docs axe link-in-text-block (2): li:nth-child(4) > a[href$="governance"], p:nth-child(12) > a[target="_blank"][rel="noopener noreferrer"]
- gate 2 always visible: 1280x800 dark /docs/concepts/artifacts sidebar: 12,72..278,1594 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/concepts/artifacts scrolled to 400px, sidebar: 12,72..278,1594 outside 1280x800
- gate 5 accessibility: 1280x800 dark /docs/concepts/artifacts axe link-in-text-block (1): p:nth-child(22) > a
- gate 2 always visible: 1280x800 dark /docs/examples/governed-task sidebar: 12,72..278,1594 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/examples/governed-task scrolled to 400px, sidebar: 12,72..278,1594 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/getting-started sidebar: 12,72..278,1594 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/getting-started scrolled to 400px, sidebar: 12,72..278,1594 outside 1280x800
- gate 5 accessibility: 1280x800 dark /docs/getting-started axe link-in-text-block (6): p:nth-child(15) > a:nth-child(2), p:nth-child(39) > a, .theme-doc-markdown > ul > li:nth-child(1) > a[href$="plan-work"]
- gate 2 always visible: 1280x800 dark /docs/guides/check-a-transcript sidebar: 12,72..278,1594 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/guides/check-a-transcript scrolled to 400px, sidebar: 12,72..278,1594 outside 1280x800
- gate 5 accessibility: 1280x800 dark /docs/guides/check-a-transcript axe link-in-text-block (1): p:nth-child(48) > a:nth-child(8)
- gate 2 always visible: 1280x800 dark /docs/reference/artifact-file sidebar: 12,72..278,1594 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/reference/artifact-file scrolled to 400px, sidebar: 12,72..278,1594 outside 1280x800
- gate 5 accessibility: 1280x800 dark /docs/reference/artifact-file axe link-in-text-block (2): td:nth-child(3) > a[href$="artifacts"], li:nth-child(1) > a[href$="reviews"]
- gate 5 accessibility: 1280x800 dark /releases/a-repository-that-already-exists axe link-in-text-block (1): p:nth-child(19) > a[href$="cli"]
- gate 2 always visible: 1024x768 light /docs sidebar: 12,72..278,1594 outside 1024x768
- gate 2 always visible: 1024x768 light /docs scrolled to 384px, sidebar: 12,72..278,1594 outside 1024x768
- gate 5 accessibility: 1024x768 light /docs axe link-in-text-block (2): li:nth-child(4) > a[href$="governance"], p:nth-child(12) > a[target="_blank"][rel="noopener noreferrer"]
- gate 2 always visible: 1024x768 light /docs/concepts/artifacts sidebar: 12,72..278,1594 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/concepts/artifacts scrolled to 384px, sidebar: 12,72..278,1594 outside 1024x768
- gate 5 accessibility: 1024x768 light /docs/concepts/artifacts axe link-in-text-block (1): p:nth-child(22) > a
- gate 2 always visible: 1024x768 light /docs/examples/governed-task sidebar: 12,72..278,1594 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/examples/governed-task scrolled to 384px, sidebar: 12,72..278,1594 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/getting-started sidebar: 12,72..278,1594 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/getting-started scrolled to 384px, sidebar: 12,72..278,1594 outside 1024x768
- gate 5 accessibility: 1024x768 light /docs/getting-started axe link-in-text-block (6): p:nth-child(15) > a:nth-child(2), p:nth-child(39) > a, .theme-doc-markdown > ul > li:nth-child(1) > a[href$="plan-work"]
- gate 2 always visible: 1024x768 light /docs/guides/check-a-transcript sidebar: 12,72..278,1594 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/guides/check-a-transcript scrolled to 384px, sidebar: 12,72..278,1594 outside 1024x768
- gate 5 accessibility: 1024x768 light /docs/guides/check-a-transcript axe link-in-text-block (1): p:nth-child(48) > a:nth-child(8)
- gate 2 always visible: 1024x768 light /docs/reference/artifact-file sidebar: 12,72..278,1594 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/reference/artifact-file scrolled to 384px, sidebar: 12,72..278,1594 outside 1024x768
- gate 5 accessibility: 1024x768 light /docs/reference/artifact-file axe link-in-text-block (2): td:nth-child(3) > a[href$="artifacts"], li:nth-child(1) > a[href$="reviews"]
- gate 5 accessibility: 1024x768 light /releases/a-repository-that-already-exists axe link-in-text-block (1): p:nth-child(19) > a[href$="cli"]
- gate 2 always visible: 1024x768 dark /docs sidebar: 12,72..278,1594 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs scrolled to 384px, sidebar: 12,72..278,1594 outside 1024x768
- gate 5 accessibility: 1024x768 dark /docs axe link-in-text-block (2): li:nth-child(4) > a[href$="governance"], p:nth-child(12) > a[target="_blank"][rel="noopener noreferrer"]
- gate 2 always visible: 1024x768 dark /docs/concepts/artifacts sidebar: 12,72..278,1594 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/concepts/artifacts scrolled to 384px, sidebar: 12,72..278,1594 outside 1024x768
- gate 5 accessibility: 1024x768 dark /docs/concepts/artifacts axe link-in-text-block (1): p:nth-child(22) > a
- gate 2 always visible: 1024x768 dark /docs/examples/governed-task sidebar: 12,72..278,1594 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/examples/governed-task scrolled to 384px, sidebar: 12,72..278,1594 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/getting-started sidebar: 12,72..278,1594 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/getting-started scrolled to 384px, sidebar: 12,72..278,1594 outside 1024x768
- gate 5 accessibility: 1024x768 dark /docs/getting-started axe link-in-text-block (6): p:nth-child(15) > a:nth-child(2), p:nth-child(39) > a, .theme-doc-markdown > ul > li:nth-child(1) > a[href$="plan-work"]
- gate 2 always visible: 1024x768 dark /docs/guides/check-a-transcript sidebar: 12,72..278,1594 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/guides/check-a-transcript scrolled to 384px, sidebar: 12,72..278,1594 outside 1024x768
- gate 5 accessibility: 1024x768 dark /docs/guides/check-a-transcript axe link-in-text-block (1): p:nth-child(48) > a:nth-child(8)
- gate 2 always visible: 1024x768 dark /docs/reference/artifact-file sidebar: 12,72..278,1594 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/reference/artifact-file scrolled to 384px, sidebar: 12,72..278,1594 outside 1024x768
- gate 5 accessibility: 1024x768 dark /docs/reference/artifact-file axe link-in-text-block (2): td:nth-child(3) > a[href$="artifacts"], li:nth-child(1) > a[href$="reviews"]
- gate 5 accessibility: 1024x768 dark /releases/a-repository-that-already-exists axe link-in-text-block (1): p:nth-child(19) > a[href$="cli"]
- gate 5 accessibility: 768x1024 light /docs axe link-in-text-block (2): li:nth-child(4) > a[href$="governance"], p:nth-child(12) > a[target="_blank"][rel="noopener noreferrer"]
- gate 5 accessibility: 768x1024 light /docs/concepts/artifacts axe link-in-text-block (1): p:nth-child(22) > a
- gate 5 accessibility: 768x1024 light /docs/getting-started axe link-in-text-block (6): p:nth-child(15) > a:nth-child(2), p:nth-child(39) > a, .theme-doc-markdown > ul > li:nth-child(1) > a[href$="plan-work"]
- gate 5 accessibility: 768x1024 light /docs/guides/check-a-transcript axe link-in-text-block (1): p:nth-child(48) > a:nth-child(8)
- gate 5 accessibility: 768x1024 light /docs/reference/artifact-file axe link-in-text-block (1): li:nth-child(1) > a[href$="reviews"]
- gate 5 accessibility: 768x1024 light /releases/a-repository-that-already-exists axe link-in-text-block (1): p:nth-child(19) > a[href$="cli"]
- gate 5 accessibility: 768x1024 dark /docs axe link-in-text-block (2): li:nth-child(4) > a[href$="governance"], p:nth-child(12) > a[target="_blank"][rel="noopener noreferrer"]
- gate 5 accessibility: 768x1024 dark /docs/concepts/artifacts axe link-in-text-block (1): p:nth-child(22) > a
- gate 5 accessibility: 768x1024 dark /docs/getting-started axe link-in-text-block (6): p:nth-child(15) > a:nth-child(2), p:nth-child(39) > a, .theme-doc-markdown > ul > li:nth-child(1) > a[href$="plan-work"]
- gate 5 accessibility: 768x1024 dark /docs/guides/check-a-transcript axe link-in-text-block (1): p:nth-child(48) > a:nth-child(8)
- gate 5 accessibility: 768x1024 dark /docs/reference/artifact-file axe link-in-text-block (1): li:nth-child(1) > a[href$="reviews"]
- gate 5 accessibility: 768x1024 dark /releases/a-repository-that-already-exists axe link-in-text-block (1): p:nth-child(19) > a[href$="cli"]
- gate 5 accessibility: 390x844 light /docs axe link-in-text-block (2): li:nth-child(4) > a[href$="governance"], p:nth-child(12) > a[target="_blank"][rel="noopener noreferrer"]
- gate 1 no scroll: 390x844 light /docs/concepts/artifacts scrolls 18px sideways
- gate 1 no scroll: 390x844 light /docs/concepts/artifacts code: spans 16..408 of 390px
- gate 5 accessibility: 390x844 light /docs/concepts/artifacts axe link-in-text-block (1): p:nth-child(22) > a
- gate 1 no scroll: 390x844 light /docs/examples/governed-task scrolls 111px sideways
- gate 1 no scroll: 390x844 light /docs/examples/governed-task code: spans 16..501 of 390px
- gate 1 no scroll: 390x844 light /docs/examples/governed-task code: spans 16..400 of 390px
- gate 1 no scroll: 390x844 light /docs/examples/governed-task code: spans 16..391 of 390px
- gate 5 accessibility: 390x844 light /docs/getting-started axe link-in-text-block (6): p:nth-child(15) > a:nth-child(2), p:nth-child(39) > a, .theme-doc-markdown > ul > li:nth-child(1) > a[href$="plan-work"]
- gate 1 no scroll: 390x844 light /docs/guides/check-a-transcript scrolls 10px sideways
- gate 1 no scroll: 390x844 light /docs/guides/check-a-transcript code: spans 16..400 of 390px
- gate 5 accessibility: 390x844 light /docs/guides/check-a-transcript axe link-in-text-block (1): p:nth-child(48) > a:nth-child(8)
- gate 5 accessibility: 390x844 light /docs/reference/artifact-file axe link-in-text-block (1): li:nth-child(1) > a[href$="reviews"]
- gate 5 accessibility: 390x844 light /docs/reference/artifact-file axe scrollable-region-focusable (1): table:nth-child(10)
- gate 5 accessibility: 390x844 light /releases/a-repository-that-already-exists axe link-in-text-block (1): p:nth-child(19) > a[href$="cli"]
- gate 5 accessibility: 390x844 dark /docs axe link-in-text-block (2): li:nth-child(4) > a[href$="governance"], p:nth-child(12) > a[target="_blank"][rel="noopener noreferrer"]
- gate 1 no scroll: 390x844 dark /docs/concepts/artifacts scrolls 18px sideways
- gate 1 no scroll: 390x844 dark /docs/concepts/artifacts code: spans 16..408 of 390px
- gate 5 accessibility: 390x844 dark /docs/concepts/artifacts axe link-in-text-block (1): p:nth-child(22) > a
- gate 1 no scroll: 390x844 dark /docs/examples/governed-task scrolls 111px sideways
- gate 1 no scroll: 390x844 dark /docs/examples/governed-task code: spans 16..501 of 390px
- gate 1 no scroll: 390x844 dark /docs/examples/governed-task code: spans 16..400 of 390px
- gate 1 no scroll: 390x844 dark /docs/examples/governed-task code: spans 16..391 of 390px
- gate 5 accessibility: 390x844 dark /docs/getting-started axe link-in-text-block (6): p:nth-child(15) > a:nth-child(2), p:nth-child(39) > a, .theme-doc-markdown > ul > li:nth-child(1) > a[href$="plan-work"]
- gate 1 no scroll: 390x844 dark /docs/guides/check-a-transcript scrolls 10px sideways
- gate 1 no scroll: 390x844 dark /docs/guides/check-a-transcript code: spans 16..400 of 390px
- gate 5 accessibility: 390x844 dark /docs/guides/check-a-transcript axe link-in-text-block (1): p:nth-child(48) > a:nth-child(8)
- gate 5 accessibility: 390x844 dark /docs/reference/artifact-file axe link-in-text-block (1): li:nth-child(1) > a[href$="reviews"]
- gate 5 accessibility: 390x844 dark /docs/reference/artifact-file axe scrollable-region-focusable (1): table:nth-child(10)
- gate 5 accessibility: 390x844 dark /releases/a-repository-that-already-exists axe link-in-text-block (1): p:nth-child(19) > a[href$="cli"]
- gate 2 always visible: 1366x768 light /docs sidebar: 12,72..278,1594 outside 1366x768
- gate 2 always visible: 1366x768 light /docs scrolled to 384px, sidebar: 12,72..278,1594 outside 1366x768
- gate 5 accessibility: 1366x768 light /docs axe link-in-text-block (2): li:nth-child(4) > a[href$="governance"], p:nth-child(12) > a[target="_blank"][rel="noopener noreferrer"]
- gate 2 always visible: 1366x768 light /docs/concepts/artifacts sidebar: 12,72..278,1594 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/concepts/artifacts scrolled to 384px, sidebar: 12,72..278,1594 outside 1366x768
- gate 5 accessibility: 1366x768 light /docs/concepts/artifacts axe link-in-text-block (1): p:nth-child(22) > a
- gate 2 always visible: 1366x768 light /docs/examples/governed-task sidebar: 12,72..278,1594 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/examples/governed-task scrolled to 384px, sidebar: 12,72..278,1594 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/getting-started sidebar: 12,72..278,1594 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/getting-started scrolled to 384px, sidebar: 12,72..278,1594 outside 1366x768
- gate 5 accessibility: 1366x768 light /docs/getting-started axe link-in-text-block (6): p:nth-child(15) > a:nth-child(2), p:nth-child(39) > a, .theme-doc-markdown > ul > li:nth-child(1) > a[href$="plan-work"]
- gate 2 always visible: 1366x768 light /docs/guides/check-a-transcript sidebar: 12,72..278,1594 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/guides/check-a-transcript scrolled to 384px, sidebar: 12,72..278,1594 outside 1366x768
- gate 5 accessibility: 1366x768 light /docs/guides/check-a-transcript axe link-in-text-block (1): p:nth-child(48) > a:nth-child(8)
- gate 2 always visible: 1366x768 light /docs/reference/artifact-file sidebar: 12,72..278,1594 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/reference/artifact-file scrolled to 384px, sidebar: 12,72..278,1594 outside 1366x768
- gate 5 accessibility: 1366x768 light /docs/reference/artifact-file axe link-in-text-block (2): td:nth-child(3) > a[href$="artifacts"], li:nth-child(1) > a[href$="reviews"]
- gate 5 accessibility: 1366x768 light /releases/a-repository-that-already-exists axe link-in-text-block (1): p:nth-child(19) > a[href$="cli"]
- gate 2 always visible: 1366x768 dark /docs sidebar: 12,72..278,1594 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs scrolled to 384px, sidebar: 12,72..278,1594 outside 1366x768
- gate 5 accessibility: 1366x768 dark /docs axe link-in-text-block (2): li:nth-child(4) > a[href$="governance"], p:nth-child(12) > a[target="_blank"][rel="noopener noreferrer"]
- gate 2 always visible: 1366x768 dark /docs/concepts/artifacts sidebar: 12,72..278,1594 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/concepts/artifacts scrolled to 384px, sidebar: 12,72..278,1594 outside 1366x768
- gate 5 accessibility: 1366x768 dark /docs/concepts/artifacts axe link-in-text-block (1): p:nth-child(22) > a
- gate 2 always visible: 1366x768 dark /docs/examples/governed-task sidebar: 12,72..278,1594 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/examples/governed-task scrolled to 384px, sidebar: 12,72..278,1594 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/getting-started sidebar: 12,72..278,1594 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/getting-started scrolled to 384px, sidebar: 12,72..278,1594 outside 1366x768
- gate 5 accessibility: 1366x768 dark /docs/getting-started axe link-in-text-block (6): p:nth-child(15) > a:nth-child(2), p:nth-child(39) > a, .theme-doc-markdown > ul > li:nth-child(1) > a[href$="plan-work"]
- gate 2 always visible: 1366x768 dark /docs/guides/check-a-transcript sidebar: 12,72..278,1594 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/guides/check-a-transcript scrolled to 384px, sidebar: 12,72..278,1594 outside 1366x768
- gate 5 accessibility: 1366x768 dark /docs/guides/check-a-transcript axe link-in-text-block (1): p:nth-child(48) > a:nth-child(8)
- gate 2 always visible: 1366x768 dark /docs/reference/artifact-file sidebar: 12,72..278,1594 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/reference/artifact-file scrolled to 384px, sidebar: 12,72..278,1594 outside 1366x768
- gate 5 accessibility: 1366x768 dark /docs/reference/artifact-file axe link-in-text-block (2): td:nth-child(3) > a[href$="artifacts"], li:nth-child(1) > a[href$="reviews"]
- gate 5 accessibility: 1366x768 dark /releases/a-repository-that-already-exists axe link-in-text-block (1): p:nth-child(19) > a[href$="cli"]
- gate 2 always visible: 1280x720 light /docs sidebar: 12,72..278,1594 outside 1280x720
- gate 2 always visible: 1280x720 light /docs scrolled to 360px, sidebar: 12,72..278,1594 outside 1280x720
- gate 5 accessibility: 1280x720 light /docs axe link-in-text-block (2): li:nth-child(4) > a[href$="governance"], p:nth-child(12) > a[target="_blank"][rel="noopener noreferrer"]
- gate 2 always visible: 1280x720 light /docs/concepts/artifacts sidebar: 12,72..278,1594 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/concepts/artifacts scrolled to 360px, sidebar: 12,72..278,1594 outside 1280x720
- gate 5 accessibility: 1280x720 light /docs/concepts/artifacts axe link-in-text-block (1): p:nth-child(22) > a
- gate 2 always visible: 1280x720 light /docs/examples/governed-task sidebar: 12,72..278,1594 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/examples/governed-task scrolled to 360px, sidebar: 12,72..278,1594 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/getting-started sidebar: 12,72..278,1594 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/getting-started scrolled to 360px, sidebar: 12,72..278,1594 outside 1280x720
- gate 5 accessibility: 1280x720 light /docs/getting-started axe link-in-text-block (6): p:nth-child(15) > a:nth-child(2), p:nth-child(39) > a, .theme-doc-markdown > ul > li:nth-child(1) > a[href$="plan-work"]
- gate 2 always visible: 1280x720 light /docs/guides/check-a-transcript sidebar: 12,72..278,1594 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/guides/check-a-transcript scrolled to 360px, sidebar: 12,72..278,1594 outside 1280x720
- gate 5 accessibility: 1280x720 light /docs/guides/check-a-transcript axe link-in-text-block (1): p:nth-child(48) > a:nth-child(8)
- gate 2 always visible: 1280x720 light /docs/reference/artifact-file sidebar: 12,72..278,1594 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/reference/artifact-file scrolled to 360px, sidebar: 12,72..278,1594 outside 1280x720
- gate 5 accessibility: 1280x720 light /docs/reference/artifact-file axe link-in-text-block (2): td:nth-child(3) > a[href$="artifacts"], li:nth-child(1) > a[href$="reviews"]
- gate 5 accessibility: 1280x720 light /releases/a-repository-that-already-exists axe link-in-text-block (1): p:nth-child(19) > a[href$="cli"]
- gate 2 always visible: 1280x720 dark /docs sidebar: 12,72..278,1594 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs scrolled to 360px, sidebar: 12,72..278,1594 outside 1280x720
- gate 5 accessibility: 1280x720 dark /docs axe link-in-text-block (2): li:nth-child(4) > a[href$="governance"], p:nth-child(12) > a[target="_blank"][rel="noopener noreferrer"]
- gate 2 always visible: 1280x720 dark /docs/concepts/artifacts sidebar: 12,72..278,1594 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/concepts/artifacts scrolled to 360px, sidebar: 12,72..278,1594 outside 1280x720
- gate 5 accessibility: 1280x720 dark /docs/concepts/artifacts axe link-in-text-block (1): p:nth-child(22) > a
- gate 2 always visible: 1280x720 dark /docs/examples/governed-task sidebar: 12,72..278,1594 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/examples/governed-task scrolled to 360px, sidebar: 12,72..278,1594 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/getting-started sidebar: 12,72..278,1594 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/getting-started scrolled to 360px, sidebar: 12,72..278,1594 outside 1280x720
- gate 5 accessibility: 1280x720 dark /docs/getting-started axe link-in-text-block (6): p:nth-child(15) > a:nth-child(2), p:nth-child(39) > a, .theme-doc-markdown > ul > li:nth-child(1) > a[href$="plan-work"]
- gate 2 always visible: 1280x720 dark /docs/guides/check-a-transcript sidebar: 12,72..278,1594 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/guides/check-a-transcript scrolled to 360px, sidebar: 12,72..278,1594 outside 1280x720
- gate 5 accessibility: 1280x720 dark /docs/guides/check-a-transcript axe link-in-text-block (1): p:nth-child(48) > a:nth-child(8)
- gate 2 always visible: 1280x720 dark /docs/reference/artifact-file sidebar: 12,72..278,1594 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/reference/artifact-file scrolled to 360px, sidebar: 12,72..278,1594 outside 1280x720
- gate 5 accessibility: 1280x720 dark /docs/reference/artifact-file axe link-in-text-block (2): td:nth-child(3) > a[href$="artifacts"], li:nth-child(1) > a[href$="reviews"]
- gate 5 accessibility: 1280x720 dark /releases/a-repository-that-already-exists axe link-in-text-block (1): p:nth-child(19) > a[href$="cli"]
- gate 4 screen-only user: 1440x900 light find-install-command (pointer) did not complete: no visible link toward docs/getting-started from /aep
- gate 5 keyboard only: 1440x900 light find-install-command (keyboard) did not complete: no visible link toward docs/getting-started from /aep
- gate 4 screen-only user: 1440x900 dark find-install-command (pointer) did not complete: no visible link toward docs/getting-started from /aep
- gate 4 screen-only user: 1280x800 light find-install-command (pointer) did not complete: no visible link toward docs/getting-started from /aep
- gate 5 keyboard only: 1280x800 light find-install-command (keyboard) did not complete: no visible link toward docs/getting-started from /aep
- gate 4 screen-only user: 1280x800 dark find-install-command (pointer) did not complete: no visible link toward docs/getting-started from /aep
- gate 4 screen-only user: 1024x768 light find-install-command (pointer) did not complete: no visible link toward docs/getting-started from /aep
- gate 5 keyboard only: 1024x768 light find-install-command (keyboard) did not complete: no visible link toward docs/getting-started from /aep
- gate 4 screen-only user: 1024x768 dark find-install-command (pointer) did not complete: no visible link toward docs/getting-started from /aep
- gate 4 screen-only user: 768x1024 light find-install-command (pointer) did not complete: page.click: Timeout 30000ms exceeded.
- gate 5 keyboard only: 768x1024 light find-install-command (keyboard) did not complete: more than 16 actions
- gate 4 screen-only user: 768x1024 dark find-install-command (pointer) did not complete: page.click: Timeout 30000ms exceeded.
- gate 4 screen-only user: 390x844 light find-install-command (pointer) did not complete: page.click: Timeout 30000ms exceeded.
- gate 5 keyboard only: 390x844 light find-install-command (keyboard) did not complete: more than 16 actions
- gate 4 screen-only user: 390x844 dark find-install-command (pointer) did not complete: page.click: Timeout 30000ms exceeded.
- gate 4 screen-only user: 1366x768 light find-install-command (pointer) did not complete: no visible link toward docs/getting-started from /aep
- gate 5 keyboard only: 1366x768 light find-install-command (keyboard) did not complete: no visible link toward docs/getting-started from /aep
- gate 4 screen-only user: 1366x768 dark find-install-command (pointer) did not complete: no visible link toward docs/getting-started from /aep
- gate 4 screen-only user: 1280x720 light find-install-command (pointer) did not complete: no visible link toward docs/getting-started from /aep
- gate 5 keyboard only: 1280x720 light find-install-command (keyboard) did not complete: no visible link toward docs/getting-started from /aep
- gate 4 screen-only user: 1280x720 dark find-install-command (pointer) did not complete: no visible link toward docs/getting-started from /aep

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
