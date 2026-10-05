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
/** Planned → decided → shipped, light end first. Ordinal checks pass on both grounds per mode. */
export const STATUS_RAMP = {
    light: { planned: '#6db794', decided: '#269269', shipped: '#006948' },
    dark: { planned: '#277354', decided: '#3ba97d', shipped: '#8bdfb8' },
};
/** All-pairs validated; UNKNOWN keeps the hand-built amber and is drawn dashed. */
export const TRUTH = {
    light: { true: '#139e6f', unknown: '#c98500', false: '#ac312a' },
    dark: { true: '#34aa7c', unknown: '#bb881a', false: '#b24039' },
};
/** Family order Canon, ELS, Loom, Commission, ESS; ELS and ESS are never adjacent. */
export const PRODUCT_SIGNATURES = {
    canon: { name: 'Canon', mark: 'C', hue: { light: '#26996e', dark: '#3ba97d' }, ink: { light: '#17684a', dark: '#b6e5ce' } },
    els: { name: 'Engineering protocols', mark: 'El', hue: { light: '#a06b01', dark: '#a36e09' }, ink: { light: '#744c00', dark: '#f0cea1' } },
    loom: { name: 'Loom', mark: 'L', hue: { light: '#0e5794', dark: '#4296e7' }, ink: { light: '#23588a', dark: '#b7d8fb' } },
    commission: { name: 'Commission', mark: 'Co', hue: { light: '#946fbd', dark: '#885cb5' }, ink: { light: '#624581', dark: '#ddcbf5' } },
    ess: { name: 'ESS', mark: 'Es', hue: { light: '#8c352a', dark: '#a95043' }, ink: { light: '#843d33', dark: '#f9c6bd' } },
};
export function isProductId(value) {
    return typeof value === 'string' && value in PRODUCT_SIGNATURES;
}
/** CSS custom properties for one product's signature, for both colour modes. */
export function productSignatureCss(product) {
    const signature = PRODUCT_SIGNATURES[product];
    const block = (mode) => `--b10x-product-hue:${signature.hue[mode]};--b10x-product-ink:${signature.ink[mode]};`;
    return `:root,html[data-theme='light']{${block('light')}}html[data-theme='dark']{${block('dark')}}`;
}
/** Mermaid `base` theme variables from the product tokens, per colour mode. */
export function mermaidThemeVariables(mode) {
    const light = mode === 'light';
    const canvas = light ? '#f6f8f5' : '#101a1b';
    const panel = light ? '#ffffff' : '#172324';
    const muted = light ? '#eef3f0' : '#13201f';
    const text = light ? '#1d2a2b' : '#e7eeea';
    const heading = light ? '#0f1b1c' : '#f1f6f3';
    const line = light ? '#7f918b' : '#5d7470';
    const hairline = light ? '#d6dfda' : '#314244';
    const accent = light ? '#17684a' : '#b6e5ce';
    const amber = light ? '#f8f1e2' : '#27281f';
    return {
        darkMode: !light,
        background: canvas,
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        fontSize: '14px',
        primaryColor: panel,
        primaryTextColor: heading,
        primaryBorderColor: line,
        secondaryColor: muted,
        secondaryTextColor: text,
        secondaryBorderColor: hairline,
        tertiaryColor: canvas,
        tertiaryTextColor: text,
        tertiaryBorderColor: hairline,
        lineColor: line,
        textColor: text,
        mainBkg: panel,
        nodeBorder: line,
        nodeTextColor: heading,
        clusterBkg: muted,
        clusterBorder: hairline,
        titleColor: heading,
        edgeLabelBackground: canvas,
        labelBackground: canvas,
        labelBackgroundColor: canvas,
        actorBkg: panel,
        actorBorder: line,
        actorTextColor: heading,
        actorLineColor: line,
        signalColor: text,
        signalTextColor: text,
        labelBoxBkgColor: panel,
        labelBoxBorderColor: line,
        labelTextColor: heading,
        loopTextColor: text,
        activationBkgColor: muted,
        activationBorderColor: line,
        sequenceNumberColor: canvas,
        noteBkgColor: amber,
        noteTextColor: text,
        noteBorderColor: light ? '#8a5300' : '#efd09a',
        stateBkg: panel,
        stateLabelColor: heading,
        specialStateColor: accent,
        transitionColor: line,
        transitionLabelColor: text,
        compositeBackground: muted,
        compositeTitleBackground: muted,
        altBackground: muted,
    };
}
