/**
 * Data contracts for product-site pages: recorded terminal sessions and the landing page.
 * Node-safe; the React renderers live in `product.tsx`.
 */
import type { DomainGraphDocument, ProtocolGraphDocument } from './product-graphs.js';
export declare const TERMINAL_FORMAT = "b10x-terminal/1";
export declare const PRODUCT_LANDING_FORMAT = "b10x-product-landing/1";
/** One command and the output it actually printed. */
export interface TerminalEntry {
    command: string;
    output?: string;
    /** The recorded exit status; a non-zero status renders the output in the danger tone. */
    exitCode?: number;
    /** A comment line shown before the command. */
    comment?: string;
}
/**
 * A recorded command-line session. Generate it by running the commands (or quote a transcript
 * verbatim); never write output by hand.
 */
export interface TerminalSession {
    format: typeof TERMINAL_FORMAT;
    title?: string;
    entries: TerminalEntry[];
    /** Provenance: the tool version and revision that produced the output. */
    recordedWith?: string;
    /**
     * Output words and their meaning, written by the recorder (for example `{"passed:": "true",
     * "failed:": "false"}`). Every occurrence in the output takes that tone. Additive to
     * b10x-terminal/1: a session without it renders as before.
     */
    tones?: Record<string, TerminalTone>;
}
export type TerminalTone = 'true' | 'false' | 'unknown' | 'muted';
export declare const TERMINAL_TONES: readonly TerminalTone[];
export declare function parseTerminalSession(value: unknown): TerminalSession;
/**
 * Parse a verbatim transcript: `$ ` starts a command, `# ` a comment, anything else is output of
 * the preceding command.
 */
export declare function parseTranscript(transcript: string): TerminalEntry[];
export type ProductStatus = 'shipped' | 'decided' | 'planned';
export interface ProductAction {
    label: string;
    href: string;
    /** `primary` renders the filled button; the default is a text link. */
    kind?: 'primary' | 'text';
}
export interface ProductFeature {
    title: string;
    description: string;
    href?: string;
    status?: ProductStatus;
}
export interface ProductFlowStep {
    label?: string;
    title: string;
    description?: string;
}
export interface ProductStatusItem {
    label: string;
    status: ProductStatus;
    detail?: string;
    href?: string;
}
export interface RelatedTool {
    name: string;
    description: string;
    href: string;
    /** One or two characters for the mark; defaults to the first letter of the name. */
    mark?: string;
    status?: ProductStatus;
}
interface SectionCopy {
    /** Short label above the title; the landing prefixes it with the section number. */
    eyebrow?: string;
    title: string;
    lede?: string;
}
export type ProductLandingSection = (SectionCopy & {
    kind: 'features';
    items: ProductFeature[];
}) | (SectionCopy & {
    kind: 'flow';
    steps: ProductFlowStep[];
}) | (SectionCopy & {
    kind: 'status';
    items: ProductStatusItem[];
}) | (SectionCopy & {
    kind: 'protocol-graph';
    data: ProtocolGraphDocument | string;
    caption?: string;
}) | (SectionCopy & {
    kind: 'domain-graph';
    data: DomainGraphDocument | string;
    caption?: string;
}) | (SectionCopy & {
    kind: 'related';
    tools: RelatedTool[];
}) | (SectionCopy & {
    kind: 'terminal';
    session: TerminalSession | string;
});
export interface ProductLandingData {
    format: typeof PRODUCT_LANDING_FORMAT;
    product: {
        name: string;
        mark?: string;
        /** The line above the promise, for example "Protocol calculus · bootstrap". */
        eyebrow?: string;
        /** The one-line promise, one entry per rendered line; the last line is emphasised. */
        promise: string[];
        lede: string;
        actions: ProductAction[];
        /** A quiet line under the actions: language, formats, licence. */
        meta?: string;
        /** Shown beside the promise. A string is a path the site plugin resolves at build time. */
        terminal?: TerminalSession | string;
        /** Footer of the hero terminal. */
        terminalCaption?: string;
    };
    sections: ProductLandingSection[];
}
export {};
