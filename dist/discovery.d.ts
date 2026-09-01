import type { DocumentationManifest } from './types.js';
export declare const discoveryBlockStart = "<!-- b10x-docs:discovery:start -->";
export declare const discoveryBlockEnd = "<!-- b10x-docs:discovery:end -->";
export interface DiscoveryBlockOptions {
    repository: string;
    displayName: string;
    docsUrl: string;
    origin?: string;
}
export interface WriteDiscoveryOptions {
    check?: boolean;
}
export declare function discoveryOptionsFromManifest(manifest: DocumentationManifest): DiscoveryBlockOptions;
export declare function renderDiscoveryBlock(options: DiscoveryBlockOptions): string;
export declare function updateDiscoveryBlock(readme: string, options: DiscoveryBlockOptions): string;
export declare function writeDiscoveryBlock(file: string, options: DiscoveryBlockOptions, writeOptions?: WriteDiscoveryOptions): Promise<boolean>;
