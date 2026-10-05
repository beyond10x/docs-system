/**
 * The beyond10x product family: one registry for related-tool cards, the footer family strip and
 * the navbar switcher, so a tool is named, marked and described the same way on every site.
 * Node-safe; the React renderers live in `product.tsx`.
 *
 * Adding a product (AEP, Mantle, …) is one entry here and one validated signature in
 * `product-palette.ts`.
 */
import { PRODUCT_SIGNATURES } from './product-palette.js';
/** Family order. ELS and ESS are never adjacent (their hues are the closest pair, style plan § 4). */
export const FAMILY_ORDER = ['canon', 'els', 'loom', 'commission', 'ess'];
/** The GitHub repository and project-site path, where they differ from the product id (the id is
 * the palette key and stays stable across a repository rename). */
const REPOSITORY = { els: 'engineering-protocols' };
const COPY = {
    canon: { tagline: 'Protocol calculus', description: 'A formal language and a deterministic calculus for evidence-governed protocols: what is known, what is owed, what has been earned.' },
    els: { tagline: 'Engineering protocols on Canon', description: 'Engineering protocols written in Canon: which claims must hold, which evidence counts, which actions need authority.' },
    loom: { tagline: 'Native agent harness', description: 'The native agent harness: a model that acts, only inside its frontier.' },
    commission: { tagline: 'Agents you can give responsibility to', description: 'Build agents you can give responsibility to: a reusable agent revision bound to a durable case, under a governor.' },
    ess: { tagline: 'Executable system specifications', description: 'Executable system specifications: the contract every product here is held to.' },
};
export const FAMILY = Object.fromEntries(FAMILY_ORDER.map((id) => [id, {
        id,
        name: PRODUCT_SIGNATURES[id].name,
        mark: PRODUCT_SIGNATURES[id].mark,
        ...COPY[id],
        url: `https://beyond10x.github.io/${REPOSITORY[id] ?? id}/`,
        repository: `https://github.com/beyond10x/${REPOSITORY[id] ?? id}`,
    }]));
export function familyMembers() {
    return FAMILY_ORDER.map((id) => FAMILY[id]);
}
export const FAMILY_RELATIONS = ['uses', 'used-by', 'beside', 'specifies', 'specified-by'];
const RELATION_WORDS = { uses: 'uses', 'used-by': 'used by', beside: 'beside', specifies: 'specifies', 'specified-by': 'specified by' };
/** "uses Canon", or the bare word when the current product is unknown. */
export function relationPhrase(relation, current) {
    return current ? `${RELATION_WORDS[relation]} ${FAMILY[current].name}` : RELATION_WORDS[relation];
}
export function isFamilyRelatedTool(value) {
    return typeof value === 'object' && value !== null && 'id' in value && !('name' in value);
}
export function parseFamilyRelatedTool(value, path) {
    if (typeof value.id !== 'string' || !(value.id in FAMILY))
        throw new Error(`${path}.id must be one of ${FAMILY_ORDER.join(', ')}`);
    if (!FAMILY_RELATIONS.includes(value.relation))
        throw new Error(`${path}.relation must be one of ${FAMILY_RELATIONS.join(', ')}`);
    if (value.via !== undefined && (typeof value.via !== 'string' || !value.via))
        throw new Error(`${path}.via must be a non-empty string`);
    for (const key of Object.keys(value))
        if (!['id', 'relation', 'via'].includes(key))
            throw new Error(`${path}.${key} is not allowed beside a family id; the registry supplies name, description and link`);
    return value;
}
export function buildLabel(build) {
    return `docs-system ${build.kind === 'commit' ? build.revision.slice(0, 7) : build.revision}${build.dirty ? ' + local changes' : ''}`;
}
export function buildHref(build) {
    return build.kind === 'commit' ? `https://github.com/beyond10x/docs-system/commit/${build.revision}` : undefined;
}
