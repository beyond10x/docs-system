// Reference site for the product-site template. The product layer is the one wrapping call below.
import path from 'node:path';
import {createRequire} from 'node:module';
import {withProductSite} from '@beyond10x/docs-system/product-site';

const require = createRequire(import.meta.url);

// The example links docs-system from this checkout, which carries its own node_modules; keep one
// React and one Docusaurus theme runtime for the bundle. A Git-pinned consumer does not need this.
function oneReact() {
  return {
    name: 'example-one-react',
    configureWebpack: () => ({
      resolve: {
        alias: {
          react: path.dirname(require.resolve('react/package.json')),
          'react-dom': path.dirname(require.resolve('react-dom/package.json')),
          '@docusaurus/theme-common$': require.resolve('@docusaurus/theme-common'),
          '@docusaurus/theme-mermaid/client$': require.resolve('@docusaurus/theme-mermaid/client'),
        },
      },
    }),
  };
}

const config = {
  title: 'Canon',
  tagline: 'A formal language and deterministic calculus for evidence-governed protocols.',
  url: 'http://localhost',
  baseUrl: '/product-site/',
  trailingSlash: false,
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  markdown: {format: 'detect', mermaid: true, hooks: {onBrokenMarkdownLinks: 'throw'}},
  themes: ['@docusaurus/theme-mermaid'],
  plugins: [oneReact],
  presets: [['classic', {docs: {routeBasePath: 'docs', sidebarPath: './sidebars.mjs'}, blog: false}]],
  themeConfig: {
    navbar: {
      title: 'Canon',
      items: [
        {to: '/docs/', label: 'Components', position: 'left'},
        {to: '/docs/charts', label: 'Charts', position: 'left'},
        {to: '/docs/meaning', label: 'Meaning', position: 'left'},
        {to: '/docs/code', label: 'Code', position: 'left'},
        {to: '/docs/status', label: 'Status', position: 'left'},
        {to: '/session', label: 'Session', position: 'left'},
        {to: '/heroes', label: 'Heroes', position: 'left'},
        {href: 'https://github.com/beyond10x/canon', label: 'GitHub', position: 'right'},
      ],
    },
    footer: {
      links: [
        {title: 'Template', items: [{label: 'Components', to: '/docs/'}, {label: 'Charts', to: '/docs/charts'}, {label: 'Hero art', to: '/heroes'}]},
        {title: 'Project', items: [{label: 'Status', to: '/docs/status'}, {label: 'Session', to: '/session'}, {label: 'Source', href: 'https://github.com/beyond10x/docs-system'}]},
      ],
      copyright: 'A beyond10x project. The product-site template from docs-system, rendered with real inputs.',
    },
  },
};

export default withProductSite(config, {landing: './product.json', product: 'canon'});
