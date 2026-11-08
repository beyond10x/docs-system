export interface SiteServer {
    url: string;
    close(): Promise<void>;
}
export declare function serveSite(root: string, baseUrl: string): Promise<SiteServer>;
/** Page paths after the base URL from the build's sitemap.xml, sorted; the root page is ''. */
export declare function sitemapPages(root: string, baseUrl: string): Promise<string[]>;
