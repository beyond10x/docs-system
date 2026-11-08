import type { Browser, BrowserContext, Page } from 'playwright';
import type { AlwaysVisible, UxAdapter, Viewport } from './adapter.js';
export interface PageFacts {
    /** Gate 1: horizontal document scroll in px (0 is a pass). */
    pageScrollX: number;
    /** Gate 1: elements running past the viewport or their own box, as `selector: detail`. */
    overflow: string[];
    /** Text cut with an ellipsis and no full value in title or aria-label. */
    truncated: string[];
    /** Gate 2: always-visible elements that are missing, clipped or covered. */
    hidden: string[];
    /** Always-visible elements marked required: false that are absent. */
    missingOptional: string[];
    /** axe-core violations by impact, with rule ids. */
    axe: {
        serious: string[];
        critical: string[];
        moderate: string[];
        minor: string[];
    };
    /** Failing axe-core nodes, summed over rules. */
    axeNodes: {
        serious_critical: number;
        moderate_minor: number;
    };
    /** Cumulative layout shift during load and settle. */
    cls: number;
    /** Animations still running under prefers-reduced-motion: reduce. */
    motion: string[];
    errors: string[];
}
export declare function openContext(browser: Browser, viewport: Viewport, theme: string): Promise<BrowserContext>;
export declare function settle(page: Page): Promise<void>;
/**
 * Runs gates 1, 2 and 5 on the current page at its current scroll position. With `full: false` only
 * the always-visible elements are checked, for the scroll steps after load.
 */
export declare function checkPage(page: Page, adapter: UxAdapter, viewport: Viewport, pagePath: string, theme: string, full?: boolean): Promise<PageFacts>;
export declare function applies(rule: AlwaysVisible, viewport: Viewport, pagePath: string): boolean;
