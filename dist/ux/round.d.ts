import type { ScenarioCard, UxAdapter } from './adapter.js';
import type { Baseline } from './ratchet.js';
import { type UxRun } from './run.js';
export interface RoundInput {
    run: UxRun;
    adapter: UxAdapter;
    scenarios: ScenarioCard[];
    roundDir: string;
    baseline: Baseline;
    findingsDir: string;
}
export interface Headline {
    /** Hard-gate failures at the gating viewports. */
    gate_failures_gating: number;
    /** The same checks at every measured viewport. */
    gate_failures_all: number;
    overflow_all: number;
    hidden_all: number;
    axe_serious_critical_all: number;
    axe_moderate_minor_all: number;
    optional_missing_all: number;
    screen_only_incomplete_all: number;
    screen_only_actions_median: number;
    cls_max: number;
}
export declare function headline(run: UxRun, scenarios: ScenarioCard[]): Headline;
export declare function writeRound({ run, adapter, scenarios, roundDir, baseline, findingsDir }: RoundInput): Promise<void>;
