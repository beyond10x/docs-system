/** Table-of-contents labels: code in a heading breaks at spaces, after `/` and `_`, and before `.`, never between letters. */
export interface TocHeading {
    value: string;
    id: string;
    level: number;
    children: TocHeading[];
}
/**
 * Wrap each word of the code in a heading's HTML in an unbreakable span, with break opportunities
 * after `/` and `_` and before `.`. Tags and the text outside `<code>` are returned unchanged.
 */
export declare function breakableTocLabel(html: string): string;
export declare function breakableToc(toc: readonly TocHeading[]): TocHeading[];
