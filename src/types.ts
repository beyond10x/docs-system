export type Maturity = 'stable' | 'development' | 'experimental';
export type Availability = 'published' | 'local-only' | 'planned';
export type Discoverability = 'public' | 'unlisted' | 'internal';
export type Journey = 'understand' | 'specify' | 'build-agents' | 'operate-services';

export interface SurfaceLink {
  label: string;
  url: string;
  kind?: 'docs' | 'quickstart' | 'api' | 'source' | 'security' | 'status' | 'feed' | 'reference';
}

export interface SurfaceRelationship {
  target: string;
  kind: 'informs' | 'specifies' | 'implements' | 'hosts' | 'drives' | 'executes-in' | 'uses';
  label?: string;
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
  audiences?: Array<'evaluator' | 'adopter' | 'developer' | 'operator' | 'researcher'>;
  journeys: Journey[];
  capabilities: string[];
  sections: SurfaceLink[];
  relationships?: SurfaceRelationship[];
  feeds?: SurfaceLink[];
  accent?: string;
  mark?: string;
  shell: {integration: 'docusaurus' | 'portable'; revision: string};
}

export interface DocumentationManifest {
  schema: 'b10x-docs/v1';
  repository: {id: string; url: string};
  surfaces: DocumentationSurface[];
}

export interface RegistrySurface extends DocumentationSurface {
  key: string;
  repository: DocumentationManifest['repository'];
}

export interface EcosystemRegistry {
  schema: 'b10x-docs-registry/v1';
  surfaces: RegistrySurface[];
}
