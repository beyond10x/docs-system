import {memo, useDeferredValue, useId, useMemo, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import {Breakable, DownloadLink, entries, Examples, follow, heading, isRecord, MethodChip, pointerTokens, Prose, RefContext, schemaAnchor, SchemaCards, SchemaType, SchemaView, slug, StatusChip, statusClass, useHydrated, useOpenOnHash} from './api-common.js';
import type {HeadingTag, JsonSchema, ReferenceContext} from './api-common.js';
import {AsyncApiReference} from './asyncapi.js';
import type {AsyncApiDocument} from './asyncapi.js';
import {CliReference} from './cli-reference-view.js';
import type {CliReferenceDocument} from './cli-reference.js';
import {ScrollableTable} from './scrollable-table.js';

export type {JsonSchema} from './api-common.js';
export {AsyncApiReference} from './asyncapi.js';
export type {AsyncApiDocument, AsyncApiReferenceProps} from './asyncapi.js';
export {CliReference, cliSynopsis} from './cli-reference-view.js';
export type {CliReferenceProps} from './cli-reference-view.js';

interface OpenApiMedia {schema?: JsonSchema; example?: unknown; examples?: Record<string, {summary?: string; description?: string; value?: unknown; externalValue?: string}>}
interface OpenApiParameter {name: string; in: string; required?: boolean; deprecated?: boolean; description?: string; schema?: JsonSchema; example?: unknown; examples?: OpenApiMedia['examples']; content?: Record<string, OpenApiMedia>}
interface OpenApiHeader {description?: string; required?: boolean; deprecated?: boolean; schema?: JsonSchema; content?: Record<string, OpenApiMedia>}
interface OpenApiResponse {description?: string; headers?: Record<string, OpenApiHeader | {$ref: string}>; content?: Record<string, OpenApiMedia>}
type Reference<T> = T | {$ref: string};
interface OpenApiOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
  security?: Array<Record<string, string[]>>;
  parameters?: Array<Reference<OpenApiParameter>>;
  requestBody?: Reference<{description?: string; required?: boolean; content?: Record<string, OpenApiMedia>}>;
  responses?: Record<string, Reference<OpenApiResponse>>;
}
type OpenApiPathItem = Partial<Record<'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace', OpenApiOperation>> & {summary?: string; description?: string; parameters?: Array<Reference<OpenApiParameter>>; $ref?: string};
export interface OpenApiDocument {
  openapi: string;
  info: {title: string; version: string; summary?: string; description?: string};
  servers?: Array<{url: string; description?: string; variables?: Record<string, {default?: string; enum?: string[]; description?: string}>}>;
  tags?: Array<{name: string; description?: string}>;
  security?: Array<Record<string, string[]>>;
  paths?: Record<string, OpenApiPathItem>;
  components?: {schemas?: Record<string, JsonSchema>; securitySchemes?: Record<string, Record<string, unknown>>; [key: string]: unknown};
}

export interface OpenApiReferenceProps {
  document: OpenApiDocument;
  /** Where the unchanged source document can be downloaded; shown as a download link. */
  sourceUrl?: string;
  /** The file name the download carries, shown beside the link. */
  sourceName?: string;
  /** Heading for the reference title. Use 3 when embedding beneath a documentation-page h2. */
  headingLevel?: 2 | 3;
  /** Heading text instead of the document's `info.title`. */
  title?: string;
}

const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;
const UNTAGGED = 'Other';

interface Operation {key: string; id: string; method: string; path: string; tag: string; operation: OpenApiOperation; parameters: OpenApiParameter[]; text: string}
interface OperationGroup {tag: string; description?: string; operations: Operation[]}

/** The schema viewer over one document; a `$ref` into it links to its schema card. */
export function JsonSchemaViewer({schema, depth = 0, document}: {schema: JsonSchema; depth?: number; document?: unknown}): ReactNode {
  const context = useMemo<ReferenceContext>(() => ({root: document, anchor: schemaAnchor}), [document]);
  return <RefContext.Provider value={context}><SchemaView schema={schema} depth={depth} /></RefContext.Provider>;
}

function openApiModel(document: OpenApiDocument): {groups: OperationGroup[]; operations: Operation[]; tagged: boolean} {
  const operations: Operation[] = [];
  for (const [path, rawItem] of entries<OpenApiPathItem>(document.paths)) {
    const item = follow<OpenApiPathItem>(document, rawItem).value;
    if (!isRecord(item)) continue;
    for (const method of METHODS) {
      const operation = item[method];
      if (!isRecord(operation)) continue;
      const merged = new Map<string, OpenApiParameter>();
      for (const raw of [...(Array.isArray(item.parameters) ? item.parameters : []), ...(Array.isArray(operation.parameters) ? operation.parameters : [])]) {
        const parameter = follow<OpenApiParameter>(document, raw).value;
        if (isRecord(parameter) && typeof parameter.name === 'string') merged.set(`${parameter.in}:${parameter.name}`, parameter);
      }
      const tag = Array.isArray(operation.tags) && typeof operation.tags[0] === 'string' ? operation.tags[0] : UNTAGGED;
      const id = `operation-${operation.operationId ?? slug(`${method}-${path}`)}`;
      const summary = operation.summary ?? item.summary;
      operations.push({key: `${method} ${path}`, id, method, path, tag, operation: {...operation, summary, description: operation.description ?? item.description}, parameters: Array.from(merged.values()), text: [method, path, summary, operation.operationId, tag].filter(Boolean).join(' ').toLowerCase()});
    }
  }
  const declared = (Array.isArray(document.tags) ? document.tags : []).filter((tag) => isRecord(tag) && typeof tag.name === 'string');
  const order = [...declared.map((tag) => tag.name), ...operations.map((operation) => operation.tag)].filter((tag, index, all) => tag !== UNTAGGED && all.indexOf(tag) === index);
  const groups = [...order, UNTAGGED].map((tag) => ({tag, description: declared.find((entry) => entry.name === tag)?.description, operations: operations.filter((operation) => operation.tag === tag)})).filter((group) => group.operations.length);
  return {groups, operations, tagged: operations.some((operation) => operation.tag !== UNTAGGED)};
}

function openApiAnchor(ref: string): string | undefined {
  const tokens = pointerTokens(ref);
  return tokens?.length === 3 && tokens[0] === 'components' && tokens[1] === 'schemas' ? `schema-${tokens[2]}` : undefined;
}

const matches = (text: string, query: string): boolean => query.trim().toLowerCase().split(/\s+/).every((term) => text.includes(term));

export function OpenApiReference({document, sourceUrl, sourceName, headingLevel = 2, title}: OpenApiReferenceProps): ReactNode {
  if (!isRecord(document) || typeof document.openapi !== 'string' || !document.openapi.startsWith('3.1.')) throw new Error(`OpenApiReference supports OpenAPI 3.1, received ${isRecord(document) ? String(document.openapi) : typeof document}`);
  const model = useMemo(() => openApiModel(document), [document]);
  const context = useMemo<ReferenceContext>(() => ({root: document, anchor: openApiAnchor}), [document]);
  const hydrated = useHydrated();
  const root = useRef<HTMLElement>(null);
  useOpenOnHash(root);
  const [query, setQuery] = useState('');
  const filter = useDeferredValue(query);
  const visible = useMemo(() => new Set(model.operations.filter((operation) => matches(operation.text, filter)).map((operation) => operation.key)), [model, filter]);
  const filterId = useId();
  const info = isRecord(document.info) ? document.info : {title: 'API', version: ''};
  const base = `openapi-${slug(info.title)}`;
  const TitleHeading = heading(headingLevel);
  const SectionHeading = heading(headingLevel + 1);
  const operationLevel = model.tagged ? headingLevel + 2 : headingLevel + 1;
  const schemas = entries<JsonSchema>(document.components?.schemas);
  const securitySchemes = entries<Record<string, unknown>>(document.components?.securitySchemes);
  const servers = Array.isArray(document.servers) ? document.servers.filter((server) => isRecord(server) && typeof server.url === 'string') : [];
  return <RefContext.Provider value={context}>
    <section className="b10x-openapi b10x-api" aria-labelledby={`${base}-title`} ref={root}>
      <header className="b10x-api-header">
        <p className="b10x-eyebrow">OPENAPI {document.openapi}</p>
        <TitleHeading id={`${base}-title`}>{title ?? info.title}</TitleHeading>
        {info.summary && <Prose text={info.summary} className="b10x-api-lede" />}
        <Prose text={info.description} />
        <dl className="b10x-facts">
          <div><dt>Version</dt><dd>{info.version}</dd></div>
          <div><dt>Operations</dt><dd>{model.operations.length}</dd></div>
          {schemas.length > 0 && <div><dt>Schemas</dt><dd>{schemas.length}</dd></div>}
          {servers.length > 0 && <div><dt>Servers</dt><dd>{servers.length}</dd></div>}
        </dl>
        <DownloadLink url={sourceUrl} name={sourceName} label="Download OpenAPI source" />
      </header>
      {(servers.length > 0 || securitySchemes.length > 0) && <Access servers={servers} schemes={securitySchemes} security={document.security} Heading={SectionHeading} base={base} />}
      <nav className="b10x-api-index" aria-label={`${info.title} operations`}>
        <div className="b10x-api-filter" hidden={!hydrated}>
          <label htmlFor={filterId}>Filter operations</label>
          <input id={filterId} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Method, path or name" autoComplete="off" />
          <p aria-live="polite">{visible.size === model.operations.length ? `${model.operations.length} operations` : `${visible.size} of ${model.operations.length} operations`}</p>
        </div>
        {model.groups.map((group) => {
          const shown = group.operations.filter((operation) => visible.has(operation.key));
          return <div className="b10x-api-index__group" key={group.tag} hidden={!shown.length}>
            {model.tagged && <p className="b10x-api-index__tag">{group.tag}</p>}
            <ul>{group.operations.map((operation) => <li key={operation.key} hidden={!visible.has(operation.key)}>
              <a href={`#${operation.id}`}><MethodChip method={operation.method} /><code className="b10x-api-path"><Breakable text={operation.path} /></code><span>{operation.operation.summary ?? operation.operation.operationId}</span></a>
            </li>)}</ul>
          </div>;
        })}
        {visible.size === 0 && <p className="b10x-api-empty">No operation matches “{filter}”.</p>}
      </nav>
      {model.groups.map((group) => {
        const groupId = `${base}-tag-${slug(group.tag)}`;
        const cards = group.operations.map((operation) => <OperationCard key={operation.key} operation={operation} level={operationLevel} hidden={!visible.has(operation.key)} />);
        if (!model.tagged) return <div className="b10x-api-operations" key={group.tag}>{cards}</div>;
        return <section className="b10x-api-group" key={group.tag} aria-labelledby={groupId} hidden={!group.operations.some((operation) => visible.has(operation.key))}>
          <SectionHeading id={groupId}>{group.tag}</SectionHeading>
          <Prose text={group.description} />
          <div className="b10x-api-operations">{cards}</div>
        </section>;
      })}
      {schemas.length > 0 && <section className="b10x-api-schemas" aria-labelledby={`${base}-schemas`}>
        <SectionHeading id={`${base}-schemas`}>Schemas</SectionHeading>
        <details className="b10x-api-all-schemas">
          <summary>{`Show all ${schemas.length} schemas`}</summary>
          <SchemaCards schemas={schemas} anchor={(name) => `schema-${name}`} />
        </details>
      </section>}
    </section>
  </RefContext.Provider>;
}

function Access({servers, schemes, security, Heading, base}: {servers: NonNullable<OpenApiDocument['servers']>; schemes: Array<[string, Record<string, unknown>]>; security?: OpenApiDocument['security']; Heading: HeadingTag; base: string}): ReactNode {
  return <>
    {servers.length > 0 && <section className="b10x-api-servers" aria-labelledby={`${base}-servers`}>
      <Heading id={`${base}-servers`}>Servers</Heading>
      <ul className="b10x-api-list">{servers.map((server, index) => <li key={index}>
        <code><Breakable text={server.url} /></code>
        <Prose text={server.description} />
        {entries<{default?: string; enum?: string[]; description?: string}>(server.variables).map(([name, variable]) => <p className="b10x-schema-note" key={name}><code>{`{${name}}`}</code> {variable.default !== undefined && <>default <code>{variable.default}</code></>} {variable.description}</p>)}
      </li>)}</ul>
    </section>}
    {schemes.length > 0 && <section className="b10x-api-security" aria-labelledby={`${base}-security`}>
      <Heading id={`${base}-security`}>Security schemes</Heading>
      <p className="b10x-schema-note">Listed for reading. This page sends no request and takes no credential.</p>
      <ScrollableTable label="Security schemes"><thead><tr><th scope="col">Scheme</th><th scope="col">Type</th><th scope="col">Details</th><th scope="col">Description</th></tr></thead>
        <tbody>{schemes.map(([name, scheme]) => <tr key={name}><td><code>{name}</code></td><td>{String(scheme.type ?? '')}</td><td>{schemeDetails(scheme)}</td><td><Prose text={scheme.description} /></td></tr>)}</tbody>
      </ScrollableTable>
      {Array.isArray(security) && security.length > 0 && <p className="b10x-api-requirement">Required by default: <SecurityList security={security} /></p>}
    </section>}
  </>;
}

function schemeDetails(scheme: Record<string, unknown>): ReactNode {
  const parts: ReactNode[] = [];
  if (scheme.type === 'apiKey') parts.push(<>{String(scheme.in)} <code>{String(scheme.name)}</code></>);
  if (scheme.type === 'http') parts.push(<><code>{String(scheme.scheme)}</code>{scheme.bearerFormat ? <> ({String(scheme.bearerFormat)})</> : null}</>);
  if (scheme.type === 'oauth2' && isRecord(scheme.flows)) parts.push(<>flows: {Object.keys(scheme.flows).join(', ')}</>);
  if (scheme.type === 'openIdConnect' && typeof scheme.openIdConnectUrl === 'string') parts.push(<code><Breakable text={scheme.openIdConnectUrl} /></code>);
  return parts.length ? parts.map((part, index) => <span key={index}>{part}</span>) : '—';
}

function SecurityList({security}: {security: NonNullable<OpenApiOperation['security']>}): ReactNode {
  return <>{security.map((requirement, index) => {
    const names = Object.entries(isRecord(requirement) ? requirement : {});
    return <span key={index} className="b10x-api-requirement__item">{index > 0 && ' or '}{names.length ? names.map(([name, scopes], item) => <span key={name}>{item > 0 && ' and '}<code>{name}</code>{Array.isArray(scopes) && scopes.length ? ` (${scopes.join(', ')})` : null}</span>) : 'none'}</span>;
  })}</>;
}

const OperationCard = memo(function OperationCard({operation, level, hidden}: {operation: Operation; level: number; hidden: boolean}): ReactNode {
  const {method, path, operation: details, parameters} = operation;
  const Heading = heading(level);
  const Part = heading(level + 1);
  const responses = entries<Reference<OpenApiResponse>>(details.responses);
  return <details className="b10x-api-operation" id={operation.id} hidden={hidden}>
    <summary>
      <MethodChip method={method} />
      <code className="b10x-api-path"><Breakable text={path} /></code>
      <Heading>{details.summary ?? details.operationId ?? path}</Heading>
      {details.deprecated && <span className="b10x-api-chip b10x-api-deprecated">deprecated</span>}
    </summary>
    <div className="b10x-api-operation__body">
      {details.operationId && <p className="b10x-api-operation-id">Operation <code><Breakable text={details.operationId} /></code></p>}
      <Prose text={details.description} />
      {Array.isArray(details.security) && <p className="b10x-api-requirement">Security: {details.security.length ? <SecurityList security={details.security} /> : 'none'}</p>}
      {parameters.length > 0 && <div className="b10x-api-part">
        <Part>Parameters</Part>
        <ScrollableTable label={`Parameters of ${method.toUpperCase()} ${path}`} className="b10x-api-parameters">
          <thead><tr><th scope="col">Name</th><th scope="col">In</th><th scope="col">Type</th><th scope="col">Required</th><th scope="col">Description</th></tr></thead>
          <tbody>{parameters.map((parameter) => <tr key={`${parameter.in}:${parameter.name}`}>
            <td><code><Breakable text={parameter.name} /></code>{parameter.deprecated && <> <span className="b10x-api-chip b10x-api-deprecated">deprecated</span></>}</td>
            <td>{parameter.in}</td>
            <td><SchemaType schema={parameter.schema ?? Object.values(parameter.content ?? {})[0]?.schema} /></td>
            <td>{parameter.required || parameter.in === 'path' ? <b className="b10x-schema-required">required</b> : 'optional'}</td>
            <td><Prose text={parameter.description} /><ParameterConstraints schema={parameter.schema} /></td>
          </tr>)}</tbody>
        </ScrollableTable>
      </div>}
      {details.requestBody && <RequestBody body={details.requestBody} Part={Part} />}
      {responses.length > 0 && <div className="b10x-api-part">
        <Part>Responses</Part>
        <div className="b10x-api-responses">{responses.map(([status, response]) => <Response key={status} status={status} response={response} />)}</div>
      </div>}
    </div>
  </details>;
});

function ParameterConstraints({schema}: {schema?: JsonSchema}): ReactNode {
  if (!isRecord(schema) || schema.$ref) return null;
  const parts: ReactNode[] = [];
  if (Array.isArray(schema.enum)) parts.push(<>One of {schema.enum.map((value, index) => <code key={index}>{String(value)}</code>)}</>);
  if (schema.default !== undefined) parts.push(<>Default <code>{String(schema.default)}</code></>);
  if (typeof schema.pattern === 'string') parts.push(<>Pattern <code>{schema.pattern}</code></>);
  if (!parts.length) return null;
  return <ul className="b10x-schema-constraints">{parts.map((part, index) => <li key={index}>{part}</li>)}</ul>;
}

function RequestBody({body, Part}: {body: NonNullable<OpenApiOperation['requestBody']>; Part: HeadingTag}): ReactNode {
  return <RefContext.Consumer>{(context) => {
    const resolved = follow<{description?: string; required?: boolean; content?: Record<string, OpenApiMedia>}>(context.root, body).value;
    if (!isRecord(resolved)) return null;
    return <div className="b10x-api-part b10x-api-request">
      <Part>Request body {resolved.required ? <b className="b10x-schema-required">required</b> : <span className="b10x-schema-optional">optional</span>}</Part>
      <Prose text={resolved.description} />
      <MediaList content={resolved.content} />
    </div>;
  }}</RefContext.Consumer>;
}

function MediaList({content}: {content?: Record<string, OpenApiMedia>}): ReactNode {
  const media = entries<OpenApiMedia>(content);
  if (!media.length) return null;
  return <>{media.map(([type, value]) => <div className="b10x-api-media" key={type}>
    <p className="b10x-api-media__type"><code>{type}</code></p>
    {isRecord(value) && value.schema ? <SchemaView schema={value.schema} /> : <p className="b10x-schema-note">No schema.</p>}
    {isRecord(value) && <Examples examples={value.examples} example={value.example} />}
  </div>)}</>;
}

function Response({status, response}: {status: string; response: Reference<OpenApiResponse>}): ReactNode {
  return <RefContext.Consumer>{(context) => {
    const resolved = follow<OpenApiResponse>(context.root, response).value;
    if (!isRecord(resolved)) return null;
    const headers = entries<Reference<OpenApiHeader>>(resolved.headers).map(([name, header]) => [name, follow<OpenApiHeader>(context.root, header).value] as const).filter(([, header]) => isRecord(header)) as Array<[string, OpenApiHeader]>;
    return <div className={`b10x-api-response b10x-api-response--${statusClass(status)}`}>
      <div className="b10x-api-response__head"><StatusChip status={status} /><Prose text={resolved.description} /></div>
      {headers.length > 0 && <ScrollableTable label={`Headers of the ${status} response`} className="b10x-api-headers">
        <thead><tr><th scope="col">Header</th><th scope="col">Type</th><th scope="col">Description</th></tr></thead>
        <tbody>{headers.map(([name, header]) => <tr key={name}><td><code>{name}</code>{header.required && <> <b className="b10x-schema-required">required</b></>}</td><td><SchemaType schema={header.schema ?? Object.values(header.content ?? {})[0]?.schema} /></td><td><Prose text={header.description} /></td></tr>)}</tbody>
      </ScrollableTable>}
      <MediaList content={resolved.content} />
    </div>;
  }}</RefContext.Consumer>;
}

/** One reference as the product-site plugin writes it: `@b10x-reference/<id>.json`. */
export interface ApiReferenceData {
  id: string;
  kind: 'openapi' | 'asyncapi' | 'cli';
  title?: string;
  document: unknown;
  sourceUrl?: string;
  sourceName?: string;
}

export const API_REFERENCE_KINDS = ['openapi', 'asyncapi', 'cli'] as const;

export interface ApiReferenceProps {
  /** The data module of one reference: `import reference from '@b10x-reference/<id>.json'`. */
  reference: ApiReferenceData;
  /** Heading for the reference title. */
  headingLevel?: 2 | 3;
}

/** Render a reference the product-site plugin loaded, by its kind. */
export function ApiReference({reference, headingLevel = 2}: ApiReferenceProps): ReactNode {
  if (!isRecord(reference) || typeof reference.kind !== 'string') throw new Error('ApiReference needs a reference written by the product-site plugin: {id, kind, document}');
  const common = {sourceUrl: reference.sourceUrl, sourceName: reference.sourceName, headingLevel, ...(reference.title ? {title: reference.title} : {})};
  if (reference.kind === 'openapi') return <OpenApiReference document={reference.document as OpenApiDocument} {...common} />;
  if (reference.kind === 'asyncapi') return <AsyncApiReference document={reference.document as AsyncApiDocument} {...common} />;
  if (reference.kind === 'cli') return <CliReference document={reference.document as CliReferenceDocument} {...common} />;
  throw new Error(`ApiReference ${JSON.stringify(reference.id)}: kind must be one of ${API_REFERENCE_KINDS.join(', ')}, received ${JSON.stringify(reference.kind)}`);
}
