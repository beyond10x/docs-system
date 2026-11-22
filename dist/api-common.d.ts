import type { ReactNode, RefObject } from 'react';
export interface JsonSchema {
    $ref?: string;
    title?: string;
    type?: string | string[];
    format?: string;
    description?: string;
    enum?: unknown[];
    const?: unknown;
    default?: unknown;
    examples?: unknown[];
    example?: unknown;
    pattern?: string;
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: number | boolean;
    exclusiveMaximum?: number | boolean;
    multipleOf?: number;
    minLength?: number;
    maxLength?: number;
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;
    minProperties?: number;
    maxProperties?: number;
    deprecated?: boolean;
    readOnly?: boolean;
    writeOnly?: boolean;
    nullable?: boolean;
    properties?: Record<string, JsonSchema>;
    required?: string[];
    items?: JsonSchema | JsonSchema[];
    prefixItems?: JsonSchema[];
    additionalProperties?: boolean | JsonSchema;
    oneOf?: JsonSchema[];
    anyOf?: JsonSchema[];
    allOf?: JsonSchema[];
    not?: JsonSchema;
    discriminator?: {
        propertyName?: string;
        mapping?: Record<string, string>;
    };
}
export type HeadingTag = 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export declare const heading: (level: number) => HeadingTag;
export declare const slug: (value: string) => string;
type RecordOf<T> = unknown extends T ? Record<string, unknown> : Extract<T, object>;
/** True for a plain object; a value of a known object type keeps that type. */
export declare const isRecord: <T>(value: T) => value is RecordOf<T> & T;
export declare const entries: <T>(value: unknown) => Array<[string, T]>;
/** Text with a break opportunity after every `.`, `/`, `_` and `-`, for long identifiers and paths. */
export declare function Breakable({ text }: {
    text: string;
}): ReactNode;
/**
 * A description from the document as plain text: blank lines separate paragraphs, a paragraph whose
 * lines all start with `- ` or `* ` is a list, and backtick spans are code. HTML in the text stays text.
 */
export declare function Prose({ text, className }: {
    text?: unknown;
    className?: string;
}): ReactNode;
/** Decode one JSON pointer fragment (`#/a/b~1c`) into its tokens; undefined for anything else. */
export declare function pointerTokens(ref: string): string[] | undefined;
/** The value a local `$ref` names inside `root`, or undefined. External references are never fetched. */
export declare function resolvePointer(root: unknown, ref: string): unknown;
/** Follow a chain of `$ref` objects (`{$ref}` → `{$ref}` → value) with a loop guard. */
export declare function follow<T>(root: unknown, value: unknown): {
    value: T | undefined;
    ref?: string;
};
export interface ReferenceContext {
    /** The whole document `$ref` pointers resolve in; absent, no reference is resolved. */
    root?: unknown;
    /** The page anchor of the card a pointer names, if the reference renders one. */
    anchor(ref: string): string | undefined;
}
/** Without a document: a `#/components/schemas/<name>` reference links to `#schema-<name>`. */
export declare const schemaAnchor: (ref: string) => string | undefined;
export declare const RefContext: import("react").Context<ReferenceContext>;
/** The display name of a pointer: its last token. */
export declare const refName: (ref: string) => string;
/** True once React has hydrated on the client. Server and first client render agree on false. */
export declare function useHydrated(): boolean;
/** Open every closed `<details>` around the element the location hash names, inside `root`. */
export declare function useOpenOnHash(root: RefObject<HTMLElement | null>): void;
/**
 * A native disclosure whose content renders only once it is opened, so a deep schema is never laid
 * out eagerly. Until then (and without JavaScript) it holds `fallback`.
 */
export declare function LazyDetails({ summary, className, fallback, children }: {
    summary: ReactNode;
    className?: string;
    fallback?: ReactNode;
    children: () => ReactNode;
}): ReactNode;
export declare function MethodChip({ method }: {
    method: string;
}): ReactNode;
export declare function statusClass(status: string): string;
export declare function StatusChip({ status }: {
    status: string;
}): ReactNode;
export declare function ActionChip({ action }: {
    action: string;
}): ReactNode;
export declare function DownloadLink({ url, label, name }: {
    url?: string;
    label: string;
    name?: string;
}): ReactNode;
export declare const formatValue: (value: unknown) => string;
export declare const formatExample: (value: unknown) => string;
/** A short type label: `string · date-time`, `string | null`, `array of Message`, `one of 3`. */
export declare function typeLabel(schema: JsonSchema | undefined): string;
/** The type of one schema in a row: a link to the referenced card, or the inline label. */
export declare function SchemaType({ schema }: {
    schema?: JsonSchema;
}): ReactNode;
/**
 * The body of one schema: variants, properties, items, additional properties and constraints.
 * A `$ref` shows the referenced name as a link to its card and expands in place on demand.
 */
export declare const SchemaView: import("react").NamedExoticComponent<{
    schema?: JsonSchema;
    depth?: number;
    trail?: readonly string[];
    bare?: boolean;
}>;
/** One collapsible card per named schema. */
export declare function SchemaCards({ schemas, anchor }: {
    schemas: Array<[string, JsonSchema]>;
    anchor: (name: string) => string;
}): ReactNode;
/** Examples as closed disclosures holding formatted JSON or text. */
export declare function Examples({ examples, example, label }: {
    examples?: unknown;
    example?: unknown;
    label?: string;
}): ReactNode;
export {};
