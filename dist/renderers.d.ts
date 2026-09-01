import type { ReactNode } from 'react';
export interface JsonSchema {
    $ref?: string;
    type?: string | string[];
    format?: string;
    description?: string;
    enum?: unknown[];
    const?: unknown;
    properties?: Record<string, JsonSchema>;
    required?: string[];
    items?: JsonSchema;
    oneOf?: JsonSchema[];
    anyOf?: JsonSchema[];
    allOf?: JsonSchema[];
}
interface OpenApiMedia {
    schema?: JsonSchema;
    examples?: Record<string, {
        summary?: string;
        value?: unknown;
    }>;
}
interface OpenApiOperation {
    operationId?: string;
    summary?: string;
    description?: string;
    parameters?: Array<{
        name: string;
        in: string;
        required?: boolean;
        description?: string;
        schema?: JsonSchema;
    }>;
    requestBody?: {
        content?: Record<string, OpenApiMedia>;
    };
    responses?: Record<string, {
        description?: string;
        content?: Record<string, OpenApiMedia>;
    }>;
}
export interface OpenApiDocument {
    openapi: string;
    info: {
        title: string;
        version: string;
        description?: string;
    };
    paths: Record<string, Partial<Record<'get' | 'post' | 'put' | 'patch' | 'delete', OpenApiOperation>>>;
    components?: {
        schemas?: Record<string, JsonSchema>;
    };
}
export interface OpenApiReferenceProps {
    document: OpenApiDocument;
    sourceUrl?: string;
    /** Heading for the reference title. Use 3 when embedding beneath a documentation-page h2. */
    headingLevel?: 2 | 3;
}
export declare function JsonSchemaViewer({ schema, depth }: {
    schema: JsonSchema;
    depth?: number;
}): ReactNode;
export declare function OpenApiReference({ document, sourceUrl, headingLevel }: OpenApiReferenceProps): ReactNode;
export {};
