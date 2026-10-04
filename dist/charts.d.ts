import type { ReactNode } from 'react';
/**
 * `default` is the documentation figure. `hero` is the compact landing-page art: scaled to fit its
 * column but never below `HERO_MIN_SCALE` (a wider graph is cropped at the column edge and scrolls),
 * no header, tooltip or text table (the full figure and its table live further down the page), and
 * edges that draw once when motion is allowed.
 */
export type GraphVariant = 'default' | 'hero';
/** The smallest hero scale: 13 px node names stay at least 10 px on screen. */
export declare const HERO_MIN_SCALE = 0.8;
export interface ProtocolGraphProps {
    /** A `b10x-protocol-graph/1` document, usually imported from the repository's generated JSON. */
    data: unknown;
    title?: string;
    description?: ReactNode;
    caption?: ReactNode;
    variant?: GraphVariant;
}
export declare function ProtocolGraph({ data, title, description, caption, variant }: ProtocolGraphProps): ReactNode;
export interface DomainGraphProps {
    /** A `b10x-domain-graph/1` document emitted from a compiled ESS model. */
    data: unknown;
    title?: string;
    description?: ReactNode;
    caption?: ReactNode;
    variant?: GraphVariant;
}
export declare function DomainGraph({ data, title, description, caption, variant }: DomainGraphProps): ReactNode;
