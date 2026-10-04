/**
 * The reserved colour roles of the product sites, with the values the dataviz validator passed
 * (style plan § 4). One hue never does two jobs inside a component:
 *
 * - status maturity: an ordinal one-hue ramp, always with a glyph (○ ◐ ●) and the word;
 * - truth values: TRUE, UNKNOWN, FALSE, always with a glyph (✓ ? ✕) and the word;
 * - protocol kinds: unchanged, in product-components.css;
 * - product signature: identity only, always beside the product's name and mark.
 *
 * Links, buttons and focus stay the shared family green. Node-safe.
 */
export type ProductId = 'canon' | 'els' | 'loom' | 'commission' | 'ess';
export type Mode = 'light' | 'dark';
/** Planned → decided → shipped, light end first. Ordinal checks pass on both grounds per mode. */
export declare const STATUS_RAMP: Record<Mode, {
    planned: string;
    decided: string;
    shipped: string;
}>;
/** All-pairs validated; UNKNOWN keeps the hand-built amber and is drawn dashed. */
export declare const TRUTH: Record<Mode, {
    true: string;
    unknown: string;
    false: string;
}>;
export interface ProductSignature {
    name: string;
    /** Default letter mark. */
    mark: string;
    /** Mark tile and rule colour, per mode (categorical, family order validated adjacent). */
    hue: Record<Mode, string>;
    /** Text ink for the hero emphasis, kicker and mark letter (≥ 6.5:1 light, ≥ 10.6:1 dark). */
    ink: Record<Mode, string>;
}
/** Family order Canon, ELS, Loom, Commission, ESS; ELS and ESS are never adjacent. */
export declare const PRODUCT_SIGNATURES: Record<ProductId, ProductSignature>;
export declare function isProductId(value: unknown): value is ProductId;
/** CSS custom properties for one product's signature, for both colour modes. */
export declare function productSignatureCss(product: ProductId): string;
/** Mermaid `base` theme variables from the product tokens, per colour mode. */
export declare function mermaidThemeVariables(mode: Mode): Record<string, string | boolean>;
