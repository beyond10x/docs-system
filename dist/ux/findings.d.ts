export declare const FINDING_FIELDS: readonly ["id", "title", "class", "severity", "metric", "status", "found_by", "evidence_recording", "evidence_screenshot", "evidence_lines", "regression_asset"];
export type Finding = Record<(typeof FINDING_FIELDS)[number], string> & {
    file: string;
};
/** Reads the `key: value` header lines up to the first blank line after the title. */
export declare function parseFinding(text: string, file: string): Finding;
export declare function readFindings(directory: string): Promise<Finding[]>;
/** Problems: an id that does not match its file, an unknown severity or class, a closed S1/S2 without an asset that exists. */
export declare function checkFindings(directory: string, root: string): Promise<string[]>;
