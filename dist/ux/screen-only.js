const MAX_ACTIONS = 16;
export async function runScreenOnly(page, base, adapter, card, mode) {
    const result = { scenario: card.id, mode, completed: false, actions: 0, looks: 0, steers: 0, glances: [], timeToAct: [], trail: [] };
    const visited = new Set();
    const target = new URL(card.truth.path, base).pathname.replace(/\/$/, '');
    await page.goto(new URL(card.start, base).href, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    let stepsHere = 0;
    let scrolledHere = 0;
    let menuOpen = false;
    let tabs = 0;
    const act = (what) => { result.actions += 1; stepsHere += 1; result.trail.push(what); };
    while (result.actions <= MAX_ACTIONS) {
        const here = new URL(page.url()).pathname.replace(/\/$/, '');
        visited.add(here);
        result.looks += 1;
        if (here === target && await truthInView(page, card.truth.text)) {
            result.completed = true;
            break;
        }
        if (here === target) {
            if (await atBottom(page)) {
                result.reason = `on ${card.truth.path} but "${card.truth.text}" is not visible`;
                break;
            }
            act('PageDown');
            await pageDown(page);
            scrolledHere += 1;
            continue;
        }
        const candidates = (await visibleLinks(page, adapter)).filter((candidate) => !visited.has(new URL(candidate.href).pathname.replace(/\/$/, '')));
        const best = choose(candidates, card.keywords);
        if (best) {
            // The link seen on screen must also be the one found by role and accessible name.
            const locator = page.getByRole('link', { name: best.name, exact: true }).and(page.locator('[data-ux-pick]'));
            let found = 0;
            for (let tries = 0; tries < 3 && found !== 1; tries += 1) {
                // Hydration may re-render the link and drop the mark; mark it again and look once more.
                if (tries)
                    await page.waitForTimeout(250);
                await page.evaluate((index) => {
                    document.querySelectorAll('[data-ux-pick]').forEach((element) => element.removeAttribute('data-ux-pick'));
                    document.querySelectorAll('a[href]')[index]?.setAttribute('data-ux-pick', '');
                }, best.index);
                found = await locator.count();
            }
            if (found !== 1) {
                result.reason = `link "${best.name}" on screen has a different accessible name`;
                break;
            }
            result.glances.push(scrolledHere > 0 || menuOpen ? 3 : best.region === 'primary' ? 1 : 2);
            result.timeToAct.push(stepsHere + 1);
            if (mode === 'keyboard') {
                const presses = await tabTo(page);
                if (presses < 0) {
                    result.reason = `link "${best.name}" is not reachable with Tab`;
                    break;
                }
                tabs += presses;
                result.trail.push(`Tab x${presses}`);
                act(`Enter "${best.name}"`);
                await page.keyboard.press('Enter');
            }
            else {
                act(`click "${best.name}"`);
                const clicked = await locator.click({ timeout: 5000 }).then(() => true, () => false);
                if (!clicked) {
                    result.reason = `link "${best.name}" could not be clicked`;
                    break;
                }
            }
            await page.waitForURL((url) => url.pathname.replace(/\/$/, '') !== here, { timeout: 5000 }).catch(() => undefined);
            await page.waitForLoadState('load');
            await page.waitForTimeout(150);
            stepsHere = 0;
            scrolledHere = 0;
            menuOpen = false;
            continue;
        }
        if (!menuOpen && await visibleControl(page, adapter.menuToggle)) {
            act('open menu');
            if (mode === 'keyboard') {
                await page.focus(adapter.menuToggle);
                await page.keyboard.press('Enter');
            }
            else
                await page.click(adapter.menuToggle);
            await page.waitForTimeout(300);
            menuOpen = true;
            continue;
        }
        if (menuOpen) {
            act('Escape');
            await page.keyboard.press('Escape');
            await page.waitForTimeout(200);
            menuOpen = false;
        }
        if (!(await atBottom(page))) {
            act('PageDown');
            await pageDown(page);
            scrolledHere += 1;
            continue;
        }
        if (result.trail.some((step) => !step.startsWith('PageDown'))) {
            result.steers += 1;
            act('back');
            await page.goBack({ waitUntil: 'load' });
            await page.waitForTimeout(150);
            stepsHere = 0;
            scrolledHere = 0;
            continue;
        }
        result.reason = `no visible link toward ${card.truth.path} from ${here}`;
        break;
    }
    if (!result.completed && !result.reason)
        result.reason = `more than ${MAX_ACTIONS} actions`;
    // A key press is one action: Tab presses count in keyboard mode (they do not count toward MAX_ACTIONS).
    result.actions += tabs;
    return result;
}
/** Links fully in view and uncovered at their centre, in DOM order. */
async function visibleLinks(page, adapter) {
    return page.evaluate((primary) => {
        const out = [];
        const width = document.documentElement.clientWidth;
        Array.from(document.querySelectorAll('a[href]')).forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            if (rect.width < 1 || rect.height < 1 || rect.left < 0 || rect.top < 0 || rect.right > width || rect.bottom > window.innerHeight)
                return;
            const style = getComputedStyle(element);
            if (style.visibility === 'hidden' || Number(style.opacity) === 0)
                return;
            const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
            if (!hit || !(hit === element || element.contains(hit)))
                return;
            const href = element.href;
            if (!href.startsWith(location.origin) || element.hash && href.split('#')[0] === location.href.split('#')[0])
                return;
            // Rendered text without aria-hidden parts; block children are separate words, as in the browser's accessible name.
            const words = (node) => {
                if (node.nodeType === 3)
                    return node.textContent ?? '';
                if (!(node instanceof HTMLElement))
                    return '';
                if (node.getAttribute('aria-hidden') === 'true')
                    return '';
                const style = getComputedStyle(node);
                if (style.display === 'none' || style.visibility === 'hidden')
                    return '';
                const text = Array.from(node.childNodes).map(words).join('');
                return style.display.startsWith('inline') || style.display === 'contents' ? text : ` ${text} `;
            };
            const name = (element.getAttribute('aria-label') ?? words(element)).replace(/\s+/g, ' ').trim();
            if (!name)
                return;
            out.push({ name, href: href.split('#')[0], region: element.closest(primary) ? 'primary' : 'other', index });
        });
        return out;
    }, adapter.primaryRegion);
}
/** Highest keyword score wins; an earlier keyword weighs more; ties go to the primary region, then DOM order. */
export function choose(candidates, keywords) {
    let best;
    let bestScore = 0;
    for (const candidate of candidates) {
        const name = candidate.name.toLowerCase();
        const score = keywords.reduce((sum, keyword, index) => sum + (name.includes(keyword.toLowerCase()) ? keywords.length - index : 0), 0);
        const better = score > bestScore || (score === bestScore && score > 0 && best && candidate.region === 'primary' && best.region !== 'primary');
        if (better) {
            best = candidate;
            bestScore = score;
        }
    }
    return best;
}
async function truthInView(page, text) {
    return page.evaluate((needle) => {
        const width = document.documentElement.clientWidth;
        const has = (element) => (element.textContent ?? '').replace(/\s+/g, ' ').includes(needle);
        const scope = document.querySelector('main') ?? document.body;
        // The deepest elements holding the whole needle; tokenised code splits it over spans.
        const deepest = Array.from(scope.querySelectorAll('*')).filter((element) => has(element) && !Array.from(element.children).some(has));
        return deepest.some((element) => {
            const rect = element.getBoundingClientRect();
            return rect.height > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight && rect.left >= 0 && rect.left < width;
        });
    }, text);
}
/** One PageDown, then wait until the scroll position holds still so the next look is deterministic. */
async function pageDown(page) {
    await page.keyboard.press('PageDown');
    let last = -1;
    for (let tries = 0; tries < 40; tries += 1) {
        await page.waitForTimeout(60);
        const now = await page.evaluate(() => window.scrollY);
        if (now === last)
            return;
        last = now;
    }
}
async function atBottom(page) {
    return page.evaluate(() => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2);
}
async function visibleControl(page, selector) {
    return page.evaluate((query) => {
        const element = document.querySelector(query);
        if (!element)
            return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden' && getComputedStyle(element).display !== 'none';
    }, selector);
}
/** Presses Tab until the picked link has focus; the number of presses, or -1 when it never does. */
async function tabTo(page) {
    for (let presses = 0; presses < 300; presses += 1) {
        await page.keyboard.press('Tab');
        if (await page.evaluate(() => document.activeElement?.hasAttribute('data-ux-pick') ?? false))
            return presses + 1;
    }
    return -1;
}
