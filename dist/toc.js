/**
 * Table-of-contents labels: code in a heading breaks at spaces, after `/`, `_`, a joining `-` and
 * `::`, before `.` and between a lower-case letter and a capital, never elsewhere between letters.
 */
/** The longest run between break opportunities that is kept on one line. */
export const TOC_UNBROKEN_RUN = 24;
function breakPoints(word) {
    return word
        .replace(/([/_])(?=.)/g, '$1<wbr>')
        .replace(/(?<=[^\s/_.])\.(?=[^.])/g, '<wbr>.')
        .replace(/(?<=[^\s-])-(?=[^\s-])/g, '-<wbr>')
        .replace(/::(?=[^:])/g, '::<wbr>')
        .replace(/(?<=[a-z\d])(?=[A-Z])/g, '<wbr>');
}
function runLength(run) {
    return Array.from(run.replace(/&[^;\s]+;/g, '&')).length;
}
/**
 * Wrap each word of the code in a heading's HTML in an unbreakable span, with break opportunities
 * at its separators. A word with a run longer than `TOC_UNBROKEN_RUN` stays unwrapped, so the rail
 * may break it anywhere rather than overflow. Tags and the text outside `<code>` are unchanged.
 */
export function breakableTocLabel(html) {
    let depth = 0;
    return html.split(/(<[^>]*>)/).map(part => {
        if (part.startsWith('<')) {
            if (/^<code[\s>]/i.test(part))
                depth++;
            else if (/^<\/code>/i.test(part))
                depth = Math.max(0, depth - 1);
            return part;
        }
        if (!depth)
            return part;
        return part.replace(/\S+/g, word => {
            const broken = breakPoints(word);
            if (broken.split('<wbr>').some(run => runLength(run) > TOC_UNBROKEN_RUN))
                return broken;
            return `<span class="b10x-toc-word">${broken}</span>`;
        });
    }).join('');
}
export function breakableToc(toc) {
    return toc.map(heading => ({ ...heading, value: breakableTocLabel(heading.value), children: breakableToc(heading.children) }));
}
