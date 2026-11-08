# R-01 report review

Verdict: **not fit to send as is.** Default action: send R-01 with the caveats in § 4. Before any
baseline is written from these tools, fix T1 and T2, because both make a gate pass that should fail.

How I checked:

- Re-measured the built site (`.cache/product-site-build`, 120 views) with my own Playwright and
  axe-core script, which does not use the round's check code.
- Counted real key presses for all 15 keyboard trails.
- Re-ran `ux round` into scratch. Its headline and all bot trails are identical to R-01, so the run
  is deterministic.

Scripts and outputs are in
the session scratch directory (not committed): `measure.mjs`,
`keys.mjs`, `measure.json`, `keys.json`, `adopt-1024-y1536.png` and `rerun/`.

## 1. Are the numbers right and meaningful?

| headline | report | recomputed | differs |
| --- | --- | --- | --- |
| Hard-gate failures, gating viewports | 28 | 44 | +16: sidebar out of view at 1024x768 (T1) |
| Hard-gate checks failing, any viewport | 72 | 108 | +36: same cause, all desktop widths |
| Always-visible missing, clipped or covered | 2 | 38 | +36 (T1) |
| axe serious+critical "rule hits" | 70 | 70 | no. It counts (page, rule) pairs; the same views have 2520 failing nodes (T3) |
| axe moderate+minor | 0 | 0 | no. Outside the WCAG tags there are 2 more (`landmark-unique`) |
| Elements past their box or the viewport | 0 | 0 | no |
| Optional element absent (search) | 120 | 120 | no |
| Screen-only runs not completed | 0 | 0 | no |
| Screen-only actions, median of pointer runs | 3 | 3 | no |
| Largest layout shift | 0 | 0.000013 | no (rounding) |
| Keyboard runs, actions (15 rows) | 1–6 | 9–36 key presses | every row (T2) |

Three headline numbers differ, plus all 15 keyboard action counts.

The recomputed always-visible count uses the round's own rule: the element must be inside the
viewport and uncovered, with the end of the page exempt for the sidebar (`atEnd: false`). I sampled
every half screen instead of only at "one screen down". The +16/+36 depends on where the samples
fall, but it is never 0.

What each metric means in this round:

- **Gate 2 ("always visible")** is not met at the gating viewport 1024x768.
  - On all 8 docs pages, in both themes, the sidebar leaves the top of the viewport during the last
    screen, before the exempt end state. One example is `/docs/adopt` at scrollY 1536: the sidebar
    spans −112 to 262 px and its first items are under the navbar (`adopt-1024-y1536.png`).
  - UXF-006 says this "turns red if it reaches a gating viewport". It already has.
- **Gate 5 (keyboard)** passes only because Tab presses are not counted.
  - `find-adopt-config` at 1024x768 takes 13 Tab + Enter, then 21 Tab + Enter: 36 presses. The card
    allows 4 actions; the report shows 2.
- **The axe headline** cannot move until a rule is fixed on every node of a page. For example,
  `/session` `aria-prohibited-attr` is 109 nodes counted as 1. Both the bar and the ratchet are
  blind to partial fixes and to new nodes added to a rule that already fails.
- **Bars marked 0** are attached to all-views totals (`hidden`, `axe`). The gate itself covers only
  the gating viewports. So hidden = 2, which is entirely at the non-gated 1440x900, reads as a gate
  breach.
- **Comparison.** This is the first round, so "last round" is empty by design. `ux/baseline.json`
  does not exist ("Baseline entries: 0"), so nothing in this round is ratcheted yet.
- **Commit.** The report says 296f431, but this is unverified.
  - The working tree has uncommitted changes to `src/charts.tsx`, `src/product.tsx` and
    `src/session-charts.tsx`.
  - Those files were modified at 23:23, the build is from 23:00, and the round ran from 23:19 to
    23:23. The measured site is the 23:00 build, and the report does not say what source it came
    from.
- **No people, no recordings.** The trial is a scripted bot that matches link names to keywords.
  "Actions" measures how the site's link text fits the card's keywords, not a reader's effort.

## 2. Findings the report misses

1. **Gating sidebar loss at 1024x768.** 16 gating views fail (8 docs pages, both themes), and 38 fail
   across 1440, 1280 and 1024. This makes UXF-006 a gate failure, not a deferred S3. Two of these
   views are covered by navbar parts rather than pushed out of view: `/docs/contracts` at 1440x900
   (`navbar__brand`) and `/docs/code` at 1280x800 (`navbar__title`).
2. **Keyboard cost.** At desktop widths the reader needs 13 Tab presses to reach the hero button and
   21 more to reach "Adopt the template" in the sidebar. At phone widths, reaching "Status" takes 13
   Tab presses after the menu opens. No row of the report shows this.
3. **Node counts.** 2520 failing nodes in total, 252 per viewport and theme. `/session` alone has 109
   chart marks with a prohibited `aria-label`. The report shows at most 3 selectors per rule.
4. **The only gate-2 failure in the report has no shot.** `/docs/adopt` at 1440x900, one screen
   down, scores 3 and is not gated, so the tie-break drops it from the six worst moments.
5. **Worst shots don't show the defect.** `worst-2.png` (`/` at 390x844) shows the top of the page,
   but the truncated terminal title and the graph nodes it lists are below the fold.
6. **Desktop frames on the contact sheets are too small to read.** A 1440 px frame is scaled to
   390 px.

## 3. Tool defects

- **T1** `src/ux/run.ts` (the `mid`/`end` loop in `runUx`) checks always-visible elements only at
  scrollY = innerHeight and at the very end.
  - The sidebar leaving view between those two points is never sampled, at any width.
  - Input: `/docs/adopt` at 1024x768, scrollY 1536, sidebar top −112. The same happens on every docs
    page at 1024, 1280 and 1440.
- **T2** `src/ux/screen-only.ts`: `tabTo()` presses Tab up to 300 times without calling `act()`, and
  keyboard "open menu" uses `page.focus()`.
  - Keyboard actions therefore equal pointer actions, and `gateFailures` (`run.ts`) compares them
    with `maxActions`.
  - Input: `find-adopt-config` keyboard at 1024x768: 36 presses, reported 2, card maximum 4.
- **T3** `src/ux/checks.ts` (`byImpact`) and `round.ts` (`headline`, `metricsOf`) count one entry per
  violated rule per view and drop `nodes`.
  - Input: `/session` `aria-prohibited-attr`, 109 nodes counted as 1. The headline is 70 against
    2520 nodes.
- **T4** `src/ux/round.ts` metrics table: bar 0 is printed for `hidden_all` and
  `axe_serious_critical_all`, which are all-views totals. The gate covers gating viewports only.
  - Input: hidden = 2 against bar 0, with both entries at the non-gated 1440x900.
- **T5** `src/ux/round.ts` worst moments copy the shot taken at load, at the top of the page, not
  the state or element that failed. The tie-break ranks gated views first, so a non-gated gate-2
  failure is never shown.
  - Input: `worst-2.png`, and the missing `/docs/adopt` 1440x900 "one screen down" entry.
- **T6** `src/ux/round.ts` takes the commit from `git rev-parse --short HEAD` in the current
  directory. It neither flags a dirty tree nor records the build's source or time.
  - Input: R-01 says 296f431 while three files in `src/` were modified.
  - Related: `dist/ux` was compiled at 23:24:41, after `round.json` (23:23:31). The re-run with the
    current `dist` matched exactly, so this round is not affected.
- **T7** `src/ux/round.ts` "Levels run" is hard-coded. It claims "L7 heuristic review (two review
  agents)" before either reviewer runs. "Findings on file" is read at write time.
  - Input: the scratch re-run now lists UXF-007..010, which R-01's `report.md` does not.
- **T8** `src/ux/ratchet.ts` `readBaseline` silently returns an empty baseline when
  `ux/baseline.json` is missing. The report still says "the baseline is `ux/baseline.json`".
  - Input: R-01, where the file does not exist.
- **T9** `src/ux/round.ts` `headline` uses the lower median for `screen_only_actions_median`, while
  `metricsOf` in `run.ts` uses the averaged median. The two disagree on even counts.
  - Input: not visible in R-01, where both give 3.
- **T10** `src/ux/round.ts` `contactSheet` draws every frame 390 px wide, so desktop frames end up
  about 27 % of their size.
  - Input: `shots/contact-sheet-light.png`.

## 4. Caveats to send with the round

- Gate 2 fails at the gating viewport 1024x768 (the sidebar during the last screen of every docs
  page), although the report shows 0 there.
- The keyboard gate passed only because Tab presses are not counted. Real cost is 9–36 key presses
  per task, and 36 for `find-adopt-config`, whose card allows 4.
- axe counts are (page, rule) pairs: 70 pairs against 2520 failing nodes.
- No baseline exists yet. "Commit 296f431" is unverified, because the tree was dirty and the site
  build predates the last source edits.
- No people, recordings, questionnaire or paid levels were used. Every scenario result comes from a
  keyword-matching bot.
