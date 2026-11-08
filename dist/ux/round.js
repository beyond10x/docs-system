// The round's Measure step (SKILL § 3.2): report.md, round.json, shots/ and ../trend.md.
import { execFileSync } from 'node:child_process';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readFindings } from './findings.js';
import { gateFailures, launch, median, metricsOf } from './run.js';
export function headline(run, scenarios) {
    const all = { ...run, gating: run.viewports };
    const sum = (pick) => run.pageRuns.reduce((total, item) => total + pick(item), 0);
    const pointer = run.botRuns.filter((item) => item.result.mode === 'pointer').map((item) => item.result.actions);
    return {
        gate_failures_gating: gateFailures(run, scenarios).length,
        gate_failures_all: gateFailures(all, scenarios).length,
        overflow_all: sum((item) => item.facts.overflow.length + (item.facts.pageScrollX > 0 ? 1 : 0)),
        hidden_all: sum((item) => item.facts.hidden.length),
        axe_serious_critical_all: sum((item) => item.facts.axeNodes.serious_critical),
        axe_moderate_minor_all: sum((item) => item.facts.axeNodes.moderate_minor),
        optional_missing_all: sum((item) => item.facts.missingOptional.length),
        screen_only_incomplete_all: run.botRuns.filter((item) => !item.result.completed).length,
        screen_only_actions_median: median(pointer),
        cls_max: Math.round(Math.max(0, ...run.pageRuns.map((item) => item.facts.cls)) * 1000) / 1000,
    };
}
const LABELS = {
    gate_failures_gating: 'Hard-gate failures, gating viewports',
    gate_failures_all: 'Hard-gate checks failing at any measured viewport',
    overflow_all: 'Elements past their box or the viewport (all views)',
    hidden_all: 'Always-visible elements missing, clipped or covered (all views)',
    axe_serious_critical_all: 'axe serious or critical failing nodes (all views)',
    axe_moderate_minor_all: 'axe moderate or minor failing nodes (all views)',
    optional_missing_all: 'Optional always-visible elements absent (search)',
    screen_only_incomplete_all: 'Screen-only runs not completed',
    screen_only_actions_median: 'Screen-only actions, median of pointer runs',
    cls_max: 'Largest layout shift on load',
};
export async function writeRound({ run, adapter, scenarios, roundDir, baseline, findingsDir }) {
    const round = path.basename(roundDir);
    const shots = path.join(roundDir, 'shots');
    const commit = (() => { try {
        const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
        return execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).trim() ? `${head}-dirty` : head;
    }
    catch {
        return 'unknown';
    } })();
    const date = new Date().toISOString().slice(0, 10);
    const head = headline(run, scenarios);
    const previous = await lastRound(path.dirname(roundDir), round);
    const metrics = metricsOf(run, scenarios, run.viewports);
    const failuresAll = gateFailures({ ...run, gating: run.viewports }, scenarios);
    await writeFile(path.join(roundDir, 'round.json'), `${JSON.stringify({ round, date, commit, headline: head, gating: run.gating, viewports: run.viewports, themes: run.themes, pages: run.pages, metrics, failures_gating: run.failures, failures_all: failuresAll, bots: run.botRuns, views: run.pageRuns.map(({ shot, ...rest }) => ({ ...rest, shot: shot ? path.relative(roundDir, shot) : undefined })) }, null, 2)}\n`);
    // Worst moments: the views with the most findings, one shot each.
    const score = (item) => item.facts.overflow.length + item.facts.hidden.length * 3 + (item.facts.axe.serious.length + item.facts.axe.critical.length) * 3 + item.facts.truncated.length;
    // One worst view per page, the gating viewports first on a tie.
    const ranked = [...run.pageRuns].filter((item) => score(item) > 0).sort((a, b) => score(b) - score(a) || Number(run.gating.includes(b.viewport)) - Number(run.gating.includes(a.viewport)) || a.page.localeCompare(b.page));
    const worst = ranked.filter((item, index) => ranked.findIndex((other) => other.page === item.page) === index).slice(0, 6);
    for (const [index, item] of worst.entries())
        if (item.shot)
            await copyFile(item.shot, path.join(shots, `worst-${index + 1}.png`));
    const sheets = [];
    for (const theme of run.themes) {
        const frames = run.pageRuns.filter((item) => item.theme === theme && item.shot && (item.page === '' || item.page === scenarios[0]?.truth.path.replace(/\/$/, '')));
        const file = path.join(shots, `contact-sheet-${theme}.png`);
        await contactSheet(frames.map((item) => ({ file: item.shot, label: `/${item.page} ${item.viewport}` })), file);
        sheets.push(path.basename(file));
    }
    const findings = await readFindings(findingsDir);
    const base = (key) => previous?.headline?.[key] ?? '–';
    const lines = [
        `# ${round} report`,
        '',
        `Commit ${commit}, ${date}. Site: ${run.pages.length} pages from the build's sitemap, ${run.viewports.length} viewports (${run.viewports.join(', ')}), themes ${run.themes.join(' and ')}. Gating viewports: ${run.gating.join(', ')}. Scenario cards: ${scenarios.map((card) => `${card.id} (${card.card})`).join(', ')}.`,
        '',
        '## Metrics',
        '',
        'All lower is better. Only the first row is gated (bar 0, gating viewports); the other rows count every measured viewport and are reported, not gated. The baseline is `ux/baseline.json` (gating viewports only).',
        '',
        '| metric | value | bar | last round |',
        '| --- | --- | --- | --- |',
        ...Object.keys(LABELS).map((key) => `| ${LABELS[key]} | ${head[key]} | ${key === 'gate_failures_gating' ? '0' : '–'} | ${base(key)} |`),
        '',
        `Baseline entries: ${Object.values(baseline.scenarios).reduce((total, keys) => total + Object.keys(keys).length, 0)} values over ${Object.keys(baseline.scenarios).length} scenario views.`,
        '',
        '## Per viewport',
        '',
        '| viewport | theme | overflow | hidden | axe serious+critical nodes | axe moderate+minor nodes | truncated | search absent | CLS max |',
        '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
        ...run.viewports.flatMap((viewport) => run.themes.map((theme) => {
            const m = metrics[`site@${viewport}@${theme}`] ?? {};
            return `| ${viewport}${run.gating.includes(viewport) ? ' (gating)' : ''} | ${theme} | ${m['layout.overflow']} | ${m['layout.hidden']} | ${m['axe.serious_critical']} | ${m['axe.moderate_minor']} | ${m['layout.truncated']} | ${m['layout.optional_missing']} | ${m['layout_shift.cls_max']} |`;
        })),
        '',
        '## Screen-only user',
        '',
        '| scenario | viewport | theme | mode | done | actions | looks | steers | trail |',
        '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
        ...run.botRuns.map(({ viewport, theme, result }) => `| ${result.scenario} | ${viewport} | ${theme} | ${result.mode} | ${result.completed ? 'yes' : `no: ${result.reason}`} | ${result.actions} | ${result.looks} | ${result.steers} | ${result.trail.join(' > ').replace(/\|/g, '\\|')} |`),
        '',
        '## Worst moments',
        '',
        ...(worst.length ? worst.map((item, index) => `${index + 1}. \`/${item.page}\` ${item.viewport} ${item.theme}: ${[...item.facts.hidden, ...item.facts.overflow, ...item.facts.axe.critical, ...item.facts.axe.serious, ...item.facts.truncated].slice(0, 4).join('; ').replace(/\|/g, '\\|')}. Shot: [shots/worst-${index + 1}.png](shots/worst-${index + 1}.png)`) : ['None.']),
        '',
        `Contact sheets: ${sheets.map((name) => `[shots/${name}](shots/${name})`).join(', ')}.`,
        '',
        '## Failing checks at any measured viewport',
        '',
        ...(failuresAll.length ? failuresAll.map((line) => `- ${line}`) : ['None.']),
        '',
        '## Findings on file',
        '',
        ...(findings.length ? findings.map((finding) => `- ${finding.id} ${finding.severity} ${finding.status}: ${finding.title}`) : ['None yet.']),
        '',
        '## Levels run and skipped',
        '',
        '- Run: L1 (metric functions), L2 layout contract and axe-core, L3 screen-only user (pointer and keyboard), L7 heuristic review (two review agents).',
        '- Skipped: L0 and gate 6 (a docs site has no guidance cue); gate 3 (no completion state beyond the task\'s target text, which gate 4 covers).',
        '- Skipped, paid: L4 keyed replay and L5 discoverability probe. Not run in this round; no operator approval for paid APIs was sought.',
        '- Skipped, people: L6 live rounds and the 90-second questionnaire. No person ran the cards; questionnaire scores: none.',
        '- L8 real-user sessions: not in a round.',
        '',
        '## Missing inputs',
        '',
        '- No rrweb recordings: the trial is the scripted screen-only user, whose trail is listed above.',
        '- No questionnaire, no L5 probe results.',
        '',
    ];
    await writeFile(path.join(roundDir, 'report.md'), `${lines.join('\n')}`);
    await appendTrend(path.join(path.dirname(roundDir), 'trend.md'), round, date, commit, head);
}
async function lastRound(roundsDir, current) {
    const number = Number(current.replace(/^R-/, ''));
    if (!(number > 1))
        return undefined;
    const previous = `R-${String(number - 1).padStart(2, '0')}`;
    return JSON.parse(await readFile(path.join(roundsDir, previous, 'round.json'), 'utf8').catch(() => '{}'));
}
async function appendTrend(file, round, date, commit, head) {
    const header = ['# UX trend', '', 'One row per round, from each round\'s round.json. All lower is better.', '',
        '| round | date | commit | gate failures (gating) | gate checks failing (all) | overflow | hidden | axe serious+critical | search absent | screen-only incomplete | actions median |',
        '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'];
    const existing = await readFile(file, 'utf8').catch(() => '');
    const rows = existing.split('\n').filter((line) => /^\| R-\d+ /.test(line) && !line.startsWith(`| ${round} `));
    rows.push(`| ${round} | ${date} | ${commit} | ${head.gate_failures_gating} | ${head.gate_failures_all} | ${head.overflow_all} | ${head.hidden_all} | ${head.axe_serious_critical_all} | ${head.optional_missing_all} | ${head.screen_only_incomplete_all} | ${head.screen_only_actions_median} |`);
    rows.sort();
    await writeFile(file, `${[...header, ...rows].join('\n')}\n`);
}
/** Renders the frames in a grid with their labels and screenshots it. */
async function contactSheet(frames, out) {
    if (!frames.length)
        return;
    const images = await Promise.all(frames.map(async (frame) => ({ label: frame.label, data: (await readFile(frame.file)).toString('base64') })));
    const html = `<!doctype html><body style="margin:0;background:#222;font:14px sans-serif;color:#eee;display:flex;flex-wrap:wrap;gap:8px;padding:8px;width:1600px">${images.map((image) => `<figure style="margin:0;width:780px"><img style="width:780px;display:block" src="data:image/png;base64,${image.data}"><figcaption>${image.label.replace(/</g, '&lt;')}</figcaption></figure>`).join('')}</body>`;
    const browser = await launch(process.env.B10X_CHROME_BIN);
    try {
        const page = await browser.newPage({ viewport: { width: 1616, height: 400 } });
        await page.setContent(html, { waitUntil: 'load' });
        await page.screenshot({ path: out, fullPage: true });
    }
    finally {
        await browser.close();
    }
}
