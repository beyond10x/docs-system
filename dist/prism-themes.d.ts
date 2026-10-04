/**
 * Prism themes matched to the product-site tokens. Every token colour clears WCAG 4.5:1 against
 * its code surface (light #f4f7f4, dark #0c1516). Shape-compatible with prism-react-renderer's
 * `PrismTheme`, so `themeConfig.prism.theme` / `darkTheme` accept them directly.
 */
export interface PrismThemeEntry {
    types: string[];
    style: Record<string, string>;
    languages?: string[];
}
export interface PrismTheme {
    plain: Record<string, string>;
    styles: PrismThemeEntry[];
}
export declare const productPrismTheme: PrismTheme;
export declare const productPrismDarkTheme: PrismTheme;
