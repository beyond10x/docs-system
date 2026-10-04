/**
 * Meaning chips for plain Markdown. A table cell or inline code whose whole text is a reserved
 * word becomes a chip with a glyph: truth values (TRUE, UNKNOWN, FALSE), status (shipped,
 * decided, planned) and protocol kinds (action, evidence, claim, outcome, obligation). Authors
 * keep writing Markdown. protocol/1 YAML fences get magic comments that give every top-level kind
 * section a kind gutter (see `PROTOCOL_KIND_MAGIC_COMMENTS`). Node-safe; no dependencies.
 */
interface HastText {
    type: 'text';
    value: string;
}
interface HastElement {
    type: 'element';
    tagName: string;
    properties?: Record<string, unknown>;
    children: HastNode[];
}
type HastNode = HastText | HastElement | {
    type: string;
    children?: HastNode[];
    value?: string;
};
export type ChipKind = 'truth' | 'status' | 'kind';
export interface ChipMeaning {
    kind: ChipKind;
    value: string;
    glyph: string;
}
/** The meaning of an exact reserved word, or undefined. */
export declare function chipMeaning(text: string): ChipMeaning | undefined;
export declare function chipElement(text: string, meaning: ChipMeaning): HastElement;
/** Docusaurus magic comments for the protocol/1 kind gutter; append after the highlight entry. */
export declare const PROTOCOL_KIND_MAGIC_COMMENTS: ({
    className: string;
    block: {
        start: string;
        end: string;
    };
    line?: undefined;
} | {
    className: string;
    line: string;
    block?: undefined;
})[];
/** Mark each top-level kind section of a protocol/1 document with magic comments. */
export declare function annotateProtocolSource(source: string): string;
/** The rehype plugin. Register it for docs (and pages) through `withProductSite`. */
export default function rehypeSemanticChips(): (tree: HastNode) => void;
export {};
