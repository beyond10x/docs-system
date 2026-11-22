import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Fragment, useMemo } from 'react';
import { DownloadLink, heading, Prose, slug } from './api-common.js';
import { parseCliReference } from './cli-reference.js';
import { ScrollableTable } from './scrollable-table.js';
const flagOf = (argument) => argument.long ? `--${argument.long}` : `-${argument.short}`;
const valueOf = (argument) => `<${argument.valueName ?? argument.name.replace(/-/g, '_').toUpperCase()}>`;
/** Required on its own, or as the one member of a required group. */
const isRequired = (argument, command) => !!argument.required || !!command?.groups?.some((group) => group.required && group.arguments.length === 1 && group.arguments[0] === argument.name);
/** The group of more than one member an argument belongs to. */
const groupOf = (argument, command, exclusive = false) => command?.groups?.find((group) => group.arguments.length > 1 && (!exclusive || !group.multiple) && group.arguments.includes(argument.name));
function token(argument) {
    if (argument.kind === 'switch')
        return flagOf(argument);
    if (argument.kind === 'option')
        return `${flagOf(argument)} ${valueOf(argument)}`;
    return argument.trailing ? `-- ${valueOf(argument)}` : valueOf(argument);
}
/** The words of one command's synopsis: each is an atom that never breaks across lines. */
export function cliSynopsisParts(document, command) {
    const parts = [[[document.binary, ...command.path].join(' ')]];
    const all = command.arguments ?? [];
    const ordered = [...all.filter((argument) => argument.kind !== 'positional'), ...all.filter((argument) => argument.kind === 'positional')];
    const done = new Set();
    for (const argument of ordered) {
        if (done.has(argument.name))
            continue;
        const group = groupOf(argument, command, true);
        if (group) {
            const members = group.arguments.map((name) => all.find((candidate) => candidate.name === name)).filter((member) => !!member);
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
export function cliSynopsis(document, command) {
    return cliSynopsisParts(document, command).map((part) => part.join(' ')).join(' ');
}
/**
 * The anchor of each command. Two paths can slug alike (`key new` and `key-new`, `a_b` and `a.b`),
 * and a command's title takes `<id>-title`, so a later command whose id or title id is taken gets
 * a number: `command-key-new-2`.
 */
function commandIds(commands) {
    const ids = new Map();
    const taken = new Set();
    for (const command of commands) {
        const base = `command-${slug(command.path.join('-'))}`;
        let id = base;
        for (let count = 2; taken.has(id) || taken.has(`${id}-title`); count += 1)
            id = `${base}-${count}`;
        taken.add(id);
        taken.add(`${id}-title`);
        ids.set(command, id);
    }
    return ids;
}
export function CliReference({ document: input, sourceUrl, sourceName, headingLevel = 2, title }) {
    const document = useMemo(() => parseCliReference(input), [input]);
    const base = `cli-${slug(document.binary)}`;
    const TitleHeading = heading(headingLevel);
    const Section = heading(headingLevel + 1);
    const Item = heading(headingLevel + 2);
    const groups = new Map();
    for (const command of document.commands)
        groups.set(command.path[0], [...(groups.get(command.path[0]) ?? []), command]);
    const bound = new Map();
    for (const argument of [...(document.globalOptions ?? []), ...document.commands.flatMap((command) => command.arguments ?? [])]) {
        if (!argument.env)
            continue;
        const entry = bound.get(argument.env) ?? { flags: [], help: argument.help };
        if (!entry.flags.includes(flagOf(argument)))
            entry.flags.push(argument.kind === 'positional' ? valueOf(argument) : flagOf(argument));
        bound.set(argument.env, entry);
    }
    const environment = document.environment ?? [];
    const ids = useMemo(() => commandIds(document.commands), [document]);
    return _jsxs("section", { className: "b10x-cli b10x-api", "aria-labelledby": `${base}-title`, children: [_jsxs("header", { className: "b10x-api-header", children: [_jsx("p", { className: "b10x-eyebrow", children: "COMMAND LINE" }), _jsx(TitleHeading, { id: `${base}-title`, children: title ?? _jsx("code", { children: document.binary }) }), _jsx(Prose, { text: document.about, className: "b10x-api-lede" }), _jsx(Prose, { text: document.description }), _jsxs("dl", { className: "b10x-facts", children: [document.version && _jsxs("div", { children: [_jsx("dt", { children: "Version" }), _jsx("dd", { children: document.version })] }), _jsxs("div", { children: [_jsx("dt", { children: "Commands" }), _jsx("dd", { children: document.commands.length })] }), document.globalOptions?.length ? _jsxs("div", { children: [_jsx("dt", { children: "Global options" }), _jsx("dd", { children: document.globalOptions.length })] }) : null, document.exitStatuses?.length ? _jsxs("div", { children: [_jsx("dt", { children: "Exit statuses" }), _jsx("dd", { children: document.exitStatuses.length })] }) : null] }), _jsx(DownloadLink, { url: sourceUrl, name: sourceName, label: "Download CLI reference source" })] }), _jsx("nav", { className: "b10x-cli-index", "aria-label": `${document.binary} commands`, children: _jsx("ul", { children: Array.from(groups).map(([word, commands]) => commands.length === 1 && commands[0].path.length === 1
                        ? _jsxs("li", { children: [_jsx("a", { href: `#${ids.get(commands[0])}`, children: _jsx("code", { children: word }) }), _jsx("span", { children: commands[0].about })] }, word)
                        : _jsxs("li", { className: "b10x-cli-index__group", children: [_jsx("span", { children: _jsx("code", { children: word }) }), _jsx("ul", { children: commands.map((command) => _jsxs("li", { children: [_jsx("a", { href: `#${ids.get(command)}`, children: _jsx("code", { children: command.path.join(' ') }) }), _jsx("span", { children: command.about })] }, command.path.join(' '))) })] }, word)) }) }), _jsxs("section", { className: "b10x-cli-commands", "aria-labelledby": `${base}-commands`, children: [_jsx(Section, { id: `${base}-commands`, children: "Commands" }), document.commands.map((command) => {
                        const id = ids.get(command);
                        return _jsxs("section", { className: "b10x-cli-command", id: id, children: [_jsx(Item, { id: `${id}-title`, children: _jsx("code", { children: [document.binary, ...command.path].join(' ') }) }), _jsx(Prose, { text: command.about, className: "b10x-api-lede" }), _jsx("pre", { className: "b10x-cli-synopsis", children: _jsx("code", { children: cliSynopsisParts(document, command).map((part, index) => _jsxs(Fragment, { children: [index > 0 && ' ', _jsx("span", { className: "b10x-cli-part", children: part.map((atom, item) => _jsxs(Fragment, { children: [item > 0 && ' ', _jsx("span", { className: "b10x-cli-atom", children: atom })] }, item)) })] }, index)) }) }), command.aliases?.length ? _jsxs("p", { className: "b10x-schema-note", children: ["Also: ", command.aliases.map((alias, index) => _jsxs(Fragment, { children: [index > 0 && ', ', _jsx("code", { children: [document.binary, ...alias].join(' ') })] }, index))] }) : null, _jsx(Prose, { text: command.description }), command.arguments?.length ? _jsx(ArgumentTable, { argumentsList: command.arguments, command: command, label: `Arguments of ${[document.binary, ...command.path].join(' ')}` }) : _jsx("p", { className: "b10x-schema-note", children: "No arguments." })] }, id);
                    })] }), document.globalOptions?.length ? _jsxs("section", { className: "b10x-cli-globals", "aria-labelledby": `${base}-globals`, children: [_jsx(Section, { id: `${base}-globals`, children: "Global options" }), _jsx("p", { children: "Accepted by every command." }), _jsx(ArgumentTable, { argumentsList: document.globalOptions, label: "Global options" })] }) : null, environment.length || bound.size ? _jsxs("section", { className: "b10x-cli-environment", "aria-labelledby": `${base}-environment`, children: [_jsx(Section, { id: `${base}-environment`, children: "Environment variables" }), _jsxs(ScrollableTable, { label: "Environment variables", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Variable" }), _jsx("th", { scope: "col", children: "Read" }), _jsx("th", { scope: "col", children: "Description" })] }) }), _jsxs("tbody", { children: [environment.map((variable) => _jsxs("tr", { children: [_jsx("td", { children: _jsx("code", { children: variable.name }) }), _jsx("td", { children: variable.commands ? _jsxs(_Fragment, { children: ["By ", variable.commands.map((path, index) => _jsxs(Fragment, { children: [index > 0 && ', ', _jsx("code", { children: [document.binary, ...path].join(' ') })] }, index))] }) : 'By every command' }), _jsx("td", { children: _jsx(Prose, { text: variable.description }) })] }, variable.name)), Array.from(bound).filter(([name]) => !environment.some((variable) => variable.name === name)).map(([name, entry]) => _jsxs("tr", { children: [_jsx("td", { children: _jsx("code", { children: name }) }), _jsxs("td", { children: ["In place of ", entry.flags.map((flag, index) => _jsxs(Fragment, { children: [index > 0 && ', ', _jsx("code", { children: flag })] }, flag))] }), _jsx("td", { children: _jsx(Prose, { text: entry.help }) })] }, name))] })] })] }) : null, document.exitStatuses?.length ? _jsxs("section", { className: "b10x-cli-exit", "aria-labelledby": `${base}-exit`, children: [_jsx(Section, { id: `${base}-exit`, children: "Exit statuses" }), _jsxs(ScrollableTable, { label: "Exit statuses", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Status" }), _jsx("th", { scope: "col", children: "Meaning" })] }) }), _jsx("tbody", { children: document.exitStatuses.map((status) => _jsxs("tr", { children: [_jsx("td", { children: _jsx("span", { className: `b10x-api-chip b10x-cli-exit-code b10x-cli-exit-code--${status.code === 0 ? 'ok' : 'failure'}`, children: status.code }) }), _jsx("td", { children: _jsx(Prose, { text: status.meaning }) })] }, status.code)) })] })] }) : null] });
}
function ArgumentTable({ argumentsList, command, label }) {
    const flagName = (name) => {
        const argument = argumentsList.find((candidate) => candidate.name === name);
        return argument ? (argument.kind === 'positional' ? valueOf(argument) : flagOf(argument)) : name;
    };
    return _jsxs(ScrollableTable, { label: label, className: "b10x-cli-arguments", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Argument" }), _jsx("th", { scope: "col", children: "Required or default" }), _jsx("th", { scope: "col", children: "Environment" }), _jsx("th", { scope: "col", children: "Description" })] }) }), _jsx("tbody", { children: argumentsList.map((argument) => {
                    const group = groupOf(argument, command);
                    const notes = [];
                    if (argument.repeatable)
                        notes.push(argument.kind === 'positional' ? 'Takes one or more values.' : 'May be given more than once.');
                    if (argument.trailing)
                        notes.push(_jsxs(_Fragment, { children: ["Only after ", _jsx("code", { children: "--" }), "."] }));
                    if (argument.conflicts?.length)
                        notes.push(_jsxs(_Fragment, { children: ["Not with ", argument.conflicts.map((name, index) => _jsxs(Fragment, { children: [index > 0 && ', ', _jsx("code", { children: flagName(name) })] }, name)), "."] }));
                    if (argument.requires?.length)
                        notes.push(_jsxs(_Fragment, { children: ["Needs ", argument.requires.map((name, index) => _jsxs(Fragment, { children: [index > 0 && ', ', _jsx("code", { children: flagName(name) })] }, name)), "."] }));
                    if (group)
                        notes.push(_jsxs(_Fragment, { children: [`${group.required ? 'One of' : 'At most one of'}${group.multiple ? ' or more of' : ''} `, group.arguments.map((name, index) => _jsxs(Fragment, { children: [index > 0 && ', ', _jsx("code", { children: flagName(name) })] }, name)), group.required ? ' is required.' : '.'] }));
                    const value = argument.kind === 'switch' ? _jsx("span", { className: "b10x-schema-note", children: "switch" })
                        : argument.values?.length ? _jsx("span", { className: "b10x-cli-values", children: argument.values.map((item) => _jsx("code", { children: item }, item)) })
                            : argument.kind === 'positional' ? null : _jsx("code", { children: valueOf(argument) });
                    return _jsxs("tr", { children: [_jsxs("td", { children: [_jsx("code", { className: "b10x-cli-flag", children: argument.kind === 'positional' ? valueOf(argument) : flagOf(argument) }), argument.long && argument.short && _jsxs(_Fragment, { children: [" ", _jsxs("code", { className: "b10x-cli-flag", children: ["-", argument.short] })] }), value && _jsx("span", { className: "b10x-cli-value", children: value })] }), _jsx("td", { children: isRequired(argument, command) ? _jsx("b", { className: "b10x-schema-required", children: "required" }) : argument.default !== undefined ? _jsxs(_Fragment, { children: ["default ", _jsx("code", { children: argument.default })] }) : _jsx("span", { className: "b10x-schema-optional", children: "optional" }) }), _jsx("td", { children: argument.env ? _jsx("code", { children: argument.env }) : _jsx("span", { className: "b10x-schema-note", children: "\u2014" }) }), _jsxs("td", { children: [_jsx(Prose, { text: argument.help }), notes.length ? _jsx("p", { className: "b10x-cli-notes", children: notes.map((note, index) => _jsxs(Fragment, { children: [index > 0 && ' ', note] }, index)) }) : null] })] }, argument.name);
                }) })] });
}
