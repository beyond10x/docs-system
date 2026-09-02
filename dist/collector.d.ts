import type { CollectedSource, CollectionIndex, DocumentationManifestV3, DocumentationManifestV4, SharedComponentName, SourceLock } from './types.js';
export interface CollectOptions {
    /** Copy validated files beneath this directory using each index entry's outputPath. */
    outputRoot?: string;
}
export interface VerifyCollectionLockOptions {
    commit?: string;
    manifestSha256?: string;
}
/**
 * Collect only paths explicitly declared by a v3 or v4 manifest. The collector never imports or executes
 * repository code. It optionally copies the validated bytes and always returns their stable index.
 */
export declare function collectManifestSources(manifest: DocumentationManifestV3 | DocumentationManifestV4, repositoryRoot: string, options?: CollectOptions): Promise<CollectionIndex>;
export declare function buildCollectionIndex(manifest: DocumentationManifestV3 | DocumentationManifestV4, files: CollectedSource[]): CollectionIndex;
export declare function verifyCollectionLock(lock: SourceLock, index: CollectionIndex, options?: VerifyCollectionLockOptions): void;
export declare function sha256File(file: string | URL): Promise<string>;
/** Refuse executable MDX while allowing a small, explicitly declared shared-component vocabulary. */
export declare function assertPassiveMdx(source: string, file: string, allowedComponents?: SharedComponentName[]): void;
