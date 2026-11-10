// Layout contract and accessibility checks on one loaded page (SKILL § 4 gates 1, 2, 5).
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let axeSource;
async function axe() {
    axeSource ??= await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
    return axeSource;
}
export async function openContext(browser, viewport, theme) {
    const context = await browser.newContext({ viewport, colorScheme: theme === 'dark' ? 'dark' : 'light', reducedMotion: 'reduce', deviceScaleFactor: 1 });
    await context.addInitScript((value) => {
        try {
            localStorage.setItem('theme', value);
        }
        catch { /* storage may be blocked */ }
        const state = { cls: 0 };
        window.__ux = state;
        try {
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries())
                    if (!entry.hadRecentInput)
                        state.cls += entry.value;
            }).observe({ type: 'layout-shift', buffered: true });
        }
        catch { /* layout-shift unsupported */ }
    }, theme);
    await context.route(/^(?!http:\/\/127\.0\.0\.1[:/])/, (route) => route.abort());
    return context;
}
export async function settle(page) {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
}
/**
 * Runs gates 1, 2 and 5 on the current page at its current scroll position. With `full: false` only
 * the always-visible elements are checked, for the scroll steps after load.
 */
export async function checkPage(page, adapter, viewport, pagePath, theme, full = true) {
    const rules = adapter.alwaysVisible.filter((rule) => applies(rule, viewport, pagePath));
    const layout = await page.evaluate(({ rules, ignore, theme, full, footer }) => {
        const describe = (element) => {
            const id = element.id ? `#${element.id}` : '';
            const classes = Array.from(element.classList).filter((name) => !/_[a-zA-Z0-9]{4,}$/.test(name)).slice(0, 2).map((name) => `.${name}`).join('');
            return `${element.tagName.toLowerCase()}${id}${classes}`;
        };
        const root = document.documentElement;
        const width = root.clientWidth;
        const shown = (element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
        };
        const clippedBy = (element) => {
            for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
                if (getComputedStyle(parent).overflowX !== 'visible')
                    return parent;
            }
            return undefined;
        };
        const ignored = (element) => ignore.some((selector) => element.closest(selector));
        const overflow = [];
        const truncated = [];
        for (const element of full ? Array.from(document.body.querySelectorAll('*')) : []) {
            if (!shown(element) || ignored(element) || element.closest('svg') && element.tagName.toLowerCase() !== 'svg')
                continue;
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            if ((rect.right > width + 1 || rect.left < -1) && !clippedBy(element) && style.position !== 'fixed') {
                overflow.push(`${describe(element)}: spans ${Math.round(rect.left)}..${Math.round(rect.right)} of ${width}px`);
            }
            const own = element;
            if (style.overflowX === 'visible' && style.display !== 'inline' && own.scrollWidth > own.clientWidth + 1 && own.clientWidth > 0 && element.childElementCount === 0 && (element.textContent ?? '').trim()) {
                overflow.push(`${describe(element)}: text ${own.scrollWidth}px in a ${own.clientWidth}px box`);
            }
            if (style.textOverflow === 'ellipsis' && own.scrollWidth > own.clientWidth + 1) {
                const full = element.getAttribute('title') ?? element.getAttribute('aria-label') ?? element.closest('[title]')?.getAttribute('title');
                if (!full)
                    truncated.push(`${describe(element)}: "${(element.textContent ?? '').trim().slice(0, 40)}"`);
            }
        }
        const hidden = [];
        const missingOptional = [];
        const footerTop = document.querySelector(footer)?.getBoundingClientRect().top ?? Infinity;
        for (const rule of rules) {
            if (rule.whileFooterHidden && footerTop < window.innerHeight)
                continue;
            const element = Array.from(document.querySelectorAll(rule.selector)).find(shown);
            if (!element) {
                (rule.required === false ? missingOptional : hidden).push(`${rule.name}: absent`);
                continue;
            }
            // A menu taller than the screen that scrolls inside its own column stays reachable: the column is what must be in view.
            const column = (() => { for (let parent = element; parent && parent !== document.body; parent = parent.parentElement) {
                const { overflowY } = getComputedStyle(parent);
                if ((overflowY === "auto" || overflowY === "scroll") && parent.scrollHeight > parent.clientHeight + 1)
                    return parent;
            } return undefined; })();
            const rect = (column ?? element).getBoundingClientRect();
            if (rect.left < -0.5 || rect.top < -0.5 || rect.right > width + 0.5 || rect.bottom > window.innerHeight + 0.5) {
                hidden.push(`${rule.name}: ${Math.round(rect.left)},${Math.round(rect.top)}..${Math.round(rect.right)},${Math.round(rect.bottom)} outside ${width}x${window.innerHeight}`);
                continue;
            }
            const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + Math.min(rect.height / 2, 20));
            if (!hit || !((column ?? element) === hit || (column ?? element).contains(hit) || hit.contains(column ?? element)))
                hidden.push(`${rule.name}: covered by ${hit ? describe(hit) : 'nothing'}`);
        }
        const errors = [];
        const mode = root.getAttribute('data-theme');
        if (mode && mode !== theme)
            errors.push(`theme is ${mode}, expected ${theme}`);
        const motion = document.getAnimations()
            .filter((animation) => animation.playState === 'running')
            .filter((animation) => { const timing = animation.effect?.getComputedTiming(); return timing && (timing.iterations === Infinity || Number(timing.duration) > 50); })
            .map((animation) => { const target = animation.effect?.target; return target ? describe(target) : 'animation'; });
        return { pageScrollX: Math.max(0, root.scrollWidth - width), overflow: [...new Set(overflow)], truncated: [...new Set(truncated)], hidden, missingOptional, errors, motion: [...new Set(motion)], cls: window.__ux?.cls ?? 0 };
    }, { rules, ignore: adapter.overflowIgnore, theme, full, footer: adapter.footer });
    if (!full)
        return { ...layout, axe: { serious: [], critical: [], moderate: [], minor: [] }, axeNodes: { serious_critical: 0, moderate_minor: 0 } };
    await page.addScriptTag({ content: await axe() });
    const result = await page.evaluate(async (disabled) => {
        const axe = window.axe;
        const rules = Object.fromEntries(disabled.map((id) => [id, { enabled: false }]));
        const report = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, rules, resultTypes: ['violations'] });
        return report.violations.map((violation) => ({ id: violation.id, impact: violation.impact, nodes: violation.nodes.length, targets: violation.nodes.slice(0, 3).map((node) => String(node.target.join(' '))) }));
    }, adapter.axeDisabled);
    const byImpact = { serious: [], critical: [], moderate: [], minor: [] };
    const axeNodes = { serious_critical: 0, moderate_minor: 0 };
    for (const violation of result) {
        const impact = (violation.impact ?? 'minor');
        byImpact[impact]?.push(`${violation.id} (${violation.nodes}): ${violation.targets.join(', ')}`);
        axeNodes[impact === 'serious' || impact === 'critical' ? 'serious_critical' : 'moderate_minor'] += violation.nodes;
    }
    return { ...layout, axe: byImpact, axeNodes };
}
export function applies(rule, viewport, pagePath) {
    if (rule.minWidth !== undefined && viewport.width < rule.minWidth)
        return false;
    if (rule.maxWidth !== undefined && viewport.width > rule.maxWidth)
        return false;
    if (rule.pathPrefix !== undefined && !pagePath.startsWith(rule.pathPrefix))
        return false;
    return true;
}
