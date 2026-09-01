import type { ReactNode } from 'react';
import type { AnyDocumentationSurface, ChangeLedgerEntry, EcosystemRegistry, Journey, Maturity, RegistrySurface } from './types.js';
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
export interface DiagramAlternative {
    /** Optional prose for relationships that do not fit a node/edge model. */
    content?: ReactNode;
    nodes?: readonly DependencyGraphNode[];
    edges?: readonly DependencyGraphEdge[];
    label?: string;
}
export interface DiagramProps {
    kind: 'mermaid' | 'svg';
    source?: string;
    src?: string;
    title: string;
    description: string;
    download?: string;
    /** Minimum visual canvas width inside the keyboard-scrollable viewport. */
    minWidth?: number | string;
    /** Initial pan position after the visual renderer has measured its canvas. */
    initialPosition?: 'center' | 'start';
    /** Complete prose or node/edge representation offered alongside the visual. */
    alternative?: DiagramAlternative;
}
export declare function DependencyGraph({ nodes, edges, title, description, minWidth }: {
    nodes: DependencyGraphNode[];
    edges: DependencyGraphEdge[];
    title?: string;
    description?: string;
    minWidth?: number | string;
}): ReactNode;
export declare function Diagram({ kind, source, src, title, description, download, minWidth, initialPosition, alternative }: DiagramProps): ReactNode;
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
export interface EcosystemSwitcherProps {
    registry: EcosystemRegistry;
    current?: string;
    familyOrder?: readonly string[];
    startUrl?: string;
    allProjectsUrl?: string;
}
export declare function EcosystemSwitcher({ registry, current, familyOrder, startUrl, allProjectsUrl }: EcosystemSwitcherProps): ReactNode;
export interface EcosystemFamilyGatewayOptions {
    current?: string;
    /** Shell-owned family sequence; membership still comes from source.navigation.group. */
    familyOrder?: readonly string[];
    title?: string;
    description?: string;
    headingLevel?: 2 | 3;
}
export type EcosystemFamilyGatewayProps = EcosystemFamilyGatewayOptions & ({
    registry: EcosystemRegistry;
    surfaces?: never;
} | {
    registry?: never;
    surfaces: readonly RegistrySurface[];
});
export declare function EcosystemFamilyGateway({ registry, surfaces, current, familyOrder, title, description, headingLevel, }: EcosystemFamilyGatewayProps): ReactNode;
