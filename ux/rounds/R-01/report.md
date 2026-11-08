# R-01 report

Commit 296f431, 2026-11-08. Site: 12 pages from the build's sitemap, 5 viewports (1440x900, 1280x800, 1024x768, 768x1024, 390x844), themes light and dark. Gating viewports: 1024x768, 390x844. Scenario cards: find-adopt-config (anchor), find-install-command (anchor), find-not-built (rotating).

## Metrics

All lower is better. Bar is the hard-gate bar; the baseline is `ux/baseline.json` (gating viewports only).

| metric | value | bar | last round |
| --- | --- | --- | --- |
| Hard-gate failures, gating viewports | 28 | 0 | – |
| Hard-gate checks failing at any measured viewport | 72 | – | – |
| Elements past their box or the viewport (all views) | 0 | – | – |
| Always-visible elements missing, clipped or covered (all views) | 2 | 0 | – |
| axe serious or critical rule hits (all views) | 70 | 0 | – |
| axe moderate or minor rule hits (all views) | 0 | – | – |
| Optional always-visible elements absent (search) | 120 | – | – |
| Screen-only runs not completed | 0 | 0 | – |
| Screen-only actions, median of pointer runs | 3 | – | – |
| Largest layout shift on load | 0 | – | – |

Baseline entries: 0 values over 0 scenario views.

## Per viewport

| viewport | theme | overflow | hidden | axe serious+critical | axe moderate+minor | truncated | search absent | CLS max |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | light | 0 | 1 | 7 | 0 | 0 | 12 | 0 |
| 1440x900 | dark | 0 | 1 | 7 | 0 | 0 | 12 | 0 |
| 1280x800 | light | 0 | 0 | 7 | 0 | 0 | 12 | 0 |
| 1280x800 | dark | 0 | 0 | 7 | 0 | 0 | 12 | 0 |
| 1024x768 (gating) | light | 0 | 0 | 7 | 0 | 0 | 12 | 0 |
| 1024x768 (gating) | dark | 0 | 0 | 7 | 0 | 0 | 12 | 0 |
| 768x1024 | light | 0 | 0 | 7 | 0 | 0 | 12 | 0 |
| 768x1024 | dark | 0 | 0 | 7 | 0 | 0 | 12 | 0 |
| 390x844 (gating) | light | 0 | 0 | 7 | 0 | 1 | 12 | 0 |
| 390x844 (gating) | dark | 0 | 0 | 7 | 0 | 1 | 12 | 0 |

## Screen-only user

| scenario | viewport | theme | mode | done | actions | looks | steers | trail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| find-adopt-config | 1440x900 | light | pointer | yes | 2 | 3 | 0 | click "Read the components" > click "Adopt the template" |
| find-adopt-config | 1440x900 | light | keyboard | yes | 2 | 3 | 0 | Enter "Read the components" > Enter "Adopt the template" |
| find-install-command | 1440x900 | light | pointer | yes | 3 | 4 | 0 | click "Code" > PageDown > PageDown |
| find-install-command | 1440x900 | light | keyboard | yes | 3 | 4 | 0 | Enter "Code" > PageDown > PageDown |
| find-not-built | 1440x900 | light | pointer | yes | 1 | 2 | 0 | click "Status" |
| find-not-built | 1440x900 | light | keyboard | yes | 1 | 2 | 0 | Enter "Status" |
| find-adopt-config | 1440x900 | dark | pointer | yes | 2 | 3 | 0 | click "Read the components" > click "Adopt the template" |
| find-install-command | 1440x900 | dark | pointer | yes | 3 | 4 | 0 | click "Code" > PageDown > PageDown |
| find-not-built | 1440x900 | dark | pointer | yes | 1 | 2 | 0 | click "Status" |
| find-adopt-config | 1280x800 | light | pointer | yes | 2 | 3 | 0 | click "Read the components" > click "Adopt the template" |
| find-adopt-config | 1280x800 | light | keyboard | yes | 2 | 3 | 0 | Enter "Read the components" > Enter "Adopt the template" |
| find-install-command | 1280x800 | light | pointer | yes | 4 | 5 | 0 | click "Code" > PageDown > PageDown > PageDown |
| find-install-command | 1280x800 | light | keyboard | yes | 4 | 5 | 0 | Enter "Code" > PageDown > PageDown > PageDown |
| find-not-built | 1280x800 | light | pointer | yes | 1 | 2 | 0 | click "Status" |
| find-not-built | 1280x800 | light | keyboard | yes | 1 | 2 | 0 | Enter "Status" |
| find-adopt-config | 1280x800 | dark | pointer | yes | 2 | 3 | 0 | click "Read the components" > click "Adopt the template" |
| find-install-command | 1280x800 | dark | pointer | yes | 4 | 5 | 0 | click "Code" > PageDown > PageDown > PageDown |
| find-not-built | 1280x800 | dark | pointer | yes | 1 | 2 | 0 | click "Status" |
| find-adopt-config | 1024x768 | light | pointer | yes | 2 | 3 | 0 | click "Read the components" > click "Adopt the template" |
| find-adopt-config | 1024x768 | light | keyboard | yes | 2 | 3 | 0 | Enter "Read the components" > Enter "Adopt the template" |
| find-install-command | 1024x768 | light | pointer | yes | 4 | 5 | 0 | click "Code" > PageDown > PageDown > PageDown |
| find-install-command | 1024x768 | light | keyboard | yes | 4 | 5 | 0 | Enter "Code" > PageDown > PageDown > PageDown |
| find-not-built | 1024x768 | light | pointer | yes | 1 | 2 | 0 | click "Status" |
| find-not-built | 1024x768 | light | keyboard | yes | 1 | 2 | 0 | Enter "Status" |
| find-adopt-config | 1024x768 | dark | pointer | yes | 2 | 3 | 0 | click "Read the components" > click "Adopt the template" |
| find-install-command | 1024x768 | dark | pointer | yes | 4 | 5 | 0 | click "Code" > PageDown > PageDown > PageDown |
| find-not-built | 1024x768 | dark | pointer | yes | 1 | 2 | 0 | click "Status" |
| find-adopt-config | 768x1024 | light | pointer | yes | 3 | 4 | 0 | click "Read the components" > open menu > click "Adopt the template" |
| find-adopt-config | 768x1024 | light | keyboard | yes | 3 | 4 | 0 | Enter "Read the components" > open menu > Enter "Adopt the template" |
| find-install-command | 768x1024 | light | pointer | yes | 5 | 6 | 0 | click "Read the components" > open menu > click "Code blocks" > PageDown > PageDown |
| find-install-command | 768x1024 | light | keyboard | yes | 5 | 6 | 0 | Enter "Read the components" > open menu > Enter "Code blocks" > PageDown > PageDown |
| find-not-built | 768x1024 | light | pointer | yes | 4 | 5 | 0 | open menu > click "Status" > PageDown > PageDown |
| find-not-built | 768x1024 | light | keyboard | yes | 4 | 5 | 0 | open menu > Enter "Status" > PageDown > PageDown |
| find-adopt-config | 768x1024 | dark | pointer | yes | 3 | 4 | 0 | click "Read the components" > open menu > click "Adopt the template" |
| find-install-command | 768x1024 | dark | pointer | yes | 5 | 6 | 0 | click "Read the components" > open menu > click "Code blocks" > PageDown > PageDown |
| find-not-built | 768x1024 | dark | pointer | yes | 4 | 5 | 0 | open menu > click "Status" > PageDown > PageDown |
| find-adopt-config | 390x844 | light | pointer | yes | 3 | 4 | 0 | click "Read the components" > open menu > click "Adopt the template" |
| find-adopt-config | 390x844 | light | keyboard | yes | 3 | 4 | 0 | Enter "Read the components" > open menu > Enter "Adopt the template" |
| find-install-command | 390x844 | light | pointer | yes | 6 | 7 | 0 | click "Read the components" > open menu > click "Code blocks" > PageDown > PageDown > PageDown |
| find-install-command | 390x844 | light | keyboard | yes | 6 | 7 | 0 | Enter "Read the components" > open menu > Enter "Code blocks" > PageDown > PageDown > PageDown |
| find-not-built | 390x844 | light | pointer | yes | 5 | 6 | 0 | open menu > click "Status" > PageDown > PageDown > PageDown |
| find-not-built | 390x844 | light | keyboard | yes | 5 | 6 | 0 | open menu > Enter "Status" > PageDown > PageDown > PageDown |
| find-adopt-config | 390x844 | dark | pointer | yes | 3 | 4 | 0 | click "Read the components" > open menu > click "Adopt the template" |
| find-install-command | 390x844 | dark | pointer | yes | 6 | 7 | 0 | click "Read the components" > open menu > click "Code blocks" > PageDown > PageDown > PageDown |
| find-not-built | 390x844 | dark | pointer | yes | 5 | 6 | 0 | open menu > click "Status" > PageDown > PageDown > PageDown |

## Worst moments

1. `/docs/art` 1024x768 light: label-content-name-mismatch (6): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]; link-in-text-block (1): p:nth-child(3) > a[href$="heroes"]. Shot: [shots/worst-1.png](shots/worst-1.png)
2. `/` 390x844 light: label-content-name-mismatch (18): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]; span: "canon / repository root". Shot: [shots/worst-2.png](shots/worst-2.png)
3. `/docs/charts` 1024x768 light: label-content-name-mismatch (60): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]. Shot: [shots/worst-3.png](shots/worst-3.png)
4. `/docs/reference` 1024x768 light: label-content-name-mismatch (43): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]. Shot: [shots/worst-4.png](shots/worst-4.png)
5. `/heroes` 1024x768 light: label-content-name-mismatch (15): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]. Shot: [shots/worst-5.png](shots/worst-5.png)
6. `/session` 1024x768 light: aria-prohibited-attr (109): g:nth-child(2) > .b10x-chart-mark:nth-child(1), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(2), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(3). Shot: [shots/worst-6.png](shots/worst-6.png)

Contact sheets: [shots/contact-sheet-light.png](shots/contact-sheet-light.png), [shots/contact-sheet-dark.png](shots/contact-sheet-dark.png).

## Failing checks at any measured viewport

- gate 5 accessibility: 1440x900 light / axe label-content-name-mismatch (18): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 2 always visible: 1440x900 light /docs/adopt one screen down, sidebar: covered by div.theme-layout-navbar-left
- gate 5 accessibility: 1440x900 light /docs/art axe label-content-name-mismatch (6): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 1440x900 light /docs/art axe link-in-text-block (1): p:nth-child(3) > a[href$="heroes"]
- gate 5 accessibility: 1440x900 light /docs/charts axe label-content-name-mismatch (60): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 1440x900 light /docs/reference axe label-content-name-mismatch (43): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 1440x900 light /heroes axe label-content-name-mismatch (15): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 1440x900 light /session axe aria-prohibited-attr (109): g:nth-child(2) > .b10x-chart-mark:nth-child(1), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(2), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(3)
- gate 5 accessibility: 1440x900 dark / axe label-content-name-mismatch (18): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 2 always visible: 1440x900 dark /docs/adopt one screen down, sidebar: covered by div.theme-layout-navbar-left
- gate 5 accessibility: 1440x900 dark /docs/art axe label-content-name-mismatch (6): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 1440x900 dark /docs/art axe link-in-text-block (1): p:nth-child(3) > a[href$="heroes"]
- gate 5 accessibility: 1440x900 dark /docs/charts axe label-content-name-mismatch (60): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 1440x900 dark /docs/reference axe label-content-name-mismatch (43): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 1440x900 dark /heroes axe label-content-name-mismatch (15): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 1440x900 dark /session axe aria-prohibited-attr (109): g:nth-child(2) > .b10x-chart-mark:nth-child(1), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(2), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(3)
- gate 5 accessibility: 1280x800 light / axe label-content-name-mismatch (18): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 1280x800 light /docs/art axe label-content-name-mismatch (6): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 1280x800 light /docs/art axe link-in-text-block (1): p:nth-child(3) > a[href$="heroes"]
- gate 5 accessibility: 1280x800 light /docs/charts axe label-content-name-mismatch (60): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 1280x800 light /docs/reference axe label-content-name-mismatch (43): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 1280x800 light /heroes axe label-content-name-mismatch (15): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 1280x800 light /session axe aria-prohibited-attr (109): g:nth-child(2) > .b10x-chart-mark:nth-child(1), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(2), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(3)
- gate 5 accessibility: 1280x800 dark / axe label-content-name-mismatch (18): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 1280x800 dark /docs/art axe label-content-name-mismatch (6): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 1280x800 dark /docs/art axe link-in-text-block (1): p:nth-child(3) > a[href$="heroes"]
- gate 5 accessibility: 1280x800 dark /docs/charts axe label-content-name-mismatch (60): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 1280x800 dark /docs/reference axe label-content-name-mismatch (43): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 1280x800 dark /heroes axe label-content-name-mismatch (15): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 1280x800 dark /session axe aria-prohibited-attr (109): g:nth-child(2) > .b10x-chart-mark:nth-child(1), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(2), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(3)
- gate 5 accessibility: 1024x768 light / axe label-content-name-mismatch (18): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 1024x768 light /docs/art axe label-content-name-mismatch (6): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 1024x768 light /docs/art axe link-in-text-block (1): p:nth-child(3) > a[href$="heroes"]
- gate 5 accessibility: 1024x768 light /docs/charts axe label-content-name-mismatch (60): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 1024x768 light /docs/reference axe label-content-name-mismatch (43): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 1024x768 light /heroes axe label-content-name-mismatch (15): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 1024x768 light /session axe aria-prohibited-attr (109): g:nth-child(2) > .b10x-chart-mark:nth-child(1), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(2), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(3)
- gate 5 accessibility: 1024x768 dark / axe label-content-name-mismatch (18): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 1024x768 dark /docs/art axe label-content-name-mismatch (6): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 1024x768 dark /docs/art axe link-in-text-block (1): p:nth-child(3) > a[href$="heroes"]
- gate 5 accessibility: 1024x768 dark /docs/charts axe label-content-name-mismatch (60): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 1024x768 dark /docs/reference axe label-content-name-mismatch (43): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 1024x768 dark /heroes axe label-content-name-mismatch (15): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 1024x768 dark /session axe aria-prohibited-attr (109): g:nth-child(2) > .b10x-chart-mark:nth-child(1), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(2), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(3)
- gate 5 accessibility: 768x1024 light / axe label-content-name-mismatch (18): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 768x1024 light /docs/art axe label-content-name-mismatch (6): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 768x1024 light /docs/art axe link-in-text-block (1): p:nth-child(3) > a[href$="heroes"]
- gate 5 accessibility: 768x1024 light /docs/charts axe label-content-name-mismatch (60): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 768x1024 light /docs/reference axe label-content-name-mismatch (43): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 768x1024 light /heroes axe label-content-name-mismatch (15): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 768x1024 light /session axe aria-prohibited-attr (109): g:nth-child(2) > .b10x-chart-mark:nth-child(1), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(2), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(3)
- gate 5 accessibility: 768x1024 dark / axe label-content-name-mismatch (18): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 768x1024 dark /docs/art axe label-content-name-mismatch (6): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 768x1024 dark /docs/art axe link-in-text-block (1): p:nth-child(3) > a[href$="heroes"]
- gate 5 accessibility: 768x1024 dark /docs/charts axe label-content-name-mismatch (60): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 768x1024 dark /docs/reference axe label-content-name-mismatch (43): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 768x1024 dark /heroes axe label-content-name-mismatch (15): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 768x1024 dark /session axe aria-prohibited-attr (109): g:nth-child(2) > .b10x-chart-mark:nth-child(1), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(2), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(3)
- gate 5 accessibility: 390x844 light / axe label-content-name-mismatch (18): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 390x844 light /docs/art axe label-content-name-mismatch (6): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 390x844 light /docs/art axe link-in-text-block (1): p:nth-child(3) > a[href$="heroes"]
- gate 5 accessibility: 390x844 light /docs/charts axe label-content-name-mismatch (60): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 390x844 light /docs/reference axe label-content-name-mismatch (43): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 390x844 light /heroes axe label-content-name-mismatch (15): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 390x844 light /session axe aria-prohibited-attr (109): g:nth-child(2) > .b10x-chart-mark:nth-child(1), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(2), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(3)
- gate 5 accessibility: 390x844 dark / axe label-content-name-mismatch (18): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 390x844 dark /docs/art axe label-content-name-mismatch (6): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 390x844 dark /docs/art axe link-in-text-block (1): p:nth-child(3) > a[href$="heroes"]
- gate 5 accessibility: 390x844 dark /docs/charts axe label-content-name-mismatch (60): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 390x844 dark /docs/reference axe label-content-name-mismatch (43): g[transform="translate(0,162)"], g[transform="translate(0,238)"], g[transform="translate(0,314)"]
- gate 5 accessibility: 390x844 dark /heroes axe label-content-name-mismatch (15): g[transform="translate(0,48)"], g[transform="translate(0,124)"], g[transform="translate(328,48)"]
- gate 5 accessibility: 390x844 dark /session axe aria-prohibited-attr (109): g:nth-child(2) > .b10x-chart-mark:nth-child(1), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(2), svg[viewBox="0 0 1200 340"] > g:nth-child(2) > .b10x-chart-mark:nth-child(3)

## Findings on file

- UXF-001 S2 open: A graph node's accessible name leaves out the kicker it shows
- UXF-002 S2 open: Session chart marks carry an aria-label their element may not have
- UXF-003 S2 open: A link in documentation prose looks like its text
- UXF-004 S3 open: A terminal title cut with an ellipsis loses its full text
- UXF-005 S2 open, waiting on ux/rounds/R-01/decision.md: The product-site template ships no search
- UXF-006 S3 open, deferred past R-01's change set: The docs sidebar slides under the navbar as the footer comes into view

## Levels run and skipped

- Run: L1 (metric functions), L2 layout contract and axe-core, L3 screen-only user (pointer and keyboard), L7 heuristic review (two review agents).
- Skipped: L0 and gate 6 (a docs site has no guidance cue); gate 3 (no completion state beyond the task's target text, which gate 4 covers).
- Skipped, paid: L4 keyed replay and L5 discoverability probe. Not run in this round; no operator approval for paid APIs was sought.
- Skipped, people: L6 live rounds and the 90-second questionnaire. No person ran the cards; questionnaire scores: none.
- L8 real-user sessions: not in a round.

## Missing inputs

- No rrweb recordings: the trial is the scripted screen-only user, whose trail is listed above.
- No questionnaire, no L5 probe results.
