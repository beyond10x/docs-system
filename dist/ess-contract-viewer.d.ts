import { type ReactNode } from 'react';
export interface EssContractViewerProps {
    document: unknown;
    /** Stable, unique prefix for shareable links when a page embeds multiple viewers. */
    id?: string;
    title?: string;
    sourceUrl?: string;
    sourceRepository?: string;
    initialPage?: string;
}
export declare function EssContractViewer(props: EssContractViewerProps): ReactNode;
