// Runs the fast loop on a built site: layout contract, accessibility and the screen-only user.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { parseViewport } from './adapter.js';
import { checkPage, openContext, settle } from './checks.js';
import { runScreenOnly } from './screen-only.js';
import { serveSite, sitemapPages } from './site.js';
export async function launch(executablePath) {
    const { chromium } = await import('playwright');
    return chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
}
export async function runUx(options) {
    const { adapter, scenarios } = options;
    const log = options.log ?? (() => undefined);
    const viewports = options.viewports ?? adapter.viewports.gating;
    const gating = adapter.viewports.gating;
    const pages = adapter.pages.length ? adapter.pages : await sitemapPages(options.site, adapter.baseUrl);
    const server = await serveSite(options.site, adapter.baseUrl);
    const browser = await launch(options.executablePath ?? process.env.B10X_CHROME_BIN);
    const run = { pages, viewports, gating, themes: adapter.themes, pageRuns: [], botRuns: [], failures: [], metrics: {} };
    if (options.shots)
        await mkdir(options.shots, { recursive: true });
    try {
        for (const viewportName of viewports)
            for (const theme of adapter.themes) {
                const viewport = parseViewport(viewportName);
                const context = await openContext(browser, viewport, theme);
                try {
                    const page = await context.newPage();
                    const errors = [];
                    page.on('pageerror', (error) => errors.push(String(error)));
                    for (const pagePath of pages) {
                        errors.length = 0;
                        await page.goto(new URL(pagePath, server.url).href, { waitUntil: 'load' });
                        await settle(page);
                        let shot;
                        if (options.shots) {
                            shot = path.join(options.shots, `page-${slug(pagePath)}-${viewportName}-${theme}.png`);
                            await page.screenshot({ path: shot });
                        }
                        const facts = await checkPage(page, adapter, viewport, pagePath, theme);
                        // Every reading state: half a screen at a time down to the end of the page.
                        const height = await page.evaluate(() => document.documentElement.scrollHeight);
                        const seen = new Set();
                        for (let top = viewport.height / 2; top < height; top += viewport.height / 2) {
                            await page.evaluate((y) => window.scrollTo({ left: 0, top: y, behavior: 'instant' }), top);
                            await page.waitForTimeout(80);
                            const scrolled = await checkPage(page, adapter, viewport, pagePath, theme, false);
                            for (const entry of scrolled.hidden) {
                                const name = entry.split(':')[0];
                                if (!seen.has(name)) {
                                    seen.add(name);
                                    facts.hidden.push(`scrolled to ${Math.round(await page.evaluate(() => window.scrollY))}px, ${entry}`);
                                }
                            }
                        }
                        facts.errors.push(...errors);
                        run.pageRuns.push({ page: pagePath, viewport: viewportName, theme, facts, ...(shot ? { shot } : {}) });
                        log(`${viewportName} ${theme} /${pagePath}: ${summary(facts)}`);
                    }
                    for (const card of scenarios)
                        for (const mode of ['pointer', 'keyboard']) {
                            if (mode === 'keyboard' && theme !== adapter.themes[0])
                                continue;
                            const result = await runScreenOnly(page, server.url, adapter, card, mode).catch((error) => ({
                                scenario: card.id, mode, completed: false, actions: 0, looks: 0, steers: 0, glances: [], timeToAct: [], trail: [], reason: String(error.message).split('\n')[0],
                            }));
                            run.botRuns.push({ viewport: viewportName, theme, result });
                            log(`${viewportName} ${theme} ${card.id} ${mode}: ${result.completed ? 'done' : `FAILED ${result.reason}`} in ${result.actions} actions (${result.trail.join(' > ')})`);
                        }
                }
                finally {
                    await context.close();
                }
            }
    }
    finally {
        await browser.close();
        await server.close();
    }
    run.failures = gateFailures(run, scenarios);
    run.metrics = metricsOf(run, scenarios);
    return run;
}
function summary(facts) {
    const parts = [
        facts.pageScrollX ? `scrollX ${facts.pageScrollX}` : '', facts.overflow.length ? `${facts.overflow.length} overflow` : '',
        facts.hidden.length ? `${facts.hidden.length} hidden` : '', facts.axe.serious.length + facts.axe.critical.length ? `axe ${[...facts.axe.critical, ...facts.axe.serious].join(', ')}` : '',
    ].filter(Boolean);
    return parts.length ? parts.join('; ') : 'ok';
}
export function slug(pagePath) {
    return pagePath.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'index';
}
/** Hard gates 1, 2, 4 and 5 at the gating viewports. */
export function gateFailures(run, scenarios) {
    const failures = [];
    for (const { page, viewport, theme, facts } of run.pageRuns) {
        if (!run.gating.includes(viewport))
            continue;
        const at = `${viewport} ${theme} /${page}`;
        if (facts.pageScrollX > 0)
            failures.push(`gate 1 no scroll: ${at} scrolls ${facts.pageScrollX}px sideways`);
        for (const entry of facts.overflow)
            failures.push(`gate 1 no scroll: ${at} ${entry}`);
        for (const entry of facts.hidden)
            failures.push(`gate 2 always visible: ${at} ${entry}`);
        for (const entry of [...facts.axe.critical, ...facts.axe.serious])
            failures.push(`gate 5 accessibility: ${at} axe ${entry}`);
        for (const entry of facts.errors)
            failures.push(`page error: ${at} ${entry}`);
    }
    for (const { viewport, theme, result } of run.botRuns) {
        if (!run.gating.includes(viewport))
            continue;
        const card = scenarios.find((item) => item.id === result.scenario);
        const at = `${viewport} ${theme} ${result.scenario} (${result.mode})`;
        const gate = result.mode === 'keyboard' ? 'gate 5 keyboard only' : 'gate 4 screen-only user';
        if (!result.completed)
            failures.push(`${gate}: ${at} did not complete: ${result.reason}`);
        else if (card && result.mode === 'pointer' && result.actions > card.expectations.maxActions)
            failures.push(`${gate}: ${at} took ${result.actions} actions, card allows ${card.expectations.maxActions}`);
    }
    return failures;
}
export const median = (values) => { if (!values.length)
    return 0; const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2; };
const p95 = (values) => { if (!values.length)
    return 0; const sorted = [...values].sort((a, b) => a - b); return sorted[Math.min(sorted.length - 1, Math.ceil(0.95 * sorted.length) - 1)]; };
const round = (value) => Math.round(value * 1000) / 1000;
/** Lower-is-better values per scenario and per site view, keyed for ux/baseline.json. */
export function metricsOf(run, scenarios, viewports = run.gating) {
    const metrics = {};
    for (const viewport of viewports) {
        for (const theme of run.themes) {
            const views = run.pageRuns.filter((item) => item.viewport === viewport && item.theme === theme);
            if (!views.length)
                continue;
            metrics[`site@${viewport}@${theme}`] = {
                'layout.overflow': views.reduce((sum, item) => sum + item.facts.overflow.length + (item.facts.pageScrollX > 0 ? 1 : 0), 0),
                'layout.truncated': views.reduce((sum, item) => sum + item.facts.truncated.length, 0),
                'layout.hidden': views.reduce((sum, item) => sum + item.facts.hidden.length, 0),
                'layout.optional_missing': views.reduce((sum, item) => sum + item.facts.missingOptional.length, 0),
                'axe.serious_critical': views.reduce((sum, item) => sum + item.facts.axeNodes.serious_critical, 0),
                'axe.moderate_minor': views.reduce((sum, item) => sum + item.facts.axeNodes.moderate_minor, 0),
                'layout_shift.cls_max': round(Math.max(0, ...views.map((item) => item.facts.cls))),
                'motion.running': views.reduce((sum, item) => sum + item.facts.motion.length, 0),
            };
        }
        for (const card of scenarios) {
            const bots = run.botRuns.filter((item) => item.viewport === viewport && item.result.scenario === card.id && item.result.mode === 'pointer');
            if (!bots.length)
                continue;
            const worst = (pick) => Math.max(...bots.map((item) => pick(item.result)));
            const glances = bots.flatMap((item) => item.result.glances);
            const keyboard = run.botRuns.filter((item) => item.viewport === viewport && item.result.scenario === card.id && item.result.mode === 'keyboard');
            metrics[`${card.id}@${viewport}`] = {
                ...(keyboard.length ? { 'screen_only.keyboard_actions': Math.max(...keyboard.map((item) => item.result.actions)) } : {}),
                'screen_only.incomplete': bots.filter((item) => !item.result.completed).length,
                'screen_only.actions': worst((result) => result.actions),
                'screen_only.looks': worst((result) => result.looks),
                'screen_only.steers': worst((result) => result.steers),
                'screen_only.time_to_act_steps.max': worst((result) => Math.max(0, ...result.timeToAct)),
                'glance_cost.median': median(glances),
                'glance_cost.p95': p95(glances),
            };
        }
    }
    return metrics;
}
