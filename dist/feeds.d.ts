import type { ChangeLedger, ChangeLedgerEntry, FeedScope } from './types.js';
export interface FeedWriteOptions {
    scope?: FeedScope;
    homePageUrl?: string;
    feedUrl?: string;
    title?: string;
}
export declare function writeRss(out: string, ledger: ChangeLedger, options?: FeedWriteOptions): Promise<void>;
export declare function writeJsonFeed(out: string, ledger: ChangeLedger, options?: FeedWriteOptions): Promise<void>;
export declare function selectFeedEntries(ledger: ChangeLedger, scope: FeedScope): ChangeLedgerEntry[];
