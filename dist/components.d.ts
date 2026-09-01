import type { ReactNode } from 'react';
import type { ChangeLedgerEntry, DocumentationSurface, EcosystemRegistry, Journey, Maturity } from './types.js';
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
export declare function Diagram({ kind, source, src, title, description, download }: {
    kind: 'mermaid' | 'svg';
    source?: string;
    src?: string;
    title: string;
    description: string;
    download?: string;
}): ReactNode;
export declare function ProjectCard({ surface }: {
    surface: DocumentationSurface;
}): ReactNode;
export declare function AdoptionCard({ surface, journey }: {
    surface: DocumentationSurface;
    journey?: Journey;
}): ReactNode;
export declare function ChangeTimelineEntry({ change, surfaces }: {
    change: ChangeLedgerEntry;
    surfaces?: Map<string, DocumentationSurface>;
}): ReactNode;
export declare function EcosystemSwitcher({ registry, current }: {
    registry: EcosystemRegistry;
    current?: string;
}): ReactNode;
