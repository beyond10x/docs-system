/**
 * Meaning chips for plain Markdown. A table cell or inline code whose whole text is a reserved
 * word becomes a chip with a glyph: truth values (TRUE, UNKNOWN, FALSE), status (shipped,
 * decided, planned) and protocol kinds (action, evidence, claim, outcome, obligation). Authors
 * keep writing Markdown. protocol/1 YAML fences get magic comments that give every top-level kind
 * section a kind gutter (see `PROTOCOL_KIND_MAGIC_COMMENTS`). Node-safe; no dependencies.
 */
const TRUTH = { TRUE: '✓', UNKNOWN: '?', FALSE: '✕' };
// Status glyphs are drawn as CSS masks (`.b10x-status-glyph`), not font text: no self-hosted font
// carries all of ○ ◐ ●, and a system fallback paints ◐ as a clipped sliver.
const STATUSES = new Set(['shipped', 'decided', 'planned']);
const KINDS = new Set(['action', 'evidence', 'claim', 'outcome', 'obligation']);
/** The meaning of an exact reserved word, or undefined. */
export function chipMeaning(text) {
    const word = text.trim();
    if (word in TRUTH)
        return { kind: 'truth', value: word.toLowerCase(), glyph: TRUTH[word] };
    const status = word.toLowerCase();
    if (STATUSES.has(status) && /^[a-zA-Z][a-z]*$|^[A-Z]+$/.test(word))
        return { kind: 'status', value: status, glyph: '' };
    if (KINDS.has(word))
        return { kind: 'kind', value: word, glyph: '' };
    return undefined;
}
export function chipElement(text, meaning) {
    return {
        type: 'element',
        tagName: 'span',
        properties: { className: ['b10x-chip', `b10x-chip--${meaning.kind}`, `b10x-chip--${meaning.value}`], dataB10xChip: meaning.kind },
        children: [
            { type: 'element', tagName: 'span', properties: { className: meaning.kind === 'status' ? ['b10x-chip__glyph', 'b10x-status-glyph', `b10x-status-glyph--${meaning.value}`] : ['b10x-chip__glyph'], ariaHidden: 'true' }, children: meaning.glyph ? [{ type: 'text', value: meaning.glyph }] : [] },
            { type: 'element', tagName: 'span', properties: { className: ['b10x-chip__text'] }, children: [{ type: 'text', value: text.trim() }] },
        ],
    };
}
const KIND_SECTIONS = { actions: 'action', evidence_kinds: 'evidence', claims: 'claim', outcomes: 'outcome', obligations: 'obligation' };
/** Docusaurus magic comments for the protocol/1 kind gutter; append after the highlight entry. */
export const PROTOCOL_KIND_MAGIC_COMMENTS = Object.values(KIND_SECTIONS).flatMap((kind) => [
    { className: `b10x-kind-line b10x-kind-line--${kind}`, block: { start: `b10x-kind-${kind}-start`, end: `b10x-kind-${kind}-end` } },
    { className: `b10x-kind-head b10x-kind-head--${kind}`, line: `b10x-kind-${kind}-head` },
]);
/** Mark each top-level kind section of a protocol/1 document with magic comments. */
export function annotateProtocolSource(source) {
    if (!/^format:\s*protocol\/1\s*$/m.test(source))
        return source;
    const lines = source.split('\n');
    const out = [];
    let open;
    let pendingBlank = [];
    const close = () => {
        if (open)
            out.push(`# b10x-kind-${open}-end`);
        open = undefined;
    };
    for (const line of lines) {
        const top = /^([a-z_]+):\s*$/.exec(line)?.[1];
        const isTopLevel = top !== undefined || (/^\S/.test(line) && !line.startsWith('#'));
        if (open && isTopLevel)
            close();
        if (line.trim() === '' && open) {
            pendingBlank.push(line);
            continue;
        }
        out.push(...pendingBlank.splice(0));
        if (top && KIND_SECTIONS[top]) {
            open = KIND_SECTIONS[top];
            out.push(`# b10x-kind-${open}-start`, `# b10x-kind-${open}-head`);
        }
        out.push(line);
    }
    if (open) {
        out.push(`# b10x-kind-${open}-end`);
        open = undefined;
    }
    out.push(...pendingBlank);
    return out.join('\n');
}
function text(node) {
    if (node.type === 'text')
        return node.value;
    return (node.children ?? []).map(text).join('');
}
function classes(node) {
    const value = node.properties?.className;
    return Array.isArray(value) ? value.map(String) : typeof value === 'string' ? value.split(/\s+/) : [];
}
function transform(node, parent) {
    const element = node;
    if (!Array.isArray(element.children))
        return;
    if (element.type === 'element' && element.tagName === 'pre') {
        const code = element.children.find((child) => child.type === 'element' && child.tagName === 'code');
        const meta = String(code?.properties?.metastring ?? code?.data?.meta ?? '');
        // A {range} in the metastring turns magic comments off in Docusaurus; leave such fences alone.
        if (code && !/\{[\d,\s-]+\}/.test(meta) && classes(code).some((name) => /^language-ya?ml$/.test(name)) && code.children.length === 1 && code.children[0].type === 'text') {
            const child = code.children[0];
            child.value = annotateProtocolSource(child.value);
        }
        return;
    }
    if (element.type === 'element' && (element.tagName === 'td' || element.tagName === 'th') && parent) {
        const meaningful = element.children.filter((child) => !(child.type === 'text' && !child.value.trim()));
        if (meaningful.length === 1) {
            const only = meaningful[0];
            const isPlain = only.type === 'text' || (only.type === 'element' && only.tagName === 'code');
            const meaning = isPlain ? chipMeaning(text(only)) : undefined;
            if (meaning && element.tagName === 'td') {
                element.children = [chipElement(text(only), meaning)];
                return;
            }
        }
    }
    element.children = element.children.map((child) => {
        if (child.type === 'element' && child.tagName === 'code') {
            const meaning = chipMeaning(text(child));
            if (meaning)
                return chipElement(text(child), meaning);
        }
        return child;
    });
    for (const child of element.children)
        transform(child, element.type === 'element' ? element : parent);
}
/** The rehype plugin. Register it for docs (and pages) through `withProductSite`. */
export default function rehypeSemanticChips() {
    return (tree) => transform(tree, undefined);
}
