// The UX loop's adapter: everything a site supplies to the generic core (SKILL § 1).
// The core under src/ux imports nothing from the docs-system UI; tests/ux-core.test.mjs enforces it.
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';

export interface Viewport {width: number; height: number}

export interface AlwaysVisible {
  /** Name used in reports. */
  name: string;
  /** CSS selector; the first visible match is checked. */
  selector: string;
  /** Only checked at viewport widths at or above this. */
  minWidth?: number;
  /** Only checked at viewport widths at or below this. */
  maxWidth?: number;
  /** Only checked on pages whose path (after the base URL) starts with this. */
  pathPrefix?: string;
  /** When false the element is reported as missing but does not fail the gate. */
  required?: boolean;
  /** When true the element is checked only while the page footer is out of view: it may leave with its column. */
  whileFooterHidden?: boolean;
}

export interface UxAdapter {
  about: string;
  /** Base URL the site was built for, such as `/product-site/`. */
  baseUrl: string;
  viewports: {gating: string[]; measured: string[]};
  themes: string[];
  alwaysVisible: AlwaysVisible[];
  /** Page paths after the base URL; empty reads the site's sitemap.xml. */
  pages: string[];
  /** Directory of scenario cards, relative to the adapter file. */
  scenarios: string;
  /** Selector of the primary content region, for glance cost 1. */
  primaryRegion: string;
  /** Selector of a control that opens the collapsed navigation at narrow widths. */
  menuToggle: string;
  /** Selector of the page footer, for always-visible elements checked only while it is out of view. */
  footer: string;
  /** Selectors excluded from the overflow check (intended horizontal scrollers live inside them). */
  overflowIgnore: string[];
  /** axe-core rule ids disabled, each with its reason in `about`. */
  axeDisabled: string[];
}

export interface ScenarioCard {
  id: string;
  /** anchor cards make rounds comparable; rotating cards find new problems. */
  card: 'anchor' | 'rotating';
  persona: string;
  task: string;
  /** Page the reader starts on, after the base URL. */
  start: string;
  /** Words the reader looks for in link names, in order of preference. */
  keywords: string[];
  truth: {path: string; text: string};
  expectations: {maxActions: number};
}

/** The docs-site values from the skill: five measured sizes, two gated, both themes. */
export const DOCS_SITE_DEFAULTS: Omit<UxAdapter, 'about' | 'baseUrl'> = {
  viewports: {gating: ['1024x768', '390x844'], measured: ['1440x900', '1280x800', '1024x768', '768x1024', '390x844']},
  themes: ['light', 'dark'],
  alwaysVisible: [
    {name: 'navbar', selector: '.navbar'},
    {name: 'search', selector: '.navbar .DocSearch-Button, .navbar [role="search"], .navbar input[type="search"], .navbar .navbar__search', required: false},
    {name: 'theme toggle', selector: '.navbar .navbar__items--right button[title*="mode" i], .navbar .navbar__items--right button[aria-label*="mode" i]', minWidth: 997},
    {name: 'menu toggle', selector: '.navbar__toggle', maxWidth: 996},
    {name: 'sidebar', selector: '.theme-doc-sidebar-menu', minWidth: 997, pathPrefix: 'docs', whileFooterHidden: true},
  ],
  pages: [],
  scenarios: 'scenarios',
  primaryRegion: 'main',
  menuToggle: '.navbar__toggle',
  footer: 'footer',
  overflowIgnore: [],
  axeDisabled: [],
};

export function parseViewport(value: string): Viewport {
  const match = /^(\d+)x(\d+)$/.exec(value);
  if (!match) throw new Error(`viewport must be WIDTHxHEIGHT, received ${JSON.stringify(value)}`);
  return {width: Number(match[1]), height: Number(match[2])};
}

/** Reads `ux/adapter.json`; unset fields take the docs-site defaults. */
export async function loadAdapter(file: string): Promise<{adapter: UxAdapter; scenarios: ScenarioCard[]; directory: string}> {
  const raw = JSON.parse(await readFile(file, 'utf8')) as Partial<UxAdapter>;
  if (typeof raw.baseUrl !== 'string' || !raw.baseUrl.startsWith('/') || !raw.baseUrl.endsWith('/')) throw new Error(`${file}: baseUrl must start and end with /`);
  const adapter: UxAdapter = {about: '', ...DOCS_SITE_DEFAULTS, ...raw} as UxAdapter;
  for (const value of [...adapter.viewports.gating, ...adapter.viewports.measured]) parseViewport(value);
  const directory = path.dirname(path.resolve(file));
  return {adapter, scenarios: await loadScenarios(path.resolve(directory, adapter.scenarios)), directory};
}

export async function loadScenarios(directory: string): Promise<ScenarioCard[]> {
  const entries = await readdir(directory, {withFileTypes: true}).catch(() => []);
  const cards: ScenarioCard[] = [];
  for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(directory, entry.name, 'card.json');
    const card = JSON.parse(await readFile(file, 'utf8')) as ScenarioCard;
    if (card.id !== entry.name) throw new Error(`${file}: id ${JSON.stringify(card.id)} must equal its directory name`);
    if (!Array.isArray(card.keywords) || !card.truth?.path || !card.truth?.text) throw new Error(`${file}: keywords, truth.path and truth.text are required`);
    cards.push(card);
  }
  return cards;
}
