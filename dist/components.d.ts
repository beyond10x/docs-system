import type { InputHTMLAttributes, ReactNode } from 'react';
import type { AnyDocumentationSurface, ChangeLedgerEntry, EcosystemRegistry, Journey, Maturity, RegistrySurface } from './types.js';
export type HeadingLevel = 1 | 2 | 3 | 4;
export interface PageHeaderProps {
    title: ReactNode;
    description?: ReactNode;
    eyebrow?: ReactNode;
    actions?: ReactNode;
    children?: ReactNode;
    headingLevel?: 1 | 2;
}
export declare function PageHeader({ title, description, eyebrow, actions, children, headingLevel }: PageHeaderProps): ReactNode;
export interface SectionHeaderProps {
    title: ReactNode;
    description?: ReactNode;
    eyebrow?: ReactNode;
    action?: ReactNode;
    headingLevel?: 2 | 3 | 4;
    id?: string;
}
export declare function SectionHeader({ title, description, eyebrow, action, headingLevel, id }: SectionHeaderProps): ReactNode;
export interface FactGridItem {
    label: ReactNode;
    value: ReactNode;
    detail?: ReactNode;
    url?: string;
}
export interface FactGridProps {
    items: readonly FactGridItem[];
    label?: string;
}
export declare function FactGrid({ items, label }: FactGridProps): ReactNode;
export type CalloutTone = 'note' | 'success' | 'warning' | 'danger';
export interface CalloutProps {
    children: ReactNode;
    title?: ReactNode;
    tone?: CalloutTone;
    className?: string;
}
export declare function Callout({ children, title, tone, className }: CalloutProps): ReactNode;
export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    hint?: ReactNode;
    containerClassName?: string;
}
export declare function SearchField({ label, hint, containerClassName, id, ...input }: SearchFieldProps): ReactNode;
export interface FilterChipOption {
    value: string;
    label: ReactNode;
    count?: number;
    disabled?: boolean;
}
export interface FilterChipGroupProps {
    label: string;
    options: readonly FilterChipOption[];
    selected: readonly string[];
    onToggle?: (value: string, selected: boolean) => void;
}
export declare function FilterChipGroup({ label, options, selected, onToggle }: FilterChipGroupProps): ReactNode;
export interface CardGridProps {
    children: ReactNode;
    columns?: 'auto' | 2 | 3 | 4;
    label?: string;
}
export declare function CardGrid({ children, columns, label }: CardGridProps): ReactNode;
export interface ContentCardProps {
    title: ReactNode;
    description?: ReactNode;
    eyebrow?: ReactNode;
    meta?: ReactNode;
    children?: ReactNode;
    footer?: ReactNode;
    titleUrl?: string;
    actionUrl?: string;
    actionLabel?: ReactNode;
    accent?: string;
    headingLevel?: 2 | 3 | 4;
}
export declare function ContentCard({ title, description, eyebrow, meta, children, footer, titleUrl, actionUrl, actionLabel, accent, headingLevel }: ContentCardProps): ReactNode;
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
export interface ProjectCardProps {
    surface: AnyDocumentationSurface;
    headingLevel?: 2 | 3 | 4;
    title?: ReactNode;
    titleUrl?: string;
    actionUrl?: string;
    actionLabel?: ReactNode;
}
export declare function ProjectCard({ surface, headingLevel, title, titleUrl, actionUrl, actionLabel }: ProjectCardProps): ReactNode;
export interface AdoptionCardProps {
    surface: AnyDocumentationSurface;
    journey?: Journey;
    headingLevel?: 2 | 3 | 4;
    title?: ReactNode;
    titleUrl?: string;
    actionUrl?: string;
    actionLabel?: ReactNode;
}
export declare function AdoptionCard({ surface, journey, headingLevel, title, titleUrl, actionUrl, actionLabel }: AdoptionCardProps): ReactNode;
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
