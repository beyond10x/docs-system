import type { ChangeLedger } from './types.js';
export declare function writeRss(out: string, ledger: ChangeLedger): Promise<void>;
export declare function writeJsonFeed(out: string, ledger: ChangeLedger): Promise<void>;
