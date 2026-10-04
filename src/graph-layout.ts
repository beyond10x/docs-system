/**
 * Deterministic layered (Sugiyama-style) layout for small directed graphs, left to right.
 *
 * The caller assigns every node a layer, which is what both documentation graphs already know: a
 * protocol's kinds are its columns, and an ESS domain is layered by its relations. What remains is
 * the part this module solves: dummy nodes for edges that span layers, crossing reduction by
 * barycentric sweeps plus adjacent transposition, coordinate assignment by exact constrained
 * least squares (isotonic regression), port distribution and smooth edge routes.
 *
 * It is synchronous and pure, so a Docusaurus page prerenders the finished SVG; the same input
 * always yields the same geometry.
 *
 * Iterators are copied with Array.from, never spread: Docusaurus compiles client code with loose
 * Babel, where `[...map.values()]` becomes a one-element array.
 */

export interface LayoutNodeInput {
  id: string;
  /** Zero-based column. */
  layer: number;
  width: number;
  height: number;
}

export interface LayoutEdgeInput {
  from: string;
  to: string;
  /**
   * `false` keeps the edge out of ordering and positioning; it is still routed. Use it for
   * relationships drawn against the main direction, such as a claim gating an action.
   */
  constraint?: boolean;
}

export interface LayoutOptions {
  /** Horizontal distance between columns. */
  layerGap?: number;
  /** Vertical distance between neighbouring nodes in a column. */
  nodeGap?: number;
  /** Vertical distance reserved for an edge passing through a column. */
  dummyGap?: number;
  /** Ordering sweeps; the best ordering seen is kept. */
  sweeps?: number;
  /** Spread several edges over a node side instead of meeting at its centre. */
  portSpread?: number;
}

export interface Point {x: number; y: number}

export interface LayoutNode {
  id: string;
  layer: number;
  /** Position within its column, top to bottom. */
  order: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type LayoutEdgeRoute = 'forward' | 'same-layer' | 'backward';

export interface LayoutEdge {
  /** Index of the edge in the input list. */
  index: number;
  from: string;
  to: string;
  route: LayoutEdgeRoute;
  points: Point[];
  /** SVG path data. */
  path: string;
  /** A point on the route suitable for a label. */
  label: Point;
}

export interface LayoutColumn {index: number; x: number; width: number}

export interface LayeredLayout {
  width: number;
  height: number;
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  columns: LayoutColumn[];
  /** Crossings between neighbouring columns after ordering, for tests and diagnostics. */
  crossings: number;
}

interface WorkNode {
  key: string;
  layer: number;
  width: number;
  height: number;
  dummy: boolean;
  /** Input order, the deterministic tie breaker. */
  rank: number;
  y: number;
}

interface Segment {from: string; to: string}

const DEFAULTS: Required<LayoutOptions> = {layerGap: 96, nodeGap: 20, dummyGap: 10, sweeps: 24, portSpread: 0.6};

export function layeredLayout(inputNodes: readonly LayoutNodeInput[], inputEdges: readonly LayoutEdgeInput[], options: LayoutOptions = {}): LayeredLayout {
  const settings = {...DEFAULTS, ...options};
  const nodes = new Map<string, WorkNode>();
  inputNodes.forEach((node, rank) => {
    if (nodes.has(node.id)) throw new Error(`layout contains duplicate node ${node.id}`);
    if (!Number.isInteger(node.layer) || node.layer < 0) throw new Error(`layout node ${node.id} has invalid layer ${node.layer}`);
    if (!(node.width > 0 && node.height > 0)) throw new Error(`layout node ${node.id} needs a positive size`);
    nodes.set(node.id, {key: node.id, layer: node.layer, width: node.width, height: node.height, dummy: false, rank, y: 0});
  });
  for (const edge of inputEdges) {
    if (!nodes.has(edge.from) || !nodes.has(edge.to)) throw new Error(`layout edge ${edge.from} -> ${edge.to} references an unknown node`);
  }

  const layerCount = inputNodes.reduce((max, node) => Math.max(max, node.layer + 1), 0);
  // Constraint edges, oriented forward; a same-layer edge is kept aside as an attraction.
  const segments: Segment[] = [];
  const sameLayer: Segment[] = [];
  const chains = new Map<number, string[]>();
  let dummyCount = 0;
  inputEdges.forEach((edge, index) => {
    if (edge.constraint === false || edge.from === edge.to) return;
    const source = nodes.get(edge.from)!;
    const target = nodes.get(edge.to)!;
    if (source.layer === target.layer) {
      sameLayer.push({from: edge.from, to: edge.to});
      return;
    }
    const [low, high] = source.layer < target.layer ? [source, target] : [target, source];
    const chain = [low.key];
    for (let layer = low.layer + 1; layer < high.layer; layer += 1) {
      const key = `\u0000dummy-${dummyCount++}`;
      nodes.set(key, {key, layer, width: 0, height: settings.dummyGap, dummy: true, rank: inputNodes.length + dummyCount, y: 0});
      chain.push(key);
    }
    chain.push(high.key);
    for (let position = 0; position + 1 < chain.length; position += 1) segments.push({from: chain[position], to: chain[position + 1]});
    chains.set(index, source.layer < target.layer ? chain : [...chain].reverse());
  });

  const predecessors = adjacency(segments, 'to');
  const successors = adjacency(segments, 'from');
  const peers = new Map<string, string[]>();
  for (const edge of sameLayer) {
    peers.set(edge.from, [...(peers.get(edge.from) ?? []), edge.to]);
    peers.set(edge.to, [...(peers.get(edge.to) ?? []), edge.from]);
  }

  // Ordering.
  let layers: string[][] = Array.from({length: layerCount}, () => []);
  for (const node of Array.from(nodes.values()).sort((left, right) => left.rank - right.rank)) layers[node.layer].push(node.key);
  layers = initialOrder(layers, predecessors);
  let best = layers.map((layer) => [...layer]);
  let bestCost = orderingCost(best, segments, sameLayer);
  for (let sweep = 0; sweep < settings.sweeps && bestCost > 0; sweep += 1) {
    const downward = sweep % 2 === 0;
    const sequence = downward ? range(1, layerCount) : range(layerCount - 2, -1, -1);
    for (const layerIndex of sequence) {
      const neighbours = downward ? predecessors : successors;
      layers[layerIndex] = sortByBarycenter(layers[layerIndex], layers, neighbours, peers);
    }
    // Same-layer edges also pull within the first column, which no sweep reaches.
    if (downward && layerCount > 0) layers[0] = sortByBarycenter(layers[0], layers, successors, peers);
    transpose(layers, segments, sameLayer);
    const cost = orderingCost(layers, segments, sameLayer);
    if (cost < bestCost) {
      bestCost = cost;
      best = layers.map((layer) => [...layer]);
    }
  }
  layers = best;

  // Coordinates.
  const gapAfter = (upper: WorkNode, lower: WorkNode): number => upper.height / 2 + lower.height / 2 + (upper.dummy || lower.dummy ? settings.dummyGap : settings.nodeGap);
  for (const layer of layers) {
    let cursor = 0;
    layer.forEach((key, index) => {
      const node = nodes.get(key)!;
      if (index > 0) cursor += gapAfter(nodes.get(layer[index - 1])!, node);
      node.y = cursor;
    });
    const middle = cursor / 2;
    for (const key of layer) nodes.get(key)!.y -= middle;
  }
  const place = (layerIndex: number, neighbourSets: Array<Map<string, string[]>>): void => {
    const layer = layers[layerIndex];
    const desired = layer.map((key) => {
      const node = nodes.get(key)!;
      const linked = neighbourSets.flatMap((set) => set.get(key) ?? []);
      return linked.length ? linked.reduce((sum, other) => sum + nodes.get(other)!.y, 0) / linked.length : node.y;
    });
    const weights = layer.map((key) => nodes.get(key)!.dummy ? 0.5 : 1);
    const offsets = [0];
    for (let index = 1; index < layer.length; index += 1) offsets.push(offsets[index - 1] + gapAfter(nodes.get(layer[index - 1])!, nodes.get(layer[index])!));
    const solved = isotonic(desired.map((value, index) => value - offsets[index]), weights);
    layer.forEach((key, index) => { nodes.get(key)!.y = solved[index] + offsets[index]; });
  };
  for (let pass = 0; pass < 8; pass += 1) {
    for (let layer = 1; layer < layerCount; layer += 1) place(layer, [predecessors]);
    for (let layer = layerCount - 2; layer >= 0; layer -= 1) place(layer, [successors]);
  }
  for (let layer = 0; layer < layerCount; layer += 1) place(layer, [predecessors, successors]);

  // Columns.
  const columns: LayoutColumn[] = [];
  let x = 0;
  for (let layer = 0; layer < layerCount; layer += 1) {
    const width = layers[layer].reduce((max, key) => Math.max(max, nodes.get(key)!.width), 0);
    columns.push({index: layer, x, width});
    x += width + settings.layerGap;
  }
  const width = Math.max(0, x - settings.layerGap);
  const extents = Array.from(nodes.values());
  const top = extents.length ? Math.min(...extents.map((node) => node.y - node.height / 2)) : 0;
  const bottom = extents.length ? Math.max(...extents.map((node) => node.y + node.height / 2)) : 0;
  const centre = (key: string): Point => {
    const node = nodes.get(key)!;
    const column = columns[node.layer];
    return {x: column.x + column.width / 2, y: node.y - top};
  };

  const layoutNodes: LayoutNode[] = inputNodes.map((input) => {
    const node = nodes.get(input.id)!;
    const middle = centre(input.id);
    return {id: input.id, layer: input.layer, order: layers[input.layer].indexOf(input.id), x: middle.x - input.width / 2, y: middle.y - input.height / 2, width: input.width, height: input.height};
  });
  const placed = new Map(layoutNodes.map((node) => [node.id, node]));

  // Ports: spread the edges leaving or entering one node side, ordered by the far end.
  const sides = new Map<string, Array<{edge: number; far: number; end: 'source' | 'target'}>>();
  const addPort = (side: string, entry: {edge: number; far: number; end: 'source' | 'target'}): void => { sides.set(side, [...(sides.get(side) ?? []), entry]); };
  const routes = inputEdges.map((edge, index) => {
    const source = placed.get(edge.from)!;
    const target = placed.get(edge.to)!;
    const route: LayoutEdgeRoute = source.layer === target.layer ? 'same-layer' : source.layer < target.layer ? 'forward' : 'backward';
    return {index, route, source, target};
  });
  for (const {index, route, source, target} of routes) {
    if (route === 'forward') {
      const chain = chains.get(index);
      const afterSource = chain && chain.length > 2 ? centre(chain[1]).y : target.y + target.height / 2;
      const beforeTarget = chain && chain.length > 2 ? centre(chain[chain.length - 2]).y : source.y + source.height / 2;
      addPort(`${source.id}\u0000right`, {edge: index, far: afterSource, end: 'source'});
      addPort(`${target.id}\u0000left`, {edge: index, far: beforeTarget, end: 'target'});
    } else if (route === 'same-layer') {
      addPort(`${source.id}\u0000right`, {edge: index, far: target.y + target.height / 2, end: 'source'});
      addPort(`${target.id}\u0000right`, {edge: index, far: source.y + source.height / 2, end: 'target'});
    }
  }
  const portY = new Map<string, number>();
  for (const [side, entries] of sides) {
    const node = placed.get(side.split('\u0000')[0])!;
    entries.sort((left, right) => left.far - right.far || left.edge - right.edge);
    const spread = node.height * settings.portSpread;
    entries.forEach((entry, position) => {
      const offset = entries.length === 1 ? 0 : -spread / 2 + (spread * position) / (entries.length - 1);
      portY.set(`${entry.edge}\u0000${entry.end}`, node.y + node.height / 2 + offset);
    });
  }

  const layoutEdges: LayoutEdge[] = routes.map(({index, route, source, target}) => {
    const sourceY = portY.get(`${index}\u0000source`) ?? source.y + source.height / 2;
    const targetY = portY.get(`${index}\u0000target`) ?? target.y + target.height / 2;
    let points: Point[];
    let path: string;
    if (route === 'forward') {
      const chain = chains.get(index) ?? [source.id, target.id];
      points = [{x: source.x + source.width, y: sourceY}, ...chain.slice(1, -1).map(centre), {x: target.x, y: targetY}];
      path = smoothPath(points);
    } else if (route === 'same-layer') {
      const start = {x: source.x + source.width, y: sourceY};
      const end = {x: target.x + target.width, y: targetY};
      const bulge = Math.min(settings.layerGap * 0.7, 18 + Math.abs(end.y - start.y) * 0.35);
      const column = columns[source.layer];
      const outer = column.x + column.width + bulge;
      points = [start, {x: outer, y: (start.y + end.y) / 2}, end];
      path = `M${f(start.x)},${f(start.y)} C${f(outer)},${f(start.y)} ${f(outer)},${f(end.y)} ${f(end.x)},${f(end.y)}`;
    } else {
      const start = {x: source.x, y: source.y + source.height / 2};
      const end = {x: target.x + target.width, y: target.y + target.height / 2};
      points = [start, end];
      const reach = Math.max(40, (start.x - end.x) * 0.35);
      path = `M${f(start.x)},${f(start.y)} C${f(start.x - reach)},${f(start.y)} ${f(end.x + reach)},${f(end.y)} ${f(end.x)},${f(end.y)}`;
    }
    const label = route === 'same-layer' ? points[1] : midpoint(points);
    return {index, from: source.id, to: target.id, route, points, path, label};
  });

  return {width, height: bottom - top, nodes: layoutNodes, edges: layoutEdges, columns, crossings: countCrossings(layers, segments)};
}

/** Crossings between two neighbouring columns, counted pairwise. Exposed for tests. */
export function countCrossings(layers: readonly string[][], segments: readonly Segment[]): number {
  const position = positions(layers);
  const byLayer = new Map<number, Array<[number, number]>>();
  const layerOf = new Map<string, number>();
  layers.forEach((layer, index) => layer.forEach((key) => layerOf.set(key, index)));
  for (const segment of segments) {
    const fromLayer = layerOf.get(segment.from)!;
    const toLayer = layerOf.get(segment.to)!;
    const [upper, lower, layer] = fromLayer < toLayer ? [segment.from, segment.to, fromLayer] : [segment.to, segment.from, toLayer];
    byLayer.set(layer, [...(byLayer.get(layer) ?? []), [position.get(upper)!, position.get(lower)!]]);
  }
  let crossings = 0;
  for (const pairs of byLayer.values()) {
    for (let left = 0; left < pairs.length; left += 1) {
      for (let right = left + 1; right < pairs.length; right += 1) {
        if ((pairs[left][0] - pairs[right][0]) * (pairs[left][1] - pairs[right][1]) < 0) crossings += 1;
      }
    }
  }
  return crossings;
}

function adjacency(segments: readonly Segment[], key: 'from' | 'to'): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const segment of segments) {
    const node = segment[key];
    const other = key === 'from' ? segment.to : segment.from;
    result.set(node, [...(result.get(node) ?? []), other]);
  }
  return result;
}

function initialOrder(layers: string[][], predecessors: Map<string, string[]>): string[][] {
  // Order every column by its predecessors once, so the sweeps start from a connected picture.
  const result = layers.map((layer) => [...layer]);
  for (let index = 1; index < result.length; index += 1) result[index] = sortByBarycenter(result[index], result, predecessors, new Map());
  return result;
}

function sortByBarycenter(layer: readonly string[], layers: readonly string[][], neighbours: Map<string, string[]>, peers: Map<string, string[]>): string[] {
  const position = positions(layers);
  const scored = layer.map((key, index) => {
    const linked = [...(neighbours.get(key) ?? []), ...(peers.get(key) ?? [])].map((other) => position.get(other)!).filter((value) => value !== undefined);
    return {key, index, score: linked.length ? linked.reduce((sum, value) => sum + value, 0) / linked.length : index};
  });
  return scored.sort((left, right) => left.score - right.score || left.index - right.index).map((entry) => entry.key);
}

function transpose(layers: string[][], segments: readonly Segment[], sameLayer: readonly Segment[]): void {
  let improved = true;
  let guard = 0;
  while (improved && guard < 32) {
    improved = false;
    guard += 1;
    for (const layer of layers) {
      for (let index = 0; index + 1 < layer.length; index += 1) {
        const before = orderingCost(layers, segments, sameLayer);
        [layer[index], layer[index + 1]] = [layer[index + 1], layer[index]];
        if (orderingCost(layers, segments, sameLayer) < before) improved = true;
        else [layer[index], layer[index + 1]] = [layer[index + 1], layer[index]];
      }
    }
  }
}

function orderingCost(layers: readonly string[][], segments: readonly Segment[], sameLayer: readonly Segment[]): number {
  const position = positions(layers);
  const span = sameLayer.reduce((sum, edge) => sum + Math.abs(position.get(edge.from)! - position.get(edge.to)!) - 1, 0);
  return countCrossings(layers, segments) * 1000 + span;
}

function positions(layers: readonly string[][]): Map<string, number> {
  const result = new Map<string, number>();
  for (const layer of layers) layer.forEach((key, index) => result.set(key, index));
  return result;
}

/** Weighted isotonic (non-decreasing) regression by pooling adjacent violators. */
function isotonic(values: readonly number[], weights: readonly number[]): number[] {
  const blocks: Array<{value: number; weight: number; count: number}> = [];
  values.forEach((value, index) => {
    blocks.push({value, weight: weights[index], count: 1});
    while (blocks.length > 1 && blocks[blocks.length - 2].value > blocks[blocks.length - 1].value) {
      const last = blocks.pop()!;
      const previous = blocks.pop()!;
      const weight = previous.weight + last.weight;
      blocks.push({value: (previous.value * previous.weight + last.value * last.weight) / weight, weight, count: previous.count + last.count});
    }
  });
  return blocks.flatMap((block) => Array(block.count).fill(block.value));
}

function smoothPath(points: readonly Point[]): string {
  let path = `M${f(points[0].x)},${f(points[0].y)}`;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    const reach = (to.x - from.x) / 2;
    path += ` C${f(from.x + reach)},${f(from.y)} ${f(to.x - reach)},${f(to.y)} ${f(to.x)},${f(to.y)}`;
  }
  return path;
}

function midpoint(points: readonly Point[]): Point {
  if (points.length % 2 === 1) return points[(points.length - 1) / 2];
  const left = points[points.length / 2 - 1];
  const right = points[points.length / 2];
  return {x: (left.x + right.x) / 2, y: (left.y + right.y) / 2};
}

function range(start: number, end: number, step = 1): number[] {
  const result: number[] = [];
  for (let value = start; step > 0 ? value < end : value > end; value += step) result.push(value);
  return result;
}

function f(value: number): string {
  return String(Math.round(value * 10) / 10);
}
