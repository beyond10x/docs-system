# connectors report

Commit 23b9f1bc4a-dirty, 2026-11-10. Site: 14 pages from the build's sitemap, 7 viewports (1440x900, 1280x800, 1024x768, 768x1024, 390x844, 1366x768, 1280x720), themes light and dark. Gating viewports: 1366x768, 1280x720. Scenario cards: find-install-command (rotating).

## Metrics

All lower is better. Only the first row is gated (bar 0, gating viewports); the other rows count every measured viewport and are reported, not gated. The baseline is `ux/baseline.json` (gating viewports only).

| metric | value | bar | last round |
| --- | --- | --- | --- |
| Hard-gate failures, gating viewports | 86 | 0 | – |
| Hard-gate checks failing at any measured viewport | 214 | – | – |
| Elements past their box or the viewport (all views) | 0 | – | – |
| Always-visible elements missing, clipped or covered (all views) | 212 | – | – |
| axe serious or critical failing nodes (all views) | 2 | – | – |
| axe moderate or minor failing nodes (all views) | 0 | – | – |
| Optional always-visible elements absent (search) | 196 | – | – |
| Screen-only runs not completed | 0 | – | – |
| Screen-only actions, median of pointer runs | 3 | – | – |
| Largest layout shift on load | 0.037 | – | – |

Baseline entries: 0 values over 0 scenario views.

## Per viewport

| viewport | theme | overflow | hidden | axe serious+critical nodes | axe moderate+minor nodes | truncated | search absent | CLS max |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | light | 0 | 20 | 0 | 0 | 0 | 14 | 0.037 |
| 1440x900 | dark | 0 | 20 | 0 | 0 | 0 | 14 | 0.001 |
| 1280x800 | light | 0 | 21 | 0 | 0 | 0 | 14 | 0 |
| 1280x800 | dark | 0 | 21 | 0 | 0 | 0 | 14 | 0.029 |
| 1024x768 | light | 0 | 22 | 0 | 0 | 1 | 14 | 0.016 |
| 1024x768 | dark | 0 | 22 | 0 | 0 | 1 | 14 | 0 |
| 768x1024 | light | 0 | 0 | 0 | 0 | 0 | 14 | 0.001 |
| 768x1024 | dark | 0 | 0 | 0 | 0 | 0 | 14 | 0.001 |
| 390x844 | light | 0 | 0 | 1 | 0 | 1 | 14 | 0.018 |
| 390x844 | dark | 0 | 0 | 1 | 0 | 1 | 14 | 0.018 |
| 1366x768 (gating) | light | 0 | 21 | 0 | 0 | 0 | 14 | 0 |
| 1366x768 (gating) | dark | 0 | 21 | 0 | 0 | 0 | 14 | 0.028 |
| 1280x720 (gating) | light | 0 | 22 | 0 | 0 | 0 | 14 | 0.024 |
| 1280x720 (gating) | dark | 0 | 22 | 0 | 0 | 0 | 14 | 0.024 |

## Screen-only user

| scenario | viewport | theme | mode | done | actions | looks | steers | trail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| find-install-command | 1440x900 | light | pointer | yes | 3 | 4 | 0 | click "Get started" > PageDown > PageDown |
| find-install-command | 1440x900 | light | keyboard | yes | 13 | 4 | 0 | Tab x10 > Enter "Get started" > PageDown > PageDown |
| find-install-command | 1440x900 | dark | pointer | yes | 3 | 4 | 0 | click "Get started" > PageDown > PageDown |
| find-install-command | 1280x800 | light | pointer | yes | 3 | 4 | 0 | click "Get started" > PageDown > PageDown |
| find-install-command | 1280x800 | light | keyboard | yes | 13 | 4 | 0 | Tab x10 > Enter "Get started" > PageDown > PageDown |
| find-install-command | 1280x800 | dark | pointer | yes | 3 | 4 | 0 | click "Get started" > PageDown > PageDown |
| find-install-command | 1024x768 | light | pointer | yes | 4 | 5 | 0 | click "Get started" > PageDown > PageDown > PageDown |
| find-install-command | 1024x768 | light | keyboard | yes | 8 | 5 | 0 | Tab x4 > Enter "Get started" > PageDown > PageDown > PageDown |
| find-install-command | 1024x768 | dark | pointer | yes | 4 | 5 | 0 | click "Get started" > PageDown > PageDown > PageDown |
| find-install-command | 768x1024 | light | pointer | yes | 2 | 3 | 0 | click "Get started" > PageDown |
| find-install-command | 768x1024 | light | keyboard | yes | 6 | 3 | 0 | Tab x4 > Enter "Get started" > PageDown |
| find-install-command | 768x1024 | dark | pointer | yes | 2 | 3 | 0 | click "Get started" > PageDown |
| find-install-command | 390x844 | light | pointer | yes | 4 | 5 | 0 | click "Get started" > PageDown > PageDown > PageDown |
| find-install-command | 390x844 | light | keyboard | yes | 8 | 5 | 0 | Tab x4 > Enter "Get started" > PageDown > PageDown > PageDown |
| find-install-command | 390x844 | dark | pointer | yes | 4 | 5 | 0 | click "Get started" > PageDown > PageDown > PageDown |
| find-install-command | 1366x768 | light | pointer | yes | 3 | 4 | 0 | click "Get started" > PageDown > PageDown |
| find-install-command | 1366x768 | light | keyboard | yes | 7 | 4 | 0 | Tab x4 > Enter "Get started" > PageDown > PageDown |
| find-install-command | 1366x768 | dark | pointer | yes | 3 | 4 | 0 | click "Get started" > PageDown > PageDown |
| find-install-command | 1280x720 | light | pointer | yes | 3 | 4 | 0 | click "Get started" > PageDown > PageDown |
| find-install-command | 1280x720 | light | keyboard | yes | 7 | 4 | 0 | Tab x4 > Enter "Get started" > PageDown > PageDown |
| find-install-command | 1280x720 | dark | pointer | yes | 3 | 4 | 0 | click "Get started" > PageDown > PageDown |

## Worst moments

1. `/docs` 1366x768 light: sidebar: 8,82..290,1728 outside 1366x768; scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768. Shot: [shots/worst-1.png](shots/worst-1.png)
2. `/docs/concepts/catalog-provider` 1366x768 light: sidebar: 8,82..290,1728 outside 1366x768; scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768. Shot: [shots/worst-2.png](shots/worst-2.png)
3. `/docs/connectors` 1366x768 light: sidebar: 8,82..290,1728 outside 1366x768; scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768. Shot: [shots/worst-3.png](shots/worst-3.png)
4. `/docs/connectors/calendar` 1366x768 light: sidebar: 8,82..290,1728 outside 1366x768; scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768. Shot: [shots/worst-4.png](shots/worst-4.png)
5. `/docs/examples/follow-a-request` 1366x768 light: sidebar: 8,82..290,1728 outside 1366x768; scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768. Shot: [shots/worst-5.png](shots/worst-5.png)
6. `/docs/getting-started` 1366x768 light: sidebar: 8,82..290,1728 outside 1366x768; scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768. Shot: [shots/worst-6.png](shots/worst-6.png)

Contact sheets: [shots/contact-sheet-light.png](shots/contact-sheet-light.png), [shots/contact-sheet-dark.png](shots/contact-sheet-dark.png).

## Failing checks at any measured viewport

- gate 2 always visible: 1440x900 light /docs sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 light /docs scrolled to 450px, sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/concepts/catalog-provider sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/concepts/catalog-provider scrolled to 450px, sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/connectors sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/connectors scrolled to 450px, sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/connectors/calendar sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/connectors/calendar scrolled to 450px, sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/examples/follow-a-request sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/examples/follow-a-request scrolled to 450px, sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/getting-started sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/getting-started scrolled to 450px, sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/guides/author-a-definition sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/guides/author-a-definition scrolled to 450px, sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/guides/build-a-catalog-bundle sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/guides/build-a-catalog-bundle scrolled to 450px, sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/reference/adapters sidebar: 8,82..290,2221 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/reference/adapters scrolled to 450px, sidebar: 8,82..290,2221 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/status sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 light /docs/status scrolled to 450px, sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs scrolled to 450px, sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/concepts/catalog-provider sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/concepts/catalog-provider scrolled to 450px, sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/connectors sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/connectors scrolled to 450px, sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/connectors/calendar sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/connectors/calendar scrolled to 450px, sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/examples/follow-a-request sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/examples/follow-a-request scrolled to 450px, sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/getting-started sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/getting-started scrolled to 450px, sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/guides/author-a-definition sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/guides/author-a-definition scrolled to 450px, sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/guides/build-a-catalog-bundle sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/guides/build-a-catalog-bundle scrolled to 450px, sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/reference/adapters sidebar: 8,82..290,2221 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/reference/adapters scrolled to 450px, sidebar: 8,82..290,2221 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/status sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1440x900 dark /docs/status scrolled to 450px, sidebar: 8,82..290,1728 outside 1440x900
- gate 2 always visible: 1280x800 light /docs sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 light /docs scrolled to 400px, sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/concepts/catalog-provider sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/concepts/catalog-provider scrolled to 400px, sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/connectors sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/connectors scrolled to 400px, sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/connectors/calendar sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/connectors/calendar scrolled to 400px, sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/examples/contract-exercises sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/examples/follow-a-request sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/examples/follow-a-request scrolled to 400px, sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/getting-started sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/getting-started scrolled to 400px, sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/guides/author-a-definition sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/guides/author-a-definition scrolled to 400px, sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/guides/build-a-catalog-bundle sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/guides/build-a-catalog-bundle scrolled to 400px, sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/reference/adapters sidebar: 8,82..290,2221 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/reference/adapters scrolled to 400px, sidebar: 8,82..290,2221 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/status sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 light /docs/status scrolled to 400px, sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs scrolled to 400px, sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/concepts/catalog-provider sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/concepts/catalog-provider scrolled to 400px, sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/connectors sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/connectors scrolled to 400px, sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/connectors/calendar sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/connectors/calendar scrolled to 400px, sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/examples/contract-exercises sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/examples/follow-a-request sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/examples/follow-a-request scrolled to 400px, sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/getting-started sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/getting-started scrolled to 400px, sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/guides/author-a-definition sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/guides/author-a-definition scrolled to 400px, sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/guides/build-a-catalog-bundle sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/guides/build-a-catalog-bundle scrolled to 400px, sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/reference/adapters sidebar: 8,82..290,2221 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/reference/adapters scrolled to 400px, sidebar: 8,82..290,2221 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/status sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1280x800 dark /docs/status scrolled to 400px, sidebar: 8,82..290,1728 outside 1280x800
- gate 2 always visible: 1024x768 light /docs sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 light /docs scrolled to 384px, sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/concepts/adapters sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/concepts/catalog-provider sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/concepts/catalog-provider scrolled to 384px, sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/connectors sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/connectors scrolled to 384px, sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/connectors/calendar sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/connectors/calendar scrolled to 384px, sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/examples/contract-exercises sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/examples/follow-a-request sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/examples/follow-a-request scrolled to 384px, sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/getting-started sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/getting-started scrolled to 384px, sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/guides/author-a-definition sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/guides/author-a-definition scrolled to 384px, sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/guides/build-a-catalog-bundle sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/guides/build-a-catalog-bundle scrolled to 384px, sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/reference/adapters sidebar: 8,82..290,2221 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/reference/adapters scrolled to 384px, sidebar: 8,82..290,2221 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/status sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 light /docs/status scrolled to 384px, sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs scrolled to 384px, sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/concepts/adapters sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/concepts/catalog-provider sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/concepts/catalog-provider scrolled to 384px, sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/connectors sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/connectors scrolled to 384px, sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/connectors/calendar sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/connectors/calendar scrolled to 384px, sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/examples/contract-exercises sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/examples/follow-a-request sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/examples/follow-a-request scrolled to 384px, sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/getting-started sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/getting-started scrolled to 384px, sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/guides/author-a-definition sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/guides/author-a-definition scrolled to 384px, sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/guides/build-a-catalog-bundle sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/guides/build-a-catalog-bundle scrolled to 384px, sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/reference/adapters sidebar: 8,82..290,2221 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/reference/adapters scrolled to 384px, sidebar: 8,82..290,2221 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/status sidebar: 8,82..290,1728 outside 1024x768
- gate 2 always visible: 1024x768 dark /docs/status scrolled to 384px, sidebar: 8,82..290,1728 outside 1024x768
- gate 5 accessibility: 390x844 light /docs/guides/author-a-definition axe scrollable-region-focusable (1): .b10x-table-wrap:nth-child(52) > table
- gate 5 accessibility: 390x844 dark /docs/guides/author-a-definition axe scrollable-region-focusable (1): .b10x-table-wrap:nth-child(52) > table
- gate 2 always visible: 1366x768 light /docs sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 light /docs scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/concepts/catalog-provider sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/concepts/catalog-provider scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/connectors sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/connectors scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/connectors/calendar sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/connectors/calendar scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/examples/contract-exercises sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/examples/follow-a-request sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/examples/follow-a-request scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/getting-started sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/getting-started scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/guides/author-a-definition sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/guides/author-a-definition scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/guides/build-a-catalog-bundle sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/guides/build-a-catalog-bundle scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/reference/adapters sidebar: 8,82..290,2221 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/reference/adapters scrolled to 384px, sidebar: 8,82..290,2221 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/status sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 light /docs/status scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/concepts/catalog-provider sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/concepts/catalog-provider scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/connectors sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/connectors scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/connectors/calendar sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/connectors/calendar scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/examples/contract-exercises sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/examples/follow-a-request sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/examples/follow-a-request scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/getting-started sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/getting-started scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/guides/author-a-definition sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/guides/author-a-definition scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/guides/build-a-catalog-bundle sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/guides/build-a-catalog-bundle scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/reference/adapters sidebar: 8,82..290,2221 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/reference/adapters scrolled to 384px, sidebar: 8,82..290,2221 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/status sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1366x768 dark /docs/status scrolled to 384px, sidebar: 8,82..290,1728 outside 1366x768
- gate 2 always visible: 1280x720 light /docs sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 light /docs scrolled to 360px, sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/concepts/adapters sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/concepts/catalog-provider sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/concepts/catalog-provider scrolled to 360px, sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/connectors sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/connectors scrolled to 360px, sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/connectors/calendar sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/connectors/calendar scrolled to 360px, sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/examples/contract-exercises sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/examples/follow-a-request sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/examples/follow-a-request scrolled to 360px, sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/getting-started sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/getting-started scrolled to 360px, sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/guides/author-a-definition sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/guides/author-a-definition scrolled to 360px, sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/guides/build-a-catalog-bundle sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/guides/build-a-catalog-bundle scrolled to 360px, sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/reference/adapters sidebar: 8,82..290,2221 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/reference/adapters scrolled to 360px, sidebar: 8,82..290,2221 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/status sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 light /docs/status scrolled to 360px, sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs scrolled to 360px, sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/concepts/adapters sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/concepts/catalog-provider sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/concepts/catalog-provider scrolled to 360px, sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/connectors sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/connectors scrolled to 360px, sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/connectors/calendar sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/connectors/calendar scrolled to 360px, sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/examples/contract-exercises sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/examples/follow-a-request sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/examples/follow-a-request scrolled to 360px, sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/getting-started sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/getting-started scrolled to 360px, sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/guides/author-a-definition sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/guides/author-a-definition scrolled to 360px, sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/guides/build-a-catalog-bundle sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/guides/build-a-catalog-bundle scrolled to 360px, sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/reference/adapters sidebar: 8,82..290,2221 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/reference/adapters scrolled to 360px, sidebar: 8,82..290,2221 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/status sidebar: 8,82..290,1728 outside 1280x720
- gate 2 always visible: 1280x720 dark /docs/status scrolled to 360px, sidebar: 8,82..290,1728 outside 1280x720

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
