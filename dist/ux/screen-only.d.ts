import type { Page } from 'playwright';
import type { ScenarioCard, UxAdapter } from './adapter.js';
export interface ScreenOnlyResult {
    scenario: string;
    mode: 'pointer' | 'keyboard';
    completed: boolean;
    actions: number;
    looks: number;
    steers: number;
    /** Glance cost of each chosen control: 1 in the primary region, 2 elsewhere in view, 3 not in view at first look. */
    glances: number[];
    /** Steps from arriving on a page to acting there, per page. */
    timeToAct: number[];
    trail: string[];
    reason?: string;
}
interface Candidate {
    name: string;
    href: string;
    region: 'primary' | 'other';
    index: number;
}
export declare function runScreenOnly(page: Page, base: string, adapter: UxAdapter, card: ScenarioCard, mode: 'pointer' | 'keyboard'): Promise<ScreenOnlyResult>;
/** Highest keyword score wins; an earlier keyword weighs more; ties go to the primary region, then DOM order. */
export declare function choose(candidates: Candidate[], keywords: string[]): Candidate | undefined;
export {};
