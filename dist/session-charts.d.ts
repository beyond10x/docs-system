import type { ReactNode } from 'react';
import type { SessionKpiOptions, StatTileData } from './session-data.js';
export declare function StatTiles({ items, label }: {
    items: readonly StatTileData[];
    label?: string;
}): ReactNode;
/** The headline figures of a session document, computed rather than typed. */
export declare function SessionKpis({ data, ...options }: {
    data: unknown;
} & SessionKpiOptions): ReactNode;
export interface SessionTimelineProps {
    data: unknown;
    title?: string;
    description?: ReactNode;
    /** Where decision spans and markers are drawn; defaults fit the reference document. */
    decisionLanes?: {
        question?: string;
        draft?: string;
        marks?: string;
    };
    decisionProtocol?: string;
}
export declare function SessionTimeline({ data, title, description, decisionLanes, decisionProtocol }: SessionTimelineProps): ReactNode;
export interface StepBarsRow {
    label: string;
    values: number[];
}
export interface StepBarsPart {
    label: string;
    slot: number;
}
export interface StepBarsProps {
    /** A session document; its decisions become the rows. */
    data?: unknown;
    /** Or explicit rows of durations in seconds, one value per part. */
    rows?: readonly StepBarsRow[];
    parts?: readonly StepBarsPart[];
    title?: string;
    description?: ReactNode;
}
export declare function StepBars({ data, rows, parts, title, description }: StepBarsProps): ReactNode;
export interface CompositionGraphProps {
    /** A session document (its `graph`), or the graph object itself. */
    data: unknown;
    title?: string;
    description?: ReactNode;
}
export declare function CompositionGraph({ data, title, description }: CompositionGraphProps): ReactNode;
