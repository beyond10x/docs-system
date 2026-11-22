import type { ReactNode } from 'react';
import type { JsonSchema } from './api-common.js';
type Ref = {
    $ref: string;
};
interface AsyncApiMessage {
    name?: string;
    title?: string;
    summary?: string;
    description?: string;
    contentType?: string;
    payload?: JsonSchema | {
        schemaFormat?: string;
        schema?: JsonSchema;
    };
    headers?: JsonSchema;
    correlationId?: {
        location?: string;
        description?: string;
    } | Ref;
    examples?: Array<{
        name?: string;
        summary?: string;
        payload?: unknown;
        headers?: unknown;
    }>;
}
interface AsyncApiParameter {
    description?: string;
    enum?: string[];
    default?: string;
    examples?: string[];
    location?: string;
}
interface AsyncApiChannel {
    address?: string | null;
    title?: string;
    summary?: string;
    description?: string;
    messages?: Record<string, AsyncApiMessage | Ref>;
    parameters?: Record<string, AsyncApiParameter | Ref>;
    servers?: Ref[];
}
interface AsyncApiOperation {
    action: 'send' | 'receive';
    channel: Ref;
    title?: string;
    summary?: string;
    description?: string;
    messages?: Ref[];
    reply?: {
        channel?: Ref;
        messages?: Ref[];
        address?: {
            location?: string;
            description?: string;
        };
    };
}
interface AsyncApiServer {
    host?: string;
    protocol?: string;
    protocolVersion?: string;
    pathname?: string;
    title?: string;
    summary?: string;
    description?: string;
}
export interface AsyncApiDocument {
    asyncapi: string;
    info: {
        title: string;
        version: string;
        description?: string;
    };
    defaultContentType?: string;
    servers?: Record<string, AsyncApiServer | Ref>;
    channels?: Record<string, AsyncApiChannel | Ref>;
    operations?: Record<string, AsyncApiOperation | Ref>;
    components?: {
        schemas?: Record<string, JsonSchema>;
        messages?: Record<string, AsyncApiMessage | Ref>;
        [key: string]: unknown;
    };
}
export interface AsyncApiReferenceProps {
    document: AsyncApiDocument;
    /** Where the unchanged source document can be downloaded; shown as a download link. */
    sourceUrl?: string;
    /** The file name the download carries, shown beside the link. */
    sourceName?: string;
    /** Heading for the reference title. Use 3 when embedding beneath a documentation-page h2. */
    headingLevel?: 2 | 3;
    /** Heading text instead of the document's `info.title`. */
    title?: string;
}
export declare function AsyncApiReference({ document, sourceUrl, sourceName, headingLevel, title }: AsyncApiReferenceProps): ReactNode;
export {};
