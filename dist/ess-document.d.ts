/** Passive ESS documentation projection, owned by ESS's ess-docs/1 wire contract. */
export type EssSemanticRef = {
    kind: string;
    name: string | {
        command: string;
        outcome: string;
    } | {
        entity: string;
        transition: string;
    };
};
export type EssTarget = {
    target: 'page';
    page: string;
} | {
    target: 'anchor';
    page: string;
    anchor: string;
} | {
    target: 'construct';
    ref: EssSemanticRef;
} | {
    target: 'external';
    url: string;
};
export type EssInline = {
    inline: 'text' | 'code';
    text: string;
} | {
    inline: 'strong' | 'emphasis';
    text: EssInline[];
} | {
    inline: 'link';
    text: EssInline[];
    to: EssTarget;
};
export type EssBlock = {
    block: 'prose';
    text: EssInline[];
} | {
    block: 'section';
    level: number;
    title: EssInline[];
    anchor: string;
    about?: EssSemanticRef;
    blocks: EssBlock[];
} | {
    block: 'list';
    ordered: boolean;
    items: EssBlock[][];
} | {
    block: 'table';
    columns: EssInline[][];
    rows: EssInline[][][];
} | {
    block: 'quote';
    blocks: EssBlock[];
} | {
    block: 'code';
    language?: string;
    text: string;
} | {
    block: 'diagram';
    kind: 'system' | 'lifecycle' | 'binding_flow' | 'interaction';
    source: string;
} | {
    block: 'rule';
};
export interface EssPage {
    id: string;
    title: EssInline[];
    about?: EssSemanticRef;
    provenance: {
        provenance: {
            system: string;
            specification_version: string;
            source_digest: string;
            contract_digest: string;
        };
        slice: unknown;
    };
    blocks: EssBlock[];
}
export interface EssDocument {
    format: 'ess-docs/1';
    system: string;
    version: string;
    pages: EssPage[];
}
export interface EssLocation {
    page: string;
    anchor?: string;
}
export interface EssSection extends EssLocation {
    title: string;
    level: number;
    kind?: string;
}
export interface EssDocumentIndex {
    document: EssDocument;
    pages: Map<string, EssPage>;
    sections: Map<string, EssSection[]>;
    constructs: Map<string, EssLocation>;
    search: Array<EssSection & {
        text: string;
    }>;
}
export declare function essText(nodes: EssInline[]): string;
export declare function essReferenceKey(ref: EssSemanticRef): string;
export declare function safeEssUrl(value: string): boolean;
/** Refuse unsupported or malformed presentation data before it reaches a renderer. */
export declare function parseEssDocument(input: unknown): EssDocumentIndex;
export declare function resolveEssTarget(index: EssDocumentIndex, target: EssTarget): EssLocation | string | undefined;
