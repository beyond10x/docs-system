import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { DOMAIN_NODE_HEIGHT, PROTOCOL_KIND_LABELS, layoutDomainGraph, layoutProtocolGraph, parseDomainGraph, parseProtocolGraph, predicateLines, protocolLineage, } from './product-graphs.js';
/** Text never shrinks below this share of its design size; wider graphs scroll instead. */
const MINIMUM_SCALE = 0.78;
const KIND_ORDER = ['action', 'evidence', 'claim', 'outcome', 'obligation'];
/**
 * A graph wider than its frame scrolls at no less than MINIMUM_SCALE. When it does, a toggle offers
 * "Fit to width"; the measurement runs only in the browser, so the server render has no toggle.
 */
function useFit(width) {
    const [fit, setFit] = useState(false);
    const [overflowing, setOverflowing] = useState(false);
    const viewport = useRef(null);
    useEffect(() => {
        const element = viewport.current;
        if (!element || typeof window === 'undefined')
            return;
        const measure = () => setOverflowing(width * MINIMUM_SCALE > element.clientWidth + 1);
        measure();
        if (!('ResizeObserver' in window))
            return;
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return () => observer.disconnect();
    }, [width]);
    return {
        fit,
        overflowing,
        toggle: () => setFit((value) => !value),
        viewport,
        style: { minWidth: fit ? '0px' : `${Math.round(width * MINIMUM_SCALE)}px`, maxWidth: `${Math.ceil(width)}px` },
    };
}
function FitToggle({ fit, overflowing, toggle }) {
    if (!overflowing && !fit)
        return null;
    return _jsx("button", { type: "button", className: "b10x-graph__fit", "aria-pressed": fit, onClick: toggle, children: fit ? 'Actual size' : 'Fit to width' });
}
export function ProtocolGraph({ data, title, description, caption, variant = 'default' }) {
    const prepared = useMemo(() => {
        try {
            const document = parseProtocolGraph(data);
            return { document, layout: layoutProtocolGraph(document) };
        }
        catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }, [data]);
    if ('error' in prepared)
        return _jsx(GraphError, { kind: "protocol graph", message: prepared.error });
    return _jsx(ProtocolGraphView, { document: prepared.document, layout: prepared.layout, title: title, description: description, caption: caption, variant: variant });
}
function ProtocolGraphView({ document, layout, title, description, caption, variant }) {
    const base = `b10x-pg-${useId().replaceAll(':', '')}`;
    const hero = variant === 'hero';
    const sizing = useFit(layout.width);
    const [hovered, setHovered] = useState(null);
    const [pinned, setPinned] = useState(null);
    const current = hovered ?? pinned;
    const lineage = useMemo(() => current ? protocolLineage(document, current) : null, [document, current]);
    const byId = useMemo(() => new Map(document.nodes.map((node) => [node.id, node])), [document]);
    const counts = KIND_ORDER.map((kind) => ({ kind, count: document.nodes.filter((node) => node.kind === kind).length })).filter((entry) => entry.count > 0);
    const heading = title ?? `${document.protocol.id}/${document.protocol.revision}`;
    const placed = layout.nodes.find((node) => node.node.id === current);
    const hasGates = document.edges.some((edge) => edge.kind === 'gates');
    const hasSupports = document.edges.some((edge) => edge.kind === 'supports');
    const onKeyDown = (event) => { if (event.key === 'Escape') {
        setPinned(null);
        setHovered(null);
    } };
    const legend = _jsxs("ul", { className: "b10x-graph__legend", "aria-label": "Legend", children: [counts.map(({ kind, count }) => _jsxs("li", { children: [_jsx("span", { className: `b10x-graph__swatch b10x-graph__swatch--${kind}`, "aria-hidden": "true" }), PROTOCOL_KIND_LABELS[kind].plural, _jsx("span", { className: "b10x-graph__count", children: count })] }, kind)), !hero && hasSupports && _jsxs("li", { children: [_jsx("svg", { className: "b10x-graph__key", viewBox: "0 0 22 12", "aria-hidden": "true", children: _jsx("path", { d: "M2,2 C14,2 14,10 2,10" }) }), "Claim supports claim"] }), !hero && hasGates && _jsxs("li", { children: [_jsx(Glyph, { kind: "lock", legend: true }), "Precondition, traced on hover"] }), !hero && document.nodes.some((node) => node.capabilities?.length) && _jsxs("li", { children: [_jsx(Glyph, { kind: "key", legend: true }), "Needs authority"] })] });
    return _jsxs("figure", { className: classes('b10x-graph', 'b10x-protocol-graph', hero && 'b10x-graph--hero'), "aria-labelledby": `${base}-title`, onKeyDown: onKeyDown, children: [hero
                ? _jsxs("p", { className: "b10x-graph__kicker b10x-graph__hero-title", children: [_jsx("span", { id: `${base}-title`, children: heading }), " \u00B7 protocol graph"] })
                : _jsxs("header", { className: "b10x-graph__header", children: [_jsxs("div", { className: "b10x-graph__heading", children: [_jsxs("p", { className: "b10x-graph__kicker", children: ["Protocol \u00B7 revision ", document.protocol.revision] }), _jsx("strong", { id: `${base}-title`, className: "b10x-graph__title", children: heading }), (description ?? document.protocol.description) && _jsx("p", { className: "b10x-graph__description", id: `${base}-description`, children: description ?? document.protocol.description })] }), legend] }), _jsx("div", { className: "b10x-graph__viewport", ref: sizing.viewport, children: _jsxs("div", { className: "b10x-graph__canvas", style: hero ? { maxWidth: `${Math.ceil(layout.width)}px` } : sizing.style, children: [_jsxs("svg", { viewBox: `-2 -2 ${f(layout.width + 4)} ${f(layout.height + 4)}`, className: "b10x-graph__svg", role: "group", "aria-labelledby": `${base}-title`, "aria-describedby": `${base}-hint`, children: [_jsxs("defs", { children: [_jsx("marker", { id: `${base}-arrow`, viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse", children: _jsx("path", { d: "M0,1 L9,5 L0,9 z", className: "b10x-graph__arrow" }) }), _jsx("marker", { id: `${base}-arrow-lit`, viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse", children: _jsx("path", { d: "M0,1 L9,5 L0,9 z", className: "b10x-graph__arrow b10x-graph__arrow--lit" }) })] }), _jsx("g", { className: "b10x-graph__columns", "aria-hidden": "true", children: layout.columns.map((column, index) => _jsxs("g", { transform: `translate(${f(column.x)},0)`, children: [_jsxs("text", { className: "b10x-graph__column-label", x: 0, y: 14, children: [_jsx("tspan", { className: "b10x-graph__column-index", children: String(index + 1).padStart(2, '0') }), `  ${column.plural.toUpperCase()}`] }), _jsx("line", { className: `b10x-graph__column-rule b10x-graph__column-rule--${column.kind}`, x1: 0, x2: column.width, y1: 26, y2: 26 })] }, column.kind)) }), _jsx("g", { className: "b10x-graph__edges", "aria-hidden": "true", children: layout.edges.map(({ edge, index, path }) => {
                                        const touchesCurrent = edge.from === current || edge.to === current;
                                        if (edge.kind === 'gates' && !touchesCurrent)
                                            return null;
                                        const lit = lineage ? lineage.has(edge.from) && lineage.has(edge.to) && (edge.kind !== 'gates' || touchesCurrent) : false;
                                        const dim = lineage !== null && !lit;
                                        return _jsx("path", { d: path, pathLength: hero && edge.kind !== 'gates' ? 1 : undefined, className: classes('b10x-graph__edge', `b10x-graph__edge--${edge.kind}`, lit && 'is-lit', dim && 'is-dimmed'), markerEnd: `url(#${base}-${lit ? 'arrow-lit' : 'arrow'})` }, index);
                                    }) }), lineage && _jsx("g", { className: "b10x-graph__qualifiers", "aria-hidden": "true", children: layout.edges.filter(({ edge }) => edge.qualifier && lineage.has(edge.from) && lineage.has(edge.to) && (edge.kind !== 'gates' || edge.from === current || edge.to === current)).map(({ edge, index, label }) => {
                                        const width = edge.qualifier.length * 6.6 + 12;
                                        return _jsxs("g", { transform: `translate(${f(label.x - width / 2)},${f(label.y - 9)})`, children: [_jsx("rect", { width: f(width), height: 18, rx: 9, className: "b10x-graph__qualifier-bg" }), _jsx("text", { x: f(width / 2), y: 12.5, textAnchor: "middle", className: "b10x-graph__qualifier", children: edge.qualifier })] }, index);
                                    }) }), _jsx("g", { className: "b10x-graph__nodes", children: layout.nodes.map(({ node, x, y, width, height, displayName }) => {
                                        const dim = lineage !== null && !lineage.has(node.id);
                                        const isCurrent = node.id === current;
                                        return _jsxs("g", { transform: `translate(${f(x)},${f(y)})`, className: classes('b10x-graph__node', `b10x-graph__node--${node.kind}`, dim && 'is-dimmed', isCurrent && 'is-current'), tabIndex: 0, role: "button", "aria-pressed": pinned === node.id, "aria-label": `${PROTOCOL_KIND_LABELS[node.kind].singular} ${node.name}${node.description ? `. ${node.description}` : ''}`, "aria-describedby": isCurrent ? `${base}-tooltip` : undefined, onPointerEnter: () => setHovered(node.id), onPointerLeave: () => setHovered(null), onFocus: () => setHovered(node.id), onBlur: () => setHovered(null), onClick: () => setPinned((value) => value === node.id ? null : node.id), onKeyDown: (event) => { if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                setPinned((value) => value === node.id ? null : node.id);
                                            } }, children: [_jsx("rect", { className: "b10x-graph__hit", x: -6, y: -6, width: width + 12, height: height + 12, rx: 12 }), _jsx("rect", { className: "b10x-graph__body", width: width, height: height, rx: 8 }), _jsx("rect", { className: "b10x-graph__accent", x: 0, y: 10, width: 3, height: height - 20, rx: 1.5 }), _jsx("text", { className: "b10x-graph__node-kicker", x: 16, y: 22, children: kicker(node) }), _jsx("text", { className: "b10x-graph__node-name", x: 16, y: 42, children: displayName }), _jsx(NodeGlyphs, { node: node, width: width })] }, node.id);
                                    }) })] }), placed && !hero && _jsx(ProtocolTooltip, { id: `${base}-tooltip`, placed: placed, layout: layout, document: document, byId: byId })] }) }), hero
                ? _jsxs(_Fragment, { children: [legend, _jsx("p", { className: "b10x-sr-only", id: `${base}-hint`, children: "Hover or focus a node to trace what it rests on." })] })
                : _jsxs("div", { className: "b10x-graph__tools", children: [_jsx("p", { className: "b10x-graph__hint", id: `${base}-hint`, "data-pagefind-ignore": true, children: "Hover or focus a node to trace what it rests on and what rests on it. Press Enter to pin it, Escape to clear." }), _jsx(FitToggle, { ...sizing })] }), caption && _jsx("figcaption", { className: "b10x-graph__caption", children: caption }), !hero && _jsx(ProtocolTable, { document: document }), !hero && document.protocol.source && _jsxs("p", { className: "b10x-graph__source", children: ["Source: ", document.protocol.source] })] });
}
function kicker(node) {
    const label = PROTOCOL_KIND_LABELS[node.kind].singular.toUpperCase();
    return node.kind === 'action' && node.effect ? `${label} · ${node.effect.toUpperCase()}` : label;
}
function NodeGlyphs({ node, width }) {
    const glyphs = [];
    if (node.kind === 'action' && node.predicate)
        glyphs.push('lock');
    if (node.capabilities?.length)
        glyphs.push('key');
    return _jsx(_Fragment, { children: glyphs.map((glyph, index) => _jsx("g", { transform: `translate(${width - 24 - index * 18},11)`, children: _jsx(Glyph, { kind: glyph }) }, glyph)) });
}
function Glyph({ kind, legend = false }) {
    const shape = kind === 'lock'
        ? _jsxs(_Fragment, { children: [_jsx("rect", { x: 2.5, y: 6, width: 9, height: 7, rx: 1.5 }), _jsx("path", { d: "M4.5,6 V4.5 a2.5,2.5 0 0 1 5,0 V6" })] })
        : _jsxs(_Fragment, { children: [_jsx("circle", { cx: 4.5, cy: 7, r: 3 }), _jsx("path", { d: "M7.5,7 H13 M11,7 V9.5 M13,7 V9" })] });
    return legend
        ? _jsx("svg", { className: `b10x-graph__glyph b10x-graph__glyph--${kind}`, viewBox: "0 0 14 14", "aria-hidden": "true", children: shape })
        : _jsx("g", { className: `b10x-graph__glyph b10x-graph__glyph--${kind}`, "aria-hidden": "true", children: shape });
}
function ProtocolTooltip({ id, placed, layout, document, byId }) {
    const { node } = placed;
    const style = tooltipPosition(placed, layout.width, layout.height);
    const related = (kind, direction) => document.edges.filter((edge) => edge.kind === kind && edge[direction] === node.id);
    const produces = related('produces', 'from');
    const producedBy = related('produces', 'to');
    const establishes = related('establishes', 'from');
    const gates = related('gates', 'from');
    const neededBy = [...related('supports', 'from'), ...related('requires', 'from')];
    const nameOf = (edgeId) => byId.get(edgeId)?.name ?? edgeId;
    return _jsxs("div", { className: `b10x-graph__tooltip b10x-graph__tooltip--${node.kind}`, role: "tooltip", id: id, style: style, children: [_jsx("p", { className: "b10x-graph__tooltip-kicker", children: kicker(node) }), _jsx("p", { className: "b10x-graph__tooltip-name", children: _jsx("code", { children: node.name }) }), node.description && _jsx("p", { className: "b10x-graph__tooltip-text", children: node.description }), node.predicate && _jsx(TooltipSection, { title: node.kind === 'claim' ? 'True when' : node.kind === 'action' ? 'Admissible when' : 'Requires', children: _jsx(Predicate, { value: node.predicate }) }), node.capabilities?.length ? _jsx(TooltipSection, { title: "Needs authority", children: node.capabilities.map((capability) => _jsx("code", { children: capability }, capability)) }) : null, produces.length > 0 && _jsx(TooltipSection, { title: "May produce", children: produces.map((edge) => _jsx("code", { children: nameOf(edge.to) }, edge.to)) }), producedBy.length > 0 && _jsx(TooltipSection, { title: "Produced by", children: producedBy.map((edge) => _jsx("code", { children: nameOf(edge.from) }, edge.from)) }), establishes.length > 0 && _jsx(TooltipSection, { title: "Establishes", children: establishes.map((edge) => _jsxs("span", { children: [_jsx("code", { children: nameOf(edge.to) }), edge.qualifier && _jsxs(_Fragment, { children: [" on ", _jsx("b", { children: edge.qualifier })] })] }, edge.to)) }), neededBy.length > 0 && _jsx(TooltipSection, { title: "Needed by", children: neededBy.map((edge) => _jsxs("span", { children: [_jsx("code", { children: nameOf(edge.to) }), edge.qualifier && _jsxs(_Fragment, { children: [" as ", _jsx("b", { children: edge.qualifier })] })] }, edge.to)) }), gates.length > 0 && _jsx(TooltipSection, { title: "Gates", children: gates.map((edge) => _jsx("code", { children: nameOf(edge.to) }, edge.to)) })] });
}
function TooltipSection({ title, children }) {
    return _jsxs("div", { className: "b10x-graph__tooltip-section", children: [_jsx("p", { children: title }), _jsx("div", { children: children })] });
}
function Predicate({ value }) {
    return _jsx("ul", { className: "b10x-graph__predicate", children: predicateLines(value).map((line, index) => _jsx("li", { style: { '--b10x-depth': line.depth }, children: line.reference ? _jsxs(_Fragment, { children: [line.text, " ", _jsx("code", { children: line.reference })] }) : _jsx("span", { children: line.text }) }, index)) });
}
function ProtocolTable({ document }) {
    const names = new Map(document.nodes.map((node) => [node.id, node.name]));
    const links = (node) => {
        const outgoing = document.edges.filter((edge) => edge.from === node.id).map((edge) => `${edge.kind} ${names.get(edge.to)}${edge.qualifier ? ` (${edge.qualifier})` : ''}`);
        return outgoing.join('; ') || '—';
    };
    return _jsxs("details", { className: "b10x-graph__table", children: [_jsx("summary", { children: "Protocol as text" }), KIND_ORDER.map((kind) => {
                const nodes = document.nodes.filter((node) => node.kind === kind);
                if (!nodes.length)
                    return null;
                return _jsx("div", { className: "b10x-table-wrap", children: _jsxs("table", { children: [_jsx("caption", { children: PROTOCOL_KIND_LABELS[kind].plural }), _jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Name" }), _jsx("th", { scope: "col", children: "Description" }), _jsx("th", { scope: "col", children: "Rule" }), _jsx("th", { scope: "col", children: "Leads to" })] }) }), _jsx("tbody", { children: nodes.map((node) => _jsxs("tr", { children: [_jsx("th", { scope: "row", children: _jsx("code", { children: node.name }) }), _jsx("td", { children: node.description ?? '—' }), _jsx("td", { children: [node.predicate ? predicateLines(node.predicate).map((line) => `${'  '.repeat(line.depth)}${line.text}${line.reference ? ` ${line.reference}` : ''}`).join('\n') : '', node.capabilities?.length ? `needs ${node.capabilities.join(', ')}` : '', node.effect ? `effect ${node.effect}` : ''].filter(Boolean).join('\n') || '—' }), _jsx("td", { children: links(node) })] }, node.id)) })] }) }, kind);
            })] });
}
export function DomainGraph({ data, title, description, caption, variant = 'default' }) {
    const prepared = useMemo(() => {
        try {
            const document = parseDomainGraph(data);
            return { document, layout: layoutDomainGraph(document) };
        }
        catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }, [data]);
    if ('error' in prepared)
        return _jsx(GraphError, { kind: "domain graph", message: prepared.error });
    return _jsx(DomainGraphView, { document: prepared.document, layout: prepared.layout, title: title, description: description, caption: caption, variant: variant });
}
function DomainGraphView({ document, layout, title, description, caption, variant }) {
    const base = `b10x-dg-${useId().replaceAll(':', '')}`;
    const hero = variant === 'hero';
    const sizing = useFit(layout.width);
    const [hovered, setHovered] = useState(null);
    const [pinned, setPinned] = useState(null);
    const current = hovered ?? pinned;
    const neighbours = useMemo(() => {
        if (!current)
            return null;
        const result = new Set([current]);
        for (const relation of document.relations)
            if (relation.from === current || relation.to === current) {
                result.add(relation.from);
                result.add(relation.to);
            }
        return result;
    }, [document, current]);
    const placed = layout.nodes.find((node) => node.entity.id === current);
    const kinds = new Set(document.relations.map((relation) => relation.kind));
    const lifecycles = document.entities.filter((entity) => (entity.lifecycle?.transitions?.length ?? 0) > 0);
    const onKeyDown = (event) => { if (event.key === 'Escape') {
        setPinned(null);
        setHovered(null);
    } };
    const heading = title ?? document.domain.display ?? document.domain.id;
    const legend = _jsxs("ul", { className: "b10x-graph__legend", "aria-label": "Legend", children: [_jsxs("li", { children: [_jsx("span", { className: "b10x-graph__swatch b10x-graph__swatch--entity", "aria-hidden": "true" }), "Entities", _jsx("span", { className: "b10x-graph__count", children: document.entities.length })] }), kinds.has('owns') && _jsxs("li", { children: [_jsxs("svg", { className: "b10x-graph__key", viewBox: "0 0 26 12", "aria-hidden": "true", children: [_jsx("path", { d: "M1,6 L5,3 L9,6 L5,9 z", className: "b10x-graph__key-fill" }), _jsx("path", { d: "M9,6 H25" })] }), "Owns"] }), kinds.has('references') && _jsxs("li", { children: [_jsxs("svg", { className: "b10x-graph__key", viewBox: "0 0 26 12", "aria-hidden": "true", children: [_jsx("circle", { cx: 4, cy: 6, r: 2.6 }), _jsx("path", { d: "M7,6 H25" })] }), "References"] }), !hero && _jsxs("li", { children: [_jsx("svg", { className: "b10x-graph__key", viewBox: "0 0 26 12", "aria-hidden": "true", children: _jsx("path", { d: "M1,6 H25 M19,1 V11" }) }), "One"] }), !hero && _jsxs("li", { children: [_jsx("svg", { className: "b10x-graph__key", viewBox: "0 0 26 12", "aria-hidden": "true", children: _jsx("path", { d: "M1,6 H25 M17,6 L25,1 M17,6 L25,11" }) }), "Many"] }), !hero && _jsxs("li", { children: [_jsx("span", { className: "b10x-graph__state-key", "aria-hidden": "true", children: "\u25CF" }), "Initial state"] })] });
    return _jsxs("figure", { className: classes('b10x-graph', 'b10x-domain-graph', hero && 'b10x-graph--hero'), "aria-labelledby": `${base}-title`, onKeyDown: onKeyDown, children: [hero
                ? _jsxs("p", { className: "b10x-graph__kicker b10x-graph__hero-title", children: [_jsx("code", { id: `${base}-title`, children: document.domain.id }), " \u00B7 ESS domain"] })
                : _jsxs("header", { className: "b10x-graph__header", children: [_jsxs("div", { className: "b10x-graph__heading", children: [_jsxs("p", { className: "b10x-graph__kicker", children: ["ESS domain \u00B7 ", _jsx("code", { children: document.domain.id })] }), _jsx("strong", { id: `${base}-title`, className: "b10x-graph__title", children: heading }), (description ?? document.domain.summary) && _jsx("p", { className: "b10x-graph__description", children: description ?? document.domain.summary })] }), legend] }), _jsx("div", { className: "b10x-graph__viewport", ref: sizing.viewport, children: _jsxs("div", { className: "b10x-graph__canvas", style: hero ? { maxWidth: `${Math.ceil(layout.width)}px` } : sizing.style, children: [_jsxs("svg", { viewBox: `-4 -4 ${f(layout.width + 8)} ${f(layout.height + 8)}`, className: "b10x-graph__svg", role: "group", "aria-labelledby": `${base}-title`, "aria-describedby": `${base}-hint`, children: [_jsxs("defs", { children: [_jsx("marker", { id: `${base}-owns`, viewBox: "0 0 12 10", refX: "1", refY: "5", markerWidth: "12", markerHeight: "10", markerUnits: "userSpaceOnUse", orient: "auto", children: _jsx("path", { d: "M1,5 L6,1.5 L11,5 L6,8.5 z", className: "b10x-graph__marker-fill" }) }), _jsx("marker", { id: `${base}-references`, viewBox: "0 0 10 10", refX: "2", refY: "5", markerWidth: "9", markerHeight: "9", markerUnits: "userSpaceOnUse", orient: "auto", children: _jsx("circle", { cx: 5, cy: 5, r: 3, className: "b10x-graph__marker-open" }) }), _jsx("marker", { id: `${base}-one`, viewBox: "0 0 12 12", refX: "11", refY: "6", markerWidth: "12", markerHeight: "12", markerUnits: "userSpaceOnUse", orient: "auto", children: _jsx("path", { d: "M5,1 V11", className: "b10x-graph__marker-line" }) }), _jsx("marker", { id: `${base}-many`, viewBox: "0 0 12 12", refX: "11", refY: "6", markerWidth: "12", markerHeight: "12", markerUnits: "userSpaceOnUse", orient: "auto", children: _jsx("path", { d: "M1,6 L11,1 M1,6 L11,11 M1,6 H11", className: "b10x-graph__marker-line" }) })] }), _jsx("g", { className: "b10x-graph__edges", "aria-hidden": "true", children: layout.edges.map(({ relation, index, path }) => {
                                        const lit = neighbours !== null && (relation.from === current || relation.to === current);
                                        return _jsx("path", { d: path, pathLength: hero ? 1 : undefined, className: classes('b10x-graph__edge', `b10x-graph__edge--${relation.kind}`, lit && 'is-lit', neighbours !== null && !lit && 'is-dimmed'), markerStart: `url(#${base}-${relation.kind})`, markerEnd: `url(#${base}-${relation.cardinality})` }, index);
                                    }) }), _jsx("g", { className: "b10x-graph__relation-labels", "aria-hidden": "true", children: layout.edges.map(({ relation, index, start, end, route }) => {
                                        const dim = neighbours !== null && relation.from !== current && relation.to !== current;
                                        const anchorEnd = route === 'backward';
                                        return _jsx("text", { x: f(start.x + (anchorEnd ? -10 : 10)), y: f(start.y + (end.y < start.y - 4 ? 13 : -6)), textAnchor: anchorEnd ? 'end' : 'start', className: classes('b10x-graph__relation-label', dim && 'is-dimmed'), children: relation.name }, index);
                                    }) }), _jsx("g", { className: "b10x-graph__nodes", children: layout.nodes.map(({ entity, x, y, width, height, displayName }) => {
                                        const isCurrent = entity.id === current;
                                        return _jsxs("g", { transform: `translate(${f(x)},${f(y)})`, className: classes('b10x-graph__node', 'b10x-graph__node--entity', neighbours !== null && !neighbours.has(entity.id) && 'is-dimmed', isCurrent && 'is-current'), tabIndex: 0, role: "button", "aria-pressed": pinned === entity.id, "aria-label": `Entity ${entity.name}${entity.summary ? `. ${entity.summary}` : ''}`, "aria-describedby": isCurrent ? `${base}-tooltip` : undefined, onPointerEnter: () => setHovered(entity.id), onPointerLeave: () => setHovered(null), onFocus: () => setHovered(entity.id), onBlur: () => setHovered(null), onClick: () => setPinned((value) => value === entity.id ? null : entity.id), onKeyDown: (event) => { if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                setPinned((value) => value === entity.id ? null : entity.id);
                                            } }, children: [_jsx("rect", { className: "b10x-graph__hit", x: -6, y: -6, width: width + 12, height: height + 12, rx: 12 }), _jsx("rect", { className: "b10x-graph__body", width: width, height: height, rx: 8 }), _jsx("rect", { className: "b10x-graph__accent", x: 0, y: 10, width: 3, height: height - 20, rx: 1.5 }), _jsx("text", { className: "b10x-graph__node-kicker", x: 16, y: 21, children: `ENTITY · ${entity.fields.length + 1} FIELD${entity.fields.length ? 'S' : ''}` }), _jsx("text", { className: "b10x-graph__entity-name", x: 16, y: 42, children: displayName }), _jsx(StateChips, { entity: entity, width: width })] }, entity.id);
                                    }) })] }), placed && !hero && _jsx(DomainTooltip, { id: `${base}-tooltip`, placed: placed, layout: layout, document: document })] }) }), hero
                ? _jsxs(_Fragment, { children: [legend, _jsx("p", { className: "b10x-sr-only", id: `${base}-hint`, children: "Hover or focus an entity to see what it relates to." })] })
                : _jsxs("div", { className: "b10x-graph__tools", children: [_jsx("p", { className: "b10x-graph__hint", id: `${base}-hint`, "data-pagefind-ignore": true, children: "Hover or focus an entity to see its fields, lifecycle and relations. Press Enter to pin it, Escape to clear." }), _jsx(FitToggle, { ...sizing })] }), !hero && lifecycles.length > 0 && _jsxs("section", { className: "b10x-lifecycles", "aria-label": "Lifecycles", children: [_jsx("p", { className: "b10x-graph__kicker", children: "Lifecycles with transitions" }), _jsx("div", { children: lifecycles.map((entity) => _jsx(Lifecycle, { entity: entity }, entity.id)) })] }), caption && _jsx("figcaption", { className: "b10x-graph__caption", children: caption }), !hero && _jsx(DomainTable, { document: document }), !hero && document.domain.source && _jsxs("p", { className: "b10x-graph__source", children: ["Source: ", document.domain.source] })] });
}
function StateChips({ entity, width }) {
    const lifecycle = entity.lifecycle;
    if (!lifecycle)
        return _jsx("text", { className: "b10x-graph__node-meta", x: 16, y: DOMAIN_NODE_HEIGHT - 20, children: "No lifecycle" });
    const chips = [];
    let x = 16;
    const limit = width - 16;
    lifecycle.states.forEach((state, index) => {
        const initial = state === lifecycle.initial;
        const chipWidth = state.length * 6.3 + (initial ? 26 : 16);
        if (x + chipWidth > limit) {
            if (chips.length && !chips.some((chip) => chip.key === 'more'))
                chips.push(_jsx("text", { className: "b10x-graph__node-meta", x: x, y: DOMAIN_NODE_HEIGHT - 20, children: `+${lifecycle.states.length - index}` }, "more"));
            x = limit + 1;
            return;
        }
        chips.push(_jsxs("g", { transform: `translate(${f(x)},${DOMAIN_NODE_HEIGHT - 34})`, className: classes('b10x-graph__state', initial && 'is-initial'), children: [_jsx("rect", { width: f(chipWidth), height: 20, rx: 10 }), initial && _jsx("circle", { cx: 10, cy: 10, r: 3 }), _jsx("text", { x: initial ? 18 : 8, y: 14, children: state })] }, state));
        x += chipWidth + 6;
    });
    return _jsx(_Fragment, { children: chips });
}
function DomainTooltip({ id, placed, layout, document }) {
    const { entity } = placed;
    const names = new Map(document.entities.map((item) => [item.id, item.name]));
    const outgoing = document.relations.filter((relation) => relation.from === entity.id);
    const incoming = document.relations.filter((relation) => relation.to === entity.id);
    return _jsxs("div", { className: "b10x-graph__tooltip b10x-graph__tooltip--entity", role: "tooltip", id: id, style: tooltipPosition(placed, layout.width, layout.height), children: [_jsx("p", { className: "b10x-graph__tooltip-kicker", children: "Entity" }), _jsx("p", { className: "b10x-graph__tooltip-name", children: _jsx("code", { children: entity.name }) }), entity.summary && _jsx("p", { className: "b10x-graph__tooltip-text", children: entity.summary }), _jsx(TooltipSection, { title: "Fields", children: _jsxs("ul", { className: "b10x-graph__fields", children: [_jsxs("li", { children: [_jsx("code", { children: entity.identity.name }), _jsx("span", { children: entity.identity.type }), _jsx("b", { children: "identity" })] }), entity.fields.map((field) => _jsxs("li", { children: [_jsx("code", { children: field.name }), _jsx("span", { children: field.type })] }, field.name))] }) }), entity.lifecycle && _jsx(TooltipSection, { title: "Lifecycle", children: entity.lifecycle.states.map((state) => _jsx("code", { children: state === entity.lifecycle.initial ? `● ${state}` : state }, state)) }), entity.createdBy?.length ? _jsx(TooltipSection, { title: "Created by", children: entity.createdBy.map((command) => _jsx("code", { children: command }, command)) }) : null, outgoing.length > 0 && _jsx(TooltipSection, { title: "Relations", children: outgoing.map((relation) => _jsx("span", { children: relationText(relation, names) }, relation.name)) }), incoming.length > 0 && _jsx(TooltipSection, { title: "Referenced by", children: incoming.map((relation) => _jsxs("span", { children: [_jsx("code", { children: names.get(relation.from) }), ".", relation.name] }, `${relation.from}-${relation.name}`)) })] });
}
function relationText(relation, names) {
    return _jsxs(_Fragment, { children: [_jsx("code", { children: relation.name }), " ", relation.kind, " ", relation.cardinality === 'many' ? 'many' : 'one', " ", _jsx("code", { children: names.get(relation.to) }), relation.via && _jsxs(_Fragment, { children: [" via ", _jsx("code", { children: relation.via })] })] });
}
function Lifecycle({ entity }) {
    const lifecycle = entity.lifecycle;
    const transitions = lifecycle.transitions ?? [];
    const order = lifecycle.states;
    const widths = order.map((state) => state.length * 7.4 + 30);
    const gap = Math.max(110, ...transitions.map((transition) => (transition.name.length + (transition.commands?.[0]?.length ?? 0) + 3) * 6.2 + 20));
    const lead = entity.createdBy?.length ? 56 : 8;
    const xs = [];
    let cursor = lead;
    widths.forEach((width) => { xs.push(cursor); cursor += width + gap; });
    const width = cursor - gap + 8;
    const height = 132;
    const middle = 66;
    const centre = (state) => { const index = order.indexOf(state); return xs[index] + widths[index] / 2; };
    const edge = (state, side) => { const index = order.indexOf(state); return side === 'left' ? xs[index] : xs[index] + widths[index]; };
    const markerId = `b10x-lc-${entity.id.replace(/[^a-zA-Z0-9]+/g, '-')}`;
    return _jsxs("figure", { className: "b10x-lifecycle", "aria-label": `${entity.name} lifecycle: ${transitions.map((transition) => `${transition.name} from ${transition.from.join(' or ')} to ${transition.to}`).join('; ')}`, children: [_jsx("figcaption", { children: _jsx("code", { children: entity.name }) }), _jsxs("svg", { viewBox: `0 0 ${f(width)} ${height}`, style: { maxWidth: `${Math.ceil(width)}px` }, "aria-hidden": "true", children: [_jsx("defs", { children: _jsx("marker", { id: markerId, viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse", children: _jsx("path", { d: "M0,1 L9,5 L0,9 z", className: "b10x-graph__arrow b10x-graph__arrow--lit" }) }) }), entity.createdBy?.length ? _jsxs("g", { className: "b10x-lifecycle__entry", children: [_jsx("circle", { cx: 10, cy: middle, r: 5 }), _jsx("path", { d: `M16,${middle} H${f(xs[order.indexOf(lifecycle.initial)] - 4)}`, markerEnd: `url(#${markerId})` }), _jsx("text", { x: 8, y: middle + 24, children: entity.createdBy[0] })] }) : null, transitions.flatMap((transition, tIndex) => transition.from.map((from) => {
                        const forward = order.indexOf(transition.to) >= order.indexOf(from);
                        const startX = forward ? edge(from, 'right') - 10 : edge(from, 'left') + 10;
                        const endX = forward ? edge(transition.to, 'left') + 10 : edge(transition.to, 'right') - 10;
                        const lift = forward ? -1 : 1;
                        const y = middle + lift * 14;
                        const peak = middle + lift * 48;
                        const label = `${transition.name}${transition.commands?.length ? ` · ${transition.commands.join(', ')}` : ''}`;
                        return _jsxs("g", { className: "b10x-lifecycle__transition", children: [_jsx("path", { d: `M${f(startX)},${f(y)} C${f(startX)},${f(peak)} ${f(endX)},${f(peak)} ${f(endX)},${f(y)}`, markerEnd: `url(#${markerId})` }), _jsx("text", { x: f((centre(from) + centre(transition.to)) / 2), y: f(middle + lift * 44 + (forward ? -4 : 12)), textAnchor: "middle", children: label })] }, `${tIndex}-${from}`);
                    })), order.map((state, index) => _jsxs("g", { transform: `translate(${f(xs[index])},${middle - 14})`, className: classes('b10x-lifecycle__state', state === lifecycle.initial && 'is-initial', lifecycle.terminal?.includes(state) && 'is-terminal'), children: [_jsx("rect", { width: f(widths[index]), height: 28, rx: 14 }), _jsx("text", { x: f(widths[index] / 2), y: 18.5, textAnchor: "middle", children: state })] }, state))] })] });
}
function DomainTable({ document }) {
    const names = new Map(document.entities.map((entity) => [entity.id, entity.name]));
    return _jsxs("details", { className: "b10x-graph__table", children: [_jsx("summary", { children: "Domain as text" }), _jsx("div", { className: "b10x-table-wrap", children: _jsxs("table", { children: [_jsx("caption", { children: "Entities" }), _jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Entity" }), _jsx("th", { scope: "col", children: "Identity and fields" }), _jsx("th", { scope: "col", children: "Lifecycle" }), _jsx("th", { scope: "col", children: "Relations" })] }) }), _jsx("tbody", { children: document.entities.map((entity) => _jsxs("tr", { children: [_jsx("th", { scope: "row", children: _jsx("code", { children: entity.name }) }), _jsx("td", { children: [`${entity.identity.name}: ${entity.identity.type} (identity)`, ...entity.fields.map((field) => `${field.name}: ${field.type}`)].join('\n') }), _jsx("td", { children: entity.lifecycle ? [`states ${entity.lifecycle.states.join(', ')}; initial ${entity.lifecycle.initial}`, ...(entity.lifecycle.transitions ?? []).map((transition) => `${transition.name}: ${transition.from.join(' or ')} → ${transition.to}${transition.commands?.length ? ` (${transition.commands.join(', ')})` : ''}`)].join('\n') : '—' }), _jsx("td", { children: document.relations.filter((relation) => relation.from === entity.id).map((relation) => `${relation.name} ${relation.kind} ${relation.cardinality} ${names.get(relation.to)}`).join('\n') || '—' })] }, entity.id)) })] }) })] });
}
// ---------------------------------------------------------------------------------------------
function tooltipPosition(placed, width, height) {
    const style = {};
    // The tooltip is about 330 layout units wide at full scale; never let it leave the canvas.
    const needed = 340;
    const rightRoom = width - (placed.x + placed.width);
    const below = placed.y + placed.height / 2 > height * 0.55;
    if (rightRoom >= needed)
        style.left = pct(placed.x + placed.width + 14, width);
    else if (placed.x >= needed)
        style.right = pct(width - placed.x + 14, width);
    else {
        // Neither side has room: sit under (or over) the node, aligned to whichever edge fits.
        if (placed.x + needed <= width)
            style.left = pct(placed.x, width);
        else
            style.right = pct(width - placed.x - placed.width, width);
        if (below)
            style.bottom = pct(height - placed.y + 10, height);
        else
            style.top = pct(placed.y + placed.height + 10, height);
        return style;
    }
    if (below)
        style.bottom = pct(height - placed.y - placed.height, height);
    else
        style.top = pct(placed.y, height);
    return style;
}
function GraphError({ kind, message }) {
    return _jsxs("aside", { className: "b10x-callout b10x-callout--danger b10x-graph-error", role: "alert", children: [_jsxs("p", { className: "b10x-callout__title b10x-eyebrow", children: ["Cannot render ", kind] }), _jsx("div", { className: "b10x-callout__content", children: _jsx("p", { children: _jsx("code", { children: message }) }) })] });
}
function classes(...values) {
    return values.filter(Boolean).join(' ');
}
function pct(value, total) {
    return `${Math.round((value / total) * 10000) / 100}%`;
}
function f(value) {
    return String(Math.round(value * 10) / 10);
}
