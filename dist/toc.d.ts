/**
 * Table-of-contents labels: code in a heading breaks at spaces, after `/`, `_`, a joining `-` and
 * `::`, before `.` and between a lower-case letter and a capital, never elsewhere between letters.
 */
export interface TocHeading {
    value: string;
    id: string;
    level: number;
    children: TocHeading[];
}
/** The longest run between break opportunities that is kept on one line. */
export declare const TOC_UNBROKEN_RUN = 24;
/**
 * Wrap each word of the code in a heading's HTML in an unbreakable span, with break opportunities
 * at its separators. A word with a run longer than `TOC_UNBROKEN_RUN` stays unwrapped, so the rail
 * may break it anywhere rather than overflow. Tags and the text outside `<code>` are unchanged.
 */
export declare function breakableTocLabel(html: string): string;
export declare function breakableToc(toc: readonly TocHeading[]): TocHeading[];
