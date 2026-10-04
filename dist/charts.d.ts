import type { ReactNode } from 'react';
export interface ProtocolGraphProps {
    /** A `b10x-protocol-graph/1` document, usually imported from the repository's generated JSON. */
    data: unknown;
    title?: string;
    description?: ReactNode;
    caption?: ReactNode;
}
export declare function ProtocolGraph({ data, title, description, caption }: ProtocolGraphProps): ReactNode;
export interface DomainGraphProps {
    /** A `b10x-domain-graph/1` document emitted from a compiled ESS model. */
    data: unknown;
    title?: string;
    description?: ReactNode;
    caption?: ReactNode;
}
export declare function DomainGraph({ data, title, description, caption }: DomainGraphProps): ReactNode;
