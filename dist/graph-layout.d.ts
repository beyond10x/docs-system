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
export interface Point {
    x: number;
    y: number;
}
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
export interface LayoutColumn {
    index: number;
    x: number;
    width: number;
}
export interface LayeredLayout {
    width: number;
    height: number;
    nodes: LayoutNode[];
    edges: LayoutEdge[];
    columns: LayoutColumn[];
    /** Crossings between neighbouring columns after ordering, for tests and diagnostics. */
    crossings: number;
}
interface Segment {
    from: string;
    to: string;
}
export declare function layeredLayout(inputNodes: readonly LayoutNodeInput[], inputEdges: readonly LayoutEdgeInput[], options?: LayoutOptions): LayeredLayout;
/** Crossings between two neighbouring columns, counted pairwise. Exposed for tests. */
export declare function countCrossings(layers: readonly string[][], segments: readonly Segment[]): number;
export {};
