import { fileURLToPath } from 'node:url';
export default function docsSystemPlugin() {
    return {
        name: 'b10x-docs-system',
        getClientModules() {
            return [fileURLToPath(new URL('../styles/tokens.css', import.meta.url))];
        },
    };
}
