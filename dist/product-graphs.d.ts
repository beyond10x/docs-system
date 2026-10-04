export declare const PROTOCOL_GRAPH_FORMAT = "b10x-protocol-graph/1";
export declare const DOMAIN_GRAPH_FORMAT = "b10x-domain-graph/1";
export type ProtocolNodeKind = 'action' | 'evidence' | 'claim' | 'outcome' | 'obligation';
export type ProtocolEdgeKind = 'produces' | 'establishes' | 'supports' | 'requires' | 'gates';
export type ProtocolTruth = 'true' | 'false' | 'unknown';
/** A Canon predicate, in the shape of `canon-ir/1`. */
export type ProtocolPredicate = {
    all: ProtocolPredicate[];
} | {
    any: ProtocolPredicate[];
} | {
    not: ProtocolPredicate;
} | {
    claim: {
        id: string;
        is?: ProtocolTruth;
    };
} | {
    evidence: {
        kind: string;
        result?: string | null;
    };
};
export interface ProtocolGraphNode {
    /** Unique within the document; by convention `<kind>:<name>`. */
    id: string;
    kind: ProtocolNodeKind;
    /** The protocol identifier, shown on the node. */
    name: string;
    description?: string;
    /** Claim `true_when`, outcome `requires`, or action `precondition`. Omit an empty `all`. */
    predicate?: ProtocolPredicate;
    /** Actions: the declared effect (`read`, `write`, `execute`, `state`). */
    effect?: string;
    /** Actions: capabilities whose authority the action requires. */
    capabilities?: string[];
}
export interface ProtocolGraphEdge {
    from: string;
    to: string;
    /**
     * `produces` action → evidence; `establishes` evidence → claim; `supports` claim → claim;
     * `requires` claim → outcome; `gates` claim → action (a precondition).
     */
    kind: ProtocolEdgeKind;
    /** The evidence result or claim value the edge asks for, when it is not plain `true`. */
    qualifier?: string;
}
export interface ProtocolGraphDocument {
    format: typeof PROTOCOL_GRAPH_FORMAT;
    protocol: {
        id: string;
        revision: number;
        description?: string;
        source?: string;
    };
    nodes: ProtocolGraphNode[];
    edges: ProtocolGraphEdge[];
}
export declare const PROTOCOL_KIND_LABELS: Record<ProtocolNodeKind, {
    singular: string;
    plural: string;
}>;
/** Read and check a `b10x-protocol-graph/1` document. Throws with the offending path. */
export declare function parseProtocolGraph(value: unknown): ProtocolGraphDocument;
/** One line of a predicate, indented by depth, for text and tooltips. */
export interface PredicateLine {
    depth: number;
    text: string;
    reference?: string;
}
export declare function predicateLines(value: ProtocolPredicate, depth?: number): PredicateLine[];
export interface ProtocolGraphLayoutNode {
    node: ProtocolGraphNode;
    x: number;
    y: number;
    width: number;
    height: number;
    /** Name as drawn; shortened with an ellipsis when it would not fit. */
    displayName: string;
}
export interface ProtocolGraphLayout {
    width: number;
    height: number;
    /** Height reserved above the nodes for column headings. */
    headerHeight: number;
    columns: Array<{
        kind: ProtocolNodeKind;
        plural: string;
        x: number;
        width: number;
        count: number;
    }>;
    nodes: ProtocolGraphLayoutNode[];
    edges: Array<{
        edge: ProtocolGraphEdge;
        index: number;
        path: string;
        route: 'forward' | 'same-layer' | 'backward';
        label: {
            x: number;
            y: number;
        };
    }>;
    crossings: number;
}
export declare function layoutProtocolGraph(document: ProtocolGraphDocument): ProtocolGraphLayout;
/** Every node reachable upstream and downstream along the main direction, plus gate partners. */
export declare function protocolLineage(document: ProtocolGraphDocument, id: string): Set<string>;
export type DomainRelationKind = 'owns' | 'references';
export type DomainCardinality = 'one' | 'many';
export interface DomainField {
    name: string;
    type: string;
}
export interface DomainTransition {
    name: string;
    from: string[];
    to: string;
    /** Commands whose outcome performs this transition. */
    commands?: string[];
}
export interface DomainLifecycle {
    initial: string;
    states: string[];
    terminal?: string[];
    transitions?: DomainTransition[];
}
export interface DomainEntity {
    /** Fully qualified ESS name. */
    id: string;
    /** Short display name. */
    name: string;
    summary?: string;
    identity: DomainField;
    fields: DomainField[];
    lifecycle?: DomainLifecycle;
    /** Commands whose outcome creates an instance. */
    createdBy?: string[];
}
export interface DomainRelation {
    from: string;
    to: string;
    name: string;
    kind: DomainRelationKind;
    cardinality: DomainCardinality;
    via?: string;
}
export interface DomainGraphDocument {
    format: typeof DOMAIN_GRAPH_FORMAT;
    domain: {
        id: string;
        display?: string;
        summary?: string;
        system?: string;
        source?: string;
    };
    entities: DomainEntity[];
    relations: DomainRelation[];
}
export declare function parseDomainGraph(value: unknown): DomainGraphDocument;
export interface DomainGraphLayout {
    width: number;
    height: number;
    nodes: Array<{
        entity: DomainEntity;
        x: number;
        y: number;
        width: number;
        height: number;
        displayName: string;
    }>;
    edges: Array<{
        relation: DomainRelation;
        index: number;
        path: string;
        route: 'forward' | 'same-layer' | 'backward';
        start: {
            x: number;
            y: number;
        };
        end: {
            x: number;
            y: number;
        };
    }>;
    crossings: number;
}
export declare const DOMAIN_NODE_WIDTH = 248;
export declare const DOMAIN_NODE_HEIGHT = 92;
/** Layer entities by the longest relation path that reaches them; cycles are broken in input order. */
export declare function domainLayers(document: DomainGraphDocument): Map<string, number>;
export declare function layoutDomainGraph(document: DomainGraphDocument): DomainGraphLayout;
