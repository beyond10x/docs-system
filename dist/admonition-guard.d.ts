/**
 * Raw admonition markers. Docusaurus 3 reads `:::caution[Planned]`; `:::caution Planned` is not an
 * admonition and reaches the page as literal text. Two guards: a source lint for authors and a
 * built-HTML check the product-site plugin runs after every build. Node-safe.
 */
export interface AdmonitionProblem {
    line: number;
    text: string;
}
/** Source lint: a `:::kind Title` line outside fenced code. */
export declare const RAW_ADMONITION_SOURCE: RegExp;
export declare function rawAdmonitionSourceProblems(source: string): AdmonitionProblem[];
/** Built-HTML check: text outside `<pre>`, `<code>`, `<script>` and `<style>` that starts with `:::kind`. */
export declare function rawAdmonitionHtmlProblems(html: string): AdmonitionProblem[];
