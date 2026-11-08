import type { Metrics } from './run.js';
export interface BaselineEntry {
    value: number;
    tolerance: number;
    decision?: string;
}
export interface Baseline {
    about: string;
    scenarios: Record<string, Record<string, BaselineEntry>>;
    tolerances: Record<string, number>;
}
export declare const DEFAULT_TOLERANCES: Record<string, number>;
/** Tolerance for one key: layout_shift 0.01, step medians and percentiles 5 %, every count 0. */
export declare function toleranceFor(key: string, value: number, tolerances?: Record<string, number>): number;
/**
 * Compares measured values with the baseline. Fails on a worse value beyond tolerance, an improvement
 * not taken into the baseline, a value missing on either side, and a baseline entry worse than
 * `main`'s without a decision id.
 */
export declare function ratchet(baseline: Baseline, measured: Metrics, main?: Baseline): string[];
/** Takes measured values into the baseline. A value worse than before needs a decision id. */
export declare function updateBaseline(baseline: Baseline, measured: Metrics, decision?: string): {
    baseline: Baseline;
    refused: string[];
};
export declare function readBaseline(file: string): Promise<Baseline>;
export declare function writeBaseline(file: string, baseline: Baseline): Promise<void>;
/** The baseline file as committed on `ref` (default origin/main, then main); undefined when absent. */
export declare function baselineAt(file: string, ref?: string): Promise<Baseline | undefined>;
