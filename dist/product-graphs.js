/**
 * Input contracts for the spec-driven product-site charts, and their deterministic layout.
 *
 * Both documents are emitted by the owning repository's Rust generator; nothing here derives them
 * from source. This module is Node-safe so preparation code, tests and the React renderers share
 * one reader and one layout.
 */
import { layeredLayout } from './graph-layout.js';
export const PROTOCOL_GRAPH_FORMAT = 'b10x-protocol-graph/1';
export const DOMAIN_GRAPH_FORMAT = 'b10x-domain-graph/1';
const PROTOCOL_NODE_KINDS = ['action', 'evidence', 'claim', 'outcome', 'obligation'];
const PROTOCOL_EDGE_ENDS = {
    produces: [['action'], ['evidence']],
    establishes: [['evidence'], ['claim']],
    supports: [['claim'], ['claim']],
    requires: [['claim', 'evidence'], ['outcome', 'obligation']],
    gates: [['claim', 'evidence'], ['action']],
};
export const PROTOCOL_KIND_LABELS = {
    action: { singular: 'Action', plural: 'Actions' },
    evidence: { singular: 'Evidence kind', plural: 'Evidence kinds' },
    claim: { singular: 'Claim', plural: 'Claims' },
    outcome: { singular: 'Outcome', plural: 'Outcomes' },
    obligation: { singular: 'Obligation', plural: 'Obligations' },
};
/** Read and check a `b10x-protocol-graph/1` document. Throws with the offending path. */
export function parseProtocolGraph(value) {
    const document = object(value, 'document');
    if (document.format !== PROTOCOL_GRAPH_FORMAT)
        throw new Error(`document.format must be ${PROTOCOL_GRAPH_FORMAT}, received ${JSON.stringify(document.format)}`);
    const protocol = object(document.protocol, 'protocol');
    text(protocol.id, 'protocol.id');
    if (!Number.isInteger(protocol.revision) || protocol.revision < 1)
        throw new Error('protocol.revision must be a positive integer');
    optionalText(protocol.description, 'protocol.description');
    optionalText(protocol.source, 'protocol.source');
    const kinds = new Map();
    list(document.nodes, 'nodes').forEach((entry, index) => {
        const path = `nodes[${index}]`;
        const node = object(entry, path);
        const id = text(node.id, `${path}.id`);
        if (kinds.has(id))
            throw new Error(`${path}.id duplicates ${id}`);
        if (!PROTOCOL_NODE_KINDS.includes(node.kind))
            throw new Error(`${path}.kind must be one of ${PROTOCOL_NODE_KINDS.join(', ')}`);
        kinds.set(id, node.kind);
        text(node.name, `${path}.name`);
        optionalText(node.description, `${path}.description`);
        optionalText(node.effect, `${path}.effect`);
        if (node.capabilities !== undefined)
            list(node.capabilities, `${path}.capabilities`).forEach((capability, position) => text(capability, `${path}.capabilities[${position}]`));
        if (node.predicate !== undefined)
            predicate(node.predicate, `${path}.predicate`);
    });
    list(document.edges, 'edges').forEach((entry, index) => {
        const path = `edges[${index}]`;
        const edge = object(entry, path);
        const from = text(edge.from, `${path}.from`);
        const to = text(edge.to, `${path}.to`);
        const kind = edge.kind;
        if (!(kind in PROTOCOL_EDGE_ENDS))
            throw new Error(`${path}.kind must be one of ${Object.keys(PROTOCOL_EDGE_ENDS).join(', ')}`);
        if (!kinds.has(from))
            throw new Error(`${path}.from references unknown node ${from}`);
        if (!kinds.has(to))
            throw new Error(`${path}.to references unknown node ${to}`);
        const [sources, targets] = PROTOCOL_EDGE_ENDS[kind];
        if (!sources.includes(kinds.get(from)) || !targets.includes(kinds.get(to)))
            throw new Error(`${path} ${kind} cannot join ${kinds.get(from)} to ${kinds.get(to)}`);
        optionalText(edge.qualifier, `${path}.qualifier`);
    });
    return value;
}
function predicate(value, path) {
    const node = object(value, path);
    const keys = Object.keys(node);
    if (keys.length !== 1)
        throw new Error(`${path} must have exactly one of all, any, not, claim, evidence`);
    const [key] = keys;
    if (key === 'all' || key === 'any')
        list(node[key], `${path}.${key}`).forEach((child, index) => predicate(child, `${path}.${key}[${index}]`));
    else if (key === 'not')
        predicate(node.not, `${path}.not`);
    else if (key === 'claim') {
        const claim = object(node.claim, `${path}.claim`);
        text(claim.id, `${path}.claim.id`);
        if (claim.is !== undefined && !['true', 'false', 'unknown'].includes(claim.is))
            throw new Error(`${path}.claim.is must be true, false or unknown`);
    }
    else if (key === 'evidence') {
        const evidence = object(node.evidence, `${path}.evidence`);
        text(evidence.kind, `${path}.evidence.kind`);
        if (evidence.result !== undefined && evidence.result !== null)
            text(evidence.result, `${path}.evidence.result`);
    }
    else
        throw new Error(`${path} has unknown predicate ${key}`);
}
export function predicateLines(value, depth = 0) {
    if ('all' in value)
        return value.all.length === 1 ? predicateLines(value.all[0], depth) : [{ depth, text: 'all of' }, ...value.all.flatMap((child) => predicateLines(child, depth + 1))];
    if ('any' in value)
        return [{ depth, text: 'any of' }, ...value.any.flatMap((child) => predicateLines(child, depth + 1))];
    if ('not' in value)
        return [{ depth, text: 'not' }, ...predicateLines(value.not, depth + 1)];
    if ('claim' in value) {
        const is = value.claim.is ?? 'true';
        return [{ depth, text: is === 'true' ? 'claim' : `claim is ${is}:`, reference: value.claim.id }];
    }
    const result = value.evidence.result;
    return [{ depth, text: result ? `evidence = ${result}:` : 'any evidence:', reference: value.evidence.kind }];
}
const PROTOCOL_LAYER = { action: 0, evidence: 1, claim: 2, outcome: 3, obligation: 3 };
/** Approximate advance of the monospace face at 1px, generous so names never overflow. */
const MONO_ADVANCE = 0.62;
const NAME_SIZE = 13;
const NODE_PADDING = 32;
export function layoutProtocolGraph(document) {
    const headerHeight = 48;
    const widths = new Map();
    for (const node of document.nodes) {
        const layer = PROTOCOL_LAYER[node.kind];
        const needed = Math.ceil(node.name.length * NAME_SIZE * MONO_ADVANCE + NODE_PADDING + (node.kind === 'action' ? 22 : 0));
        widths.set(layer, Math.max(widths.get(layer) ?? 176, Math.min(needed, 252)));
    }
    const ordered = [...document.nodes].sort((left, right) => PROTOCOL_LAYER[left.kind] - PROTOCOL_LAYER[right.kind] || (left.kind === right.kind ? 0 : left.kind === 'outcome' ? -1 : 1));
    const inputs = ordered.map((node) => ({ id: node.id, layer: PROTOCOL_LAYER[node.kind], width: widths.get(PROTOCOL_LAYER[node.kind]), height: 58 }));
    const edges = document.edges.map((edge) => ({ from: edge.from, to: edge.to, constraint: edge.kind !== 'gates' }));
    const layout = layeredLayout(inputs, edges, { layerGap: 104, nodeGap: 18 });
    const byId = new Map(document.nodes.map((node) => [node.id, node]));
    const columnKinds = ['action', 'evidence', 'claim', 'outcome'];
    return {
        width: layout.width,
        height: layout.height + headerHeight,
        headerHeight,
        columns: layout.columns.map((column) => {
            const kind = columnKinds[column.index];
            const count = document.nodes.filter((node) => PROTOCOL_LAYER[node.kind] === column.index).length;
            const obligations = column.index === 3 && document.nodes.some((node) => node.kind === 'obligation');
            return { kind, plural: obligations ? 'Outcomes · obligations' : PROTOCOL_KIND_LABELS[kind].plural, x: column.x, width: column.width, count };
        }),
        nodes: layout.nodes.map((placed) => {
            const node = byId.get(placed.id);
            const room = Math.floor((placed.width - NODE_PADDING - (node.kind === 'action' ? 22 : 0)) / (NAME_SIZE * MONO_ADVANCE));
            return { node, x: placed.x, y: placed.y + headerHeight, width: placed.width, height: placed.height, displayName: shorten(node.name, room) };
        }),
        edges: shiftEdges(layout, headerHeight).map((edge) => ({ edge: document.edges[edge.index], index: edge.index, path: edge.path, route: edge.route, label: edge.label })),
        crossings: layout.crossings,
    };
}
/** Every node reachable upstream and downstream along the main direction, plus gate partners. */
export function protocolLineage(document, id) {
    const forward = document.edges.filter((edge) => edge.kind !== 'gates');
    const lineage = new Set([id]);
    const walk = (start, next) => {
        const queue = [start];
        while (queue.length) {
            const current = queue.shift();
            for (const edge of forward) {
                const [from, to] = next(edge);
                if (from === current && !lineage.has(to)) {
                    lineage.add(to);
                    queue.push(to);
                }
            }
        }
    };
    walk(id, (edge) => [edge.from, edge.to]);
    walk(id, (edge) => [edge.to, edge.from]);
    for (const edge of document.edges)
        if (edge.kind === 'gates' && (edge.from === id || edge.to === id)) {
            lineage.add(edge.from);
            lineage.add(edge.to);
        }
    return lineage;
}
export function parseDomainGraph(value) {
    const document = object(value, 'document');
    if (document.format !== DOMAIN_GRAPH_FORMAT)
        throw new Error(`document.format must be ${DOMAIN_GRAPH_FORMAT}, received ${JSON.stringify(document.format)}`);
    const domain = object(document.domain, 'domain');
    text(domain.id, 'domain.id');
    for (const key of ['display', 'summary', 'system', 'source'])
        optionalText(domain[key], `domain.${key}`);
    const identifiers = new Set();
    list(document.entities, 'entities').forEach((entry, index) => {
        const path = `entities[${index}]`;
        const entity = object(entry, path);
        const id = text(entity.id, `${path}.id`);
        if (identifiers.has(id))
            throw new Error(`${path}.id duplicates ${id}`);
        identifiers.add(id);
        text(entity.name, `${path}.name`);
        optionalText(entity.summary, `${path}.summary`);
        field(entity.identity, `${path}.identity`);
        list(entity.fields, `${path}.fields`).forEach((child, position) => field(child, `${path}.fields[${position}]`));
        if (entity.createdBy !== undefined)
            list(entity.createdBy, `${path}.createdBy`).forEach((command, position) => text(command, `${path}.createdBy[${position}]`));
        if (entity.lifecycle !== undefined) {
            const lifecycle = object(entity.lifecycle, `${path}.lifecycle`);
            const states = list(lifecycle.states, `${path}.lifecycle.states`).map((state, position) => text(state, `${path}.lifecycle.states[${position}]`));
            if (!states.length)
                throw new Error(`${path}.lifecycle.states must not be empty`);
            const known = (state, at) => { if (!states.includes(text(state, at)))
                throw new Error(`${at} names undeclared state ${String(state)}`); };
            known(lifecycle.initial, `${path}.lifecycle.initial`);
            if (lifecycle.terminal !== undefined)
                list(lifecycle.terminal, `${path}.lifecycle.terminal`).forEach((state, position) => known(state, `${path}.lifecycle.terminal[${position}]`));
            if (lifecycle.transitions !== undefined)
                list(lifecycle.transitions, `${path}.lifecycle.transitions`).forEach((child, position) => {
                    const at = `${path}.lifecycle.transitions[${position}]`;
                    const transition = object(child, at);
                    text(transition.name, `${at}.name`);
                    list(transition.from, `${at}.from`).forEach((state, offset) => known(state, `${at}.from[${offset}]`));
                    known(transition.to, `${at}.to`);
                    if (transition.commands !== undefined)
                        list(transition.commands, `${at}.commands`).forEach((command, offset) => text(command, `${at}.commands[${offset}]`));
                });
        }
    });
    list(document.relations, 'relations').forEach((entry, index) => {
        const path = `relations[${index}]`;
        const relation = object(entry, path);
        const from = text(relation.from, `${path}.from`);
        const to = text(relation.to, `${path}.to`);
        if (!identifiers.has(from))
            throw new Error(`${path}.from references unknown entity ${from}`);
        if (!identifiers.has(to))
            throw new Error(`${path}.to references unknown entity ${to}`);
        text(relation.name, `${path}.name`);
        if (relation.kind !== 'owns' && relation.kind !== 'references')
            throw new Error(`${path}.kind must be owns or references`);
        if (relation.cardinality !== 'one' && relation.cardinality !== 'many')
            throw new Error(`${path}.cardinality must be one or many`);
        optionalText(relation.via, `${path}.via`);
    });
    return value;
}
function field(value, path) {
    const entry = object(value, path);
    text(entry.name, `${path}.name`);
    text(entry.type, `${path}.type`);
}
export const DOMAIN_NODE_WIDTH = 248;
export const DOMAIN_NODE_HEIGHT = 92;
/** Layer entities by the longest relation path that reaches them; cycles are broken in input order. */
export function domainLayers(document) {
    const outgoing = new Map();
    for (const relation of document.relations)
        if (relation.from !== relation.to)
            outgoing.set(relation.from, [...(outgoing.get(relation.from) ?? []), relation.to]);
    const state = new Map();
    const acyclic = new Map();
    const visit = (id) => {
        state.set(id, 'visiting');
        for (const next of outgoing.get(id) ?? []) {
            if (state.get(next) === 'visiting')
                continue;
            acyclic.set(id, [...(acyclic.get(id) ?? []), next]);
            if (!state.has(next))
                visit(next);
        }
        state.set(id, 'done');
    };
    for (const entity of document.entities)
        if (!state.has(entity.id))
            visit(entity.id);
    const layer = new Map(document.entities.map((entity) => [entity.id, 0]));
    // Longest path on the acyclic remainder: relax until stable (the graph is small).
    for (let pass = 0; pass < document.entities.length; pass += 1) {
        let changed = false;
        for (const [from, targets] of acyclic)
            for (const to of targets) {
                if (layer.get(to) < layer.get(from) + 1) {
                    layer.set(to, layer.get(from) + 1);
                    changed = true;
                }
            }
        if (!changed)
            break;
    }
    return layer;
}
export function layoutDomainGraph(document) {
    const layers = domainLayers(document);
    const inputs = document.entities.map((entity) => ({ id: entity.id, layer: layers.get(entity.id), width: DOMAIN_NODE_WIDTH, height: DOMAIN_NODE_HEIGHT }));
    const edges = document.relations.map((relation) => ({ from: relation.from, to: relation.to }));
    const layout = layeredLayout(inputs, edges, { layerGap: 112, nodeGap: 22, portSpread: 0.8 });
    const byId = new Map(document.entities.map((entity) => [entity.id, entity]));
    return {
        width: layout.width,
        height: layout.height,
        nodes: layout.nodes.map((placed) => {
            const entity = byId.get(placed.id);
            return { entity, x: placed.x, y: placed.y, width: placed.width, height: placed.height, displayName: shorten(entity.name, 26) };
        }),
        edges: layout.edges.map((edge) => ({ relation: document.relations[edge.index], index: edge.index, path: edge.path, route: edge.route, start: edge.points[0], end: edge.points[edge.points.length - 1] })),
        crossings: layout.crossings,
    };
}
// ---------------------------------------------------------------------------------------------
function shiftEdges(layout, offset) {
    return layout.edges.map((edge) => ({
        ...edge,
        points: edge.points.map((point) => ({ x: point.x, y: point.y + offset })),
        label: { x: edge.label.x, y: edge.label.y + offset },
        path: edge.path.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_match, x, y) => `${x},${Math.round((Number(y) + offset) * 10) / 10}`),
    }));
}
function shorten(value, room) {
    return value.length <= room ? value : `${value.slice(0, Math.max(1, room - 1))}…`;
}
function object(value, path) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
        throw new Error(`${path} must be an object`);
    return value;
}
function list(value, path) {
    if (!Array.isArray(value))
        throw new Error(`${path} must be an array`);
    return value;
}
function text(value, path) {
    if (typeof value !== 'string' || value.length === 0)
        throw new Error(`${path} must be a non-empty string`);
    return value;
}
function optionalText(value, path) {
    if (value !== undefined)
        text(value, path);
}
