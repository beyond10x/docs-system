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
  hooks: {add(name: 'after-tokenize', callback: (env: ConsoleTokenizeEnv) => void): void};
  tokenize(text: string, grammar: unknown): unknown[];
  Token: new (type: string, content: string) => unknown;
}

export interface ConsoleTokenizeEnv {
  code: string;
  language: string;
  tokens: unknown[];
}

/** The fence language this module highlights. */
export const CONSOLE_LANGUAGE = 'console';

/** The token type of the prompt drawn before a command in a block that writes none. */
export const CONSOLE_PROMPT_TOKEN = 'console-prompt';

const PROMPTED = /^[ \t]*(?:[\w.-]+@[\w.-]+(?::[^\s$]*)?)?\$(?:[ \t]|$)/m;
const CONTINUED = /(?:\\|\||&&|\|\|)[ \t]*$/;

const registered = new WeakSet<object>();

/** True when the block writes its own prompts and is therefore a transcript with output. */
export function consoleHasPrompts(code: string): boolean {
  return PROMPTED.test(code);
}

/**
 * Splits a block without prompts into commands, comments and blank lines. A line ending in `\`,
 * `|`, `&&` or `||` continues the command on the next line.
 */
export function consoleCommands(code: string): Array<{prompt: boolean; text: string}> {
  const segments: Array<{prompt: boolean; text: string}> = [];
  let continued = false;
  for (const line of code.split('\n')) {
    if (continued) {
      segments[segments.length - 1].text += `\n${line}`;
    } else {
      const trimmed = line.trim();
      segments.push({prompt: trimmed !== '' && !trimmed.startsWith('#'), text: line});
    }
    continued = segments[segments.length - 1].prompt && CONTINUED.test(line);
  }
  return segments;
}

/** Registers the `console` language on a Prism instance once; Bash and shell-session must be loaded for highlighting. */
export function registerConsoleLanguage(prism: ConsolePrism): void {
  if (registered.has(prism)) return;
  registered.add(prism);
  prism.languages[CONSOLE_LANGUAGE] = prism.languages.bash ?? {};
  prism.hooks.add('after-tokenize', (env) => {
    if (env.language !== CONSOLE_LANGUAGE) return;
    const session = prism.languages['shell-session'];
    if (session && consoleHasPrompts(env.code)) {
      env.tokens = prism.tokenize(env.code, session);
      return;
    }
    const grammar = prism.languages.bash ?? {};
    const tokens: unknown[] = [];
    consoleCommands(env.code).forEach((segment, index) => {
      if (index > 0) tokens.push('\n');
      if (segment.prompt) tokens.push(new prism.Token(CONSOLE_PROMPT_TOKEN, '$ '));
      if (segment.text) tokens.push(...prism.tokenize(segment.text, grammar));
    });
    env.tokens = tokens;
  });
}
