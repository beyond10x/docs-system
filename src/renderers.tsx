import type {ReactNode} from 'react';

export interface JsonSchema {
  $ref?: string;
  type?: string | string[];
  format?: string;
  description?: string;
  enum?: unknown[];
  const?: unknown;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
}

interface OpenApiMedia {schema?: JsonSchema; examples?: Record<string, {summary?: string; value?: unknown}>}
interface OpenApiOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: Array<{name: string; in: string; required?: boolean; description?: string; schema?: JsonSchema}>;
  requestBody?: {content?: Record<string, OpenApiMedia>};
  responses?: Record<string, {description?: string; content?: Record<string, OpenApiMedia>}>;
}
export interface OpenApiDocument {
  openapi: string;
  info: {title: string; version: string; description?: string};
  paths: Record<string, Partial<Record<'get' | 'post' | 'put' | 'patch' | 'delete', OpenApiOperation>>>;
  components?: {schemas?: Record<string, JsonSchema>};
}

export interface OpenApiReferenceProps {
  document: OpenApiDocument;
  sourceUrl?: string;
  /** Heading for the reference title. Use 3 when embedding beneath a documentation-page h2. */
  headingLevel?: 2 | 3;
}

export function JsonSchemaViewer({schema, depth = 0}: {schema: JsonSchema; depth?: number}): ReactNode {
  const composition = schema.oneOf ?? schema.anyOf ?? schema.allOf;
  if (schema.$ref) return <a href={`#schema-${schema.$ref.split('/').at(-1)}`}><code>{schema.$ref.split('/').at(-1)}</code></a>;
  if (composition) return <span className="b10x-schema-composition">{composition.map((part, index) => <JsonSchemaViewer key={index} schema={part} depth={depth + 1} />)}</span>;
  if (schema.enum) return <code>{schema.enum.map(String).join(' | ')}</code>;
  if (schema.const !== undefined) return <code>{JSON.stringify(schema.const)}</code>;
  if (!schema.properties || depth >= 3) return <code>{schemaType(schema)}</code>;
  return <dl className="b10x-schema-properties">{Object.entries(schema.properties).map(([name, property]) => <div key={name}><dt><code>{name}</code>{schema.required?.includes(name) && <b>required</b>}<span>{schemaType(property)}</span></dt>{property.description && <dd>{property.description}</dd>}<dd><JsonSchemaViewer schema={property} depth={depth + 1} /></dd></div>)}</dl>;
}

export function OpenApiReference({document, sourceUrl, headingLevel = 2}: OpenApiReferenceProps): ReactNode {
  if (!document.openapi.startsWith('3.1.')) throw new Error(`OpenApiReference supports OpenAPI 3.1, received ${document.openapi}`);
  const operations = Object.entries(document.paths).flatMap(([path, methods]) => Object.entries(methods).map(([method, operation]) => ({path, method, operation: operation as OpenApiOperation})));
  const TitleHeading = headingLevel === 2 ? 'h2' : 'h3';
  const DetailHeading = headingLevel === 2 ? 'h3' : 'h4';
  const titleId = `openapi-${slug(document.info.title)}-title`;
  const schemaTitleId = `openapi-${slug(document.info.title)}-schemas`;
  return <section className="b10x-openapi" aria-labelledby={titleId}>
    <header>
      <p className="b10x-eyebrow">OPENAPI {document.openapi}</p>
      <TitleHeading id={titleId}>{document.info.title}</TitleHeading>
      {document.info.description && <p>{document.info.description}</p>}
      <dl className="b10x-facts"><div><dt>Version</dt><dd>{document.info.version}</dd></div><div><dt>Operations</dt><dd>{operations.length}</dd></div></dl>
      {sourceUrl && <a className="b10x-touch-link" href={sourceUrl} download>Download OpenAPI source</a>}
    </header>
    <nav aria-label={`${document.info.title} operations`}>{operations.map(({path, method, operation}) => <a key={`${method}-${path}`} href={`#operation-${operation.operationId ?? slug(`${method}-${path}`)}`}><code>{method.toUpperCase()}</code> {operation.summary ?? path}</a>)}</nav>
    <div className="b10x-api-operations">{operations.map(({path, method, operation}) => <Operation Heading={DetailHeading} key={`${method}-${path}`} path={path} method={method} operation={operation} />)}</div>
    {document.components?.schemas && <section aria-labelledby={schemaTitleId}><DetailHeading id={schemaTitleId}>Schemas</DetailHeading><div className="b10x-schema-grid">{Object.entries(document.components.schemas).map(([name, schema]) => <details id={`schema-${name}`} key={name}><summary><code>{name}</code><span>{schemaType(schema)}</span></summary><div>{schema.description && <p>{schema.description}</p>}<JsonSchemaViewer schema={schema} /></div></details>)}</div></section>}
  </section>;
}

function Operation({path, method, operation, Heading}: {path: string; method: string; operation: OpenApiOperation; Heading: 'h3' | 'h4'}): ReactNode {
  const id = `operation-${operation.operationId ?? slug(`${method}-${path}`)}`;
  return <article className="b10x-api-operation" id={id}><p className="b10x-api-route"><strong>{method.toUpperCase()}</strong> <code>{path}</code></p><Heading>{operation.summary ?? operation.operationId ?? path}</Heading>{operation.description && <p>{operation.description}</p>}{operation.parameters?.length ? <dl>{operation.parameters.map((parameter) => <div key={`${parameter.in}-${parameter.name}`}><dt><code>{parameter.name}</code>{parameter.required && <b>required</b>}</dt><dd>{parameter.in} · {schemaType(parameter.schema)}{parameter.description && ` · ${parameter.description}`}</dd></div>)}</dl> : null}<ResponseTable responses={operation.responses ?? {}} /></article>;
}

function ResponseTable({responses}: {responses: NonNullable<OpenApiOperation['responses']>}): ReactNode {
  return <div className="b10x-table-wrap"><table><thead><tr><th scope="col">Status</th><th scope="col">Description</th><th scope="col">Schema</th></tr></thead><tbody>{Object.entries(responses).map(([status, response]) => { const media = Object.values(response.content ?? {})[0]; return <tr key={status}><td><code>{status}</code></td><td>{response.description}</td><td>{media?.schema ? <JsonSchemaViewer schema={media.schema} /> : '—'}</td></tr>; })}</tbody></table></div>;
}

function schemaType(schema?: JsonSchema): string {
  if (!schema) return 'document';
  if (schema.$ref) return schema.$ref.split('/').at(-1) ?? 'reference';
  const type = Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type;
  return [type ?? (schema.properties ? 'object' : 'value'), schema.format].filter(Boolean).join(' · ');
}

function slug(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
