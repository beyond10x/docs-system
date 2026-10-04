/**
 * Prism themes matched to the product-site tokens. Every token colour clears WCAG 4.5:1 against
 * its code surface (light #f4f7f4, dark #0c1516). Shape-compatible with prism-react-renderer's
 * `PrismTheme`, so `themeConfig.prism.theme` / `darkTheme` accept them directly.
 */

export interface PrismThemeEntry {types: string[]; style: Record<string, string>; languages?: string[]}
export interface PrismTheme {plain: Record<string, string>; styles: PrismThemeEntry[]}

interface CodePalette {
  background: string;
  text: string;
  comment: string;
  punctuation: string;
  keyword: string;
  string: string;
  literal: string;
  key: string;
  function: string;
  type: string;
}

function theme(palette: CodePalette): PrismTheme {
  return {
    plain: {color: palette.text, backgroundColor: palette.background},
    styles: [
      {types: ['comment', 'prolog', 'doctype', 'cdata'], style: {color: palette.comment, fontStyle: 'italic'}},
      {types: ['punctuation', 'operator'], style: {color: palette.punctuation}},
      {types: ['keyword', 'selector', 'important', 'atrule', 'tag', 'deleted'], style: {color: palette.keyword}},
      {types: ['string', 'char', 'attr-value', 'regex', 'url', 'inserted'], style: {color: palette.string}},
      {types: ['number', 'boolean', 'constant', 'symbol', 'lifetime-annotation'], style: {color: palette.literal}},
      {types: ['property', 'attr-name', 'key', 'macro', 'namespace'], style: {color: palette.key}},
      {types: ['function', 'function-definition'], style: {color: palette.function}},
      {types: ['class-name', 'builtin', 'type-definition'], style: {color: palette.type}},
      {types: ['variable', 'parameter'], style: {color: palette.text}},
      // YAML: keys are `atrule key`; give them the key colour, and plain scalars the string colour.
      {types: ['key', 'atrule'], languages: ['yaml'], style: {color: palette.key}},
      {types: ['scalar', 'string'], languages: ['yaml'], style: {color: palette.string}},
      {types: ['important'], style: {fontWeight: '600'}},
      {types: ['italic'], style: {fontStyle: 'italic'}},
      {types: ['bold'], style: {fontWeight: '600'}},
    ],
  };
}

export const productPrismTheme: PrismTheme = theme({
  background: '#f4f7f4',
  text: '#1d2a2b',
  comment: '#5f716b',
  punctuation: '#4f625d',
  keyword: '#a1392b',
  string: '#1f5f86',
  literal: '#8a5300',
  key: '#17684a',
  function: '#4f6a00',
  type: '#5b49b3',
});

export const productPrismDarkTheme: PrismTheme = theme({
  background: '#0c1516',
  text: '#e7eeea',
  comment: '#8a9e97',
  punctuation: '#a8b8b3',
  keyword: '#eeb1a8',
  string: '#b9d9ee',
  literal: '#efd09a',
  key: '#b6e5ce',
  function: '#d9e7a6',
  type: '#c9c1f0',
});
