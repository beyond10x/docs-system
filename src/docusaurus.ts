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
