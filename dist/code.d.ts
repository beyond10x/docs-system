/**
 * Prism grammars used by the shared Docusaurus shell.
 *
 * Keep this list in one place so every documentation surface highlights the
 * same repository-owned Markdown. JavaScript, TypeScript, JSX, TSX, CSS, and
 * markup are already loaded by Docusaurus and therefore do not belong in the
 * additional-language list.
 */
export declare const PRISM_ADDITIONAL_LANGUAGES: readonly ["bash", "c", "cpp", "diff", "docker", "go", "graphql", "http", "ini", "json", "json5", "markdown", "powershell", "properties", "python", "rust", "shell-session", "toml", "yaml"];
/** Canonical language names accepted across beyond10x Markdown and examples. */
export declare const PRISM_LANGUAGES: readonly ["bash", "c", "cpp", "diff", "docker", "go", "graphql", "http", "ini", "json", "json5", "markdown", "powershell", "properties", "python", "rust", "shell-session", "toml", "yaml", "css", "javascript", "jsx", "markup", "text", "typescript", "tsx"];
export type PrismLanguage = (typeof PRISM_LANGUAGES)[number];
export type CodePresentationKind = 'command' | 'transcript' | 'output' | 'source';
export interface CodeLanguagePresentation {
    label: string;
    kind: CodePresentationKind;
}
export interface MarkdownFencePresentation extends CodeLanguagePresentation {
    language: string;
    canonical: boolean;
}
/** Human-facing labels and semantics for every grammar in the shared shell. */
export declare const PRISM_LANGUAGE_PRESENTATIONS: Readonly<Record<PrismLanguage, CodeLanguagePresentation>>;
/**
 * Normalize a Markdown fence or CodeBlock language to the shared Prism name.
 * Unknown names are retained so a consumer can add a project-specific Prism
 * grammar without this package silently turning its source into plain text.
 */
export declare function normalizeMarkdownFenceLanguage(language?: string | null): string;
export interface MarkdownFenceSource {
    /** The info-string language exactly as authored; empty or absent when the fence has none. */
    language?: string | null;
    /** The fence's raw source text, from its opening marker through its closing marker if any. */
    raw: string;
}
/**
 * The source-mode Markdown code-fence contract shared by the Website publisher
 * and `b10x-docs check-source`. Returns one message per violation; an empty
 * list means the fence is publishable. Parsing Markdown is left to the caller
 * so this module stays free of parser dependencies in browser bundles.
 */
export declare function markdownFenceProblems(fence: MarkdownFenceSource): string[];
/** Resolve the label and visual semantics used by shared code surfaces. */
export declare function describeMarkdownFenceLanguage(language?: string | null): MarkdownFencePresentation;
/** A managed-range violation, carrying the 1-based source line of the offending marker. */
export declare class ManagedRangeError extends Error {
    readonly line: number;
    constructor(message: string, line: number);
}
/**
 * The passive rendering the Website publisher applies to a collected Markdown body before it
 * reaches Docusaurus (Website `scripts/passive-markdown.mjs`): managed ranges removed, HTML
 * comments dropped, placeholder tags escaped, `{#id}` headings made explicit anchors, and opening
 * fence languages canonicalized. Fence state toggles on any same-character marker, exactly as the
 * publisher does; a nested fence the CommonMark parser keeps open is therefore rendered as prose.
 */
export declare function normalizePassiveMarkdown(source: string): string;
/** Escape unknown, attribute-free lowercase tags outside code spans; authored HTML is left alone. */
export declare function escapePlaceholderTags(line: string): string;
/** Canonicalize only the language token of an opening fence line; `console` stays visible. */
export declare function normalizeFenceLine(line: string): string;
/** Remove `<!-- b10x-docs…:start -->` … `:end -->` ranges outside fences; malformed ranges throw. */
export declare function stripManagedRanges(source: string): string;
