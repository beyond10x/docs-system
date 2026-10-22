/**
 * The `console` fence language on a product site: shell highlighting with a prompt the reader sees
 * and never copies.
 *
 * A block that writes its own prompts (`$ cargo test` followed by output) is a transcript and is
 * highlighted with Prism's `shell-session` grammar. A block without one is a list of commands: each
 * command is highlighted as Bash and gets a `console-prompt` token, which exists only in the
 * rendered page. The copy button copies the fence's source, so the prompt is never copied, and the
 * stylesheet makes it unselectable.
 */
/** The parts of a Prism instance this module uses; prism-react-renderer's `Prism` satisfies it. */
export interface ConsolePrism {
    languages: Record<string, unknown>;
    hooks: {
        add(name: 'after-tokenize', callback: (env: ConsoleTokenizeEnv) => void): void;
    };
    tokenize(text: string, grammar: unknown): unknown[];
    Token: new (type: string, content: string) => unknown;
}
export interface ConsoleTokenizeEnv {
    code: string;
    language: string;
    tokens: unknown[];
}
/** The fence language this module highlights. */
export declare const CONSOLE_LANGUAGE = "console";
/** The token type of the prompt drawn before a command in a block that writes none. */
export declare const CONSOLE_PROMPT_TOKEN = "console-prompt";
/** True when the block writes its own prompts and is therefore a transcript with output. */
export declare function consoleHasPrompts(code: string): boolean;
/**
 * Splits a block without prompts into commands, comments and blank lines. A line ending in `\`,
 * `|`, `&&` or `||` continues the command on the next line.
 */
export declare function consoleCommands(code: string): Array<{
    prompt: boolean;
    text: string;
}>;
/** Registers the `console` language on a Prism instance once; Bash and shell-session must be loaded for highlighting. */
export declare function registerConsoleLanguage(prism: ConsolePrism): void;
