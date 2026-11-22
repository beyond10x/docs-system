import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useRef } from 'react';
import { ActionChip, Breakable, DownloadLink, entries, Examples, follow, heading, isRecord, LazyDetails, pointerTokens, Prose, RefContext, refName, SchemaCards, SchemaView, slug, useOpenOnHash } from './api-common.js';
import { ScrollableTable } from './scrollable-table.js';
const pointer = (...tokens) => `#/${tokens.map((token) => token.replace(/~/g, '~0').replace(/\//g, '~1')).join('/')}`;
/** Page anchors for AsyncAPI pointers; a channel's message that points at a component message links to that card. */
function asyncApiAnchor(document) {
    return (ref) => {
        const tokens = pointerTokens(ref);
        if (!tokens)
            return undefined;
        // The page holds a card only for what the document declares: a reference to anything else
        // gets no anchor, and its caller writes text instead of a link.
        const target = follow(document, { $ref: ref }).value;
        if (target === undefined)
            return undefined;
        if (tokens[0] === 'components' && tokens.length === 3 && tokens[1] === 'schemas')
            return `schema-${tokens[2]}`;
        if (!isRecord(target))
            return undefined;
        if (tokens[0] === 'components' && tokens.length === 3 && tokens[1] === 'messages')
            return `message-${tokens[2]}`;
        if (tokens[0] === 'operations' && tokens.length === 2)
            return `operation-${tokens[1]}`;
        if (tokens[0] === 'channels' && tokens.length === 2)
            return `channel-${tokens[1]}`;
        if (tokens[0] === 'channels' && tokens.length === 4 && tokens[2] === 'messages') {
            const { ref: last } = follow(document, { $ref: ref });
            const target = last && last !== ref ? pointerTokens(last) : undefined;
            return target?.[0] === 'components' && target[1] === 'messages' && target.length === 3 ? `message-${target[2]}` : `channel-${tokens[1]}`;
        }
        return undefined;
    };
}
function payloadSchema(message) {
    const payload = message.payload;
    if (!isRecord(payload))
        return undefined;
    return 'schemaFormat' in payload && isRecord(payload.schema) ? payload.schema : payload;
}
export function AsyncApiReference({ document, sourceUrl, sourceName, headingLevel = 2, title }) {
    if (!isRecord(document) || typeof document.asyncapi !== 'string' || !/^3\.0\.\d+$/.test(document.asyncapi))
        throw new Error(`AsyncApiReference supports AsyncAPI 3.0, received ${isRecord(document) ? String(document.asyncapi) : typeof document}`);
    const context = useMemo(() => ({ root: document, anchor: asyncApiAnchor(document) }), [document]);
    const root = useRef(null);
    useOpenOnHash(root);
    const info = isRecord(document.info) ? document.info : { title: 'Events', version: '' };
    const base = `asyncapi-${slug(info.title)}`;
    const TitleHeading = heading(headingLevel);
    const Section = heading(headingLevel + 1);
    const Item = heading(headingLevel + 2);
    const operations = entries(document.operations).map(([name, raw]) => [name, follow(document, raw).value]).filter(([, operation]) => isRecord(operation));
    const channels = entries(document.channels).map(([name, raw]) => [name, follow(document, raw).value]).filter(([, channel]) => isRecord(channel));
    const messages = entries(document.components?.messages).map(([name, raw]) => [name, follow(document, raw).value]).filter(([, message]) => isRecord(message));
    const servers = entries(document.servers).map(([name, raw]) => [name, follow(document, raw).value]).filter(([, server]) => isRecord(server));
    const schemas = entries(document.components?.schemas);
    const channelOf = (operation) => {
        const ref = isRecord(operation.channel) ? operation.channel.$ref : undefined;
        const tokens = typeof ref === 'string' ? pointerTokens(ref) : undefined;
        return { name: tokens?.[0] === 'channels' ? tokens[1] : ref ? refName(ref) : undefined, channel: ref ? follow(document, { $ref: ref }).value : undefined, anchor: typeof ref === 'string' ? context.anchor(ref) : undefined };
    };
    const address = (name, channel) => typeof channel?.address === 'string' ? channel.address : name ?? '—';
    return _jsx(RefContext.Provider, { value: context, children: _jsxs("section", { className: "b10x-asyncapi b10x-api", "aria-labelledby": `${base}-title`, ref: root, children: [_jsxs("header", { className: "b10x-api-header", children: [_jsxs("p", { className: "b10x-eyebrow", children: ["ASYNCAPI ", document.asyncapi] }), _jsx(TitleHeading, { id: `${base}-title`, children: title ?? info.title }), _jsx(Prose, { text: info.description }), _jsxs("dl", { className: "b10x-facts", children: [_jsxs("div", { children: [_jsx("dt", { children: "Version" }), _jsx("dd", { children: info.version })] }), _jsxs("div", { children: [_jsx("dt", { children: "Operations" }), _jsx("dd", { children: operations.length })] }), _jsxs("div", { children: [_jsx("dt", { children: "Channels" }), _jsx("dd", { children: channels.length })] }), _jsxs("div", { children: [_jsx("dt", { children: "Messages" }), _jsx("dd", { children: messages.length })] }), document.defaultContentType && _jsxs("div", { children: [_jsx("dt", { children: "Content type" }), _jsx("dd", { children: _jsx("code", { children: document.defaultContentType }) })] })] }), _jsx(DownloadLink, { url: sourceUrl, name: sourceName, label: "Download AsyncAPI source" })] }), servers.length > 0 && _jsxs("section", { className: "b10x-api-servers", "aria-labelledby": `${base}-servers`, children: [_jsx(Section, { id: `${base}-servers`, children: "Servers" }), _jsxs(ScrollableTable, { label: "Servers", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Server" }), _jsx("th", { scope: "col", children: "Host" }), _jsx("th", { scope: "col", children: "Protocol" }), _jsx("th", { scope: "col", children: "Description" })] }) }), _jsx("tbody", { children: servers.map(([name, server]) => _jsxs("tr", { children: [_jsx("td", { children: _jsx("code", { children: name }) }), _jsx("td", { children: _jsx("code", { children: _jsx(Breakable, { text: `${server.host ?? ''}${server.pathname ?? ''}` }) }) }), _jsx("td", { children: [server.protocol, server.protocolVersion].filter(Boolean).join(' ') }), _jsx("td", { children: _jsx(Prose, { text: server.description ?? server.summary ?? server.title }) })] }, name)) })] })] }), operations.length > 0 && _jsx("nav", { className: "b10x-api-index", "aria-label": `${info.title} operations`, children: _jsx("ul", { children: operations.map(([name, operation]) => {
                            const { name: channelName, channel } = channelOf(operation);
                            return _jsx("li", { children: _jsxs("a", { href: `#operation-${name}`, children: [_jsx(ActionChip, { action: operation.action }), _jsx("code", { className: "b10x-api-path", children: _jsx(Breakable, { text: address(channelName, channel) }) }), _jsx("span", { children: operation.title ?? operation.summary ?? name })] }) }, name);
                        }) }) }), operations.length > 0 && _jsxs("section", { className: "b10x-api-group", "aria-labelledby": `${base}-operations`, children: [_jsx(Section, { id: `${base}-operations`, children: "Operations" }), _jsx("div", { className: "b10x-api-operations", children: operations.map(([name, operation]) => {
                                const { name: channelName, channel, anchor: channelAnchor } = channelOf(operation);
                                const replyRef = isRecord(operation.reply) && isRecord(operation.reply.channel) && typeof operation.reply.channel.$ref === 'string' ? operation.reply.channel.$ref : undefined;
                                const replyAnchor = replyRef ? context.anchor(replyRef) : undefined;
                                return _jsxs("details", { className: "b10x-api-operation", id: `operation-${name}`, children: [_jsxs("summary", { children: [_jsx(ActionChip, { action: operation.action }), _jsx("code", { className: "b10x-api-path", children: _jsx(Breakable, { text: address(channelName, channel) }) }), _jsx(Item, { children: operation.title ?? name })] }), _jsxs("div", { className: "b10x-api-operation__body", children: [_jsxs("p", { className: "b10x-api-operation-id", children: ["Operation ", _jsx("code", { children: _jsx(Breakable, { text: name }) })] }), _jsx(Prose, { text: operation.summary, className: "b10x-api-lede" }), _jsx(Prose, { text: operation.description }), _jsxs("dl", { className: "b10x-api-pairs", children: [_jsxs("div", { children: [_jsx("dt", { children: "Channel" }), _jsx("dd", { children: !channelName ? '—' : channelAnchor ? _jsx("a", { href: `#${channelAnchor}`, children: _jsx("code", { children: _jsx(Breakable, { text: channelName }) }) }) : _jsx("code", { children: _jsx(Breakable, { text: channelName }) }) })] }), _jsxs("div", { children: [_jsx("dt", { children: operation.action === 'receive' ? 'Receives' : 'Sends' }), _jsx("dd", { children: _jsx(MessageRefs, { refs: operation.messages ?? [] }) })] }), isRecord(operation.reply) && _jsxs("div", { children: [_jsx("dt", { children: "Reply" }), _jsxs("dd", { children: [replyRef ? (replyAnchor ? _jsx("a", { href: `#${replyAnchor}`, children: _jsx("code", { children: refName(replyRef) }) }) : _jsx("code", { children: refName(replyRef) })) : operation.reply.address?.location ? _jsx("code", { children: operation.reply.address.location }) : '—', operation.reply.messages && _jsx(MessageRefs, { refs: operation.reply.messages })] })] })] })] })] }, name);
                            }) })] }), channels.length > 0 && _jsxs("section", { className: "b10x-api-group", "aria-labelledby": `${base}-channels`, children: [_jsx(Section, { id: `${base}-channels`, children: "Channels" }), _jsx("div", { className: "b10x-schema-grid b10x-api-cards", children: channels.map(([name, channel]) => {
                                const parameters = entries(channel.parameters).map(([key, raw]) => [key, follow(document, raw).value]).filter(([, parameter]) => isRecord(parameter));
                                const users = operations.filter(([, operation]) => channelOf(operation).name === name);
                                return _jsxs("details", { className: "b10x-schema-card", id: `channel-${name}`, children: [_jsxs("summary", { children: [_jsx("code", { children: _jsx(Breakable, { text: address(name, channel) }) }), _jsx("span", { className: "b10x-schema-card__type", children: channel.title ?? 'channel' })] }), _jsxs("div", { children: [_jsx(Prose, { text: channel.summary, className: "b10x-api-lede" }), _jsx(Prose, { text: channel.description }), channel.address === null && _jsx("p", { className: "b10x-schema-note", children: "The address is dynamic or unknown." }), parameters.length > 0 && _jsxs(ScrollableTable, { label: `Parameters of ${name}`, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Parameter" }), _jsx("th", { scope: "col", children: "Values" }), _jsx("th", { scope: "col", children: "Description" })] }) }), _jsx("tbody", { children: parameters.map(([key, parameter]) => _jsxs("tr", { children: [_jsx("td", { children: _jsx("code", { children: `{${key}}` }) }), _jsxs("td", { children: [Array.isArray(parameter.enum) ? parameter.enum.map((value) => _jsx("code", { children: value }, value)) : 'any', parameter.default !== undefined && _jsxs(_Fragment, { children: [" default ", _jsx("code", { children: parameter.default })] })] }), _jsxs("td", { children: [_jsx(Prose, { text: parameter.description }), parameter.location && _jsxs("p", { className: "b10x-schema-note", children: ["From ", _jsx("code", { children: parameter.location })] })] })] }, key)) })] }), _jsxs("dl", { className: "b10x-api-pairs", children: [_jsxs("div", { children: [_jsx("dt", { children: "Messages" }), _jsx("dd", { children: _jsx(MessageRefs, { refs: entries(channel.messages).map(([key]) => ({ $ref: pointer('channels', name, 'messages', key) })) }) })] }), users.length > 0 && _jsxs("div", { children: [_jsx("dt", { children: "Operations" }), _jsx("dd", { children: _jsx("ul", { className: "b10x-api-inline-list", children: users.map(([key, operation]) => _jsx("li", { children: _jsxs("a", { href: `#operation-${key}`, children: [_jsx(ActionChip, { action: operation.action }), " ", _jsx("span", { children: operation.title ?? key })] }) }, key)) }) })] })] })] })] }, name);
                            }) })] }), messages.length > 0 && _jsxs("section", { className: "b10x-api-group", "aria-labelledby": `${base}-messages`, children: [_jsx(Section, { id: `${base}-messages`, children: "Messages" }), _jsx("div", { className: "b10x-schema-grid b10x-api-cards", children: messages.map(([name, message]) => _jsxs("details", { className: "b10x-schema-card", id: `message-${name}`, children: [_jsxs("summary", { children: [_jsx("code", { children: _jsx(Breakable, { text: message.name ?? name }) }), _jsx("span", { className: "b10x-schema-card__type", children: message.contentType ?? document.defaultContentType ?? 'message' })] }), _jsx("div", { children: _jsx(Message, { message: message, name: name }) })] }, name)) })] }), schemas.length > 0 && _jsxs("section", { className: "b10x-api-schemas", "aria-labelledby": `${base}-schemas`, children: [_jsx(Section, { id: `${base}-schemas`, children: "Schemas" }), _jsx(SchemaCards, { schemas: schemas, anchor: (name) => `schema-${name}` })] })] }) });
}
function Message({ message, name }) {
    const payload = payloadSchema(message);
    return _jsxs(_Fragment, { children: [message.title && message.title !== name && _jsx("p", { className: "b10x-schema-title", children: message.title }), _jsx(Prose, { text: message.summary, className: "b10x-api-lede" }), _jsx(Prose, { text: message.description }), _jsx("p", { className: "b10x-schema-label", children: "Payload" }), payload ? _jsx(SchemaView, { schema: payload }) : _jsx("p", { className: "b10x-schema-note", children: "No payload schema." }), isRecord(message.headers) && _jsxs(_Fragment, { children: [_jsx("p", { className: "b10x-schema-label", children: "Headers" }), _jsx(SchemaView, { schema: message.headers })] }), isRecord(message.correlationId) && 'location' in message.correlationId && _jsxs("p", { className: "b10x-schema-note", children: ["Correlation id at ", _jsx("code", { children: String(message.correlationId.location) })] }), _jsx(Examples, { examples: message.examples })] });
}
/** Message references as links to their cards, each with its payload expandable in place. */
function MessageRefs({ refs }) {
    return _jsx(RefContext.Consumer, { children: (context) => {
            const list = refs.filter((ref) => isRecord(ref) && typeof ref.$ref === 'string');
            if (!list.length)
                return _jsx(_Fragment, { children: "\u2014" });
            return _jsx("ul", { className: "b10x-api-messages", children: list.map((ref) => {
                    const message = follow(context.root, ref).value;
                    const anchor = context.anchor(ref.$ref);
                    const label = isRecord(message) ? message.name ?? message.title ?? refName(ref.$ref) : refName(ref.$ref);
                    const payload = isRecord(message) ? payloadSchema(message) : undefined;
                    return _jsxs("li", { children: [anchor ? _jsx("a", { href: `#${anchor}`, children: _jsx("code", { children: _jsx(Breakable, { text: label }) }) }) : _jsx("code", { children: _jsx(Breakable, { text: label }) }), payload && _jsx(LazyDetails, { className: "b10x-schema-more", summary: _jsxs(_Fragment, { children: ["Show payload", _jsxs("span", { className: "b10x-sr-only", children: [" of ", label] })] }), fallback: anchor ? _jsxs("p", { className: "b10x-schema-note", children: ["See ", _jsx("a", { href: `#${anchor}`, children: _jsx("code", { children: _jsx(Breakable, { text: label }) }) }), "."] }) : null, children: () => _jsx(SchemaView, { schema: payload }) })] }, ref.$ref);
                }) });
        } });
}
