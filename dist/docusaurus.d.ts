export interface DocsSystemPluginOptions {
    manifestPath?: string;
}
export default function docsSystemPlugin(): {
    name: string;
    getClientModules(): string[];
};
