import {Fragment, useMemo} from 'react';
import type {ReactNode} from 'react';
import {DownloadLink, heading, Prose, slug} from './api-common.js';
import {parseCliReference} from './cli-reference.js';
import type {CliArgument, CliArgumentGroup, CliCommand, CliReferenceDocument} from './cli-reference.js';
import {ScrollableTable} from './scrollable-table.js';

export interface CliReferenceProps {
  /** A `b10x-cli-reference/1` document; it is checked with `parseCliReference` before rendering. */
  document: CliReferenceDocument;
  /** Where the unchanged source document can be downloaded; shown as a download link. */
  sourceUrl?: string;
  /** The file name the download carries, shown beside the link. */
  sourceName?: string;
  /** Heading for the reference title. Use 3 when embedding beneath a documentation-page h2. */
  headingLevel?: 2 | 3;
  /** Heading text instead of the binary name. */
  title?: string;
}

const flagOf = (argument: CliArgument): string => argument.long ? `--${argument.long}` : `-${argument.short}`;
const valueOf = (argument: CliArgument): string => `<${argument.valueName ?? argument.name.replace(/-/g, '_').toUpperCase()}>`;
/** Required on its own, or as the one member of a required group. */
const isRequired = (argument: CliArgument, command?: CliCommand): boolean => !!argument.required || !!command?.groups?.some((group) => group.required && group.arguments.length === 1 && group.arguments[0] === argument.name);
/** The group of more than one member an argument belongs to. */
const groupOf = (argument: CliArgument, command?: CliCommand, exclusive = false): CliArgumentGroup | undefined => command?.groups?.find((group) => group.arguments.length > 1 && (!exclusive || !group.multiple) && group.arguments.includes(argument.name));

function token(argument: CliArgument): string {
  if (argument.kind === 'switch') return flagOf(argument);
  if (argument.kind === 'option') return `${flagOf(argument)} ${valueOf(argument)}`;
  return argument.trailing ? `-- ${valueOf(argument)}` : valueOf(argument);
}

/** The words of one command's synopsis: each is an atom that never breaks across lines. */
export function cliSynopsisParts(document: CliReferenceDocument, command: CliCommand): string[][] {
  const parts: string[][] = [[[document.binary, ...command.path].join(' ')]];
  const all = command.arguments ?? [];
  const ordered = [...all.filter((argument) => argument.kind !== 'positional'), ...all.filter((argument) => argument.kind === 'positional')];
  const done = new Set<string>();
  for (const argument of ordered) {
    if (done.has(argument.name)) continue;
    const group = groupOf(argument, command, true);
    if (group) {
      const members = group.arguments.map((name) => all.find((candidate) => candidate.name === name)).filter((member): member is CliArgument => !!member);
      members.forEach((member) => done.add(member.name));
      const [open, close] = group.required ? ['(', ')'] : ['[', ']'];
      parts.push(members.map((member, index) => `${index === 0 ? open : '| '}${token(member)}${member.repeatable ? '...' : ''}${index === members.length - 1 ? close : ''}`));
      continue;
    }
    done.add(argument.name);
    const word = `${token(argument)}${argument.repeatable ? '...' : ''}`;
    parts.push([isRequired(argument, command) ? word : `[${word}]`]);
  }
  return parts;
}

/** One command's synopsis line: `tool post --to <TO> [--kind <KIND>] (--body <BODY> | --body-file <BODY_FILE>)`. */
export function cliSynopsis(document: CliReferenceDocument, command: CliCommand): string {
  return cliSynopsisParts(document, command).map((part) => part.join(' ')).join(' ');
}

/**
 * The anchor of each command. Two paths can slug alike (`key new` and `key-new`, `a_b` and `a.b`),
 * and a command's title takes `<id>-title`, so a later command whose id or title id is taken gets
 * a number: `command-key-new-2`.
 */
function commandIds(commands: CliCommand[]): Map<CliCommand, string> {
  const ids = new Map<CliCommand, string>();
  const taken = new Set<string>();
  for (const command of commands) {
    const base = `command-${slug(command.path.join('-'))}`;
    let id = base;
    for (let count = 2; taken.has(id) || taken.has(`${id}-title`); count += 1) id = `${base}-${count}`;
    taken.add(id);
    taken.add(`${id}-title`);
    ids.set(command, id);
  }
  return ids;
}

export function CliReference({document: input, sourceUrl, sourceName, headingLevel = 2, title}: CliReferenceProps): ReactNode {
  const document = useMemo(() => parseCliReference(input), [input]);
  const base = `cli-${slug(document.binary)}`;
  const TitleHeading = heading(headingLevel);
  const Section = heading(headingLevel + 1);
  const Item = heading(headingLevel + 2);
  const groups = new Map<string, CliCommand[]>();
  for (const command of document.commands) groups.set(command.path[0], [...(groups.get(command.path[0]) ?? []), command]);
  const bound = new Map<string, {flags: string[]; help?: string}>();
  for (const argument of [...(document.globalOptions ?? []), ...document.commands.flatMap((command) => command.arguments ?? [])]) {
    if (!argument.env) continue;
    const entry = bound.get(argument.env) ?? {flags: [], help: argument.help};
    if (!entry.flags.includes(flagOf(argument))) entry.flags.push(argument.kind === 'positional' ? valueOf(argument) : flagOf(argument));
    bound.set(argument.env, entry);
  }
  const environment = document.environment ?? [];
  const ids = useMemo(() => commandIds(document.commands), [document]);
  return <section className="b10x-cli b10x-api" aria-labelledby={`${base}-title`}>
    <header className="b10x-api-header">
      <p className="b10x-eyebrow">COMMAND LINE</p>
      <TitleHeading id={`${base}-title`}>{title ?? <code>{document.binary}</code>}</TitleHeading>
      <Prose text={document.about} className="b10x-api-lede" />
      <Prose text={document.description} />
      <dl className="b10x-facts">
        {document.version && <div><dt>Version</dt><dd>{document.version}</dd></div>}
        <div><dt>Commands</dt><dd>{document.commands.length}</dd></div>
        {document.globalOptions?.length ? <div><dt>Global options</dt><dd>{document.globalOptions.length}</dd></div> : null}
        {document.exitStatuses?.length ? <div><dt>Exit statuses</dt><dd>{document.exitStatuses.length}</dd></div> : null}
      </dl>
      <DownloadLink url={sourceUrl} name={sourceName} label="Download CLI reference source" />
    </header>
    <nav className="b10x-cli-index" aria-label={`${document.binary} commands`}>
      <ul>{Array.from(groups).map(([word, commands]) => commands.length === 1 && commands[0].path.length === 1
        ? <li key={word}><a href={`#${ids.get(commands[0])}`}><code>{word}</code></a><span>{commands[0].about}</span></li>
        : <li key={word} className="b10x-cli-index__group"><span><code>{word}</code></span><ul>{commands.map((command) => <li key={command.path.join(' ')}><a href={`#${ids.get(command)}`}><code>{command.path.join(' ')}</code></a><span>{command.about}</span></li>)}</ul></li>)}</ul>
    </nav>
    <section className="b10x-cli-commands" aria-labelledby={`${base}-commands`}>
      <Section id={`${base}-commands`}>Commands</Section>
      {document.commands.map((command) => {
        const id = ids.get(command) as string;
        return <section className="b10x-cli-command" id={id} key={id}>
          <Item id={`${id}-title`}><code>{[document.binary, ...command.path].join(' ')}</code></Item>
          <Prose text={command.about} className="b10x-api-lede" />
          <pre className="b10x-cli-synopsis"><code>{cliSynopsisParts(document, command).map((part, index) => <Fragment key={index}>{index > 0 && ' '}<span className="b10x-cli-part">{part.map((atom, item) => <Fragment key={item}>{item > 0 && ' '}<span className="b10x-cli-atom">{atom}</span></Fragment>)}</span></Fragment>)}</code></pre>
          {command.aliases?.length ? <p className="b10x-schema-note">Also: {command.aliases.map((alias, index) => <Fragment key={index}>{index > 0 && ', '}<code>{[document.binary, ...alias].join(' ')}</code></Fragment>)}</p> : null}
          <Prose text={command.description} />
          {command.arguments?.length ? <ArgumentTable argumentsList={command.arguments} command={command} label={`Arguments of ${[document.binary, ...command.path].join(' ')}`} /> : <p className="b10x-schema-note">No arguments.</p>}
        </section>;
      })}
    </section>
    {document.globalOptions?.length ? <section className="b10x-cli-globals" aria-labelledby={`${base}-globals`}>
      <Section id={`${base}-globals`}>Global options</Section>
      <p>Accepted by every command.</p>
      <ArgumentTable argumentsList={document.globalOptions} label="Global options" />
    </section> : null}
    {environment.length || bound.size ? <section className="b10x-cli-environment" aria-labelledby={`${base}-environment`}>
      <Section id={`${base}-environment`}>Environment variables</Section>
      <ScrollableTable label="Environment variables">
        <thead><tr><th scope="col">Variable</th><th scope="col">Read</th><th scope="col">Description</th></tr></thead>
        <tbody>
          {environment.map((variable) => <tr key={variable.name}><td><code>{variable.name}</code></td><td>{variable.commands ? <>By {variable.commands.map((path, index) => <Fragment key={index}>{index > 0 && ', '}<code>{[document.binary, ...path].join(' ')}</code></Fragment>)}</> : 'By every command'}</td><td><Prose text={variable.description} /></td></tr>)}
          {Array.from(bound).filter(([name]) => !environment.some((variable) => variable.name === name)).map(([name, entry]) => <tr key={name}><td><code>{name}</code></td><td>In place of {entry.flags.map((flag, index) => <Fragment key={flag}>{index > 0 && ', '}<code>{flag}</code></Fragment>)}</td><td><Prose text={entry.help} /></td></tr>)}
        </tbody>
      </ScrollableTable>
    </section> : null}
    {document.exitStatuses?.length ? <section className="b10x-cli-exit" aria-labelledby={`${base}-exit`}>
      <Section id={`${base}-exit`}>Exit statuses</Section>
      <ScrollableTable label="Exit statuses">
        <thead><tr><th scope="col">Status</th><th scope="col">Meaning</th></tr></thead>
        <tbody>{document.exitStatuses.map((status) => <tr key={status.code}><td><span className={`b10x-api-chip b10x-cli-exit-code b10x-cli-exit-code--${status.code === 0 ? 'ok' : 'failure'}`}>{status.code}</span></td><td><Prose text={status.meaning} /></td></tr>)}</tbody>
      </ScrollableTable>
    </section> : null}
  </section>;
}

function ArgumentTable({argumentsList, command, label}: {argumentsList: CliArgument[]; command?: CliCommand; label: string}): ReactNode {
  const flagName = (name: string): string => {
    const argument = argumentsList.find((candidate) => candidate.name === name);
    return argument ? (argument.kind === 'positional' ? valueOf(argument) : flagOf(argument)) : name;
  };
  return <ScrollableTable label={label} className="b10x-cli-arguments">
    <thead><tr><th scope="col">Argument</th><th scope="col">Required or default</th><th scope="col">Environment</th><th scope="col">Description</th></tr></thead>
    <tbody>{argumentsList.map((argument) => {
      const group = groupOf(argument, command);
      const notes: ReactNode[] = [];
      if (argument.repeatable) notes.push(argument.kind === 'positional' ? 'Takes one or more values.' : 'May be given more than once.');
      if (argument.trailing) notes.push(<>Only after <code>--</code>.</>);
      if (argument.conflicts?.length) notes.push(<>Not with {argument.conflicts.map((name, index) => <Fragment key={name}>{index > 0 && ', '}<code>{flagName(name)}</code></Fragment>)}.</>);
      if (argument.requires?.length) notes.push(<>Needs {argument.requires.map((name, index) => <Fragment key={name}>{index > 0 && ', '}<code>{flagName(name)}</code></Fragment>)}.</>);
      if (group) notes.push(<>{`${group.required ? 'One of' : 'At most one of'}${group.multiple ? ' or more of' : ''} `}{group.arguments.map((name, index) => <Fragment key={name}>{index > 0 && ', '}<code>{flagName(name)}</code></Fragment>)}{group.required ? ' is required.' : '.'}</>);
      const value = argument.kind === 'switch' ? <span className="b10x-schema-note">switch</span>
        : argument.values?.length ? <span className="b10x-cli-values">{argument.values.map((item) => <code key={item}>{item}</code>)}</span>
        : argument.kind === 'positional' ? null : <code>{valueOf(argument)}</code>;
      return <tr key={argument.name}>
        <td><code className="b10x-cli-flag">{argument.kind === 'positional' ? valueOf(argument) : flagOf(argument)}</code>{argument.long && argument.short && <> <code className="b10x-cli-flag">-{argument.short}</code></>}{value && <span className="b10x-cli-value">{value}</span>}</td>
        <td>{isRequired(argument, command) ? <b className="b10x-schema-required">required</b> : argument.default !== undefined ? <>default <code>{argument.default}</code></> : <span className="b10x-schema-optional">optional</span>}</td>
        <td>{argument.env ? <code>{argument.env}</code> : <span className="b10x-schema-note">—</span>}</td>
        <td><Prose text={argument.help} />{notes.length ? <p className="b10x-cli-notes">{notes.map((note, index) => <Fragment key={index}>{index > 0 && ' '}{note}</Fragment>)}</p> : null}</td>
      </tr>;
    })}</tbody>
  </ScrollableTable>;
}
