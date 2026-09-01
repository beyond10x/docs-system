export interface DocsSystemPluginOptions {
    manifestPath?: string;
}
export default function docsSystemPlugin(): {
    name: string;
    getClientModules(): string[];
};
export declare function ecosystemNavbarItems(): Array<Record<string, string>>;
export declare function ecosystemFooterGroup(): {
    title: string;
    items: Array<{
        label: string;
        href: string;
    }>;
};
