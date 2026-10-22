import type { ReactNode } from 'react';
/**
 * `default` is the documentation figure. `hero` is the compact landing-page art: never wider than
 * its design size and scaled down to fit its column, so no part of the graph is ever cut at the
 * column edge; no header, tooltip or text table (the full figure and its table live further down
 * the page), and edges that draw once when motion is allowed.
 */
export type GraphVariant = 'default' | 'hero';
/**
 * The scale under which a hero graph used to stop shrinking and overflow its column instead.
 *
 * @deprecated Since 0.12.1 the hero always fits its column, because the overflow was cut at the
 * card edge rather than scrolled. Kept for consumers that import it; nothing reads it.
 */
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
