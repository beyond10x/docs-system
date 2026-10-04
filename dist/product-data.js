export const TERMINAL_FORMAT = 'b10x-terminal/1';
export const PRODUCT_LANDING_FORMAT = 'b10x-product-landing/1';
export const TERMINAL_TONES = ['true', 'false', 'unknown', 'muted'];
export function parseTerminalSession(value) {
    const session = record(value, 'session');
    if (session.format !== TERMINAL_FORMAT)
        throw new Error(`session.format must be ${TERMINAL_FORMAT}`);
    optional(session.title, 'session.title');
    optional(session.recordedWith, 'session.recordedWith');
    if (session.tones !== undefined) {
        const tones = record(session.tones, 'session.tones');
        for (const [word, tone] of Object.entries(tones)) {
            if (!word)
                throw new Error('session.tones keys must be non-empty');
            if (!TERMINAL_TONES.includes(tone))
                throw new Error(`session.tones[${JSON.stringify(word)}] must be one of ${TERMINAL_TONES.join(', ')}`);
        }
    }
    if (!Array.isArray(session.entries) || session.entries.length === 0)
        throw new Error('session.entries must be a non-empty array');
    session.entries.forEach((entry, index) => {
        const item = record(entry, `session.entries[${index}]`);
        if (typeof item.command !== 'string' || !item.command.trim())
            throw new Error(`session.entries[${index}].command must be a non-empty string`);
        if (item.output !== undefined && typeof item.output !== 'string')
            throw new Error(`session.entries[${index}].output must be a string`);
        if (item.comment !== undefined && typeof item.comment !== 'string')
            throw new Error(`session.entries[${index}].comment must be a string`);
        if (item.exitCode !== undefined && !Number.isInteger(item.exitCode))
            throw new Error(`session.entries[${index}].exitCode must be an integer`);
    });
    return value;
}
/**
 * Parse a verbatim transcript: `$ ` starts a command, `# ` a comment, anything else is output of
 * the preceding command.
 */
export function parseTranscript(transcript) {
    const entries = [];
    const pending = [];
    const append = (line) => {
        const last = entries[entries.length - 1];
        if (last)
            last.output = last.output === undefined ? line : `${last.output}\n${line}`;
    };
    // A `# ` line is a comment only when a command follows it; otherwise it was output.
    const flush = () => { for (const line of pending.splice(0))
        append(`# ${line}`); };
    for (const line of transcript.replace(/^\n+|\s+$/g, '').split('\n')) {
        if (line.startsWith('$ '))
            entries.push({ command: line.slice(2), ...(pending.length ? { comment: pending.splice(0).join(' ') } : {}) });
        else if (line.startsWith('# '))
            pending.push(line.slice(2));
        else {
            flush();
            append(line);
        }
    }
    flush();
    for (const entry of entries)
        if (entry.output !== undefined)
            entry.output = entry.output.replace(/\s+$/, '');
    return entries;
}
// ---------------------------------------------------------------------------------------------
// b10x-status/1: one status file for the landing strip and the status page
// ---------------------------------------------------------------------------------------------
export const STATUS_FORMAT = 'b10x-status/1';
export const PRODUCT_STATUSES = ['shipped', 'decided', 'planned'];
export function parseStatusDocument(value) {
    const document = record(value, 'status');
    if (document.format !== STATUS_FORMAT)
        throw new Error(`status.format must be ${STATUS_FORMAT}`);
    optional(document.source, 'status.source');
    if (document.asOf !== undefined && (typeof document.asOf !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(document.asOf)))
        throw new Error('status.asOf must be a date, YYYY-MM-DD');
    parseStatusItems(document.items, 'status.items');
    return value;
}
export function parseStatusItems(value, path) {
    if (!Array.isArray(value))
        throw new Error(`${path} must be an array`);
    const labels = new Set();
    value.forEach((entry, index) => {
        const item = record(entry, `${path}[${index}]`);
        if (typeof item.label !== 'string' || !item.label)
            throw new Error(`${path}[${index}].label must be a non-empty string`);
        if (labels.has(item.label))
            throw new Error(`${path}[${index}].label ${JSON.stringify(item.label)} is listed twice`);
        labels.add(item.label);
        if (!PRODUCT_STATUSES.includes(item.status))
            throw new Error(`${path}[${index}].status must be one of ${PRODUCT_STATUSES.join(', ')}`);
        for (const key of ['detail', 'href', 'area'])
            optional(item[key], `${path}[${index}].${key}`);
    });
    return value;
}
// ---------------------------------------------------------------------------------------------
// Hero art: b10x-case/1 and b10x-code-pair/1
// ---------------------------------------------------------------------------------------------
export const CASE_FORMAT = 'b10x-case/1';
export const CODE_PAIR_FORMAT = 'b10x-code-pair/1';
export function parseCaseDocument(value) {
    const document = record(value, 'case');
    if (document.format !== CASE_FORMAT)
        throw new Error(`case.format must be ${CASE_FORMAT}`);
    if (typeof document.case !== 'string' || !document.case)
        throw new Error('case.case must be a non-empty string');
    optional(document.protocol, 'case.protocol');
    optional(document.recordedWith, 'case.recordedWith');
    if (!Array.isArray(document.frames) || document.frames.length === 0)
        throw new Error('case.frames must be a non-empty array');
    document.frames.forEach((entry, index) => {
        const path = `case.frames[${index}]`;
        const frame = record(entry, path);
        if (typeof frame.label !== 'string' || !frame.label)
            throw new Error(`${path}.label must be a non-empty string`);
        if (frame.current !== undefined && typeof frame.current !== 'boolean')
            throw new Error(`${path}.current must be a boolean`);
        const rows = (key, field, allowed) => {
            if (frame[key] === undefined)
                return;
            if (!Array.isArray(frame[key]))
                throw new Error(`${path}.${key} must be an array`);
            frame[key].forEach((row, rowIndex) => {
                const item = record(row, `${path}.${key}[${rowIndex}]`);
                if (typeof item.name !== 'string' || !item.name)
                    throw new Error(`${path}.${key}[${rowIndex}].name must be a non-empty string`);
                if (typeof item[field] !== 'string' || !item[field] || (allowed && !allowed.includes(item[field])))
                    throw new Error(`${path}.${key}[${rowIndex}].${field} must be ${allowed ? `one of ${allowed.join(', ')}` : 'a non-empty string'}`);
            });
        };
        rows('claims', 'value', ['true', 'false', 'unknown']);
        rows('outcomes', 'state');
        rows('actions', 'state');
        if (frame.notes !== undefined && (!Array.isArray(frame.notes) || frame.notes.some((note) => typeof note !== 'string' || !note)))
            throw new Error(`${path}.notes must be an array of non-empty strings`);
    });
    if (document.frames.filter((frame) => frame.current).length > 1)
        throw new Error('case.frames may mark at most one frame current');
    return value;
}
export function parseCodePairDocument(value) {
    const document = record(value, 'code pair');
    if (document.format !== CODE_PAIR_FORMAT)
        throw new Error(`codePair.format must be ${CODE_PAIR_FORMAT}`);
    for (const side of ['from', 'to']) {
        const pane = record(document[side], `codePair.${side}`);
        for (const key of ['title', 'language', 'code'])
            if (typeof pane[key] !== 'string' || !pane[key])
                throw new Error(`codePair.${side}.${key} must be a non-empty string`);
    }
    optional(document.via, 'codePair.via');
    optional(document.recordedWith, 'codePair.recordedWith');
    return value;
}
export const ART_KINDS = ['terminal', 'protocol-graph', 'domain-graph', 'case', 'code-pair'];
export const KPI_COUNTS = ['entities', 'relations', 'lifecycles', 'nodes', 'actions', 'evidence', 'claims', 'outcomes', 'obligations', 'commands', 'capabilities', 'shipped', 'decided', 'planned'];
const KPI_LABELS = {
    entities: 'entities in the domain',
    relations: 'relations',
    lifecycles: 'entities with a lifecycle',
    nodes: 'nodes in the protocol',
    actions: 'actions',
    evidence: 'evidence kinds',
    claims: 'claims',
    outcomes: 'outcomes',
    obligations: 'obligations',
    commands: 'recorded commands',
    capabilities: 'capabilities tracked',
    shipped: 'shipped, runs today',
    decided: 'decided, not built',
    planned: 'planned',
};
const PROTOCOL_COUNTS = { actions: 'action', evidence: 'evidence', claims: 'claim', outcomes: 'outcome', obligations: 'obligation' };
/**
 * Resolve a landing's KPI row from its inlined data. Graph counts read the hero art first, then the
 * first graph section of that kind; status counts read the first status section; `commands` reads
 * the hero terminal. A count with no source throws, so a build cannot show an invented number.
 */
export function landingKpis(landing) {
    const art = landing.product.art;
    const graph = (kind) => {
        if (art?.kind === kind)
            return art.data;
        return landing.sections.find((section) => section.kind === kind)?.data;
    };
    const statusSection = landing.sections.find((section) => section.kind === 'status');
    const terminal = art?.kind === 'terminal' ? art.session : landing.product.terminal;
    return (landing.product.kpis ?? []).map((entry, index) => {
        const spec = typeof entry === 'string' ? { count: entry } : entry;
        if (!KPI_COUNTS.includes(spec.count))
            throw new Error(`product.kpis[${index}] must name one of ${KPI_COUNTS.join(', ')}`);
        const missing = (source) => new Error(`product.kpis[${index}] counts ${spec.count}, but the landing has no ${source} to count`);
        let value;
        let label = KPI_LABELS[spec.count];
        let tone = 'product';
        if (spec.count === 'entities' || spec.count === 'relations' || spec.count === 'lifecycles') {
            const domain = graph('domain-graph');
            if (!domain || typeof domain !== 'object')
                throw missing('domain graph');
            if (spec.count === 'entities')
                value = domain.entities.length;
            else if (spec.count === 'lifecycles')
                value = domain.entities.filter((entity) => entity.lifecycle).length;
            else {
                value = domain.relations.length;
                const owning = domain.relations.filter((relation) => relation.kind === 'owns').length;
                if (owning)
                    label = `relations, ${owning} owning`;
            }
        }
        else if (spec.count === 'nodes' || PROTOCOL_COUNTS[spec.count]) {
            const protocol = graph('protocol-graph');
            if (!protocol || typeof protocol !== 'object')
                throw missing('protocol graph');
            value = spec.count === 'nodes' ? protocol.nodes.length : protocol.nodes.filter((node) => node.kind === PROTOCOL_COUNTS[spec.count]).length;
        }
        else if (spec.count === 'commands') {
            if (!terminal || typeof terminal !== 'object')
                throw missing('hero terminal');
            value = terminal.entries.length;
            const recorded = terminal.entries.filter((item) => item.exitCode !== undefined);
            if (recorded.length)
                label = `recorded commands, ${recorded.filter((item) => item.exitCode === 0).length} exit 0`;
        }
        else {
            if (!statusSection || !Array.isArray(statusSection.items))
                throw missing('status section');
            const items = statusSection.items;
            if (spec.count === 'capabilities')
                value = items.length;
            else {
                value = items.filter((item) => item.status === spec.count).length;
                tone = spec.count;
            }
        }
        return { count: spec.count, value, label: spec.label ?? label, tone };
    });
}
function record(value, path) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
        throw new Error(`${path} must be an object`);
    return value;
}
function optional(value, path) {
    if (value !== undefined && (typeof value !== 'string' || !value))
        throw new Error(`${path} must be a non-empty string`);
}
