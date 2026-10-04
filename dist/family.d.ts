import type { ProductId } from './product-palette.js';
export interface FamilyMember {
    id: ProductId;
    name: string;
    /** Unique letter mark: C, El, L, Co, Es. */
    mark: string;
    /** A few words, for the switcher and the family strip. */
    tagline: string;
    /** One sentence, for related-tool cards. */
    description: string;
    /** The product site. */
    url: string;
    repository: string;
}
/** Family order. ELS and ESS are never adjacent (their hues are the closest pair, style plan § 4). */
export declare const FAMILY_ORDER: readonly ProductId[];
export declare const FAMILY: Readonly<Record<ProductId, FamilyMember>>;
export declare function familyMembers(): FamilyMember[];
/** How a related tool stands to the product whose site shows it: "ELS uses Canon". */
export type FamilyRelation = 'uses' | 'used-by' | 'beside' | 'specifies' | 'specified-by';
export declare const FAMILY_RELATIONS: readonly FamilyRelation[];
/** "uses Canon", or the bare word when the current product is unknown. */
export declare function relationPhrase(relation: FamilyRelation, current?: ProductId): string;
/** A related tool named by its family id; name, mark, description and link come from the registry. */
export interface FamilyRelatedTool {
    id: ProductId;
    relation: FamilyRelation;
    /** What the relation goes through, for example `protocol/1`. */
    via?: string;
}
export declare function isFamilyRelatedTool(value: unknown): value is FamilyRelatedTool;
export declare function parseFamilyRelatedTool(value: Record<string, unknown>, path: string): FamilyRelatedTool;
/** Global data the product-site plugin publishes for the footer, navbar and landing. */
export interface ProductSiteGlobalData {
    product?: ProductId;
    /** The docs-system build this site was rendered with. */
    build?: DocsSystemBuild;
}
export interface DocsSystemBuild {
    /** A full commit id when known, otherwise the package version. */
    revision: string;
    /** `commit` when `revision` is a Git commit. */
    kind: 'commit' | 'version';
    /** The build ran from a checkout with uncommitted changes. */
    dirty?: boolean;
}
export declare function buildLabel(build: DocsSystemBuild): string;
export declare function buildHref(build: DocsSystemBuild): string | undefined;
