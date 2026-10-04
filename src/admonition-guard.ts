/**
 * Raw admonition markers. Docusaurus 3 reads `:::caution[Planned]`; `:::caution Planned` is not an
 * admonition and reaches the page as literal text. Two guards: a source lint for authors and a
 * built-HTML check the product-site plugin runs after every build. Node-safe.
 */

export interface AdmonitionProblem {line: number; text: string}

/** Source lint: a `:::kind Title` line outside fenced code. */
export const RAW_ADMONITION_SOURCE = /^:::[a-z]+ +\S/;

export function rawAdmonitionSourceProblems(source: string): AdmonitionProblem[] {
  const problems: AdmonitionProblem[] = [];
  let fence: string | undefined;
  source.replace(/\r\n?/g, '\n').split('\n').forEach((text, index) => {
    const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(text)?.[1];
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length && /^\s{0,3}(`{3,}|~{3,})\s*$/.test(text)) fence = undefined;
      return;
    }
    if (marker) { fence = marker; return; }
    if (RAW_ADMONITION_SOURCE.test(text)) problems.push({line: index + 1, text});
  });
  return problems;
}

/** Built-HTML check: text outside `<pre>`, `<code>`, `<script>` and `<style>` that starts with `:::kind`. */
export function rawAdmonitionHtmlProblems(html: string): AdmonitionProblem[] {
  const blank = (match: string): string => match.replace(/[^\n]/g, ' ');
  const visible = html
    .replace(/<(pre|code|script|style|textarea)\b[\s\S]*?<\/\1>/gi, blank)
    .replace(/<!--[\s\S]*?-->/g, blank);
  const problems: AdmonitionProblem[] = [];
  const lines = visible.split('\n');
  lines.forEach((line, index) => {
    // Each text run starts after a tag boundary or at a line start.
    for (const run of line.split(/<[^>]*>/)) {
      const text = run.replace(/&nbsp;|&#160;/g, ' ').trimStart();
      if (/^:::[a-z]+/.test(text)) problems.push({line: index + 1, text: text.slice(0, 80)});
    }
  });
  return problems;
}
