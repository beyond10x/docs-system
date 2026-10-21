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
export function breakableTocLabel(html: string): string {
  let depth = 0;
  return html.split(/(<[^>]*>)/).map(part => {
    if (part.startsWith('<')) {
      if (/^<code[\s>]/i.test(part)) depth++;
      else if (/^<\/code>/i.test(part)) depth = Math.max(0, depth - 1);
      return part;
    }
    if (!depth) return part;
    return part.replace(/\S+/g, word => `<span class="b10x-toc-word">${word.replace(/([/_])(?=.)/g, '$1<wbr>').replace(/(?<=[^\s/_.])\.(?=[^.])/g, '<wbr>.')}</span>`);
  }).join('');
}

export function breakableToc(toc: readonly TocHeading[]): TocHeading[] {
  return toc.map(heading => ({...heading, value: breakableTocLabel(heading.value), children: breakableToc(heading.children)}));
}
