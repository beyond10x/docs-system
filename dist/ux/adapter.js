// The UX loop's adapter: everything a site supplies to the generic core (SKILL § 1).
// The core under src/ux imports nothing from the docs-system UI; tests/ux-core.test.mjs enforces it.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
/** The docs-site values from the skill: five measured sizes, two gated, both themes. */
export const DOCS_SITE_DEFAULTS = {
    viewports: { gating: ['1024x768', '390x844'], measured: ['1440x900', '1280x800', '1024x768', '768x1024', '390x844'] },
    themes: ['light', 'dark'],
    alwaysVisible: [
        { name: 'navbar', selector: '.navbar' },
        { name: 'search', selector: '.navbar .DocSearch-Button, .navbar [role="search"], .navbar input[type="search"], .navbar .navbar__search', required: false },
        { name: 'theme toggle', selector: '.navbar .navbar__items--right button[title*="mode" i], .navbar .navbar__items--right button[aria-label*="mode" i]', minWidth: 997 },
        { name: 'menu toggle', selector: '.navbar__toggle', maxWidth: 996 },
        { name: 'sidebar', selector: '.theme-doc-sidebar-menu', minWidth: 997, pathPrefix: 'docs', whileFooterHidden: true },
    ],
    pages: [],
    scenarios: 'scenarios',
    primaryRegion: 'main',
    menuToggle: '.navbar__toggle',
    footer: 'footer',
    overflowIgnore: [],
    axeDisabled: [],
};
export function parseViewport(value) {
    const match = /^(\d+)x(\d+)$/.exec(value);
    if (!match)
        throw new Error(`viewport must be WIDTHxHEIGHT, received ${JSON.stringify(value)}`);
    return { width: Number(match[1]), height: Number(match[2]) };
}
/** Reads `ux/adapter.json`; unset fields take the docs-site defaults. */
export async function loadAdapter(file) {
    const raw = JSON.parse(await readFile(file, 'utf8'));
    if (typeof raw.baseUrl !== 'string' || !raw.baseUrl.startsWith('/') || !raw.baseUrl.endsWith('/'))
        throw new Error(`${file}: baseUrl must start and end with /`);
    const adapter = { about: '', ...DOCS_SITE_DEFAULTS, ...raw };
    for (const value of [...adapter.viewports.gating, ...adapter.viewports.measured])
        parseViewport(value);
    const directory = path.dirname(path.resolve(file));
    return { adapter, scenarios: await loadScenarios(path.resolve(directory, adapter.scenarios)), directory };
}
export async function loadScenarios(directory) {
    const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
    const cards = [];
    for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
        const file = path.join(directory, entry.name, 'card.json');
        const card = JSON.parse(await readFile(file, 'utf8'));
        if (card.id !== entry.name)
            throw new Error(`${file}: id ${JSON.stringify(card.id)} must equal its directory name`);
        if (!Array.isArray(card.keywords) || !card.truth?.path || !card.truth?.text)
            throw new Error(`${file}: keywords, truth.path and truth.text are required`);
        cards.push(card);
    }
    return cards;
}
