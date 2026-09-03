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
/** Resolve the label and visual semantics used by shared code surfaces. */
export declare function describeMarkdownFenceLanguage(language?: string | null): MarkdownFencePresentation;
