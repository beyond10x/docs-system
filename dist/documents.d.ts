import type { CollectionIndex, DocumentPageIndex, DocumentPageMetadata, DocumentationManifest, EffectiveDocumentPageMetadata, ResolvedDocumentPageMetadata } from './types.js';
export { validateDocumentPageMetadata } from './manifest.js';
/** Validate the inner value of a top-level `b10x:` Markdown/MDX frontmatter property. */
export declare function parseDocumentPageMetadata(source: string, context?: string): Promise<DocumentPageMetadata | undefined>;
export declare function readDocumentPageMetadata(file: string | URL): Promise<DocumentPageMetadata | undefined>;
/** Return both the page declaration and its effective metadata after applying surface defaults. */
export declare function resolveDocumentPageMetadata(manifest: DocumentationManifest, surfaceId: string, source: string, context?: string): Promise<ResolvedDocumentPageMetadata>;
export declare function effectiveDocumentPageMetadata(manifest: DocumentationManifest, surfaceId: string, declared?: DocumentPageMetadata): EffectiveDocumentPageMetadata;
/**
 * Build the normalized metadata sidecar consumed by presentation/search code. The collected source
 * index is deliberately neither extended nor re-hashed.
 */
export declare function buildDocumentPageIndex(manifest: DocumentationManifest, collection: CollectionIndex, repositoryRoot: string): Promise<DocumentPageIndex>;
