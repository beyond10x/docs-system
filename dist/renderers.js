import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function JsonSchemaViewer({ schema, depth = 0 }) {
    const composition = schema.oneOf ?? schema.anyOf ?? schema.allOf;
    if (schema.$ref)
        return _jsx("a", { href: `#schema-${schema.$ref.split('/').at(-1)}`, children: _jsx("code", { children: schema.$ref.split('/').at(-1) }) });
    if (composition)
        return _jsx("span", { className: "b10x-schema-composition", children: composition.map((part, index) => _jsx(JsonSchemaViewer, { schema: part, depth: depth + 1 }, index)) });
    if (schema.enum)
        return _jsx("code", { children: schema.enum.map(String).join(' | ') });
    if (schema.const !== undefined)
        return _jsx("code", { children: JSON.stringify(schema.const) });
    if (!schema.properties || depth >= 3)
        return _jsx("code", { children: schemaType(schema) });
    return _jsx("dl", { className: "b10x-schema-properties", children: Object.entries(schema.properties).map(([name, property]) => _jsxs("div", { children: [_jsxs("dt", { children: [_jsx("code", { children: name }), schema.required?.includes(name) && _jsx("b", { children: "required" }), _jsx("span", { children: schemaType(property) })] }), property.description && _jsx("dd", { children: property.description }), _jsx("dd", { children: _jsx(JsonSchemaViewer, { schema: property, depth: depth + 1 }) })] }, name)) });
}
export function OpenApiReference({ document, sourceUrl }) {
    if (!document.openapi.startsWith('3.1.'))
        throw new Error(`OpenApiReference supports OpenAPI 3.1, received ${document.openapi}`);
    const operations = Object.entries(document.paths).flatMap(([path, methods]) => Object.entries(methods).map(([method, operation]) => ({ path, method, operation: operation })));
    return _jsxs("div", { className: "b10x-openapi", children: [_jsxs("header", { children: [_jsxs("p", { className: "b10x-eyebrow", children: ["OPENAPI ", document.openapi] }), _jsx("h1", { children: document.info.title }), _jsx("p", { children: document.info.description }), _jsxs("dl", { className: "b10x-facts", children: [_jsxs("div", { children: [_jsx("dt", { children: "Version" }), _jsx("dd", { children: document.info.version })] }), _jsxs("div", { children: [_jsx("dt", { children: "Operations" }), _jsx("dd", { children: operations.length })] })] }), sourceUrl && _jsx("a", { href: sourceUrl, download: true, children: "Download OpenAPI source" })] }), _jsx("nav", { "aria-label": "API operations", children: operations.map(({ path, method, operation }) => _jsxs("a", { href: `#operation-${operation.operationId ?? slug(`${method}-${path}`)}`, children: [_jsx("code", { children: method.toUpperCase() }), " ", operation.summary ?? path] }, `${method}-${path}`)) }), _jsx("main", { children: operations.map(({ path, method, operation }) => _jsx(Operation, { path: path, method: method, operation: operation }, `${method}-${path}`)) }), document.components?.schemas && _jsxs("section", { "aria-labelledby": "b10x-schema-title", children: [_jsx("h2", { id: "b10x-schema-title", children: "Schemas" }), _jsx("div", { className: "b10x-schema-grid", children: Object.entries(document.components.schemas).map(([name, schema]) => _jsxs("details", { id: `schema-${name}`, children: [_jsxs("summary", { children: [_jsx("code", { children: name }), _jsx("span", { children: schemaType(schema) })] }), _jsxs("div", { children: [schema.description && _jsx("p", { children: schema.description }), _jsx(JsonSchemaViewer, { schema: schema })] })] }, name)) })] })] });
}
function Operation({ path, method, operation }) {
    const id = `operation-${operation.operationId ?? slug(`${method}-${path}`)}`;
    return _jsxs("article", { className: "b10x-api-operation", id: id, children: [_jsxs("p", { className: "b10x-api-route", children: [_jsx("strong", { children: method.toUpperCase() }), " ", _jsx("code", { children: path })] }), _jsx("h2", { children: operation.summary ?? operation.operationId ?? path }), operation.description && _jsx("p", { children: operation.description }), operation.parameters?.length ? _jsx("dl", { children: operation.parameters.map((parameter) => _jsxs("div", { children: [_jsxs("dt", { children: [_jsx("code", { children: parameter.name }), parameter.required && _jsx("b", { children: "required" })] }), _jsxs("dd", { children: [parameter.in, " \u00B7 ", schemaType(parameter.schema), parameter.description && ` · ${parameter.description}`] })] }, `${parameter.in}-${parameter.name}`)) }) : null, _jsx(ResponseTable, { responses: operation.responses ?? {} })] });
}
function ResponseTable({ responses }) {
    return _jsx("div", { className: "b10x-table-wrap", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Status" }), _jsx("th", { children: "Description" }), _jsx("th", { children: "Schema" })] }) }), _jsx("tbody", { children: Object.entries(responses).map(([status, response]) => { const media = Object.values(response.content ?? {})[0]; return _jsxs("tr", { children: [_jsx("td", { children: _jsx("code", { children: status }) }), _jsx("td", { children: response.description }), _jsx("td", { children: media?.schema ? _jsx(JsonSchemaViewer, { schema: media.schema }) : '—' })] }, status); }) })] }) });
}
function schemaType(schema) {
    if (!schema)
        return 'document';
    if (schema.$ref)
        return schema.$ref.split('/').at(-1) ?? 'reference';
    const type = Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type;
    return [type ?? (schema.properties ? 'object' : 'value'), schema.format].filter(Boolean).join(' · ');
}
function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
