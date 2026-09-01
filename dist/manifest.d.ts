import type { DocumentationManifest, EcosystemRegistry } from './types.js';
export declare function readManifest(file: string | URL): Promise<DocumentationManifest>;
export declare function buildRegistry(manifests: DocumentationManifest[]): EcosystemRegistry;
export declare function writeRegistry(out: string, registry: EcosystemRegistry): Promise<void>;
