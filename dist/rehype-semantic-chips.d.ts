/**
 * Meaning chips for plain Markdown. A table cell or inline code whose whole text is a reserved
 * word becomes a chip with a glyph: truth values (TRUE, UNKNOWN, FALSE), status (shipped,
 * decided, planned) and protocol kinds (action, evidence, claim, outcome, obligation). A protocol
 * kind becomes a chip only in a table cell: in prose, `evidence` is far more often a field or key
 * name than the kind, and a kind glyph there reads as a stray icon. Authors keep writing Markdown
 * and use `<Kind>` for a kind chip in prose. Short inline code with a space or hyphen is marked
 * `b10x-code-short` so it stays on one line. protocol/1 YAML fences get magic comments that give every top-level kind
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
/**
 * Inline code short enough to fit any line keeps its words together: `cargo install` must not
 * end one line and start the next. Only spans with a space or hyphen can break that way, so only
 * those are marked. Longer spans still wrap at spaces, and code in table cells is left alone so a
 * column can stay narrow.
 */
export declare const SHORT_CODE_MAX = 24;
export declare const SHORT_CODE_CLASS = "b10x-code-short";
/** The rehype plugin. Register it for docs (and pages) through `withProductSite`. */
export default function rehypeSemanticChips(): (tree: HastNode) => void;
export {};
