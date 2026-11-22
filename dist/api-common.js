import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Shared pieces of the read-only API reference renderers: plain-text descriptions, `$ref`
 * resolution inside one document, the schema viewer with lazily expanded references, and the
 * method, status and action chips. Imports nothing from the Docusaurus theme.
 */
import { createContext, Fragment, memo, useContext, useEffect, useState } from 'react';
export const heading = (level) => `h${Math.min(6, Math.max(2, level))}`;
export const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** True for a plain object; a value of a known object type keeps that type. */
export const isRecord = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
export const entries = (value) => isRecord(value) ? Object.entries(value).filter(([key]) => !key.startsWith('x-')) : [];
/** Text with a break opportunity after every `.`, `/`, `_` and `-`, for long identifiers and paths. */
export function Breakable({ text }) {
    const parts = text.split(/(?<=[./_-])/);
    return _jsx(_Fragment, { children: parts.map((part, index) => _jsxs(Fragment, { children: [index > 0 && _jsx("wbr", {}), part] }, index)) });
}
function inline(text) {
    return text.split(/(`[^`\n]+`)/).map((part, index) => part.length > 2 && part.startsWith('`') && part.endsWith('`')
        ? _jsx("code", { children: part.slice(1, -1) }, index)
        : part);
}
/**
 * A description from the document as plain text: blank lines separate paragraphs, a paragraph whose
 * lines all start with `- ` or `* ` is a list, and backtick spans are code. HTML in the text stays text.
 */
export function Prose({ text, className }) {
    if (typeof text !== 'string' || !text.trim())
        return null;
    const blocks = text.replace(/\r\n?/g, '\n').trim().split(/\n[ \t]*\n+/);
    return _jsx("div", { className: className ? `b10x-api-prose ${className}` : 'b10x-api-prose', children: blocks.map((block, index) => {
            const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
            if (lines.length > 1 && lines.every((line) => /^[-*] /.test(line)))
                return _jsx("ul", { children: lines.map((line, item) => _jsx("li", { children: inline(line.slice(2)) }, item)) }, index);
            return _jsx("p", { children: inline(lines.join(' ')) }, index);
        }) });
}
/** Decode one JSON pointer fragment (`#/a/b~1c`) into its tokens; undefined for anything else. */
export function pointerTokens(ref) {
    if (ref === '#')
        return [];
    if (!ref.startsWith('#/'))
        return undefined;
    return ref.slice(2).split('/').map((token) => {
        let decoded = token;
        try {
            decoded = decodeURIComponent(token);
        }
        catch { /* keep the raw token */ }
        return decoded.replace(/~1/g, '/').replace(/~0/g, '~');
    });
}
/** The value a local `$ref` names inside `root`, or undefined. External references are never fetched. */
export function resolvePointer(root, ref) {
    const tokens = pointerTokens(ref);
    if (!tokens)
        return undefined;
    let value = root;
    for (const token of tokens) {
        if (Array.isArray(value) && /^\d+$/.test(token))
            value = value[Number(token)];
        else if (isRecord(value) && Object.hasOwn(value, token))
            value = value[token];
        else
            return undefined;
    }
    return value;
}
/** Follow a chain of `$ref` objects (`{$ref}` → `{$ref}` → value) with a loop guard. */
export function follow(root, value) {
    let current = value;
    let last;
    const seen = new Set();
    while (isRecord(current) && typeof current.$ref === 'string') {
        const ref = current.$ref;
        if (seen.has(ref))
            return { value: undefined, ref };
        seen.add(ref);
        last = ref;
        current = resolvePointer(root, ref);
    }
    return { value: current, ref: last };
}
/** Without a document: a `#/components/schemas/<name>` reference links to `#schema-<name>`. */
export const schemaAnchor = (ref) => ref.startsWith('#/components/schemas/') && pointerTokens(ref)?.length === 3 ? `schema-${pointerTokens(ref)[2]}` : undefined;
const fallbackContext = { anchor: schemaAnchor };
export const RefContext = createContext(fallbackContext);
/** The display name of a pointer: its last token. */
export const refName = (ref) => pointerTokens(ref)?.at(-1) ?? ref;
/** True once React has hydrated on the client. Server and first client render agree on false. */
export function useHydrated() {
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => setHydrated(true), []);
    return hydrated;
}
/** Open every closed `<details>` around the element the location hash names, inside `root`. */
export function useOpenOnHash(root) {
    useEffect(() => {
        const open = () => {
            let id = window.location.hash.slice(1);
            try {
                id = decodeURIComponent(id);
            }
            catch { /* keep the raw id */ }
            const target = id ? document.getElementById(id) : null;
            if (!target || !root.current?.contains(target))
                return;
            let opened = false;
            for (let node = target; node && node !== root.current; node = node.parentElement) {
                if (node instanceof HTMLDetailsElement && !node.open) {
                    node.open = true;
                    opened = true;
                }
            }
            if (opened)
                target.scrollIntoView({ block: 'start' });
        };
        open();
        window.addEventListener('hashchange', open);
        return () => window.removeEventListener('hashchange', open);
    }, [root]);
}
/**
 * A native disclosure whose content renders only once it is opened, so a deep schema is never laid
 * out eagerly. Until then (and without JavaScript) it holds `fallback`.
 */
export function LazyDetails({ summary, className, fallback, children }) {
    const [open, setOpen] = useState(false);
    return _jsxs("details", { className: className, onToggle: (event) => setOpen(event.currentTarget.open), children: [_jsx("summary", { children: summary }), open ? _jsx("div", { className: "b10x-schema-expanded", children: children() }) : fallback] });
}
const METHOD_TONES = new Set(['get', 'post', 'put', 'patch', 'delete']);
export function MethodChip({ method }) {
    const tone = METHOD_TONES.has(method.toLowerCase()) ? method.toLowerCase() : 'other';
    return _jsx("span", { className: `b10x-api-chip b10x-api-method b10x-api-method--${tone}`, children: method.toUpperCase() });
}
export function statusClass(status) {
    const first = status.trim()[0];
    return first && '12345'.includes(first) ? `${first}xx` : 'other';
}
export function StatusChip({ status }) {
    return _jsx("span", { className: `b10x-api-chip b10x-api-status b10x-api-status--${statusClass(status)}`, children: status });
}
export function ActionChip({ action }) {
    const tone = action === 'send' || action === 'receive' ? action : 'other';
    return _jsx("span", { className: `b10x-api-chip b10x-api-action b10x-api-action--${tone}`, children: action });
}
export function DownloadLink({ url, label, name }) {
    if (!url)
        return null;
    return _jsxs("a", { className: "b10x-touch-link b10x-api-download", href: url, download: name ?? true, children: [label, name ? _jsxs(_Fragment, { children: [" (", _jsx("code", { children: name }), ")"] }) : null] });
}
export const formatValue = (value) => typeof value === 'string' ? value : JSON.stringify(value);
export const formatExample = (value) => typeof value === 'string' ? value : JSON.stringify(value, null, 2);
function types(schema) {
    const list = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
    if (schema.nullable && !list.includes('null'))
        list.push('null');
    return list;
}
/** A short type label: `string · date-time`, `string | null`, `array of Message`, `one of 3`. */
export function typeLabel(schema) {
    if (!schema || !isRecord(schema))
        return 'any';
    if (schema.$ref)
        return refName(schema.$ref);
    const list = types(schema);
    if (list.includes('array') || (!list.length && schema.items)) {
        const items = Array.isArray(schema.items) ? undefined : schema.items;
        return `array of ${items ? typeLabel(items) : 'any'}${list.includes('null') ? ' | null' : ''}`;
    }
    const composition = schema.oneOf ? ['one of', schema.oneOf] : schema.anyOf ? ['any of', schema.anyOf] : schema.allOf ? ['all of', schema.allOf] : undefined;
    if (!list.length && composition)
        return `${composition[0]} ${composition[1].length}`;
    const base = list.length ? list.join(' | ') : schema.properties ? 'object' : schema.const !== undefined ? 'constant' : schema.enum ? 'enum' : 'any';
    return [base, schema.format].filter(Boolean).join(' · ');
}
/** True when a schema has something to expand: properties, variants, structured items or a map. */
function structured(schema) {
    if (!schema || !isRecord(schema))
        return false;
    if (schema.properties && Object.keys(schema.properties).length)
        return true;
    if (schema.oneOf || schema.anyOf || schema.allOf || schema.not)
        return true;
    if (isRecord(schema.additionalProperties))
        return true;
    if (schema.items && !Array.isArray(schema.items))
        return !!schema.items.$ref || structured(schema.items);
    return Array.isArray(schema.prefixItems);
}
function Constraints({ schema }) {
    const items = [];
    const values = (list) => list.map((value, index) => _jsxs(Fragment, { children: [index > 0 && ' ', _jsx("code", { children: formatValue(value) })] }, index));
    if (Array.isArray(schema.enum))
        items.push(_jsxs(_Fragment, { children: ["One of ", values(schema.enum)] }));
    if (schema.const !== undefined)
        items.push(_jsxs(_Fragment, { children: ["Always ", _jsx("code", { children: formatValue(schema.const) })] }));
    if (typeof schema.pattern === 'string')
        items.push(_jsxs(_Fragment, { children: ["Pattern ", _jsx("code", { children: schema.pattern })] }));
    const bound = (name, value, sign) => { if (typeof value === 'number')
        items.push(_jsxs(_Fragment, { children: [sign ? `${name} ${sign} ` : `${name} `, _jsx("code", { children: value })] })); };
    bound('Value', schema.minimum, '≥');
    bound('Value', schema.maximum, '≤');
    if (typeof schema.exclusiveMinimum === 'number')
        bound('Value', schema.exclusiveMinimum, '>');
    if (typeof schema.exclusiveMaximum === 'number')
        bound('Value', schema.exclusiveMaximum, '<');
    bound('Multiple of', schema.multipleOf, '');
    bound('Length', schema.minLength, '≥');
    bound('Length', schema.maxLength, '≤');
    bound('Items', schema.minItems, '≥');
    bound('Items', schema.maxItems, '≤');
    bound('Properties', schema.minProperties, '≥');
    bound('Properties', schema.maxProperties, '≤');
    if (schema.uniqueItems)
        items.push(_jsx(_Fragment, { children: "Items are unique" }));
    if (schema.default !== undefined)
        items.push(_jsxs(_Fragment, { children: ["Default ", _jsx("code", { children: formatValue(schema.default) })] }));
    const examples = Array.isArray(schema.examples) ? schema.examples : schema.example !== undefined ? [schema.example] : [];
    if (examples.length)
        items.push(_jsxs(_Fragment, { children: [examples.length > 1 ? 'Examples ' : 'Example ', values(examples)] }));
    if (schema.readOnly)
        items.push(_jsx(_Fragment, { children: "Read-only" }));
    if (schema.writeOnly)
        items.push(_jsx(_Fragment, { children: "Write-only" }));
    if (schema.deprecated)
        items.push(_jsx(_Fragment, { children: "Deprecated" }));
    if (!items.length)
        return null;
    return _jsx("ul", { className: "b10x-schema-constraints", children: items.map((item, index) => _jsx("li", { children: item }, index)) });
}
const EAGER_DEPTH = 2;
const MAX_DEPTH = 12;
/** The type of one schema in a row: a link to the referenced card, or the inline label. */
export function SchemaType({ schema }) {
    const context = useContext(RefContext);
    if (!schema || !isRecord(schema))
        return _jsx("span", { className: "b10x-schema-type", children: "any" });
    if (typeof schema.$ref === 'string')
        return _jsx(RefLink, { reference: schema.$ref, context: context });
    const items = !Array.isArray(schema.items) ? schema.items : undefined;
    if (items?.$ref && (types(schema).includes('array') || !schema.type))
        return _jsxs("span", { className: "b10x-schema-type", children: ["array of ", _jsx(RefLink, { reference: items.$ref, context: context })] });
    return _jsx("span", { className: "b10x-schema-type", children: typeLabel(schema) });
}
function RefLink({ reference, context }) {
    const anchor = context.anchor(reference);
    const name = _jsx("code", { children: _jsx(Breakable, { text: refName(reference) }) });
    if (!reference.startsWith('#'))
        return _jsx("span", { className: "b10x-schema-ref b10x-schema-ref--external", title: "External reference, not fetched", children: _jsx("code", { children: _jsx(Breakable, { text: reference }) }) });
    const target = context.root === undefined ? undefined : follow(context.root, { $ref: reference }).value;
    const scalar = target && isRecord(target) && !structured(target) ? typeLabel(target) : undefined;
    return _jsxs("span", { className: "b10x-schema-ref", children: [anchor ? _jsx("a", { href: `#${anchor}`, children: name }) : name, scalar && scalar !== refName(reference) && _jsx("span", { className: "b10x-schema-ref__type", children: scalar })] });
}
/**
 * The body of one schema: variants, properties, items, additional properties and constraints.
 * A `$ref` shows the referenced name as a link to its card and expands in place on demand.
 */
export const SchemaView = memo(function SchemaView({ schema, depth = 0, trail = [], bare = false }) {
    const context = useContext(RefContext);
    if (!schema || !isRecord(schema))
        return _jsx("p", { className: "b10x-schema-note", children: "Any JSON value." });
    if (typeof schema.$ref === 'string')
        return _jsx(RefBlock, { reference: schema.$ref, siblings: schema, depth: depth, trail: trail, context: context });
    const parts = [];
    const compositions = [['allOf', 'All of'], ['oneOf', 'One of'], ['anyOf', 'Any of']];
    for (const [key, label] of compositions) {
        const variants = schema[key];
        if (!Array.isArray(variants))
            continue;
        parts.push(_jsxs("div", { className: "b10x-schema-variants", children: [_jsxs("p", { className: "b10x-schema-label", children: [label, key === 'oneOf' && schema.discriminator?.propertyName ? _jsxs(_Fragment, { children: [", told apart by ", _jsx("code", { children: schema.discriminator.propertyName })] }) : null] }), _jsx("ol", { children: variants.map((variant, index) => _jsx("li", { children: _jsx(Variant, { schema: variant, depth: depth + 1, trail: trail }) }, index)) })] }, key));
    }
    if (isRecord(schema.not))
        parts.push(_jsxs("div", { className: "b10x-schema-variants", children: [_jsx("p", { className: "b10x-schema-label", children: "Not" }), _jsx(Variant, { schema: schema.not, depth: depth + 1, trail: trail })] }, "not"));
    if (schema.properties && Object.keys(schema.properties).length)
        parts.push(_jsx(Properties, { schema: schema, depth: depth, trail: trail }, "properties"));
    const items = schema.items;
    if (Array.isArray(schema.prefixItems))
        parts.push(_jsxs("div", { className: "b10x-schema-variants", children: [_jsx("p", { className: "b10x-schema-label", children: "Items in order" }), _jsx("ol", { children: schema.prefixItems.map((item, index) => _jsx("li", { children: _jsx(Variant, { schema: item, depth: depth + 1, trail: trail }) }, index)) })] }, "prefix"));
    if (items && !Array.isArray(items))
        parts.push(_jsxs("div", { className: "b10x-schema-items", children: [_jsxs("p", { className: "b10x-schema-label", children: ["Items ", _jsx(SchemaType, { schema: items })] }), structured(items) || items.$ref ? _jsx(Nested, { schema: items, depth: depth + 1, trail: trail }) : _jsx(Constraints, { schema: items })] }, "items"));
    if (isRecord(schema.additionalProperties))
        parts.push(_jsxs("div", { className: "b10x-schema-items", children: [_jsxs("p", { className: "b10x-schema-label", children: ["Other properties ", _jsx(SchemaType, { schema: schema.additionalProperties })] }), _jsx(Nested, { schema: schema.additionalProperties, depth: depth + 1, trail: trail })] }, "additional"));
    else if (schema.additionalProperties === false && schema.properties)
        parts.push(_jsx("p", { className: "b10x-schema-note", children: "No other properties." }, "closed"));
    const constraints = bare ? null : _jsx(Constraints, { schema: schema }, "constraints");
    if (!parts.length)
        return _jsxs("div", { className: "b10x-schema-scalar", children: [_jsx("span", { className: "b10x-schema-type", children: typeLabel(schema) }), constraints] });
    return _jsxs(_Fragment, { children: [constraints, parts] });
});
/** A nested schema: inline at shallow depth, a lazily rendered disclosure below it. */
function Nested({ schema, depth, trail }) {
    const context = useContext(RefContext);
    if (typeof schema.$ref === 'string')
        return _jsx(RefExpand, { reference: schema.$ref, depth: depth, trail: trail, context: context });
    if (!structured(schema))
        return null;
    if (depth <= EAGER_DEPTH)
        return _jsx("div", { className: "b10x-schema-nested", children: _jsx(SchemaView, { schema: schema, depth: depth, trail: trail, bare: true }) });
    if (depth >= MAX_DEPTH)
        return _jsx("p", { className: "b10x-schema-note", children: "Nested too deep to show here." });
    return _jsx(LazyDetails, { className: "b10x-schema-more", summary: _jsx(_Fragment, { children: "Show fields" }), fallback: _jsx("p", { className: "b10x-schema-note", children: "Opens with JavaScript." }), children: () => _jsx(SchemaView, { schema: schema, depth: depth, trail: trail, bare: true }) });
}
function Variant({ schema, depth, trail }) {
    if (!isRecord(schema))
        return _jsx(SchemaType, {});
    if (typeof schema.$ref === 'string')
        return _jsxs(_Fragment, { children: [_jsx(SchemaType, { schema: schema }), _jsx(Nested, { schema: schema, depth: depth, trail: trail })] });
    return _jsxs(_Fragment, { children: [_jsx("span", { className: "b10x-schema-type", children: schema.title ?? typeLabel(schema) }), _jsx(Prose, { text: schema.description, className: "b10x-schema-description" }), structured(schema) ? _jsx(Nested, { schema: schema, depth: depth, trail: trail }) : _jsx(Constraints, { schema: schema })] });
}
function Properties({ schema, depth, trail }) {
    const required = new Set(Array.isArray(schema.required) ? schema.required : []);
    return _jsx("dl", { className: "b10x-schema-properties", children: Object.entries(isRecord(schema.properties) ? schema.properties : {}).map(([name, property]) => {
            const value = isRecord(property) ? property : {};
            return _jsxs("div", { children: [_jsxs("dt", { children: [_jsx("code", { className: "b10x-schema-name", children: _jsx(Breakable, { text: name }) }), _jsx(SchemaType, { schema: value }), required.has(name) && _jsx("b", { className: "b10x-schema-required", children: "required" })] }), _jsxs("dd", { children: [_jsx(Prose, { text: value.description, className: "b10x-schema-description" }), _jsx(Constraints, { schema: value }), (typeof value.$ref === 'string' || structured(value)) && _jsx(Nested, { schema: value, depth: depth + 1, trail: trail })] })] }, name);
        }) });
}
/** The in-place expansion of a reference to a structured schema, guarded against cycles. */
function RefExpand({ reference, depth, trail, context }) {
    if (!reference.startsWith('#') || context.root === undefined)
        return null;
    const { value: target } = follow(context.root, { $ref: reference });
    if (!target || !structured(target))
        return null;
    const anchor = context.anchor(reference);
    const name = refName(reference);
    if (trail.includes(reference))
        return _jsxs("p", { className: "b10x-schema-note", children: ["Recursive: ", _jsx("code", { children: _jsx(Breakable, { text: name }) }), " again", anchor ? _jsxs(_Fragment, { children: [", see ", _jsx("a", { href: `#${anchor}`, children: "its card" })] }) : null, "."] });
    if (depth >= MAX_DEPTH)
        return null;
    return _jsx(LazyDetails, { className: "b10x-schema-more", summary: _jsxs(_Fragment, { children: ["Show fields", _jsxs("span", { className: "b10x-sr-only", children: [" of ", name] })] }), fallback: anchor ? _jsxs("p", { className: "b10x-schema-note", children: ["See ", _jsx("a", { href: `#${anchor}`, children: _jsx("code", { children: _jsx(Breakable, { text: name }) }) }), "."] }) : null, children: () => _jsxs(_Fragment, { children: [target.description && _jsx(Prose, { text: target.description, className: "b10x-schema-description" }), _jsx(SchemaView, { schema: target, depth: depth, trail: [...trail, reference] })] }) });
}
/** A schema at the top of a body or a payload: a reference renders its target one level deep. */
function RefBlock({ reference, siblings, depth, trail, context }) {
    const { value: target } = reference.startsWith('#') && context.root !== undefined ? follow(context.root, { $ref: reference }) : { value: undefined };
    const head = _jsx("p", { className: "b10x-schema-label", children: _jsx(SchemaType, { schema: { $ref: reference } }) });
    if (!target || trail.includes(reference) || depth > 0)
        return _jsxs("div", { className: "b10x-schema-refblock", children: [head, _jsx(Prose, { text: siblings.description, className: "b10x-schema-description" }), _jsx(Nested, { schema: { $ref: reference }, depth: depth + 1, trail: trail })] });
    return _jsxs("div", { className: "b10x-schema-refblock", children: [head, _jsx(Prose, { text: siblings.description ?? target.description, className: "b10x-schema-description" }), _jsx(SchemaView, { schema: target, depth: depth + 1, trail: [...trail, reference] })] });
}
/** One collapsible card per named schema. */
export function SchemaCards({ schemas, anchor }) {
    return _jsx("div", { className: "b10x-schema-grid", children: schemas.map(([name, schema]) => _jsxs("details", { className: "b10x-schema-card", id: anchor(name), children: [_jsxs("summary", { children: [_jsx("code", { children: _jsx(Breakable, { text: name }) }), _jsx("span", { className: "b10x-schema-card__type", children: typeLabel(schema) })] }), _jsxs("div", { children: [schema.title && schema.title !== name && _jsx("p", { className: "b10x-schema-title", children: schema.title }), _jsx(Prose, { text: schema.description, className: "b10x-schema-description" }), _jsx(SchemaView, { schema: schema, depth: 1, trail: [`#/components/schemas/${name.replace(/~/g, '~0').replace(/\//g, '~1')}`] })] })] }, name)) });
}
/** Examples as closed disclosures holding formatted JSON or text. */
export function Examples({ examples, example, label = 'Example' }) {
    const context = useContext(RefContext);
    const list = [];
    if (example !== undefined)
        list.push({ name: label, value: example });
    if (Array.isArray(examples))
        examples.forEach((value, index) => {
            const resolved = follow(context.root, value).value;
            if (isRecord(resolved) && ('payload' in resolved || 'headers' in resolved))
                list.push({ name: String(resolved.name ?? `${label} ${index + 1}`), summary: resolved.summary, value: resolved.payload ?? resolved.headers });
            else
                list.push({ name: `${label} ${index + 1}`, value });
        });
    else
        for (const [name, value] of entries(examples)) {
            const resolved = follow(context.root, value).value;
            if (!isRecord(resolved))
                continue;
            if (resolved.value === undefined && typeof resolved.externalValue === 'string')
                list.push({ name, summary: resolved.summary, value: `External example, not fetched: ${resolved.externalValue}` });
            else
                list.push({ name, summary: resolved.summary, description: resolved.description, value: resolved.value });
        }
    if (!list.length)
        return null;
    return _jsx("div", { className: "b10x-api-examples", children: list.map((item, index) => _jsxs("details", { className: "b10x-api-example", children: [_jsxs("summary", { children: [`${label}: `, _jsx("span", { children: item.summary ?? item.name })] }), _jsx(Prose, { text: item.description }), _jsx("pre", { className: "b10x-api-example__code", children: _jsx("code", { children: formatExample(item.value) }) })] }, index)) });
}
