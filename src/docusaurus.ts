import {fileURLToPath} from 'node:url';

export interface DocsSystemPluginOptions {manifestPath?: string}

export default function docsSystemPlugin(): {name: string; getClientModules(): string[]} {
  return {
    name: 'b10x-docs-system',
    getClientModules() {
      return [fileURLToPath(new URL('../styles/tokens.css', import.meta.url))];
    },
  };
}

export function ecosystemNavbarItems(): Array<Record<string, string>> {
  return [
    {href: 'https://beyond10x.github.io/getting-started/', label: 'beyond10x', position: 'left'},
    {href: 'https://beyond10x.github.io/getting-started/ecosystem', label: 'Ecosystem', position: 'left'},
    {href: 'https://beyond10x.github.io/getting-started/changes', label: 'Changes', position: 'left'},
  ];
}

export function ecosystemFooterGroup(): {title: string; items: Array<{label: string; href: string}>} {
  return {
    title: 'beyond10x',
    items: [
      {label: 'Start here', href: 'https://beyond10x.github.io/getting-started/'},
      {label: 'Public ecosystem', href: 'https://beyond10x.github.io/getting-started/ecosystem'},
      {label: 'Ecosystem changes', href: 'https://beyond10x.github.io/getting-started/changes'},
    ],
  };
}
