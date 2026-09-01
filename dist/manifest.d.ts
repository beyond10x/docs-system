import type { ChangeLedger, DocumentationManifest, EcosystemChange, EcosystemRegistry, ReleaseFactsDocument } from './types.js';
export declare function readManifest(file: string | URL): Promise<DocumentationManifest>;
export declare function readChange(file: string | URL): Promise<EcosystemChange>;
export declare function readDocument(file: string | URL): Promise<DocumentationManifest | EcosystemChange>;
export declare function buildRegistry(manifests: DocumentationManifest[]): EcosystemRegistry;
export declare function buildLedger(registry: EcosystemRegistry, changes: EcosystemChange[], releaseFacts?: ReleaseFactsDocument): ChangeLedger;
export declare function readReleaseFacts(file?: string): Promise<ReleaseFactsDocument | undefined>;
export declare function writeJson(out: string, document: EcosystemRegistry | ChangeLedger): Promise<void>;
export declare const writeRegistry: typeof writeJson;
