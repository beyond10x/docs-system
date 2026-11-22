import type { ReactNode } from 'react';
import type { JsonSchema } from './api-common.js';
export type { JsonSchema } from './api-common.js';
export { AsyncApiReference } from './asyncapi.js';
export type { AsyncApiDocument, AsyncApiReferenceProps } from './asyncapi.js';
export { CliReference, cliSynopsis } from './cli-reference-view.js';
export type { CliReferenceProps } from './cli-reference-view.js';
interface OpenApiMedia {
    schema?: JsonSchema;
    example?: unknown;
    examples?: Record<string, {
        summary?: string;
        description?: string;
        value?: unknown;
        externalValue?: string;
    }>;
}
interface OpenApiParameter {
    name: string;
    in: string;
    required?: boolean;
    deprecated?: boolean;
    description?: string;
    schema?: JsonSchema;
    example?: unknown;
    examples?: OpenApiMedia['examples'];
    content?: Record<string, OpenApiMedia>;
}
interface OpenApiHeader {
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    schema?: JsonSchema;
    content?: Record<string, OpenApiMedia>;
}
interface OpenApiResponse {
    description?: string;
    headers?: Record<string, OpenApiHeader | {
        $ref: string;
    }>;
    content?: Record<string, OpenApiMedia>;
}
type Reference<T> = T | {
    $ref: string;
};
interface OpenApiOperation {
    operationId?: string;
    summary?: string;
    description?: string;
    tags?: string[];
    deprecated?: boolean;
    security?: Array<Record<string, string[]>>;
    parameters?: Array<Reference<OpenApiParameter>>;
    requestBody?: Reference<{
        description?: string;
        required?: boolean;
        content?: Record<string, OpenApiMedia>;
    }>;
    responses?: Record<string, Reference<OpenApiResponse>>;
}
type OpenApiPathItem = Partial<Record<'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace', OpenApiOperation>> & {
    summary?: string;
    description?: string;
    parameters?: Array<Reference<OpenApiParameter>>;
    $ref?: string;
};
export interface OpenApiDocument {
    openapi: string;
    info: {
        title: string;
        version: string;
        summary?: string;
        description?: string;
    };
    servers?: Array<{
        url: string;
        description?: string;
        variables?: Record<string, {
            default?: string;
            enum?: string[];
            description?: string;
        }>;
    }>;
    tags?: Array<{
        name: string;
        description?: string;
    }>;
    security?: Array<Record<string, string[]>>;
    paths?: Record<string, OpenApiPathItem>;
    components?: {
        schemas?: Record<string, JsonSchema>;
        securitySchemes?: Record<string, Record<string, unknown>>;
        [key: string]: unknown;
    };
}
export interface OpenApiReferenceProps {
    document: OpenApiDocument;
    /** Where the unchanged source document can be downloaded; shown as a download link. */
    sourceUrl?: string;
    /** The file name the download carries, shown beside the link. */
    sourceName?: string;
    /** Heading for the reference title. Use 3 when embedding beneath a documentation-page h2. */
    headingLevel?: 2 | 3;
    /** Heading text instead of the document's `info.title`. */
    title?: string;
}
/** The schema viewer over one document; a `$ref` into it links to its schema card. */
export declare function JsonSchemaViewer({ schema, depth, document }: {
    schema: JsonSchema;
    depth?: number;
    document?: unknown;
}): ReactNode;
export declare function OpenApiReference({ document, sourceUrl, sourceName, headingLevel, title }: OpenApiReferenceProps): ReactNode;
/** One reference as the product-site plugin writes it: `@b10x-reference/<id>.json`. */
export interface ApiReferenceData {
    id: string;
    kind: 'openapi' | 'asyncapi' | 'cli';
    title?: string;
    document: unknown;
    sourceUrl?: string;
    sourceName?: string;
}
export declare const API_REFERENCE_KINDS: readonly ["openapi", "asyncapi", "cli"];
export interface ApiReferenceProps {
    /** The data module of one reference: `import reference from '@b10x-reference/<id>.json'`. */
    reference: ApiReferenceData;
    /** Heading for the reference title. */
    headingLevel?: 2 | 3;
}
/** Render a reference the product-site plugin loaded, by its kind. */
export declare function ApiReference({ reference, headingLevel }: ApiReferenceProps): ReactNode;
