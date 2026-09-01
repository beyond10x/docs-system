import type { ReactNode } from 'react';
import type { AnyDocumentationSurface, ChangeLedgerEntry, EcosystemRegistry, Journey, Maturity } from './types.js';
export declare function StatusBadge({ maturity, children }: {
    maturity: Maturity;
    children?: ReactNode;
}): ReactNode;
export declare function BoundaryNotice({ title, children }: {
    title?: string;
    children: ReactNode;
}): ReactNode;
export declare function CodeExample({ language, title, children }: {
    language: string;
    title?: string;
    children: string;
}): ReactNode;
export declare function CommandExample({ command, output, title }: {
    command: string;
    output?: string;
    title?: string;
}): ReactNode;
export declare function CodeTabs({ items }: {
    items: Array<{
        label: string;
        language: string;
        code: string;
    }>;
}): ReactNode;
export interface DataCatalogItem {
    id: string;
    name: string;
    summary?: string;
    kind?: string;
    url?: string;
}
export declare function DataCatalog({ items, title }: {
    items: DataCatalogItem[];
    title?: string;
}): ReactNode;
export interface DependencyGraphNode {
    id: string;
    label: string;
}
export interface DependencyGraphEdge {
    from: string;
    to: string;
    label?: string;
}
export declare function DependencyGraph({ nodes, edges, title, description }: {
    nodes: DependencyGraphNode[];
    edges: DependencyGraphEdge[];
    title?: string;
    description?: string;
}): ReactNode;
export declare function Diagram({ kind, source, src, title, description, download }: {
    kind: 'mermaid' | 'svg';
    source?: string;
    src?: string;
    title: string;
    description: string;
    download?: string;
}): ReactNode;
export declare function ProjectCard({ surface }: {
    surface: AnyDocumentationSurface;
}): ReactNode;
export declare function AdoptionCard({ surface, journey }: {
    surface: AnyDocumentationSurface;
    journey?: Journey;
}): ReactNode;
export declare function ChangeTimelineEntry({ change, surfaces }: {
    change: ChangeLedgerEntry;
    surfaces?: Map<string, AnyDocumentationSurface>;
}): ReactNode;
export declare function EcosystemSwitcher({ registry, current }: {
    registry: EcosystemRegistry;
    current?: string;
}): ReactNode;
