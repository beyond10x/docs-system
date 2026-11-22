export declare const REFERENCE_KINDS: readonly ["openapi", "asyncapi", "cli"];
export type ReferenceKind = typeof REFERENCE_KINDS[number];
export interface ProductSiteReference {
    /** Lower-case letters, digits and hyphens: the module `@b10x-reference/<id>.json` and the download `reference/<id>.<ext>`. */
    id: string;
    kind: ReferenceKind;
    /** The file, relative to the site directory: `.json`, `.yaml` or `.yml`. */
    source: string;
    /** Heading of the rendered reference; defaults to the document's title or binary name. */
    title?: string;
}
/** The data module `@b10x-reference/<id>.json`, as `ApiReference` reads it. */
export interface ReferenceModule {
    id: string;
    kind: ReferenceKind;
    title: string;
    document: unknown;
    /** The unchanged source bytes, served by the site. */
    sourceUrl: string;
    sourceName: string;
}
export interface LoadedReference {
    module: ReferenceModule;
    /** The absolute path of the source. */
    file: string;
    /** The served file name below `reference/`: `<id>.<ext>`. */
    served: string;
    bytes: Buffer;
}
/** Check the `references` option of `withProductSite`; the message names the entry. */
export declare function checkReferenceOptions(value: unknown): ProductSiteReference[];
/** Check one parsed document against its declared kind and version; returns its default title. */
export declare function checkReferenceDocument(kind: ReferenceKind, document: unknown): string;
/** Read and check one reference source. `baseUrl` is the site's, ending in `/`. */
export declare function readReference(reference: ProductSiteReference, siteDir: string, baseUrl: string): Promise<LoadedReference>;
