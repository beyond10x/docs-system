export type Maturity = 'stable' | 'development' | 'experimental';
export type Availability = 'published' | 'local-only' | 'planned';
export type Discoverability = 'public' | 'unlisted' | 'internal';
export type Journey = 'understand' | 'plan-work' | 'specify' | 'build-agents' | 'operate-services';
export type Audience = 'evaluator' | 'adopter' | 'developer' | 'operator' | 'researcher';
export interface SurfaceLink {
    label: string;
    url: string;
    kind?: 'docs' | 'quickstart' | 'guide' | 'api' | 'source' | 'security' | 'status' | 'feed' | 'reference';
}
export interface SurfaceRelationship {
    target: string;
    kind: 'informs' | 'specifies' | 'implements' | 'hosts' | 'drives' | 'executes-in' | 'uses' | 'supports';
    label?: string;
}
export interface AdoptionAction {
    label: string;
    url: string;
    mode: 'browser' | 'install' | 'download' | 'source-build' | 'container' | 'hosted';
    estimatedMinutes: number;
    prerequisites?: string[];
    outcome: string;
}
export interface DocumentationSurface {
    id: string;
    name: string;
    summary: string;
    kind: 'front-door' | 'documentation' | 'research' | 'service-docs' | 'reference' | 'updates';
    canonicalUrl: string;
    maturity: Maturity;
    availability: Availability;
    discoverability: Discoverability;
    audiences?: Audience[];
    journeys: Journey[];
    capabilities: string[];
    sections: SurfaceLink[];
    relationships?: SurfaceRelationship[];
    feeds?: SurfaceLink[];
    adoption?: AdoptionAction;
    accent?: string;
    mark?: string;
    shell: {
        integration: 'docusaurus' | 'portable';
        revision: string;
    };
}
export interface DocumentationManifest {
    schema: 'b10x-docs/v1' | 'b10x-docs/v2';
    repository: {
        id: string;
        url: string;
    };
    surfaces: DocumentationSurface[];
}
export interface RegistrySurface extends DocumentationSurface {
    key: string;
    repository: DocumentationManifest['repository'];
}
export interface EcosystemRegistry {
    schema: 'b10x-docs-registry/v2';
    surfaces: RegistrySurface[];
}
export type ChangeKind = 'release' | 'capability' | 'migration' | 'breaking' | 'deprecation' | 'security' | 'research';
export type ChangeImpact = 'notable' | 'significant' | 'action-required';
export type ChangeRelationKind = 'enables' | 'depends-on' | 'integrates-with' | 'migrates' | 'supersedes' | 'deprecates';
export interface EcosystemChange {
    schema: 'b10x-change/v1';
    id: string;
    repository: string;
    publishedAt: string;
    title: string;
    summary: string;
    kind: ChangeKind;
    impact: ChangeImpact;
    source: {
        url: string;
        version?: string;
    };
    journeys: Journey[];
    affectedSurfaces: string[];
    relations?: Array<{
        target: string;
        kind: ChangeRelationKind;
        label?: string;
    }>;
    action?: {
        label: string;
        url: string;
    };
}
export interface ReleaseFact {
    repository: string;
    version: string;
    publishedAt: string;
    url: string;
}
export interface ReleaseFactsDocument {
    schema: 'b10x-release-facts/v1';
    releases: ReleaseFact[];
}
export interface ChangeLedgerEntry extends Omit<EcosystemChange, 'schema'> {
    key: string;
    automatic: boolean;
}
export interface ChangeLedger {
    schema: 'b10x-change-ledger/v1';
    changes: ChangeLedgerEntry[];
}
