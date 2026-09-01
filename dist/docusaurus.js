import { fileURLToPath } from 'node:url';
export default function docsSystemPlugin() {
    return {
        name: 'b10x-docs-system',
        getClientModules() {
            return [fileURLToPath(new URL('../styles/tokens.css', import.meta.url))];
        },
    };
}
export function ecosystemNavbarItems() {
    return [
        { href: 'https://beyond10x.github.io/', label: 'beyond10x', position: 'left' },
        { href: 'https://beyond10x.github.io/ecosystem/', label: 'Ecosystem', position: 'left' },
        { href: 'https://beyond10x.github.io/changes/', label: 'Changes', position: 'left' },
    ];
}
export function ecosystemFooterGroup() {
    return {
        title: 'beyond10x',
        items: [
            { label: 'Start here', href: 'https://beyond10x.github.io/' },
            { label: 'Public ecosystem', href: 'https://beyond10x.github.io/ecosystem/' },
            { label: 'Ecosystem changes', href: 'https://beyond10x.github.io/changes/' },
        ],
    };
}
