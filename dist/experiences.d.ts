import type { Access, AdoptionPath, DocumentationManifest, DocumentationManifestV4, EvaluatedAdoptionPath, EvaluatedDocumentationExperience, ExperienceArtifact, ExperienceCatalog, ManifestExperienceSurface } from './types.js';
export { readExperienceCatalog } from './manifest.js';
/** Return the least permissive access value. `unspecified` is compatibility-only and safest. */
export declare function mostRestrictiveAccess(...values: Access[]): Access;
export declare function validateExperienceCatalogSemantics(catalog: ExperienceCatalog, context?: string): void;
export declare function evaluateAdoptionPath(path: AdoptionPath, artifactById: ReadonlyMap<string, ExperienceArtifact>): EvaluatedAdoptionPath;
export declare function evaluateExperienceCatalog(catalog: ExperienceCatalog): EvaluatedDocumentationExperience[];
/**
 * Join manifest experience references to the Website-owned catalog. Immutable v1-v3 manifests are
 * projected as explicitly non-actionable compatibility experiences instead of inheriting trust.
 */
export declare function normalizeManifestExperiences(manifest: DocumentationManifest, catalog?: ExperienceCatalog): ManifestExperienceSurface[];
export declare function validateManifestExperienceReferences(manifest: DocumentationManifestV4, catalog: ExperienceCatalog): void;
