/**
 * Shared pieces of the read-only API reference renderers: plain-text descriptions, `$ref`
 * resolution inside one document, the schema viewer with lazily expanded references, and the
 * method, status and action chips. Imports nothing from the Docusaurus theme.
 */
import {createContext, Fragment, memo, useContext, useEffect, useState} from 'react';
import type {ReactNode, RefObject} from 'react';

export interface JsonSchema {
  $ref?: string;
  title?: string;
  type?: string | string[];
  format?: string;
  description?: string;
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
  examples?: unknown[];
  example?: unknown;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number | boolean;
  exclusiveMaximum?: number | boolean;
  multipleOf?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  minProperties?: number;
  maxProperties?: number;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  nullable?: boolean;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema | JsonSchema[];
  prefixItems?: JsonSchema[];
  additionalProperties?: boolean | JsonSchema;
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
  not?: JsonSchema;
  discriminator?: {propertyName?: string; mapping?: Record<string, string>};
}

export type HeadingTag = 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export const heading = (level: number): HeadingTag => `h${Math.min(6, Math.max(2, level))}` as HeadingTag;
export const slug = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
type RecordOf<T> = unknown extends T ? Record<string, unknown> : Extract<T, object>;
/** True for a plain object; a value of a known object type keeps that type. */
export const isRecord = <T,>(value: T): value is RecordOf<T> & T => !!value && typeof value === 'object' && !Array.isArray(value);
export const entries = <T,>(value: unknown): Array<[string, T]> => isRecord(value) ? Object.entries(value).filter(([key]) => !key.startsWith('x-')) as Array<[string, T]> : [];

/** Text with a break opportunity after every `.`, `/`, `_` and `-`, for long identifiers and paths. */
export function Breakable({text}: {text: string}): ReactNode {
  const parts = text.split(/(?<=[./_-])/);
  return <>{parts.map((part, index) => <Fragment key={index}>{index > 0 && <wbr />}{part}</Fragment>)}</>;
}

function inline(text: string): ReactNode[] {
  return text.split(/(`[^`\n]+`)/).map((part, index) => part.length > 2 && part.startsWith('`') && part.endsWith('`')
    ? <code key={index}>{part.slice(1, -1)}</code>
    : part);
}

/**
 * A description from the document as plain text: blank lines separate paragraphs, a paragraph whose
 * lines all start with `- ` or `* ` is a list, and backtick spans are code. HTML in the text stays text.
 */
export function Prose({text, className}: {text?: unknown; className?: string}): ReactNode {
  if (typeof text !== 'string' || !text.trim()) return null;
  const blocks = text.replace(/\r\n?/g, '\n').trim().split(/\n[ \t]*\n+/);
  return <div className={className ? `b10x-api-prose ${className}` : 'b10x-api-prose'}>
    {blocks.map((block, index) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      if (lines.length > 1 && lines.every((line) => /^[-*] /.test(line))) return <ul key={index}>{lines.map((line, item) => <li key={item}>{inline(line.slice(2))}</li>)}</ul>;
      return <p key={index}>{inline(lines.join(' '))}</p>;
    })}
  </div>;
}

/** Decode one JSON pointer fragment (`#/a/b~1c`) into its tokens; undefined for anything else. */
export function pointerTokens(ref: string): string[] | undefined {
  if (ref === '#') return [];
  if (!ref.startsWith('#/')) return undefined;
  return ref.slice(2).split('/').map((token) => {
    let decoded = token;
    try { decoded = decodeURIComponent(token); } catch { /* keep the raw token */ }
    return decoded.replace(/~1/g, '/').replace(/~0/g, '~');
  });
}

/** The value a local `$ref` names inside `root`, or undefined. External references are never fetched. */
export function resolvePointer(root: unknown, ref: string): unknown {
  const tokens = pointerTokens(ref);
  if (!tokens) return undefined;
  let value: unknown = root;
  for (const token of tokens) {
    if (Array.isArray(value) && /^\d+$/.test(token)) value = value[Number(token)];
    else if (isRecord(value) && Object.hasOwn(value, token)) value = value[token];
    else return undefined;
  }
  return value;
}

/** Follow a chain of `$ref` objects (`{$ref}` → `{$ref}` → value) with a loop guard. */
export function follow<T>(root: unknown, value: unknown): {value: T | undefined; ref?: string} {
  let current = value;
  let last: string | undefined;
  const seen = new Set<string>();
  while (isRecord(current) && typeof current.$ref === 'string') {
    const ref = current.$ref;
    if (seen.has(ref)) return {value: undefined, ref};
    seen.add(ref);
    last = ref;
    current = resolvePointer(root, ref);
  }
  return {value: current as T | undefined, ref: last};
}

export interface ReferenceContext {
  /** The whole document `$ref` pointers resolve in; absent, no reference is resolved. */
  root?: unknown;
  /** The page anchor of the card a pointer names, if the reference renders one. */
  anchor(ref: string): string | undefined;
}

/** Without a document: a `#/components/schemas/<name>` reference links to `#schema-<name>`. */
export const schemaAnchor = (ref: string): string | undefined => ref.startsWith('#/components/schemas/') && pointerTokens(ref)?.length === 3 ? `schema-${pointerTokens(ref)![2]}` : undefined;
const fallbackContext: ReferenceContext = {anchor: schemaAnchor};
export const RefContext = createContext<ReferenceContext>(fallbackContext);

/** The display name of a pointer: its last token. */
export const refName = (ref: string): string => pointerTokens(ref)?.at(-1) ?? ref;

/** True once React has hydrated on the client. Server and first client render agree on false. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

/** Open every closed `<details>` around the element the location hash names, inside `root`. */
export function useOpenOnHash(root: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const open = (): void => {
      let id = window.location.hash.slice(1);
      try { id = decodeURIComponent(id); } catch { /* keep the raw id */ }
      const target = id ? document.getElementById(id) : null;
      if (!target || !root.current?.contains(target)) return;
      let opened = false;
      for (let node: HTMLElement | null = target; node && node !== root.current; node = node.parentElement) {
        if (node instanceof HTMLDetailsElement && !node.open) { node.open = true; opened = true; }
      }
      if (opened) target.scrollIntoView({block: 'start'});
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
export function LazyDetails({summary, className, fallback, children}: {summary: ReactNode; className?: string; fallback?: ReactNode; children: () => ReactNode}): ReactNode {
  const [open, setOpen] = useState(false);
  return <details className={className} onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary>{summary}</summary>
    {open ? <div className="b10x-schema-expanded">{children()}</div> : fallback}
  </details>;
}

const METHOD_TONES = new Set(['get', 'post', 'put', 'patch', 'delete']);
export function MethodChip({method}: {method: string}): ReactNode {
  const tone = METHOD_TONES.has(method.toLowerCase()) ? method.toLowerCase() : 'other';
  return <span className={`b10x-api-chip b10x-api-method b10x-api-method--${tone}`}>{method.toUpperCase()}</span>;
}

export function statusClass(status: string): string {
  const first = status.trim()[0];
  return first && '12345'.includes(first) ? `${first}xx` : 'other';
}
export function StatusChip({status}: {status: string}): ReactNode {
  return <span className={`b10x-api-chip b10x-api-status b10x-api-status--${statusClass(status)}`}>{status}</span>;
}
export function ActionChip({action}: {action: string}): ReactNode {
  const tone = action === 'send' || action === 'receive' ? action : 'other';
  return <span className={`b10x-api-chip b10x-api-action b10x-api-action--${tone}`}>{action}</span>;
}

export function DownloadLink({url, label, name}: {url?: string; label: string; name?: string}): ReactNode {
  if (!url) return null;
  return <a className="b10x-touch-link b10x-api-download" href={url} download={name ?? true}>{label}{name ? <> (<code>{name}</code>)</> : null}</a>;
}

export const formatValue = (value: unknown): string => typeof value === 'string' ? value : JSON.stringify(value);
export const formatExample = (value: unknown): string => typeof value === 'string' ? value : JSON.stringify(value, null, 2);

function types(schema: JsonSchema): string[] {
  const list = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  if (schema.nullable && !list.includes('null')) list.push('null');
  return list;
}

/** A short type label: `string · date-time`, `string | null`, `array of Message`, `one of 3`. */
export function typeLabel(schema: JsonSchema | undefined): string {
  if (!schema || !isRecord(schema)) return 'any';
  if (schema.$ref) return refName(schema.$ref);
  const list = types(schema);
  if (list.includes('array') || (!list.length && schema.items)) {
    const items = Array.isArray(schema.items) ? undefined : schema.items;
    return `array of ${items ? typeLabel(items) : 'any'}${list.includes('null') ? ' | null' : ''}`;
  }
  const composition = schema.oneOf ? ['one of', schema.oneOf] as const : schema.anyOf ? ['any of', schema.anyOf] as const : schema.allOf ? ['all of', schema.allOf] as const : undefined;
  if (!list.length && composition) return `${composition[0]} ${composition[1].length}`;
  const base = list.length ? list.join(' | ') : schema.properties ? 'object' : schema.const !== undefined ? 'constant' : schema.enum ? 'enum' : 'any';
  return [base, schema.format].filter(Boolean).join(' · ');
}

/** True when a schema has something to expand: properties, variants, structured items or a map. */
function structured(schema: JsonSchema | undefined): boolean {
  if (!schema || !isRecord(schema)) return false;
  if (schema.properties && Object.keys(schema.properties).length) return true;
  if (schema.oneOf || schema.anyOf || schema.allOf || schema.not) return true;
  if (isRecord(schema.additionalProperties)) return true;
  if (schema.items && !Array.isArray(schema.items)) return !!schema.items.$ref || structured(schema.items);
  return Array.isArray(schema.prefixItems);
}

function Constraints({schema}: {schema: JsonSchema}): ReactNode {
  const items: ReactNode[] = [];
  const values = (list: unknown[]): ReactNode => list.map((value, index) => <Fragment key={index}>{index > 0 && ' '}<code>{formatValue(value)}</code></Fragment>);
  if (Array.isArray(schema.enum)) items.push(<>One of {values(schema.enum)}</>);
  if (schema.const !== undefined) items.push(<>Always <code>{formatValue(schema.const)}</code></>);
  if (typeof schema.pattern === 'string') items.push(<>Pattern <code>{schema.pattern}</code></>);
  const bound = (name: string, value: unknown, sign: string): void => { if (typeof value === 'number') items.push(<>{sign ? `${name} ${sign} ` : `${name} `}<code>{value}</code></>); };
  bound('Value', schema.minimum, '≥');
  bound('Value', schema.maximum, '≤');
  if (typeof schema.exclusiveMinimum === 'number') bound('Value', schema.exclusiveMinimum, '>');
  if (typeof schema.exclusiveMaximum === 'number') bound('Value', schema.exclusiveMaximum, '<');
  bound('Multiple of', schema.multipleOf, '');
  bound('Length', schema.minLength, '≥');
  bound('Length', schema.maxLength, '≤');
  bound('Items', schema.minItems, '≥');
  bound('Items', schema.maxItems, '≤');
  bound('Properties', schema.minProperties, '≥');
  bound('Properties', schema.maxProperties, '≤');
  if (schema.uniqueItems) items.push(<>Items are unique</>);
  if (schema.default !== undefined) items.push(<>Default <code>{formatValue(schema.default)}</code></>);
  const examples = Array.isArray(schema.examples) ? schema.examples : schema.example !== undefined ? [schema.example] : [];
  if (examples.length) items.push(<>{examples.length > 1 ? 'Examples ' : 'Example '}{values(examples)}</>);
  if (schema.readOnly) items.push(<>Read-only</>);
  if (schema.writeOnly) items.push(<>Write-only</>);
  if (schema.deprecated) items.push(<>Deprecated</>);
  if (!items.length) return null;
  return <ul className="b10x-schema-constraints">{items.map((item, index) => <li key={index}>{item}</li>)}</ul>;
}

const EAGER_DEPTH = 2;
const MAX_DEPTH = 12;

/** The type of one schema in a row: a link to the referenced card, or the inline label. */
export function SchemaType({schema}: {schema?: JsonSchema}): ReactNode {
  const context = useContext(RefContext);
  if (!schema || !isRecord(schema)) return <span className="b10x-schema-type">any</span>;
  if (typeof schema.$ref === 'string') return <RefLink reference={schema.$ref} context={context} />;
  const items = !Array.isArray(schema.items) ? schema.items : undefined;
  if (items?.$ref && (types(schema).includes('array') || !schema.type)) return <span className="b10x-schema-type">array of <RefLink reference={items.$ref} context={context} /></span>;
  return <span className="b10x-schema-type">{typeLabel(schema)}</span>;
}

function RefLink({reference, context}: {reference: string; context: ReferenceContext}): ReactNode {
  const anchor = context.anchor(reference);
  const name = <code><Breakable text={refName(reference)} /></code>;
  if (!reference.startsWith('#')) return <span className="b10x-schema-ref b10x-schema-ref--external" title="External reference, not fetched"><code><Breakable text={reference} /></code></span>;
  const target = context.root === undefined ? undefined : follow<JsonSchema>(context.root, {$ref: reference}).value;
  const scalar = target && isRecord(target) && !structured(target) ? typeLabel(target) : undefined;
  return <span className="b10x-schema-ref">
    {anchor ? <a href={`#${anchor}`}>{name}</a> : name}
    {scalar && scalar !== refName(reference) && <span className="b10x-schema-ref__type">{scalar}</span>}
  </span>;
}

/**
 * The body of one schema: variants, properties, items, additional properties and constraints.
 * A `$ref` shows the referenced name as a link to its card and expands in place on demand.
 */
export const SchemaView = memo(function SchemaView({schema, depth = 0, trail = [], bare = false}: {schema?: JsonSchema; depth?: number; trail?: readonly string[]; bare?: boolean}): ReactNode {
  const context = useContext(RefContext);
  if (!schema || !isRecord(schema)) return <p className="b10x-schema-note">Any JSON value.</p>;
  if (typeof schema.$ref === 'string') return <RefBlock reference={schema.$ref} siblings={schema} depth={depth} trail={trail} context={context} />;
  const parts: ReactNode[] = [];
  const compositions = [['allOf', 'All of'], ['oneOf', 'One of'], ['anyOf', 'Any of']] as const;
  for (const [key, label] of compositions) {
    const variants = schema[key];
    if (!Array.isArray(variants)) continue;
    parts.push(<div className="b10x-schema-variants" key={key}>
      <p className="b10x-schema-label">{label}{key === 'oneOf' && schema.discriminator?.propertyName ? <>, told apart by <code>{schema.discriminator.propertyName}</code></> : null}</p>
      <ol>{variants.map((variant, index) => <li key={index}><Variant schema={variant} depth={depth + 1} trail={trail} /></li>)}</ol>
    </div>);
  }
  if (isRecord(schema.not)) parts.push(<div className="b10x-schema-variants" key="not"><p className="b10x-schema-label">Not</p><Variant schema={schema.not} depth={depth + 1} trail={trail} /></div>);
  if (schema.properties && Object.keys(schema.properties).length) parts.push(<Properties key="properties" schema={schema} depth={depth} trail={trail} />);
  const items = schema.items;
  if (Array.isArray(schema.prefixItems)) parts.push(<div className="b10x-schema-variants" key="prefix"><p className="b10x-schema-label">Items in order</p><ol>{schema.prefixItems.map((item, index) => <li key={index}><Variant schema={item} depth={depth + 1} trail={trail} /></li>)}</ol></div>);
  if (items && !Array.isArray(items)) parts.push(<div className="b10x-schema-items" key="items"><p className="b10x-schema-label">Items <SchemaType schema={items} /></p>{structured(items) || items.$ref ? <Nested schema={items} depth={depth + 1} trail={trail} /> : <Constraints schema={items} />}</div>);
  if (isRecord(schema.additionalProperties)) parts.push(<div className="b10x-schema-items" key="additional"><p className="b10x-schema-label">Other properties <SchemaType schema={schema.additionalProperties} /></p><Nested schema={schema.additionalProperties} depth={depth + 1} trail={trail} /></div>);
  else if (schema.additionalProperties === false && schema.properties) parts.push(<p className="b10x-schema-note" key="closed">No other properties.</p>);
  const constraints = bare ? null : <Constraints key="constraints" schema={schema} />;
  if (!parts.length) return <div className="b10x-schema-scalar"><span className="b10x-schema-type">{typeLabel(schema)}</span>{constraints}</div>;
  return <>{constraints}{parts}</>;
});

/** A nested schema: inline at shallow depth, a lazily rendered disclosure below it. */
function Nested({schema, depth, trail}: {schema: JsonSchema; depth: number; trail: readonly string[]}): ReactNode {
  const context = useContext(RefContext);
  if (typeof schema.$ref === 'string') return <RefExpand reference={schema.$ref} depth={depth} trail={trail} context={context} />;
  if (!structured(schema)) return null;
  if (depth <= EAGER_DEPTH) return <div className="b10x-schema-nested"><SchemaView schema={schema} depth={depth} trail={trail} bare /></div>;
  if (depth >= MAX_DEPTH) return <p className="b10x-schema-note">Nested too deep to show here.</p>;
  return <LazyDetails className="b10x-schema-more" summary={<>Show fields</>} fallback={<p className="b10x-schema-note">Opens with JavaScript.</p>}>{() => <SchemaView schema={schema} depth={depth} trail={trail} bare />}</LazyDetails>;
}

function Variant({schema, depth, trail}: {schema: JsonSchema; depth: number; trail: readonly string[]}): ReactNode {
  if (!isRecord(schema)) return <SchemaType />;
  if (typeof schema.$ref === 'string') return <><SchemaType schema={schema} /><Nested schema={schema} depth={depth} trail={trail} /></>;
  return <>
    <span className="b10x-schema-type">{schema.title ?? typeLabel(schema)}</span>
    <Prose text={schema.description} className="b10x-schema-description" />
    {structured(schema) ? <Nested schema={schema} depth={depth} trail={trail} /> : <Constraints schema={schema} />}
  </>;
}

function Properties({schema, depth, trail}: {schema: JsonSchema; depth: number; trail: readonly string[]}): ReactNode {
  const required = new Set(Array.isArray(schema.required) ? schema.required : []);
  return <dl className="b10x-schema-properties">
    {Object.entries(isRecord(schema.properties) ? schema.properties : {}).map(([name, property]) => {
      const value: JsonSchema = isRecord(property) ? property : {};
      return <div key={name}>
        <dt><code className="b10x-schema-name"><Breakable text={name} /></code><SchemaType schema={value} />{required.has(name) && <b className="b10x-schema-required">required</b>}</dt>
        <dd>
          <Prose text={value.description} className="b10x-schema-description" />
          <Constraints schema={value} />
          {(typeof value.$ref === 'string' || structured(value)) && <Nested schema={value} depth={depth + 1} trail={trail} />}
        </dd>
      </div>;
    })}
  </dl>;
}

/** The in-place expansion of a reference to a structured schema, guarded against cycles. */
function RefExpand({reference, depth, trail, context}: {reference: string; depth: number; trail: readonly string[]; context: ReferenceContext}): ReactNode {
  if (!reference.startsWith('#') || context.root === undefined) return null;
  const {value: target} = follow<JsonSchema>(context.root, {$ref: reference});
  if (!target || !structured(target)) return null;
  const anchor = context.anchor(reference);
  const name = refName(reference);
  if (trail.includes(reference)) return <p className="b10x-schema-note">Recursive: <code><Breakable text={name} /></code> again{anchor ? <>, see <a href={`#${anchor}`}>its card</a></> : null}.</p>;
  if (depth >= MAX_DEPTH) return null;
  return <LazyDetails className="b10x-schema-more" summary={<>Show fields<span className="b10x-sr-only"> of {name}</span></>}
    fallback={anchor ? <p className="b10x-schema-note">See <a href={`#${anchor}`}><code><Breakable text={name} /></code></a>.</p> : null}>
    {() => <>{target.description && <Prose text={target.description} className="b10x-schema-description" />}<SchemaView schema={target} depth={depth} trail={[...trail, reference]} /></>}
  </LazyDetails>;
}

/** A schema at the top of a body or a payload: a reference renders its target one level deep. */
function RefBlock({reference, siblings, depth, trail, context}: {reference: string; siblings: JsonSchema; depth: number; trail: readonly string[]; context: ReferenceContext}): ReactNode {
  const {value: target} = reference.startsWith('#') && context.root !== undefined ? follow<JsonSchema>(context.root, {$ref: reference}) : {value: undefined};
  const head = <p className="b10x-schema-label"><SchemaType schema={{$ref: reference}} /></p>;
  if (!target || trail.includes(reference) || depth > 0) return <div className="b10x-schema-refblock">{head}<Prose text={siblings.description} className="b10x-schema-description" /><Nested schema={{$ref: reference}} depth={depth + 1} trail={trail} /></div>;
  return <div className="b10x-schema-refblock">
    {head}
    <Prose text={siblings.description ?? target.description} className="b10x-schema-description" />
    <SchemaView schema={target} depth={depth + 1} trail={[...trail, reference]} />
  </div>;
}

/** One collapsible card per named schema. */
export function SchemaCards({schemas, anchor}: {schemas: Array<[string, JsonSchema]>; anchor: (name: string) => string}): ReactNode {
  return <div className="b10x-schema-grid">
    {schemas.map(([name, schema]) => <details className="b10x-schema-card" id={anchor(name)} key={name}>
      <summary><code><Breakable text={name} /></code><span className="b10x-schema-card__type">{typeLabel(schema)}</span></summary>
      <div>
        {schema.title && schema.title !== name && <p className="b10x-schema-title">{schema.title}</p>}
        <Prose text={schema.description} className="b10x-schema-description" />
        <SchemaView schema={schema} depth={1} trail={[`#/components/schemas/${name.replace(/~/g, '~0').replace(/\//g, '~1')}`]} />
      </div>
    </details>)}
  </div>;
}

/** Examples as closed disclosures holding formatted JSON or text. */
export function Examples({examples, example, label = 'Example'}: {examples?: unknown; example?: unknown; label?: string}): ReactNode {
  const context = useContext(RefContext);
  const list: Array<{name: string; summary?: string; description?: string; value: unknown}> = [];
  if (example !== undefined) list.push({name: label, value: example});
  if (Array.isArray(examples)) examples.forEach((value, index) => {
    const resolved = follow<Record<string, unknown>>(context.root, value).value;
    if (isRecord(resolved) && ('payload' in resolved || 'headers' in resolved)) list.push({name: String(resolved.name ?? `${label} ${index + 1}`), summary: resolved.summary as string | undefined, value: resolved.payload ?? resolved.headers});
    else list.push({name: `${label} ${index + 1}`, value});
  });
  else for (const [name, value] of entries<unknown>(examples)) {
    const resolved = follow<Record<string, unknown>>(context.root, value).value;
    if (!isRecord(resolved)) continue;
    if (resolved.value === undefined && typeof resolved.externalValue === 'string') list.push({name, summary: resolved.summary as string | undefined, value: `External example, not fetched: ${resolved.externalValue}`});
    else list.push({name, summary: resolved.summary as string | undefined, description: resolved.description as string | undefined, value: resolved.value});
  }
  if (!list.length) return null;
  return <div className="b10x-api-examples">
    {list.map((item, index) => <details className="b10x-api-example" key={index}>
      <summary>{`${label}: `}<span>{item.summary ?? item.name}</span></summary>
      <Prose text={item.description} />
      <pre className="b10x-api-example__code"><code>{formatExample(item.value)}</code></pre>
    </details>)}
  </div>;
}
