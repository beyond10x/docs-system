import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useMemo, useState } from 'react';
import { layeredLayout } from './graph-layout.js';
import { decisionSteps, formatDuration, parseSessionComposition, sessionClock, sessionKpis } from './session-data.js';
/** One HTML tooltip per chart, anchored to the mark in viewBox units so it scales with the SVG. */
function useTip() {
    const [tip, setTip] = useState(null);
    const bind = (next) => ({
        onPointerEnter: () => setTip(next),
        onPointerLeave: () => setTip(null),
        onFocus: () => setTip(next),
        onBlur: () => setTip(null),
    });
    return [tip, bind];
}
function TipBox({ tip, viewWidth, viewHeight, id }) {
    const style = {};
    const centre = tip.x + tip.width / 2;
    if (centre > viewWidth * 0.62)
        style.right = `${pct(viewWidth - tip.x + 8, viewWidth)}`;
    else
        style.left = `${pct(tip.x + Math.min(tip.width, 40) + 8, viewWidth)}`;
    if (tip.y > viewHeight * 0.6)
        style.bottom = pct(viewHeight - tip.y + 6, viewHeight);
    else
        style.top = pct(tip.y + tip.height + 6, viewHeight);
    return _jsxs("div", { className: "b10x-chart-tip", role: "tooltip", id: id, style: style, children: [_jsxs("p", { className: "b10x-chart-tip__title", children: [tip.key && _jsx("span", { className: "b10x-chart-tip__key", style: { background: tip.key }, "aria-hidden": "true" }), tip.title] }), tip.lines.map((line) => _jsx("p", { children: line }, line))] });
}
function useSession(data) {
    return useMemo(() => {
        try {
            return { document: parseSessionComposition(data) };
        }
        catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }, [data]);
}
const series = (slot) => slot && slot >= 1 && slot <= 4 ? `var(--b10x-series-${slot})` : 'var(--b10x-series-neutral)';
// ---------------------------------------------------------------------------------------------
// Stat tiles
// ---------------------------------------------------------------------------------------------
export function StatTiles({ items, label = 'Key figures' }) {
    return _jsx("dl", { className: "b10x-stat-tiles", "aria-label": label, children: items.map((item) => _jsxs("div", { className: "b10x-stat-tile", children: [_jsx("dt", { children: item.label }), _jsx("dd", { className: "b10x-stat-tile__value", children: item.value }), item.detail && _jsx("dd", { className: "b10x-stat-tile__detail", children: item.detail })] }, item.label)) });
}
/** The headline figures of a session document, computed rather than typed. */
export function SessionKpis({ data, ...options }) {
    const session = useSession(data);
    if ('error' in session)
        return _jsx(ChartError, { kind: "session figures", message: session.error });
    return _jsx(StatTiles, { items: sessionKpis(session.document, options) });
}
export function SessionTimeline({ data, title = 'Who did what, when', description = 'One lane per participant. Colour is the protocol the work belonged to; hollow bars were built and then discarded.', decisionLanes = {}, decisionProtocol = 'design.decision' }) {
    const session = useSession(data);
    const base = `b10x-tl-${useId().replaceAll(':', '')}`;
    const [tip, bind] = useTip();
    if ('error' in session)
        return _jsx(ChartError, { kind: "session timeline", message: session.error });
    const document = session.document;
    const at = sessionClock(document);
    const start = Date.parse(document.window.start) / 1000;
    const end = Date.parse(document.window.end) / 1000;
    const W = 1200;
    const left = 196;
    const right = 18;
    const rowH = 30;
    const top = 10;
    const barH = 16;
    const H = top + document.lanes.length * rowH + 30;
    const x = (time) => left + ((time - start) / (end - start)) * (W - left - right);
    const laneIndex = new Map(document.lanes.map((lane, index) => [lane.id, index]));
    const laneY = (lane) => top + (laneIndex.get(lane) ?? 0) * rowH + (rowH - barH) / 2;
    const slot = new Map(document.protocols.map((protocol) => [protocol.id, protocol.slot]));
    const protocolLabel = new Map(document.protocols.map((protocol) => [protocol.id, protocol.label]));
    const marksLane = decisionLanes.marks ?? document.lanes.find((lane) => lane.principal?.startsWith('human:'))?.id ?? document.lanes[0]?.id;
    const questionLane = decisionLanes.question ?? 'design';
    const draftLane = decisionLanes.draft ?? 'orchestrator';
    const ticks = [];
    for (let time = Math.ceil(start / 1800) * 1800; time <= end; time += 1800)
        ticks.push(time);
    const steps = decisionSteps(document);
    const bars = [];
    const bar = (key, lane, from, to, protocol, tipTitle, lines, flags = {}) => {
        if (!laneIndex.has(lane))
            return;
        const x0 = x(from);
        const width = Math.max(3, x(to) - x0);
        const y = laneY(lane);
        const colour = series(slot.get(protocol));
        const shape = flags.discarded
            ? _jsx("rect", { x: f(x0 + 1), y: f(y + 1), width: f(Math.max(1, width - 2)), height: barH - 2, rx: 4, className: "b10x-timeline__bar b10x-timeline__bar--discarded", style: { stroke: colour, strokeDasharray: flags.approximate ? '4 3' : undefined } })
            : flags.approximate
                ? _jsx("rect", { x: f(x0 + 1), y: f(y + 1), width: f(Math.max(1, width - 2)), height: barH - 2, rx: 4, className: "b10x-timeline__bar b10x-timeline__bar--approximate", style: { stroke: colour, fill: colour } })
                : _jsx("rect", { x: f(x0), y: f(y), width: f(width), height: barH, rx: 4, className: ['b10x-timeline__bar', flags.open && 'b10x-timeline__bar--open'].filter(Boolean).join(' '), style: { fill: colour } });
        bars.push(_jsxs("g", { className: "b10x-chart-mark", tabIndex: 0, "aria-label": `${tipTitle}. ${lines.join('. ')}`, "aria-describedby": tip?.title === tipTitle ? `${base}-tip` : undefined, ...bind({ x: x0, y, width, height: barH, title: tipTitle, lines, key: colour }), children: [_jsx("rect", { className: "b10x-chart-hit", x: f(x0 - 3), y: f(y - 5), width: f(width + 6), height: barH + 10 }), shape] }, key));
    };
    document.episodes.forEach((episode, index) => {
        const from = at(episode.start);
        const to = at(episode.end);
        bar(`e${index}`, episode.lane, from, to, episode.protocol, episode.label, [
            protocolLabel.get(episode.protocol) ?? episode.protocol,
            `${episode.start}–${episode.end} UTC · ${formatDuration(to - from)}`,
            ...(episode.discarded ? ['Discarded'] : []), ...(episode.approximate ? ['Times approximate'] : []), ...(episode.open ? ['Still running'] : []),
        ], episode);
    });
    steps.forEach(({ decision, questionToDecision, relayToDraft }) => {
        bar(`q${decision.n}`, questionLane, at(decision.question), at(decision.decided), decisionProtocol, `#${decision.n} ${decision.title}`, [`Question → decision · ${formatDuration(questionToDecision)}`, `${decision.question}–${decision.decided} UTC`]);
        bar(`d${decision.n}`, draftLane, at(decision.relayed), at(decision.drafted), decisionProtocol, `#${decision.n} draft ${decision.adr}`, [`Relay → draft arrived · ${formatDuration(relayToDraft)}`, `${decision.relayed}–${decision.drafted} UTC`]);
    });
    const markers = [];
    if (marksLane) {
        const cy = laneY(marksLane) + barH / 2;
        steps.forEach(({ decision }) => {
            const cx = x(at(decision.decided));
            markers.push(_jsxs("g", { className: "b10x-chart-mark", tabIndex: 0, "aria-label": `Decision ${decision.n}: ${decision.title}, ${decision.decided} UTC`, ...bind({ x: cx - 6, y: cy - 6, width: 12, height: 12, title: `Decision #${decision.n}: ${decision.title}`, lines: [`${decision.decided} UTC · ${decision.adr}`], key: series(slot.get(decisionProtocol)) }), children: [_jsx("circle", { className: "b10x-chart-hit", cx: f(cx), cy: f(cy), r: 12 }), _jsx("path", { d: `M${f(cx)} ${f(cy - 6)} L${f(cx + 6)} ${f(cy)} L${f(cx)} ${f(cy + 6)} L${f(cx - 6)} ${f(cy)} Z`, className: "b10x-timeline__marker", style: { fill: series(slot.get(decisionProtocol)) } })] }, `m${decision.n}`));
        });
        (document.operator_marks ?? []).forEach((mark, index) => {
            const cx = x(at(mark.t));
            markers.push(_jsxs("g", { className: "b10x-chart-mark", tabIndex: 0, "aria-label": `Approval at ${mark.t} UTC: ${mark.label}`, ...bind({ x: cx - 7, y: cy - 7, width: 14, height: 14, title: mark.kind === 'approval' ? 'Approval' : mark.kind, lines: [mark.label, `${mark.t} UTC`] }), children: [_jsx("circle", { className: "b10x-chart-hit", cx: f(cx), cy: f(cy), r: 12 }), _jsx("path", { d: `M${f(cx)} ${f(cy - 7)} L${f(cx + 7)} ${f(cy + 6)} L${f(cx - 7)} ${f(cy + 6)} Z`, className: "b10x-timeline__marker b10x-timeline__marker--approval" })] }, `a${index}`));
        });
    }
    return _jsxs("figure", { className: "b10x-chart b10x-timeline", "aria-labelledby": `${base}-title`, children: [_jsx(ChartHeader, { id: `${base}-title`, title: title, description: description }), _jsxs("ul", { className: "b10x-chart__legend", "aria-label": "Legend", children: [document.protocols.map((protocol) => _jsxs("li", { children: [_jsx("span", { className: "b10x-chart__swatch", style: { background: series(protocol.slot) }, "aria-hidden": "true" }), protocol.label] }, protocol.id)), _jsxs("li", { children: [_jsx("span", { className: "b10x-chart__swatch b10x-chart__swatch--hollow", "aria-hidden": "true" }), "Discarded"] }), document.episodes.some((episode) => episode.approximate) && _jsxs("li", { children: [_jsx("span", { className: "b10x-chart__swatch b10x-chart__swatch--dashed", "aria-hidden": "true" }), "Approximate time"] }), _jsxs("li", { children: [_jsx("span", { className: "b10x-chart__glyph", "aria-hidden": "true", children: "\u25C6" }), "Operator decision"] }), (document.operator_marks ?? []).length > 0 && _jsxs("li", { children: [_jsx("span", { className: "b10x-chart__glyph", "aria-hidden": "true", children: "\u25B2" }), "Operator approval"] })] }), _jsx("div", { className: "b10x-chart__viewport", children: _jsxs("div", { className: "b10x-chart__canvas", style: { minWidth: '760px' }, children: [_jsxs("svg", { viewBox: `0 0 ${W} ${H}`, className: "b10x-chart__svg", role: "group", "aria-labelledby": `${base}-title`, children: [_jsxs("g", { "aria-hidden": "true", children: [ticks.map((time) => _jsxs("g", { children: [_jsx("line", { x1: f(x(time)), x2: f(x(time)), y1: top - 4, y2: H - 24, className: "b10x-chart__grid" }), _jsx("text", { x: f(x(time)), y: H - 8, textAnchor: x(time) > W - right - 30 ? 'end' : 'middle', className: "b10x-chart__tick", children: `${new Date(time * 1000).toISOString().slice(11, 16)} UTC` })] }, time)), document.lanes.map((lane, index) => _jsxs("g", { children: [_jsx("line", { x1: left, x2: W - right, y1: top + (index + 1) * rowH, y2: top + (index + 1) * rowH, className: "b10x-chart__lane-rule" }), _jsx("text", { x: left - 14, y: top + index * rowH + rowH / 2 + 4, textAnchor: "end", className: "b10x-chart__label", children: lane.label })] }, lane.id))] }), _jsx("g", { children: bars }), _jsx("g", { children: markers })] }), tip && _jsx(TipBox, { tip: tip, viewWidth: W, viewHeight: H, id: `${base}-tip` })] }) }), _jsxs("details", { className: "b10x-chart__table", children: [_jsx("summary", { children: "Table view" }), _jsx("div", { className: "b10x-table-wrap", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Lane" }), _jsx("th", { scope: "col", children: "Protocol" }), _jsx("th", { scope: "col", children: "Episode" }), _jsx("th", { scope: "col", children: "Start" }), _jsx("th", { scope: "col", children: "End" }), _jsx("th", { scope: "col", children: "Duration" })] }) }), _jsx("tbody", { children: document.episodes.map((episode, index) => _jsxs("tr", { children: [_jsx("td", { children: document.lanes.find((lane) => lane.id === episode.lane)?.label }), _jsx("td", { children: protocolLabel.get(episode.protocol) }), _jsxs("td", { children: [episode.label, episode.discarded ? ' (discarded)' : '', episode.approximate ? ' (approximate)' : ''] }), _jsx("td", { children: episode.start }), _jsx("td", { children: episode.end }), _jsx("td", { children: formatDuration(at(episode.end) - at(episode.start)) })] }, index)) })] }) })] })] });
}
const DECISION_PARTS = [{ label: 'Question → decision', slot: 1 }, { label: 'Decision → relay', slot: 2 }, { label: 'Relay → draft arrived', slot: 3 }];
export function StepBars({ data, rows, parts, title = 'Step by step', description }) {
    const base = `b10x-sb-${useId().replaceAll(':', '')}`;
    const [tip, bind] = useTip();
    const session = useSession(data ?? null);
    let resolvedRows;
    let resolvedParts;
    if (rows && parts) {
        resolvedRows = rows;
        resolvedParts = parts;
    }
    else if ('document' in session) {
        resolvedRows = decisionSteps(session.document).map((step) => ({ label: `#${step.decision.n} ${step.decision.title}`, values: [step.questionToDecision, step.decisionToRelay, step.relayToDraft] }));
        resolvedParts = DECISION_PARTS;
    }
    else
        return _jsx(ChartError, { kind: "step bars", message: 'error' in session ? session.error : 'StepBars needs data, or rows and parts' });
    const W = 1200;
    const left = 270;
    const right = 90;
    const rowH = 28;
    const top = 6;
    const barH = 16;
    const H = top + resolvedRows.length * rowH + 30;
    const max = Math.max(1, ...resolvedRows.map((row) => row.values.reduce((sum, value) => sum + value, 0)));
    const step = [60, 120, 300, 600, 900, 1800, 3600, 7200].find((candidate) => max / candidate <= 6) ?? 7200;
    const limit = Math.ceil(max / step) * step;
    const x = (seconds) => left + (seconds / limit) * (W - left - right);
    const ticks = [];
    for (let value = 0; value <= limit; value += step)
        ticks.push(value);
    return _jsxs("figure", { className: "b10x-chart b10x-step-bars", "aria-labelledby": `${base}-title`, children: [_jsx(ChartHeader, { id: `${base}-title`, title: title, description: description }), _jsx("ul", { className: "b10x-chart__legend", "aria-label": "Legend", children: resolvedParts.map((part) => _jsxs("li", { children: [_jsx("span", { className: "b10x-chart__swatch", style: { background: series(part.slot) }, "aria-hidden": "true" }), part.label] }, part.label)) }), _jsx("div", { className: "b10x-chart__viewport", children: _jsxs("div", { className: "b10x-chart__canvas", style: { minWidth: '720px' }, children: [_jsxs("svg", { viewBox: `0 0 ${W} ${H}`, className: "b10x-chart__svg", role: "group", "aria-labelledby": `${base}-title`, children: [_jsx("g", { "aria-hidden": "true", children: ticks.map((value) => _jsxs("g", { children: [_jsx("line", { x1: f(x(value)), x2: f(x(value)), y1: top, y2: H - 24, className: value ? 'b10x-chart__grid' : 'b10x-chart__axis' }), _jsx("text", { x: f(x(value)), y: H - 8, textAnchor: "middle", className: "b10x-chart__tick", children: `${value / 60} min` })] }, value)) }), resolvedRows.map((row, index) => {
                                    const y = top + index * rowH + (rowH - barH) / 2;
                                    let accumulated = 0;
                                    const total = row.values.reduce((sum, value) => sum + value, 0);
                                    const visible = row.values.map((value, part) => ({ value, part })).filter((entry) => entry.value > 0);
                                    return _jsxs("g", { children: [_jsx("text", { x: left - 12, y: f(y + barH / 2 + 4), textAnchor: "end", className: "b10x-chart__label", children: row.label }), row.values.map((value, part) => {
                                                const from = accumulated;
                                                accumulated += value;
                                                if (value <= 0)
                                                    return null;
                                                const isLast = visible[visible.length - 1]?.part === part;
                                                const x0 = x(from) + (from > 0 ? 1 : 0);
                                                const width = Math.max(2, x(from + value) - x(from) - (from > 0 ? 1 : 0) - (isLast ? 0 : 1));
                                                const colour = series(resolvedParts[part]?.slot);
                                                const label = `${row.label}. ${resolvedParts[part]?.label}: ${formatDuration(value)}`;
                                                return _jsxs("g", { className: "b10x-chart-mark", tabIndex: 0, "aria-label": label, ...bind({ x: x0, y, width, height: barH, title: row.label, lines: [`${resolvedParts[part]?.label}: ${formatDuration(value)}`], key: colour }), children: [_jsx("rect", { className: "b10x-chart-hit", x: f(x0 - 1), y: f(y - 5), width: f(width + 2), height: barH + 10 }), _jsx("path", { d: isLast ? roundedEnd(x0, y, width, barH, 4) : `M${f(x0)},${f(y)} h${f(width)} v${barH} h${f(-width)} Z`, style: { fill: colour }, className: "b10x-step-bars__segment" })] }, part);
                                            }), _jsx("text", { x: f(x(total) + 8), y: f(y + barH / 2 + 4), className: "b10x-chart__value", children: formatDuration(total) })] }, row.label);
                                })] }), tip && _jsx(TipBox, { tip: tip, viewWidth: W, viewHeight: H, id: `${base}-tip` })] }) }), _jsxs("details", { className: "b10x-chart__table", children: [_jsx("summary", { children: "Table view" }), _jsx("div", { className: "b10x-table-wrap", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Item" }), resolvedParts.map((part) => _jsx("th", { scope: "col", children: part.label }, part.label)), _jsx("th", { scope: "col", children: "Total" })] }) }), _jsx("tbody", { children: resolvedRows.map((row) => _jsxs("tr", { children: [_jsx("th", { scope: "row", children: row.label }), row.values.map((value, index) => _jsx("td", { children: formatDuration(value) }, index)), _jsx("td", { children: formatDuration(row.values.reduce((sum, value) => sum + value, 0)) })] }, row.label)) })] }) })] })] });
}
function roundedEnd(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    return `M${f(x)},${f(y)} H${f(x + width - r)} Q${f(x + width)},${f(y)} ${f(x + width)},${f(y + r)} V${f(y + height - r)} Q${f(x + width)},${f(y + height)} ${f(x + width - r)},${f(y + height)} H${f(x)} Z`;
}
export function CompositionGraph({ data, title = 'The composition behind it', description }) {
    const base = `b10x-cg-${useId().replaceAll(':', '')}`;
    const [hovered, setHovered] = useState(null);
    const prepared = useMemo(() => {
        try {
            const graph = data?.graph ?? data;
            if (!graph || !Array.isArray(graph.columns) || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges))
                throw new Error('CompositionGraph needs columns, nodes and edges');
            const known = new Set(graph.nodes.map((node) => node.id));
            for (const [from, to] of graph.edges)
                if (!known.has(from) || !known.has(to))
                    throw new Error(`edge ${from} -> ${to} references an unknown node`);
            const layout = layeredLayout(graph.nodes.map((node) => ({ id: node.id, layer: node.col, width: 188, height: 46 })), graph.edges.map(([from, to]) => ({ from, to })), { layerGap: 44, nodeGap: 14, portSpread: 0.5 });
            return { graph, layout };
        }
        catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }, [data]);
    if ('error' in prepared)
        return _jsx(ChartError, { kind: "composition graph", message: prepared.error });
    const { graph, layout } = prepared;
    const header = 34;
    const byId = new Map(graph.nodes.map((node) => [node.id, node]));
    const linked = hovered ? new Set([hovered, ...graph.edges.filter(([from, to]) => from === hovered || to === hovered).flat()]) : null;
    const subtitle = (node) => node.detail ?? node.policy ?? (node.observed !== undefined ? (node.observed ? `${node.observed} case${node.observed === 1 ? '' : 's'} observed` : 'not observed') : '');
    const current = layout.nodes.find((node) => node.id === hovered);
    const currentNode = hovered ? byId.get(hovered) : undefined;
    const W = layout.width;
    const H = layout.height + header;
    return _jsxs("figure", { className: "b10x-chart b10x-composition", "aria-labelledby": `${base}-title`, children: [_jsx(ChartHeader, { id: `${base}-title`, title: title, description: description }), _jsx("div", { className: "b10x-chart__viewport", children: _jsxs("div", { className: "b10x-chart__canvas", style: { minWidth: `${Math.round(W * 0.78)}px`, maxWidth: `${Math.ceil(W)}px` }, children: [_jsxs("svg", { viewBox: `-2 -2 ${f(W + 4)} ${f(H + 4)}`, className: "b10x-chart__svg", role: "group", "aria-labelledby": `${base}-title`, children: [_jsx("g", { "aria-hidden": "true", children: layout.columns.map((column) => _jsx("text", { x: f(column.x + column.width / 2), y: 14, textAnchor: "middle", className: "b10x-chart__column", children: (graph.columns[column.index] ?? '').toUpperCase() }, column.index)) }), _jsxs("g", { transform: `translate(0,${header})`, children: [_jsx("g", { "aria-hidden": "true", children: layout.edges.map((edge) => {
                                                const lit = linked !== null && (edge.from === hovered || edge.to === hovered);
                                                return _jsx("path", { d: edge.path, className: ['b10x-chart__edge', lit && 'is-lit', linked !== null && !lit && 'is-dimmed'].filter(Boolean).join(' ') }, edge.index);
                                            }) }), layout.nodes.map((placed) => {
                                            const node = byId.get(placed.id);
                                            const sub = subtitle(node);
                                            const isProtocol = node.observed !== undefined || node.slot !== undefined;
                                            const room = Math.floor((placed.width - (isProtocol ? 62 : 26)) / 6.1);
                                            return _jsxs("g", { transform: `translate(${f(placed.x)},${f(placed.y)})`, className: ['b10x-chart-node', linked !== null && !linked.has(node.id) && 'is-dimmed', hovered === node.id && 'is-current'].filter(Boolean).join(' '), tabIndex: 0, "aria-label": `${graph.columns[node.col]}: ${node.label}${sub ? `, ${sub}` : ''}`, "aria-describedby": hovered === node.id ? `${base}-tip` : undefined, onPointerEnter: () => setHovered(node.id), onPointerLeave: () => setHovered(null), onFocus: () => setHovered(node.id), onBlur: () => setHovered(null), children: [_jsx("rect", { className: "b10x-chart-node__body", width: placed.width, height: placed.height, rx: 8 }), isProtocol && _jsx("rect", { x: 0, y: 9, width: 3, height: placed.height - 18, rx: 1.5, style: { fill: series(node.slot) } }), _jsx("text", { x: isProtocol ? 14 : 12, y: 19, className: "b10x-chart-node__label", children: node.label.length > room + 4 ? `${node.label.slice(0, room + 3)}…` : node.label }), sub && _jsx("text", { x: isProtocol ? 14 : 12, y: 35, className: "b10x-chart-node__sub", children: sub.length > room ? `${sub.slice(0, room - 1)}…` : sub }), isProtocol && node.observed ? _jsxs("g", { transform: `translate(${placed.width - 44},13)`, children: [_jsx("rect", { width: 34, height: 20, rx: 10, className: "b10x-chart-node__badge" }), _jsx("text", { x: 17, y: 14, textAnchor: "middle", className: "b10x-chart-node__count", children: `×${node.observed}` })] }) : null] }, node.id);
                                        })] })] }), current && currentNode && _jsx(TipBox, { id: `${base}-tip`, viewWidth: W + 4, viewHeight: H + 4, tip: { x: current.x, y: current.y + header, width: current.width, height: current.height, title: currentNode.label, lines: [graph.columns[currentNode.col] ?? '', ...(subtitle(currentNode) ? [subtitle(currentNode)] : []), ...(currentNode.policy && currentNode.detail ? [currentNode.policy] : [])], key: currentNode.slot !== undefined ? series(currentNode.slot) : undefined } })] }) }), _jsxs("details", { className: "b10x-chart__table", children: [_jsx("summary", { children: "Table view" }), _jsx("div", { className: "b10x-table-wrap", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Column" }), _jsx("th", { scope: "col", children: "Node" }), _jsx("th", { scope: "col", children: "Detail" }), _jsx("th", { scope: "col", children: "Leads to" })] }) }), _jsx("tbody", { children: graph.nodes.map((node) => _jsxs("tr", { children: [_jsx("td", { children: graph.columns[node.col] }), _jsx("th", { scope: "row", children: node.label }), _jsx("td", { children: subtitle(node) || '—' }), _jsx("td", { children: graph.edges.filter(([from]) => from === node.id).map(([, to]) => byId.get(to)?.label).join(', ') || '—' })] }, node.id)) })] }) })] })] });
}
// ---------------------------------------------------------------------------------------------
function ChartHeader({ id, title, description }) {
    return _jsxs("header", { className: "b10x-chart__header", children: [_jsx("strong", { id: id, className: "b10x-chart__title", children: title }), description && _jsx("p", { className: "b10x-chart__description", children: description })] });
}
function ChartError({ kind, message }) {
    return _jsxs("aside", { className: "b10x-callout b10x-callout--danger", role: "alert", children: [_jsxs("p", { className: "b10x-callout__title b10x-eyebrow", children: ["Cannot render ", kind] }), _jsx("div", { className: "b10x-callout__content", children: _jsx("p", { children: _jsx("code", { children: message }) }) })] });
}
function pct(value, total) {
    return `${Math.round((value / total) * 10000) / 100}%`;
}
function f(value) {
    return String(Math.round(value * 10) / 10);
}
