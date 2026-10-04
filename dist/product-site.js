/**
 * The product-site layer: one opt-in that turns a repository's Docusaurus site into a product
 * front page with documentation that shares its tokens.
 *
 * ```ts
 * import {withProductSite} from '@beyond10x/docs-system/product-site';
 * export default withProductSite(config, {landing: './product.json', mark: 'C'});
 * ```
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { PRISM_ADDITIONAL_LANGUAGES } from './code.js';
import { parseDomainGraph, parseProtocolGraph } from './product-graphs.js';
import { PRODUCT_LANDING_FORMAT, parseTerminalSession } from './product-data.js';
import { productPrismDarkTheme, productPrismTheme } from './prism-themes.js';
const styles = (name) => fileURLToPath(new URL(`../styles/${name}`, import.meta.url));
export default function productSitePlugin(context, options = {}) {
    const landingFile = options.landing ? path.resolve(context.siteDir, options.landing) : undefined;
    const watched = new Set(landingFile ? [landingFile] : []);
    const mark = options.mark ?? context.siteConfig?.title?.slice(0, 1) ?? '';
    if (mark && !/^[\p{L}\p{N}]{1,3}$/u.test(mark))
        throw new Error(`product-site mark must be one to three letters or digits, received ${JSON.stringify(mark)}`);
    return {
        name: 'b10x-product-site',
        getThemePath: () => fileURLToPath(new URL('./theme', import.meta.url)),
        getClientModules: () => [styles('tokens.css'), styles('product-components.css'), styles('product-theme.css')],
        getPathsToWatch: () => [...watched],
        async loadContent() {
            if (!landingFile)
                return null;
            const landing = await readLanding(landingFile, watched);
            return landing;
        },
        async contentLoaded({ content, actions }) {
            if (!content)
                return;
            const data = await actions.createData('b10x-product-landing.json', JSON.stringify(content));
            actions.addRoute({ path: joinRoute(context.baseUrl, options.landingPath ?? '/'), component: '@theme/ProductLandingPage', exact: true, modules: { landing: data } });
        },
        injectHtmlTags: () => ({ headTags: mark ? [{ tagName: 'style', innerHTML: `:root{--b10x-product-mark:"${mark}"}` }] : [] }),
    };
}
/** Read a landing file and inline every referenced terminal session and graph document. */
export async function readLanding(file, watched) {
    const directory = path.dirname(file);
    const parse = (text, name) => name.endsWith('.json') ? JSON.parse(text) : YAML.parse(text);
    const landing = parse(await fs.readFile(file, 'utf8'), file);
    if (landing?.format !== PRODUCT_LANDING_FORMAT)
        throw new Error(`${file}: format must be ${PRODUCT_LANDING_FORMAT}`);
    const load = async (reference) => {
        if (typeof reference !== 'string')
            return reference;
        const target = path.resolve(directory, reference);
        watched?.add(target);
        return parse(await fs.readFile(target, 'utf8'), target);
    };
    if (landing.product.terminal !== undefined)
        landing.product.terminal = parseTerminalSession(await load(landing.product.terminal));
    for (const section of landing.sections ?? []) {
        if (section.kind === 'terminal')
            section.session = parseTerminalSession(await load(section.session));
        if (section.kind === 'protocol-graph')
            section.data = parseProtocolGraph(await load(section.data));
        if (section.kind === 'domain-graph')
            section.data = parseDomainGraph(await load(section.data));
    }
    return landing;
}
/** Wrap a Docusaurus config: add the product layer, the matched Prism themes and a dark default. */
export function withProductSite(config, options = {}) {
    const themeConfig = (config.themeConfig ?? {});
    const prism = (themeConfig.prism ?? {});
    const colorMode = (themeConfig.colorMode ?? {});
    return {
        ...config,
        plugins: [...(config.plugins ?? []), [productSitePlugin, options]],
        themeConfig: {
            ...themeConfig,
            colorMode: { defaultMode: 'dark', respectPrefersColorScheme: true, ...colorMode },
            prism: {
                theme: productPrismTheme,
                darkTheme: productPrismDarkTheme,
                ...prism,
                additionalLanguages: [...new Set([...PRISM_ADDITIONAL_LANGUAGES, ...(prism.additionalLanguages ?? [])])],
            },
        },
    };
}
function joinRoute(baseUrl, route) {
    const joined = `${baseUrl.replace(/\/+$/, '')}/${route.replace(/^\/+/, '')}`;
    return joined === '' ? '/' : joined;
}
