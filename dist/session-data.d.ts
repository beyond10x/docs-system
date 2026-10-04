/**
 * The session-composition instance: one working session mapped onto protocols, lanes and the
 * composition behind it. The shape is provisional (`session-composition-instance/0-dummy`); this
 * module reads it and derives the figures the session charts draw. Node-safe.
 */
export declare const SESSION_COMPOSITION_FORMAT = "session-composition-instance/0-dummy";
export interface SessionProtocol {
    id: string;
    label: string; /** Categorical slot 1–4; 0 is neutral. */
    slot: number;
}
export interface SessionLane {
    id: string;
    label: string;
    principal?: string;
}
export interface SessionEpisode {
    lane: string;
    protocol: string;
    /** `HH:MM:SS` UTC on the day the window starts; earlier than the window start means the next day. */
    start: string;
    end: string;
    label: string;
    /** Built, then thrown away: drawn hollow. */
    discarded?: boolean;
    /** A start or end time is estimated: drawn dashed. */
    approximate?: boolean;
    /** Still running at the end of the window. */
    open?: boolean;
}
export interface SessionDecision {
    n: number;
    title: string;
    adr: string;
    question: string;
    decided: string;
    relayed: string;
    drafted: string;
}
export interface SessionMark {
    t: string;
    kind: 'approval' | string;
    label: string;
}
export interface CompositionNode {
    id: string;
    /** Column index into `graph.columns`. */
    col: number;
    label: string;
    detail?: string;
    policy?: string;
    /** Cases observed in the window (protocol nodes). */
    observed?: number;
    slot?: number;
}
export interface CompositionGraphData {
    columns: string[];
    nodes: CompositionNode[];
    edges: Array<[string, string]>;
}
export interface SessionCompositionDocument {
    format: typeof SESSION_COMPOSITION_FORMAT;
    composition?: string;
    window: {
        start: string;
        end: string;
    };
    sources?: string[];
    protocols: SessionProtocol[];
    lanes: SessionLane[];
    episodes: SessionEpisode[];
    decisions: SessionDecision[];
    operator_marks?: SessionMark[];
    graph: CompositionGraphData;
}
export declare function parseSessionComposition(value: unknown): SessionCompositionDocument;
/** Seconds since the epoch for a clock time inside the session window. */
export declare function sessionClock(document: SessionCompositionDocument): (time: string) => number;
export declare function formatDuration(seconds: number): string;
export declare function median(values: readonly number[]): number;
export interface DecisionSteps {
    decision: SessionDecision;
    questionToDecision: number;
    decisionToRelay: number;
    relayToDraft: number;
    total: number;
}
export declare function decisionSteps(document: SessionCompositionDocument): DecisionSteps[];
export interface StatTileData {
    label: string;
    value: string;
    detail?: string;
}
export interface SessionKpiOptions {
    /** Lane whose episodes are pull requests; approximate ones are not counted as merged. */
    pullRequestLane?: string;
    /** Protocol counted as an interruption, and the lanes it interrupted. */
    interruptionProtocol?: string;
    interruptionLanes?: readonly string[];
}
/** The headline figures, computed from the document rather than written by hand. */
export declare function sessionKpis(document: SessionCompositionDocument, options?: SessionKpiOptions): StatTileData[];
