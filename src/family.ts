/**
 * The beyond10x product family: one registry for related-tool cards, the footer family strip and
 * the navbar switcher, so a tool is named, marked and described the same way on every site.
 * Node-safe; the React renderers live in `product.tsx`.
 *
 * Adding a product (AEP, Mantle, …) is one entry here and one validated signature in
 * `product-palette.ts`.
 */
import {PRODUCT_SIGNATURES} from './product-palette.js';
import type {ProductId} from './product-palette.js';

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
export const FAMILY_ORDER: readonly ProductId[] = ['canon', 'els', 'loom', 'commission', 'ess'];

const COPY: Record<ProductId, Pick<FamilyMember, 'tagline' | 'description'>> = {
  canon: {tagline: 'Protocol calculus', description: 'A formal language and a deterministic calculus for evidence-governed protocols: what is known, what is owed, what has been earned.'},
  els: {tagline: 'Engineering protocols on Canon', description: 'Engineering protocols written in Canon: which claims must hold, which evidence counts, which actions need authority.'},
  loom: {tagline: 'Native agent harness', description: 'The native agent harness: a model that acts, only inside its frontier.'},
  commission: {tagline: 'Agents you can give responsibility to', description: 'Build agents you can give responsibility to: a reusable agent revision bound to a durable case, under a governor.'},
  ess: {tagline: 'Executable system specifications', description: 'Executable system specifications: the contract every product here is held to.'},
};

export const FAMILY: Readonly<Record<ProductId, FamilyMember>> = Object.fromEntries(FAMILY_ORDER.map((id) => [id, {
  id,
  name: PRODUCT_SIGNATURES[id].name,
  mark: PRODUCT_SIGNATURES[id].mark,
  ...COPY[id],
  url: `https://beyond10x.github.io/${id}/`,
  repository: `https://github.com/beyond10x/${id}`,
}])) as Record<ProductId, FamilyMember>;

export function familyMembers(): FamilyMember[] {
  return FAMILY_ORDER.map((id) => FAMILY[id]);
}

/** How a related tool stands to the product whose site shows it: "ELS uses Canon". */
export type FamilyRelation = 'uses' | 'used-by' | 'beside' | 'specifies' | 'specified-by';
export const FAMILY_RELATIONS: readonly FamilyRelation[] = ['uses', 'used-by', 'beside', 'specifies', 'specified-by'];
const RELATION_WORDS: Record<FamilyRelation, string> = {uses: 'uses', 'used-by': 'used by', beside: 'beside', specifies: 'specifies', 'specified-by': 'specified by'};

/** "uses Canon", or the bare word when the current product is unknown. */
export function relationPhrase(relation: FamilyRelation, current?: ProductId): string {
  return current ? `${RELATION_WORDS[relation]} ${FAMILY[current].name}` : RELATION_WORDS[relation];
}

/** A related tool named by its family id; name, mark, description and link come from the registry. */
export interface FamilyRelatedTool {
  id: ProductId;
  relation: FamilyRelation;
  /** What the relation goes through, for example `protocol/1`. */
  via?: string;
}

export function isFamilyRelatedTool(value: unknown): value is FamilyRelatedTool {
  return typeof value === 'object' && value !== null && 'id' in value && !('name' in value);
}

export function parseFamilyRelatedTool(value: Record<string, unknown>, path: string): FamilyRelatedTool {
  if (typeof value.id !== 'string' || !(value.id in FAMILY)) throw new Error(`${path}.id must be one of ${FAMILY_ORDER.join(', ')}`);
  if (!FAMILY_RELATIONS.includes(value.relation as FamilyRelation)) throw new Error(`${path}.relation must be one of ${FAMILY_RELATIONS.join(', ')}`);
  if (value.via !== undefined && (typeof value.via !== 'string' || !value.via)) throw new Error(`${path}.via must be a non-empty string`);
  for (const key of Object.keys(value)) if (!['id', 'relation', 'via'].includes(key)) throw new Error(`${path}.${key} is not allowed beside a family id; the registry supplies name, description and link`);
  return value as unknown as FamilyRelatedTool;
}

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

export function buildLabel(build: DocsSystemBuild): string {
  return `docs-system ${build.kind === 'commit' ? build.revision.slice(0, 7) : build.revision}${build.dirty ? ' + local changes' : ''}`;
}

export function buildHref(build: DocsSystemBuild): string | undefined {
  return build.kind === 'commit' ? `https://github.com/beyond10x/docs-system/commit/${build.revision}` : undefined;
}
