/**
 * `b10x-cli-reference/1`: a command-line interface as data, for the CLI reference page. Node-safe:
 * no React, no Docusaurus.
 */

export const CLI_REFERENCE_FORMAT = 'b10x-cli-reference/1';

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

const KINDS: readonly CliArgumentKind[] = ['positional', 'option', 'switch'];
const WORD = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;
const ENV = /^[A-Za-z_][A-Za-z0-9_]*$/;
const FLAG = /^[A-Za-z0-9][A-Za-z0-9-]*$/;

type Problem = (path: string, message: string) => never;
const fail: Problem = (path, message) => { throw new Error(`${CLI_REFERENCE_FORMAT}: ${path} ${message}`); };
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
function only(value: Record<string, unknown>, path: string, allowed: readonly string[]): void {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(path ? `${path}.${key}` : key, `is not a member of ${path || 'the document'}; allowed: ${allowed.join(', ')}`);
}
function text(value: unknown, path: string, optional = false, pattern?: RegExp): string | undefined {
  if (value === undefined && optional) return undefined;
  if (typeof value !== 'string' || !value.trim()) fail(path, 'must be a non-empty string');
  if (pattern && !pattern.test(value as string)) fail(path, `must match ${pattern}, received ${JSON.stringify(value)}`);
  return value as string;
}
function flag(value: unknown, path: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') fail(path, 'must be true or false');
  return value as boolean;
}
function list(value: unknown, path: string, pattern?: RegExp): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) fail(path, 'must be an array of strings');
  return (value as unknown[]).map((item, index) => text(item, `${path}[${index}]`, false, pattern)!);
}
function words(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || !value.length) fail(path, 'must be a non-empty array of command words');
  return (value as unknown[]).map((word, index) => text(word, `${path}[${index}]`, false, WORD)!);
}

function parseArgument(value: unknown, path: string): CliArgument {
  if (!record(value)) fail(path, 'must be an object');
  const input = value as Record<string, unknown>;
  only(input, path, ['name', 'kind', 'long', 'short', 'valueName', 'required', 'default', 'env', 'repeatable', 'trailing', 'values', 'help', 'conflicts', 'requires']);
  const kind = input.kind as CliArgumentKind;
  if (!KINDS.includes(kind)) fail(`${path}.kind`, `must be one of ${KINDS.join(', ')}, received ${JSON.stringify(input.kind)}`);
  const argument: CliArgument = {name: text(input.name, `${path}.name`, false, WORD)!, kind};
  const long = text(input.long, `${path}.long`, true, FLAG);
  const short = text(input.short, `${path}.short`, true, /^[A-Za-z0-9]$/);
  if (kind === 'positional' && (long || short)) fail(path, 'is positional and takes no long or short flag');
  if (kind !== 'positional' && !long && !short) fail(path, `is ${kind === 'option' ? 'an option' : 'a switch'} and needs a long or a short flag`);
  if (long) argument.long = long;
  if (short) argument.short = short;
  const valueName = text(input.valueName, `${path}.valueName`, true);
  if (kind === 'switch' && (valueName || input.values !== undefined || input.default !== undefined)) fail(path, 'is a switch and takes no valueName, values or default');
  if (valueName) argument.valueName = valueName;
  const required = flag(input.required, `${path}.required`);
  if (required !== undefined) argument.required = required;
  if (input.default !== undefined) {
    if (typeof input.default !== 'string') fail(`${path}.default`, 'must be a string, as the user would type it');
    argument.default = input.default as string;
  }
  if (required && argument.default !== undefined) fail(path, 'is required and has a default; a default makes it optional');
  const env = text(input.env, `${path}.env`, true, ENV);
  if (env) argument.env = env;
  const repeatable = flag(input.repeatable, `${path}.repeatable`);
  if (repeatable !== undefined) argument.repeatable = repeatable;
  const trailing = flag(input.trailing, `${path}.trailing`);
  if (trailing && kind !== 'positional') fail(`${path}.trailing`, 'applies to a positional only');
  if (trailing !== undefined) argument.trailing = trailing;
  const values = list(input.values, `${path}.values`);
  if (values) argument.values = values;
  if (values && argument.default !== undefined && !values.includes(argument.default)) fail(`${path}.default`, `must be one of values, received ${JSON.stringify(argument.default)}`);
  const help = text(input.help, `${path}.help`, true);
  if (help) argument.help = help;
  const conflicts = list(input.conflicts, `${path}.conflicts`, WORD);
  if (conflicts) argument.conflicts = conflicts;
  const requires = list(input.requires, `${path}.requires`, WORD);
  if (requires) argument.requires = requires;
  return argument;
}

function parseArguments(value: unknown, path: string): CliArgument[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) fail(path, 'must be an array');
  const result = (value as unknown[]).map((item, index) => parseArgument(item, `${path}[${index}]`));
  const seen = new Map<string, number>();
  result.forEach((argument, index) => {
    if (seen.has(argument.name)) fail(`${path}[${index}].name`, `repeats ${JSON.stringify(argument.name)} of ${path}[${seen.get(argument.name)}]`);
    seen.set(argument.name, index);
  });
  return result;
}

function checkFlags(argumentsList: CliArgument[], path: string): void {
  const flags = new Map<string, string>();
  for (const argument of argumentsList) for (const key of [argument.long && `--${argument.long}`, argument.short && `-${argument.short}`].filter(Boolean) as string[]) {
    if (flags.has(key)) fail(path, `uses ${key} for both ${flags.get(key)} and ${argument.name}`);
    flags.set(key, argument.name);
  }
}

/** Check a value is a `b10x-cli-reference/1` document; the message names the path of the first problem. */
export function parseCliReference(value: unknown): CliReferenceDocument {
  if (!record(value)) throw new Error(`${CLI_REFERENCE_FORMAT}: the document must be an object`);
  const input = value as Record<string, unknown>;
  if (input.format !== CLI_REFERENCE_FORMAT) throw new Error(`${CLI_REFERENCE_FORMAT}: format must be ${CLI_REFERENCE_FORMAT}, received ${JSON.stringify(input.format)}`);
  only(input, '', ['format', 'binary', 'about', 'description', 'version', 'globalOptions', 'commands', 'environment', 'exitStatuses']);
  const document: CliReferenceDocument = {format: CLI_REFERENCE_FORMAT, binary: text(input.binary, 'binary', false, WORD)!, commands: []};
  for (const key of ['about', 'description', 'version'] as const) {
    const member = text(input[key], key, true);
    if (member) document[key] = member;
  }
  const globals = parseArguments(input.globalOptions, 'globalOptions');
  if (globals) {
    globals.forEach((argument, index) => { if (argument.kind === 'positional') fail(`globalOptions[${index}].kind`, 'must be option or switch: a global is never positional'); });
    checkFlags(globals, 'globalOptions');
    document.globalOptions = globals;
  }
  if (!Array.isArray(input.commands) || !input.commands.length) fail('commands', 'must be a non-empty array');
  const paths = new Map<string, number>();
  (input.commands as unknown[]).forEach((raw, index) => {
    const path = `commands[${index}]`;
    if (!record(raw)) fail(path, 'must be an object');
    const command = raw as Record<string, unknown>;
    only(command, path, ['path', 'aliases', 'about', 'description', 'arguments', 'groups']);
    const parsed: CliCommand = {path: words(command.path, `${path}.path`)};
    const key = parsed.path.join(' ');
    if (paths.has(key)) fail(`${path}.path`, `repeats "${key}" of commands[${paths.get(key)}]`);
    paths.set(key, index);
    if (command.aliases !== undefined) {
      if (!Array.isArray(command.aliases)) fail(`${path}.aliases`, 'must be an array of command paths');
      parsed.aliases = (command.aliases as unknown[]).map((alias, item) => words(alias, `${path}.aliases[${item}]`));
    }
    for (const member of ['about', 'description'] as const) {
      const value = text(command[member], `${path}.${member}`, true);
      if (value) parsed[member] = value;
    }
    const argumentsList = parseArguments(command.arguments, `${path}.arguments`) ?? [];
    if (command.arguments !== undefined) parsed.arguments = argumentsList;
    checkFlags([...(globals ?? []), ...argumentsList], `${path}.arguments`);
    const names = new Set([...argumentsList, ...(globals ?? [])].map((argument) => argument.name));
    argumentsList.forEach((argument, item) => {
      for (const relation of ['conflicts', 'requires'] as const) argument[relation]?.forEach((name, position) => {
        if (!names.has(name)) fail(`${path}.arguments[${item}].${relation}[${position}]`, `names ${JSON.stringify(name)}, which is not an argument of "${key}"`);
      });
    });
    const trailing = argumentsList.findIndex((argument) => argument.trailing);
    if (trailing >= 0 && argumentsList.slice(trailing + 1).some((argument) => argument.kind === 'positional')) fail(`${path}.arguments[${trailing}]`, 'is trailing and must be the last positional');
    if (command.groups !== undefined) {
      if (!Array.isArray(command.groups)) fail(`${path}.groups`, 'must be an array');
      parsed.groups = (command.groups as unknown[]).map((group, item) => {
        const groupPath = `${path}.groups[${item}]`;
        if (!record(group)) fail(groupPath, 'must be an object');
        only(group as Record<string, unknown>, groupPath, ['name', 'arguments', 'required', 'multiple']);
        const members = list((group as Record<string, unknown>).arguments, `${groupPath}.arguments`, WORD);
        if (!members || members.length < 1) fail(`${groupPath}.arguments`, 'must name at least one argument');
        members!.forEach((name, position) => { if (!argumentsList.some((argument) => argument.name === name)) fail(`${groupPath}.arguments[${position}]`, `names ${JSON.stringify(name)}, which is not an argument of "${key}"`); });
        const parsedGroup: CliArgumentGroup = {name: text((group as Record<string, unknown>).name, `${groupPath}.name`, false, WORD)!, arguments: members!};
        const required = flag((group as Record<string, unknown>).required, `${groupPath}.required`);
        if (required !== undefined) parsedGroup.required = required;
        const multiple = flag((group as Record<string, unknown>).multiple, `${groupPath}.multiple`);
        if (multiple !== undefined) parsedGroup.multiple = multiple;
        return parsedGroup;
      });
    }
    document.commands.push(parsed);
  });
  if (input.environment !== undefined) {
    if (!Array.isArray(input.environment)) fail('environment', 'must be an array');
    document.environment = (input.environment as unknown[]).map((raw, index) => {
      const path = `environment[${index}]`;
      if (!record(raw)) fail(path, 'must be an object');
      only(raw as Record<string, unknown>, path, ['name', 'description', 'commands']);
      const variable: CliEnvironmentVariable = {name: text((raw as Record<string, unknown>).name, `${path}.name`, false, ENV)!};
      const description = text((raw as Record<string, unknown>).description, `${path}.description`, true);
      if (description) variable.description = description;
      const commands = (raw as Record<string, unknown>).commands;
      if (commands !== undefined) {
        if (!Array.isArray(commands)) fail(`${path}.commands`, 'must be an array of command paths');
        variable.commands = (commands as unknown[]).map((command, item) => {
          const path2 = `${path}.commands[${item}]`;
          const commandPath = words(command, path2);
          if (!paths.has(commandPath.join(' '))) fail(path2, `names "${commandPath.join(' ')}", which is not a command`);
          return commandPath;
        });
      }
      return variable;
    });
  }
  if (input.exitStatuses !== undefined) {
    if (!Array.isArray(input.exitStatuses)) fail('exitStatuses', 'must be an array');
    const codes = new Set<number>();
    document.exitStatuses = (input.exitStatuses as unknown[]).map((raw, index) => {
      const path = `exitStatuses[${index}]`;
      if (!record(raw)) fail(path, 'must be an object');
      only(raw as Record<string, unknown>, path, ['code', 'meaning']);
      const code = (raw as Record<string, unknown>).code;
      if (typeof code !== 'number' || !Number.isInteger(code) || code < 0 || code > 255) fail(`${path}.code`, 'must be an integer from 0 to 255');
      if (codes.has(code as number)) fail(`${path}.code`, `repeats ${code}`);
      codes.add(code as number);
      return {code: code as number, meaning: text((raw as Record<string, unknown>).meaning, `${path}.meaning`)!};
    });
  }
  return document;
}

/** The exit statuses of the ESS-generated CLI runtime. */
export const ESS_CLI_EXIT_STATUSES: readonly CliExitStatus[] = [
  {code: 0, meaning: 'Success.'},
  {code: 1, meaning: 'An application or internal failure.'},
  {code: 2, meaning: 'A parse or input error.'},
  {code: 130, meaning: 'Interrupted.'},
];

interface EssShape {kind: string; of?: EssShape; variants?: string[]; fields?: Record<string, EssShape>}
const valueName = (name: string): string => name.replace(/-/g, '_').toUpperCase();

/**
 * Convert a compiled ESS CLI plan (`ess-cli-plan/2`, `ess specify cli --format json`) into a
 * `b10x-cli-reference/1` document. A plan carries no per-flag help, environment or defaults, so the
 * result has none beyond what the ESS runtime itself adds (the global selectors and `completions`).
 */
export function cliReferenceFromEssPlan(plan: unknown): CliReferenceDocument {
  if (!record(plan)) throw new Error('ess-cli-plan: the plan must be an object');
  const input = plan as Record<string, unknown>;
  if (input.format !== 'ess-cli-plan/2') throw new Error(`ess-cli-plan: format must be ess-cli-plan/2, received ${JSON.stringify(input.format)}`);
  if (typeof input.binary !== 'string' || !Array.isArray(input.commands) || !record(input.globals) || !record(input.callables)) throw new Error('ess-cli-plan: binary, globals, callables and commands are required');
  const globals = input.globals as Record<string, unknown>;
  const callables = input.callables as Record<string, {input?: {shape?: EssShape} | null}>;
  const globalOptions: CliArgument[] = [];
  if (typeof globals.config === 'string') globalOptions.push({name: 'global_config', kind: 'option', long: globals.config, valueName: 'PATH', help: 'The configuration file.'});
  if (typeof globals.state === 'string') globalOptions.push({name: 'global_state', kind: 'option', long: globals.state, valueName: 'PATH', help: 'The state directory.'});
  if (typeof globals.output === 'string') globalOptions.push({name: 'global_output', kind: 'option', long: globals.output, valueName: 'MODE', values: ['human', 'json'], default: 'human', help: 'What standard output carries: text for a person, or JSON.'});
  const commands: CliCommand[] = (input.commands as Array<Record<string, unknown>>).map((command, index) => {
    const at = `ess-cli-plan: commands[${index}]`;
    if (!record(command) || !Array.isArray(command.path) || !Array.isArray(command.arguments)) throw new Error(`${at} needs path and arguments`);
    const callable = callables[String(command.callable)];
    if (!record(callable)) throw new Error(`${at}.callable names ${JSON.stringify(command.callable)}, which is not a callable of the plan`);
    const fields = callable.input?.shape?.kind === 'struct' ? callable.input.shape.fields ?? {} : {};
    const argumentsList: CliArgument[] = [];
    const groups: CliArgumentGroup[] = [];
    const ordered = command.arguments as Array<{field: string; source: Record<string, unknown>}>;
    for (const [position, argument] of ordered.entries()) {
      const field = String(argument.field);
      const shape = fields[field] ?? {kind: 'string'};
      const required = shape.kind !== 'optional';
      const inner = shape.kind === 'optional' && shape.of ? shape.of : shape;
      const values = inner.kind === 'enum' ? inner.variants : inner.kind === 'boolean' ? ['true', 'false'] : undefined;
      const source = argument.source ?? {};
      const kind = String(source.kind);
      const label = field.replace(/_/g, ' ');
      if (kind === 'option') argumentsList.push({name: field, kind: 'option', long: String(source.long), valueName: valueName(String(source.long)), ...(required ? {required} : {}), ...(values ? {values} : {})});
      else if (kind === 'positional') argumentsList.push({name: field, kind: 'positional', valueName: valueName(field), ...(required ? {required} : {}), ...(values ? {values} : {})});
      else if (kind === 'trailing') argumentsList.push({name: field, kind: 'positional', valueName: valueName(field), required: true, repeatable: true, trailing: true, help: 'Every word after `--`, verbatim.'});
      else if (kind === 'document') {
        const names = [`${field}_inline`, `${field}_file`, `${field}_stdin`];
        argumentsList.push(
          {name: names[0], kind: 'option', long: String(source.inline), valueName: valueName(field), help: `The ${label}, inline.`},
          {name: names[1], kind: 'option', long: String(source.file), valueName: 'PATH', help: `A file holding the ${label}.`},
          {name: names[2], kind: 'switch', long: String(source.stdin), help: `Read the ${label} from standard input.`},
        );
        groups.push({name: field, arguments: names, ...(required ? {required} : {}), multiple: false});
      } else if (kind === 'protected') {
        const names = [`${field}_file`, `${field}_stdin`, `${field}_tty`];
        argumentsList.push(
          {name: names[0], kind: 'option', long: String(source.file), valueName: 'PATH', help: `A file holding the ${label}.`},
          {name: names[1], kind: 'switch', long: String(source.stdin), help: `Read the ${label} from standard input.`},
          {name: names[2], kind: 'switch', long: String(source.hidden_tty), help: `Ask for the ${label} at the terminal without echo.`},
        );
        groups.push({name: field, arguments: names, ...(required ? {required} : {}), multiple: false});
      } else throw new Error(`${at}.arguments[${position}].source.kind ${JSON.stringify(kind)} is not one of option, positional, document, protected, trailing`);
    }
    return {
      path: (command.path as unknown[]).map(String),
      ...(Array.isArray(command.aliases) && command.aliases.length ? {aliases: (command.aliases as unknown[][]).map((alias) => alias.map(String))} : {}),
      ...(typeof command.about === 'string' && command.about ? {about: command.about} : {}),
      arguments: argumentsList,
      ...(groups.length ? {groups} : {}),
    };
  });
  commands.push({path: ['completions'], about: 'Emit shell completions', arguments: [{name: 'shell', kind: 'positional', valueName: 'SHELL', required: true, values: ['bash']}]});
  return parseCliReference({
    format: CLI_REFERENCE_FORMAT,
    binary: input.binary,
    ...(typeof input.about === 'string' && input.about ? {about: input.about} : {}),
    ...(globalOptions.length ? {globalOptions} : {}),
    commands,
    exitStatuses: ESS_CLI_EXIT_STATUSES.map((status) => ({...status})),
  });
}
