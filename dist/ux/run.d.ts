import type { Browser } from 'playwright';
import { type ScenarioCard, type UxAdapter } from './adapter.js';
import { type PageFacts } from './checks.js';
import { type ScreenOnlyResult } from './screen-only.js';
export type Metrics = Record<string, Record<string, number>>;
export interface PageRun {
    page: string;
    viewport: string;
    theme: string;
    facts: PageFacts;
    shot?: string;
}
export interface BotRun {
    viewport: string;
    theme: string;
    result: ScreenOnlyResult;
}
export interface UxRun {
    pages: string[];
    viewports: string[];
    gating: string[];
    themes: string[];
    pageRuns: PageRun[];
    botRuns: BotRun[];
    /** Hard-gate failures at gating viewports; empty is a pass. */
    failures: string[];
    /** Ratchet values per scenario key, gating viewports only. */
    metrics: Metrics;
}
export interface RunOptions {
    site: string;
    adapter: UxAdapter;
    scenarios: ScenarioCard[];
    /** Viewports to visit; defaults to the gating viewports. */
    viewports?: string[];
    /** Directory for one screenshot per page, viewport and theme. */
    shots?: string;
    executablePath?: string;
    log?: (line: string) => void;
}
export declare function launch(executablePath?: string): Promise<Browser>;
export declare function runUx(options: RunOptions): Promise<UxRun>;
export declare function slug(pagePath: string): string;
/** Hard gates 1, 2, 4 and 5 at the gating viewports. */
export declare function gateFailures(run: UxRun, scenarios: ScenarioCard[]): string[];
export declare const median: (values: number[]) => number;
/** Lower-is-better values per scenario and per site view, keyed for ux/baseline.json. */
export declare function metricsOf(run: UxRun, scenarios: ScenarioCard[], viewports?: string[]): Metrics;
