# llm report

Commit b140e094-dirty, 2026-11-10. Site: 14 pages from the build's sitemap, 7 viewports (1440x900, 1280x800, 1024x768, 768x1024, 390x844, 1366x768, 1280x720), themes light and dark. Gating viewports: 1366x768, 1280x720. Scenario cards: find-first-command (rotating).

## Metrics

All lower is better. Only the first row is gated (bar 0, gating viewports); the other rows count every measured viewport and are reported, not gated. The baseline is `ux/baseline.json` (gating viewports only).

| metric | value | bar | last round |
| --- | --- | --- | --- |
| Hard-gate failures, gating viewports | 110 | 0 | – |
| Hard-gate checks failing at any measured viewport | 281 | – | – |
| Elements past their box or the viewport (all views) | 0 | – | – |
| Always-visible elements missing, clipped or covered (all views) | 260 | – | – |
| axe serious or critical failing nodes (all views) | 0 | – | – |
| axe moderate or minor failing nodes (all views) | 0 | – | – |
| Optional always-visible elements absent (search) | 196 | – | – |
| Screen-only runs not completed | 21 | – | – |
| Screen-only actions, median of pointer runs | 17 | – | – |
| Largest layout shift on load | 0 | – | – |

Baseline entries: 0 values over 0 scenario views.

## Per viewport

| viewport | theme | overflow | hidden | axe serious+critical nodes | axe moderate+minor nodes | truncated | search absent | CLS max |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | light | 0 | 26 | 0 | 0 | 0 | 14 | 0 |
| 1440x900 | dark | 0 | 26 | 0 | 0 | 0 | 14 | 0 |
| 1280x800 | light | 0 | 26 | 0 | 0 | 0 | 14 | 0 |
| 1280x800 | dark | 0 | 26 | 0 | 0 | 0 | 14 | 0 |
| 1024x768 | light | 0 | 26 | 0 | 0 | 0 | 14 | 0 |
| 1024x768 | dark | 0 | 26 | 0 | 0 | 0 | 14 | 0 |
| 768x1024 | light | 0 | 0 | 0 | 0 | 0 | 14 | 0 |
| 768x1024 | dark | 0 | 0 | 0 | 0 | 0 | 14 | 0 |
| 390x844 | light | 0 | 0 | 0 | 0 | 0 | 14 | 0 |
| 390x844 | dark | 0 | 0 | 0 | 0 | 0 | 14 | 0 |
| 1366x768 (gating) | light | 0 | 26 | 0 | 0 | 0 | 14 | 0 |
| 1366x768 (gating) | dark | 0 | 26 | 0 | 0 | 0 | 14 | 0 |
| 1280x720 (gating) | light | 0 | 26 | 0 | 0 | 0 | 14 | 0 |
| 1280x720 (gating) | dark | 0 | 26 | 0 | 0 | 0 | 14 | 0 |

## Screen-only user

| scenario | viewport | theme | mode | done | actions | looks | steers | trail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| find-first-command | 1440x900 | light | pointer | no: more than 16 actions | 17 | 17 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > click "Getting started" > PageDown |
| find-first-command | 1440x900 | light | keyboard | no: more than 16 actions | 36 | 17 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > Tab x19 > Enter "Getting started" > PageDown |
| find-first-command | 1440x900 | dark | pointer | no: more than 16 actions | 17 | 17 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > click "Getting started" > PageDown |
| find-first-command | 1280x800 | light | pointer | no: more than 16 actions | 17 | 17 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown |
| find-first-command | 1280x800 | light | keyboard | no: more than 16 actions | 17 | 17 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown |
| find-first-command | 1280x800 | dark | pointer | no: more than 16 actions | 17 | 17 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown |
| find-first-command | 1024x768 | light | pointer | no: more than 16 actions | 17 | 17 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown |
| find-first-command | 1024x768 | light | keyboard | no: more than 16 actions | 17 | 17 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown |
| find-first-command | 1024x768 | dark | pointer | no: more than 16 actions | 17 | 17 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown |
| find-first-command | 768x1024 | light | pointer | no: page.click: Timeout 30000ms exceeded. | 0 | 0 | 0 |  |
| find-first-command | 768x1024 | light | keyboard | no: more than 16 actions | 18 | 12 | 0 | open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown |
| find-first-command | 768x1024 | dark | pointer | no: page.click: Timeout 30000ms exceeded. | 0 | 0 | 0 |  |
| find-first-command | 390x844 | light | pointer | no: page.click: Timeout 30000ms exceeded. | 0 | 0 | 0 |  |
| find-first-command | 390x844 | light | keyboard | no: more than 16 actions | 18 | 12 | 0 | open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown > open menu > Escape > PageDown |
| find-first-command | 390x844 | dark | pointer | no: page.click: Timeout 30000ms exceeded. | 0 | 0 | 0 |  |
| find-first-command | 1366x768 | light | pointer | no: more than 16 actions | 17 | 17 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown |
| find-first-command | 1366x768 | light | keyboard | no: more than 16 actions | 17 | 17 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown |
| find-first-command | 1366x768 | dark | pointer | no: more than 16 actions | 17 | 17 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown |
| find-first-command | 1280x720 | light | pointer | no: more than 16 actions | 17 | 17 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown |
| find-first-command | 1280x720 | light | keyboard | no: more than 16 actions | 17 | 17 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown |
| find-first-command | 1280x720 | dark | pointer | no: more than 16 actions | 17 | 17 | 0 | PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown > PageDown |

## Worst moments

1. `/docs` 1366x768 light: sidebar: 12,94..278,1140 outside 1366x768; scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768. Shot: [shots/worst-1.png](shots/worst-1.png)
2. `/docs/concepts/accounting` 1366x768 light: sidebar: 12,94..278,1140 outside 1366x768; scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768. Shot: [shots/worst-2.png](shots/worst-2.png)
3. `/docs/concepts/credentials` 1366x768 light: sidebar: 12,94..278,1140 outside 1366x768; scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768. Shot: [shots/worst-3.png](shots/worst-3.png)
4. `/docs/concepts/neutral-boundary` 1366x768 light: sidebar: 12,94..278,1140 outside 1366x768; scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768. Shot: [shots/worst-4.png](shots/worst-4.png)
5. `/docs/getting-started` 1366x768 light: sidebar: 12,94..278,1140 outside 1366x768; scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768. Shot: [shots/worst-5.png](shots/worst-5.png)
6. `/docs/guides/call-a-local-endpoint` 1366x768 light: sidebar: 12,94..278,1140 outside 1366x768; scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768. Shot: [shots/worst-6.png](shots/worst-6.png)

Contact sheets: [shots/contact-sheet-light.png](shots/contact-sheet-light.png), [shots/contact-sheet-dark.png](shots/contact-sheet-dark.png).

## Failing checks at any measured viewport

- gate 2 always visible: 1440x900 light /docs sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/concepts/accounting sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/concepts/accounting scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/concepts/credentials sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/concepts/credentials scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/concepts/neutral-boundary sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/concepts/neutral-boundary scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/getting-started sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/getting-started scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/guides/call-a-local-endpoint sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/guides/call-a-local-endpoint scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/guides/call-a-model-on-bedrock sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/guides/call-a-model-on-bedrock scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/guides/call-a-model-with-one-forced-tool sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/guides/call-a-model-with-one-forced-tool scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/reference/crates sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/reference/crates scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/reference/formats sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/reference/formats scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/status sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/status scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/status/limitations sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/status/limitations scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/status/roadmap sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/status/roadmap scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/concepts/accounting sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/concepts/accounting scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/concepts/credentials sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/concepts/credentials scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/concepts/neutral-boundary sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/concepts/neutral-boundary scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/getting-started sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/getting-started scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/guides/call-a-local-endpoint sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/guides/call-a-local-endpoint scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/guides/call-a-model-on-bedrock sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/guides/call-a-model-on-bedrock scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/guides/call-a-model-with-one-forced-tool sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/guides/call-a-model-with-one-forced-tool scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/reference/crates sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/reference/crates scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/reference/formats sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/reference/formats scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/status sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/status scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/status/limitations sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/status/limitations scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/status/roadmap sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/status/roadmap scrolled to 450px, sidebar: 12,94..278,1140 outside 1440x900
- gate 2 always visible: 1280x800 light /docs sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/concepts/accounting sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/concepts/accounting scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/concepts/credentials sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/concepts/credentials scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/concepts/neutral-boundary sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/concepts/neutral-boundary scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/getting-started sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/getting-started scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/guides/call-a-local-endpoint sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/guides/call-a-local-endpoint scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/guides/call-a-model-on-bedrock sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/guides/call-a-model-on-bedrock scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/guides/call-a-model-with-one-forced-tool sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/guides/call-a-model-with-one-forced-tool scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/reference/crates sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/reference/crates scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/reference/formats sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/reference/formats scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/status sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/status scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/status/limitations sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/status/limitations scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/status/roadmap sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/status/roadmap scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/concepts/accounting sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/concepts/accounting scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/concepts/credentials sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/concepts/credentials scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/concepts/neutral-boundary sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/concepts/neutral-boundary scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/getting-started sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/getting-started scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/guides/call-a-local-endpoint sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/guides/call-a-local-endpoint scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/guides/call-a-model-on-bedrock sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/guides/call-a-model-on-bedrock scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/guides/call-a-model-with-one-forced-tool sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/guides/call-a-model-with-one-forced-tool scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/reference/crates sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/reference/crates scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/reference/formats sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/reference/formats scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/status sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/status scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/status/limitations sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/status/limitations scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/status/roadmap sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/status/roadmap scrolled to 400px, sidebar: 12,94..278,1140 outside 1280x800
- gate 2 always visible: 1024x768 light /docs sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/concepts/accounting sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/concepts/accounting scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/concepts/credentials sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/concepts/credentials scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/concepts/neutral-boundary sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/concepts/neutral-boundary scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/getting-started sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/getting-started scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/guides/call-a-local-endpoint sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/guides/call-a-local-endpoint scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/guides/call-a-model-on-bedrock sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/guides/call-a-model-on-bedrock scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/guides/call-a-model-with-one-forced-tool sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/guides/call-a-model-with-one-forced-tool scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/reference/crates sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/reference/crates scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/reference/formats sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/reference/formats scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/status sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/status scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/status/limitations sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/status/limitations scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/status/roadmap sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/status/roadmap scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/concepts/accounting sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/concepts/accounting scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/concepts/credentials sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/concepts/credentials scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/concepts/neutral-boundary sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/concepts/neutral-boundary scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/getting-started sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/getting-started scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/guides/call-a-local-endpoint sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/guides/call-a-local-endpoint scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/guides/call-a-model-on-bedrock sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/guides/call-a-model-on-bedrock scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/guides/call-a-model-with-one-forced-tool sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/guides/call-a-model-with-one-forced-tool scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/reference/crates sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/reference/crates scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/reference/formats sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/reference/formats scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/status sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/status scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/status/limitations sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/status/limitations scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/status/roadmap sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/status/roadmap scrolled to 384px, sidebar: 12,94..278,1140 outside 1024x768
- gate 2 always visible: 1366x768 light /docs sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/concepts/accounting sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/concepts/accounting scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/concepts/credentials sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/concepts/credentials scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/concepts/neutral-boundary sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/concepts/neutral-boundary scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/getting-started sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/getting-started scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/guides/call-a-local-endpoint sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/guides/call-a-local-endpoint scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/guides/call-a-model-on-bedrock sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/guides/call-a-model-on-bedrock scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/guides/call-a-model-with-one-forced-tool sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/guides/call-a-model-with-one-forced-tool scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/reference/crates sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/reference/crates scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/reference/formats sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/reference/formats scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/status sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/status scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/status/limitations sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/status/limitations scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/status/roadmap sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/status/roadmap scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/concepts/accounting sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/concepts/accounting scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/concepts/credentials sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/concepts/credentials scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/concepts/neutral-boundary sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/concepts/neutral-boundary scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/getting-started sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/getting-started scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/guides/call-a-local-endpoint sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/guides/call-a-local-endpoint scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/guides/call-a-model-on-bedrock sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/guides/call-a-model-on-bedrock scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/guides/call-a-model-with-one-forced-tool sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/guides/call-a-model-with-one-forced-tool scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/reference/crates sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/reference/crates scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/reference/formats sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/reference/formats scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/status sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/status scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/status/limitations sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/status/limitations scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/status/roadmap sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/status/roadmap scrolled to 384px, sidebar: 12,94..278,1140 outside 1366x768
- gate 2 always visible: 1280x720 light /docs sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/concepts/accounting sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/concepts/accounting scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/concepts/credentials sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/concepts/credentials scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/concepts/neutral-boundary sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/concepts/neutral-boundary scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/getting-started sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/getting-started scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/guides/call-a-local-endpoint sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/guides/call-a-local-endpoint scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/guides/call-a-model-on-bedrock sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/guides/call-a-model-on-bedrock scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/guides/call-a-model-with-one-forced-tool sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/guides/call-a-model-with-one-forced-tool scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/reference/crates sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/reference/crates scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/reference/formats sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/reference/formats scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/status sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/status scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/status/limitations sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/status/limitations scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/status/roadmap sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/status/roadmap scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/concepts/accounting sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/concepts/accounting scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/concepts/credentials sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/concepts/credentials scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/concepts/neutral-boundary sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/concepts/neutral-boundary scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/getting-started sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/getting-started scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/guides/call-a-local-endpoint sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/guides/call-a-local-endpoint scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/guides/call-a-model-on-bedrock sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/guides/call-a-model-on-bedrock scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/guides/call-a-model-with-one-forced-tool sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/guides/call-a-model-with-one-forced-tool scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/reference/crates sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/reference/crates scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/reference/formats sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/reference/formats scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/status sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/status scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/status/limitations sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/status/limitations scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/status/roadmap sidebar: 12,94..278,1140 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/status/roadmap scrolled to 360px, sidebar: 12,94..278,1140 outside 1280x720
- gate 4 screen-only user: 1440x900 light find-first-command (pointer) did not complete: more than 16 actions
- gate 5 keyboard only: 1440x900 light find-first-command (keyboard) did not complete: more than 16 actions
- gate 4 screen-only user: 1440x900 dark find-first-command (pointer) did not complete: more than 16 actions
- gate 4 screen-only user: 1280x800 light find-first-command (pointer) did not complete: more than 16 actions
- gate 5 keyboard only: 1280x800 light find-first-command (keyboard) did not complete: more than 16 actions
- gate 4 screen-only user: 1280x800 dark find-first-command (pointer) did not complete: more than 16 actions
- gate 4 screen-only user: 1024x768 light find-first-command (pointer) did not complete: more than 16 actions
- gate 5 keyboard only: 1024x768 light find-first-command (keyboard) did not complete: more than 16 actions
- gate 4 screen-only user: 1024x768 dark find-first-command (pointer) did not complete: more than 16 actions
- gate 4 screen-only user: 768x1024 light find-first-command (pointer) did not complete: page.click: Timeout 30000ms exceeded.
- gate 5 keyboard only: 768x1024 light find-first-command (keyboard) did not complete: more than 16 actions
- gate 4 screen-only user: 768x1024 dark find-first-command (pointer) did not complete: page.click: Timeout 30000ms exceeded.
- gate 4 screen-only user: 390x844 light find-first-command (pointer) did not complete: page.click: Timeout 30000ms exceeded.
- gate 5 keyboard only: 390x844 light find-first-command (keyboard) did not complete: more than 16 actions
- gate 4 screen-only user: 390x844 dark find-first-command (pointer) did not complete: page.click: Timeout 30000ms exceeded.
- gate 4 screen-only user: 1366x768 light find-first-command (pointer) did not complete: more than 16 actions
- gate 5 keyboard only: 1366x768 light find-first-command (keyboard) did not complete: more than 16 actions
- gate 4 screen-only user: 1366x768 dark find-first-command (pointer) did not complete: more than 16 actions
- gate 4 screen-only user: 1280x720 light find-first-command (pointer) did not complete: more than 16 actions
- gate 5 keyboard only: 1280x720 light find-first-command (keyboard) did not complete: more than 16 actions
- gate 4 screen-only user: 1280x720 dark find-first-command (pointer) did not complete: more than 16 actions

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
