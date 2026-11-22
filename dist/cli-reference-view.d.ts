import type { ReactNode } from 'react';
import type { CliCommand, CliReferenceDocument } from './cli-reference.js';
export interface CliReferenceProps {
    /** A `b10x-cli-reference/1` document; it is checked with `parseCliReference` before rendering. */
    document: CliReferenceDocument;
    /** Where the unchanged source document can be downloaded; shown as a download link. */
    sourceUrl?: string;
    /** The file name the download carries, shown beside the link. */
    sourceName?: string;
    /** Heading for the reference title. Use 3 when embedding beneath a documentation-page h2. */
    headingLevel?: 2 | 3;
    /** Heading text instead of the binary name. */
    title?: string;
}
/** The words of one command's synopsis: each is an atom that never breaks across lines. */
export declare function cliSynopsisParts(document: CliReferenceDocument, command: CliCommand): string[][];
/** One command's synopsis line: `tool post --to <TO> [--kind <KIND>] (--body <BODY> | --body-file <BODY_FILE>)`. */
export declare function cliSynopsis(document: CliReferenceDocument, command: CliCommand): string;
export declare function CliReference({ document: input, sourceUrl, sourceName, headingLevel, title }: CliReferenceProps): ReactNode;
