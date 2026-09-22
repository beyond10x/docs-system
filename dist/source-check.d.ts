/** One violation, located in a repository-relative file and, where one exists, a 1-based line. */
export interface SourceCheckFailure {
    file: string;
    line?: number;
    message: string;
}
export interface SourceCheckResult {
    failures: SourceCheckFailure[];
    documents: number;
    changes: number;
    fences: number;
}
/**
 * Run, over the files one repository's `b10x.docs.yaml` declares, every validator the Website
 * publisher applies to that source alone: the manifest schema, every `changes/**\/*.yaml`
 * ecosystem change, the Markdown code-fence contract, passive rendering, frontmatter, field-note
 * dates, search audiences, sidebar positions, navigation groups, structured inputs, and website
 * output uniqueness. Nothing from the repository is imported or executed.
 */
export declare function checkSource(repositoryRoot: string): Promise<SourceCheckResult>;
/** `file:line: message`, or `file: message` when the violation has no line. */
export declare function formatSourceCheckFailure(failure: SourceCheckFailure): string;
