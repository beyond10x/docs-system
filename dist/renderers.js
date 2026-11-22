import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useDeferredValue, useId, useMemo, useRef, useState } from 'react';
import { Breakable, DownloadLink, entries, Examples, follow, heading, isRecord, MethodChip, pointerTokens, Prose, RefContext, schemaAnchor, SchemaCards, SchemaType, SchemaView, slug, StatusChip, statusClass, useHydrated, useOpenOnHash } from './api-common.js';
import { AsyncApiReference } from './asyncapi.js';
import { CliReference } from './cli-reference-view.js';
import { ScrollableTable } from './scrollable-table.js';
export { AsyncApiReference } from './asyncapi.js';
export { CliReference, cliSynopsis } from './cli-reference-view.js';
const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
const UNTAGGED = 'Other';
/** The schema viewer over one document; a `$ref` into it links to its schema card. */
export function JsonSchemaViewer({ schema, depth = 0, document }) {
    const context = useMemo(() => ({ root: document, anchor: schemaAnchor }), [document]);
    return _jsx(RefContext.Provider, { value: context, children: _jsx(SchemaView, { schema: schema, depth: depth }) });
}
function openApiModel(document) {
    const operations = [];
    for (const [path, rawItem] of entries(document.paths)) {
        const item = follow(document, rawItem).value;
        if (!isRecord(item))
            continue;
        for (const method of METHODS) {
            const operation = item[method];
            if (!isRecord(operation))
                continue;
            const merged = new Map();
            for (const raw of [...(Array.isArray(item.parameters) ? item.parameters : []), ...(Array.isArray(operation.parameters) ? operation.parameters : [])]) {
                const parameter = follow(document, raw).value;
                if (isRecord(parameter) && typeof parameter.name === 'string')
                    merged.set(`${parameter.in}:${parameter.name}`, parameter);
            }
            const tag = Array.isArray(operation.tags) && typeof operation.tags[0] === 'string' ? operation.tags[0] : UNTAGGED;
            const id = `operation-${operation.operationId ?? slug(`${method}-${path}`)}`;
            const summary = operation.summary ?? item.summary;
            operations.push({ key: `${method} ${path}`, id, method, path, tag, operation: { ...operation, summary, description: operation.description ?? item.description }, parameters: Array.from(merged.values()), text: [method, path, summary, operation.operationId, tag].filter(Boolean).join(' ').toLowerCase() });
        }
    }
    const declared = (Array.isArray(document.tags) ? document.tags : []).filter((tag) => isRecord(tag) && typeof tag.name === 'string');
    const order = [...declared.map((tag) => tag.name), ...operations.map((operation) => operation.tag)].filter((tag, index, all) => tag !== UNTAGGED && all.indexOf(tag) === index);
    const groups = [...order, UNTAGGED].map((tag) => ({ tag, description: declared.find((entry) => entry.name === tag)?.description, operations: operations.filter((operation) => operation.tag === tag) })).filter((group) => group.operations.length);
    return { groups, operations, tagged: operations.some((operation) => operation.tag !== UNTAGGED) };
}
function openApiAnchor(ref) {
    const tokens = pointerTokens(ref);
    return tokens?.length === 3 && tokens[0] === 'components' && tokens[1] === 'schemas' ? `schema-${tokens[2]}` : undefined;
}
const matches = (text, query) => query.trim().toLowerCase().split(/\s+/).every((term) => text.includes(term));
export function OpenApiReference({ document, sourceUrl, sourceName, headingLevel = 2, title }) {
    if (!isRecord(document) || typeof document.openapi !== 'string' || !document.openapi.startsWith('3.1.'))
        throw new Error(`OpenApiReference supports OpenAPI 3.1, received ${isRecord(document) ? String(document.openapi) : typeof document}`);
    const model = useMemo(() => openApiModel(document), [document]);
    const context = useMemo(() => ({ root: document, anchor: openApiAnchor }), [document]);
    const hydrated = useHydrated();
    const root = useRef(null);
    useOpenOnHash(root);
    const [query, setQuery] = useState('');
    const filter = useDeferredValue(query);
    const visible = useMemo(() => new Set(model.operations.filter((operation) => matches(operation.text, filter)).map((operation) => operation.key)), [model, filter]);
    const filterId = useId();
    const info = isRecord(document.info) ? document.info : { title: 'API', version: '' };
    const base = `openapi-${slug(info.title)}`;
    const TitleHeading = heading(headingLevel);
    const SectionHeading = heading(headingLevel + 1);
    const operationLevel = model.tagged ? headingLevel + 2 : headingLevel + 1;
    const schemas = entries(document.components?.schemas);
    const securitySchemes = entries(document.components?.securitySchemes);
    const servers = Array.isArray(document.servers) ? document.servers.filter((server) => isRecord(server) && typeof server.url === 'string') : [];
    return _jsx(RefContext.Provider, { value: context, children: _jsxs("section", { className: "b10x-openapi b10x-api", "aria-labelledby": `${base}-title`, ref: root, children: [_jsxs("header", { className: "b10x-api-header", children: [_jsxs("p", { className: "b10x-eyebrow", children: ["OPENAPI ", document.openapi] }), _jsx(TitleHeading, { id: `${base}-title`, children: title ?? info.title }), info.summary && _jsx(Prose, { text: info.summary, className: "b10x-api-lede" }), _jsx(Prose, { text: info.description }), _jsxs("dl", { className: "b10x-facts", children: [_jsxs("div", { children: [_jsx("dt", { children: "Version" }), _jsx("dd", { children: info.version })] }), _jsxs("div", { children: [_jsx("dt", { children: "Operations" }), _jsx("dd", { children: model.operations.length })] }), schemas.length > 0 && _jsxs("div", { children: [_jsx("dt", { children: "Schemas" }), _jsx("dd", { children: schemas.length })] }), servers.length > 0 && _jsxs("div", { children: [_jsx("dt", { children: "Servers" }), _jsx("dd", { children: servers.length })] })] }), _jsx(DownloadLink, { url: sourceUrl, name: sourceName, label: "Download OpenAPI source" })] }), (servers.length > 0 || securitySchemes.length > 0) && _jsx(Access, { servers: servers, schemes: securitySchemes, security: document.security, Heading: SectionHeading, base: base }), _jsxs("nav", { className: "b10x-api-index", "aria-label": `${info.title} operations`, children: [_jsxs("div", { className: "b10x-api-filter", hidden: !hydrated, children: [_jsx("label", { htmlFor: filterId, children: "Filter operations" }), _jsx("input", { id: filterId, type: "search", value: query, onChange: (event) => setQuery(event.target.value), placeholder: "Method, path or name", autoComplete: "off" }), _jsx("p", { "aria-live": "polite", children: visible.size === model.operations.length ? `${model.operations.length} operations` : `${visible.size} of ${model.operations.length} operations` })] }), model.groups.map((group) => {
                            const shown = group.operations.filter((operation) => visible.has(operation.key));
                            return _jsxs("div", { className: "b10x-api-index__group", hidden: !shown.length, children: [model.tagged && _jsx("p", { className: "b10x-api-index__tag", children: group.tag }), _jsx("ul", { children: group.operations.map((operation) => _jsx("li", { hidden: !visible.has(operation.key), children: _jsxs("a", { href: `#${operation.id}`, children: [_jsx(MethodChip, { method: operation.method }), _jsx("code", { className: "b10x-api-path", children: _jsx(Breakable, { text: operation.path }) }), _jsx("span", { children: operation.operation.summary ?? operation.operation.operationId })] }) }, operation.key)) })] }, group.tag);
                        }), visible.size === 0 && _jsxs("p", { className: "b10x-api-empty", children: ["No operation matches \u201C", filter, "\u201D."] })] }), model.groups.map((group) => {
                    const groupId = `${base}-tag-${slug(group.tag)}`;
                    const cards = group.operations.map((operation) => _jsx(OperationCard, { operation: operation, level: operationLevel, hidden: !visible.has(operation.key) }, operation.key));
                    if (!model.tagged)
                        return _jsx("div", { className: "b10x-api-operations", children: cards }, group.tag);
                    return _jsxs("section", { className: "b10x-api-group", "aria-labelledby": groupId, hidden: !group.operations.some((operation) => visible.has(operation.key)), children: [_jsx(SectionHeading, { id: groupId, children: group.tag }), _jsx(Prose, { text: group.description }), _jsx("div", { className: "b10x-api-operations", children: cards })] }, group.tag);
                }), schemas.length > 0 && _jsxs("section", { className: "b10x-api-schemas", "aria-labelledby": `${base}-schemas`, children: [_jsx(SectionHeading, { id: `${base}-schemas`, children: "Schemas" }), _jsxs("details", { className: "b10x-api-all-schemas", children: [_jsx("summary", { children: `Show all ${schemas.length} schemas` }), _jsx(SchemaCards, { schemas: schemas, anchor: (name) => `schema-${name}` })] })] })] }) });
}
function Access({ servers, schemes, security, Heading, base }) {
    return _jsxs(_Fragment, { children: [servers.length > 0 && _jsxs("section", { className: "b10x-api-servers", "aria-labelledby": `${base}-servers`, children: [_jsx(Heading, { id: `${base}-servers`, children: "Servers" }), _jsx("ul", { className: "b10x-api-list", children: servers.map((server, index) => _jsxs("li", { children: [_jsx("code", { children: _jsx(Breakable, { text: server.url }) }), _jsx(Prose, { text: server.description }), entries(server.variables).map(([name, variable]) => _jsxs("p", { className: "b10x-schema-note", children: [_jsx("code", { children: `{${name}}` }), " ", variable.default !== undefined && _jsxs(_Fragment, { children: ["default ", _jsx("code", { children: variable.default })] }), " ", variable.description] }, name))] }, index)) })] }), schemes.length > 0 && _jsxs("section", { className: "b10x-api-security", "aria-labelledby": `${base}-security`, children: [_jsx(Heading, { id: `${base}-security`, children: "Security schemes" }), _jsx("p", { className: "b10x-schema-note", children: "Listed for reading. This page sends no request and takes no credential." }), _jsxs(ScrollableTable, { label: "Security schemes", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Scheme" }), _jsx("th", { scope: "col", children: "Type" }), _jsx("th", { scope: "col", children: "Details" }), _jsx("th", { scope: "col", children: "Description" })] }) }), _jsx("tbody", { children: schemes.map(([name, scheme]) => _jsxs("tr", { children: [_jsx("td", { children: _jsx("code", { children: name }) }), _jsx("td", { children: String(scheme.type ?? '') }), _jsx("td", { children: schemeDetails(scheme) }), _jsx("td", { children: _jsx(Prose, { text: scheme.description }) })] }, name)) })] }), Array.isArray(security) && security.length > 0 && _jsxs("p", { className: "b10x-api-requirement", children: ["Required by default: ", _jsx(SecurityList, { security: security })] })] })] });
}
function schemeDetails(scheme) {
    const parts = [];
    if (scheme.type === 'apiKey')
        parts.push(_jsxs(_Fragment, { children: [String(scheme.in), " ", _jsx("code", { children: String(scheme.name) })] }));
    if (scheme.type === 'http')
        parts.push(_jsxs(_Fragment, { children: [_jsx("code", { children: String(scheme.scheme) }), scheme.bearerFormat ? _jsxs(_Fragment, { children: [" (", String(scheme.bearerFormat), ")"] }) : null] }));
    if (scheme.type === 'oauth2' && isRecord(scheme.flows))
        parts.push(_jsxs(_Fragment, { children: ["flows: ", Object.keys(scheme.flows).join(', ')] }));
    if (scheme.type === 'openIdConnect' && typeof scheme.openIdConnectUrl === 'string')
        parts.push(_jsx("code", { children: _jsx(Breakable, { text: scheme.openIdConnectUrl }) }));
    return parts.length ? parts.map((part, index) => _jsx("span", { children: part }, index)) : '—';
}
function SecurityList({ security }) {
    return _jsx(_Fragment, { children: security.map((requirement, index) => {
            const names = Object.entries(isRecord(requirement) ? requirement : {});
            return _jsxs("span", { className: "b10x-api-requirement__item", children: [index > 0 && ' or ', names.length ? names.map(([name, scopes], item) => _jsxs("span", { children: [item > 0 && ' and ', _jsx("code", { children: name }), Array.isArray(scopes) && scopes.length ? ` (${scopes.join(', ')})` : null] }, name)) : 'none'] }, index);
        }) });
}
const OperationCard = memo(function OperationCard({ operation, level, hidden }) {
    const { method, path, operation: details, parameters } = operation;
    const Heading = heading(level);
    const Part = heading(level + 1);
    const responses = entries(details.responses);
    return _jsxs("details", { className: "b10x-api-operation", id: operation.id, hidden: hidden, children: [_jsxs("summary", { children: [_jsx(MethodChip, { method: method }), _jsx("code", { className: "b10x-api-path", children: _jsx(Breakable, { text: path }) }), _jsx(Heading, { children: details.summary ?? details.operationId ?? path }), details.deprecated && _jsx("span", { className: "b10x-api-chip b10x-api-deprecated", children: "deprecated" })] }), _jsxs("div", { className: "b10x-api-operation__body", children: [details.operationId && _jsxs("p", { className: "b10x-api-operation-id", children: ["Operation ", _jsx("code", { children: _jsx(Breakable, { text: details.operationId }) })] }), _jsx(Prose, { text: details.description }), Array.isArray(details.security) && _jsxs("p", { className: "b10x-api-requirement", children: ["Security: ", details.security.length ? _jsx(SecurityList, { security: details.security }) : 'none'] }), parameters.length > 0 && _jsxs("div", { className: "b10x-api-part", children: [_jsx(Part, { children: "Parameters" }), _jsxs(ScrollableTable, { label: `Parameters of ${method.toUpperCase()} ${path}`, className: "b10x-api-parameters", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Name" }), _jsx("th", { scope: "col", children: "In" }), _jsx("th", { scope: "col", children: "Type" }), _jsx("th", { scope: "col", children: "Required" }), _jsx("th", { scope: "col", children: "Description" })] }) }), _jsx("tbody", { children: parameters.map((parameter) => _jsxs("tr", { children: [_jsxs("td", { children: [_jsx("code", { children: _jsx(Breakable, { text: parameter.name }) }), parameter.deprecated && _jsxs(_Fragment, { children: [" ", _jsx("span", { className: "b10x-api-chip b10x-api-deprecated", children: "deprecated" })] })] }), _jsx("td", { children: parameter.in }), _jsx("td", { children: _jsx(SchemaType, { schema: parameter.schema ?? Object.values(parameter.content ?? {})[0]?.schema }) }), _jsx("td", { children: parameter.required || parameter.in === 'path' ? _jsx("b", { className: "b10x-schema-required", children: "required" }) : 'optional' }), _jsxs("td", { children: [_jsx(Prose, { text: parameter.description }), _jsx(ParameterConstraints, { schema: parameter.schema })] })] }, `${parameter.in}:${parameter.name}`)) })] })] }), details.requestBody && _jsx(RequestBody, { body: details.requestBody, Part: Part }), responses.length > 0 && _jsxs("div", { className: "b10x-api-part", children: [_jsx(Part, { children: "Responses" }), _jsx("div", { className: "b10x-api-responses", children: responses.map(([status, response]) => _jsx(Response, { status: status, response: response }, status)) })] })] })] });
});
function ParameterConstraints({ schema }) {
    if (!isRecord(schema) || schema.$ref)
        return null;
    const parts = [];
    if (Array.isArray(schema.enum))
        parts.push(_jsxs(_Fragment, { children: ["One of ", schema.enum.map((value, index) => _jsx("code", { children: String(value) }, index))] }));
    if (schema.default !== undefined)
        parts.push(_jsxs(_Fragment, { children: ["Default ", _jsx("code", { children: String(schema.default) })] }));
    if (typeof schema.pattern === 'string')
        parts.push(_jsxs(_Fragment, { children: ["Pattern ", _jsx("code", { children: schema.pattern })] }));
    if (!parts.length)
        return null;
    return _jsx("ul", { className: "b10x-schema-constraints", children: parts.map((part, index) => _jsx("li", { children: part }, index)) });
}
function RequestBody({ body, Part }) {
    return _jsx(RefContext.Consumer, { children: (context) => {
            const resolved = follow(context.root, body).value;
            if (!isRecord(resolved))
                return null;
            return _jsxs("div", { className: "b10x-api-part b10x-api-request", children: [_jsxs(Part, { children: ["Request body ", resolved.required ? _jsx("b", { className: "b10x-schema-required", children: "required" }) : _jsx("span", { className: "b10x-schema-optional", children: "optional" })] }), _jsx(Prose, { text: resolved.description }), _jsx(MediaList, { content: resolved.content })] });
        } });
}
function MediaList({ content }) {
    const media = entries(content);
    if (!media.length)
        return null;
    return _jsx(_Fragment, { children: media.map(([type, value]) => _jsxs("div", { className: "b10x-api-media", children: [_jsx("p", { className: "b10x-api-media__type", children: _jsx("code", { children: type }) }), isRecord(value) && value.schema ? _jsx(SchemaView, { schema: value.schema }) : _jsx("p", { className: "b10x-schema-note", children: "No schema." }), isRecord(value) && _jsx(Examples, { examples: value.examples, example: value.example })] }, type)) });
}
function Response({ status, response }) {
    return _jsx(RefContext.Consumer, { children: (context) => {
            const resolved = follow(context.root, response).value;
            if (!isRecord(resolved))
                return null;
            const headers = entries(resolved.headers).map(([name, header]) => [name, follow(context.root, header).value]).filter(([, header]) => isRecord(header));
            return _jsxs("div", { className: `b10x-api-response b10x-api-response--${statusClass(status)}`, children: [_jsxs("div", { className: "b10x-api-response__head", children: [_jsx(StatusChip, { status: status }), _jsx(Prose, { text: resolved.description })] }), headers.length > 0 && _jsxs(ScrollableTable, { label: `Headers of the ${status} response`, className: "b10x-api-headers", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Header" }), _jsx("th", { scope: "col", children: "Type" }), _jsx("th", { scope: "col", children: "Description" })] }) }), _jsx("tbody", { children: headers.map(([name, header]) => _jsxs("tr", { children: [_jsxs("td", { children: [_jsx("code", { children: name }), header.required && _jsxs(_Fragment, { children: [" ", _jsx("b", { className: "b10x-schema-required", children: "required" })] })] }), _jsx("td", { children: _jsx(SchemaType, { schema: header.schema ?? Object.values(header.content ?? {})[0]?.schema }) }), _jsx("td", { children: _jsx(Prose, { text: header.description }) })] }, name)) })] }), _jsx(MediaList, { content: resolved.content })] });
        } });
}
export const API_REFERENCE_KINDS = ['openapi', 'asyncapi', 'cli'];
/** Render a reference the product-site plugin loaded, by its kind. */
export function ApiReference({ reference, headingLevel = 2 }) {
    if (!isRecord(reference) || typeof reference.kind !== 'string')
        throw new Error('ApiReference needs a reference written by the product-site plugin: {id, kind, document}');
    const common = { sourceUrl: reference.sourceUrl, sourceName: reference.sourceName, headingLevel, ...(reference.title ? { title: reference.title } : {}) };
    if (reference.kind === 'openapi')
        return _jsx(OpenApiReference, { document: reference.document, ...common });
    if (reference.kind === 'asyncapi')
        return _jsx(AsyncApiReference, { document: reference.document, ...common });
    if (reference.kind === 'cli')
        return _jsx(CliReference, { document: reference.document, ...common });
    throw new Error(`ApiReference ${JSON.stringify(reference.id)}: kind must be one of ${API_REFERENCE_KINDS.join(', ')}, received ${JSON.stringify(reference.kind)}`);
}
