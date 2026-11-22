/**
 * `b10x-cli-reference/1`: a command-line interface as data, for the CLI reference page. Node-safe:
 * no React, no Docusaurus.
 */
export declare const CLI_REFERENCE_FORMAT = "b10x-cli-reference/1";
export type CliArgumentKind = 'positional' | 'option' | 'switch';
export interface CliArgument {
    /** The argument's id inside its command; `conflicts`, `requires` and groups name it. */
    name: string;
    kind: CliArgumentKind;
    /** Long flag without dashes (`secret-key-file`); options and switches. */
    long?: string;
    /** Short flag, one character without the dash; options and switches. */
    short?: string;
    /** The value placeholder (`TO`); options and positionals. Defaults to the name in capitals. */
    valueName?: string;
    required?: boolean;
    /** The value used when the argument is absent, as the user would type it. */
    default?: string;
    /** An environment variable read when the flag is absent. */
    env?: string;
    /** May be given more than once (an option), or takes several values (a positional). */
    repeatable?: boolean;
    /** A positional that only follows `--` and takes every remaining word. */
    trailing?: boolean;
    /** The only values accepted. */
    values?: string[];
    help?: string;
    conflicts?: string[];
    requires?: string[];
}
export interface CliArgumentGroup {
    name: string;
    /** The argument names in the group. */
    arguments: string[];
    /** One of the group must be given. */
    required?: boolean;
    /** More than one of the group may be given. Default false. */
    multiple?: boolean;
}
export interface CliCommand {
    /** The words after the binary name: `["key", "new"]`. */
    path: string[];
    aliases?: string[][];
    about?: string;
    /** Long description, plain text; blank lines separate paragraphs. */
    description?: string;
    arguments?: CliArgument[];
    groups?: CliArgumentGroup[];
}
export interface CliEnvironmentVariable {
    name: string;
    description?: string;
    /** The command paths that read it; absent, every command may. */
    commands?: string[][];
}
export interface CliExitStatus {
    code: number;
    meaning: string;
}
export interface CliReferenceDocument {
    format: typeof CLI_REFERENCE_FORMAT;
    binary: string;
    about?: string;
    description?: string;
    version?: string;
    globalOptions?: CliArgument[];
    commands: CliCommand[];
    /** Environment variables read outside any flag's `env`. */
    environment?: CliEnvironmentVariable[];
    exitStatuses?: CliExitStatus[];
}
/** Check a value is a `b10x-cli-reference/1` document; the message names the path of the first problem. */
export declare function parseCliReference(value: unknown): CliReferenceDocument;
/** The exit statuses of the ESS-generated CLI runtime. */
export declare const ESS_CLI_EXIT_STATUSES: readonly CliExitStatus[];
/**
 * Convert a compiled ESS CLI plan (`ess-cli-plan/2`, `ess specify cli --format json`) into a
 * `b10x-cli-reference/1` document. A plan carries no per-flag help, environment or defaults, so the
 * result has none beyond what the ESS runtime itself adds (the global selectors and `completions`).
 */
export declare function cliReferenceFromEssPlan(plan: unknown): CliReferenceDocument;
