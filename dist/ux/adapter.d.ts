export interface Viewport {
    width: number;
    height: number;
}
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
    viewports: {
        gating: string[];
        measured: string[];
    };
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
    truth: {
        path: string;
        text: string;
    };
    expectations: {
        maxActions: number;
    };
}
/** The docs-site values from the skill: five measured sizes, two gated, both themes. */
export declare const DOCS_SITE_DEFAULTS: Omit<UxAdapter, 'about' | 'baseUrl'>;
export declare function parseViewport(value: string): Viewport;
/** Reads `ux/adapter.json`; unset fields take the docs-site defaults. */
export declare function loadAdapter(file: string): Promise<{
    adapter: UxAdapter;
    scenarios: ScenarioCard[];
    directory: string;
}>;
export declare function loadScenarios(directory: string): Promise<ScenarioCard[]>;
