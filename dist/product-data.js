export const TERMINAL_FORMAT = 'b10x-terminal/1';
export const PRODUCT_LANDING_FORMAT = 'b10x-product-landing/1';
export function parseTerminalSession(value) {
    const session = record(value, 'session');
    if (session.format !== TERMINAL_FORMAT)
        throw new Error(`session.format must be ${TERMINAL_FORMAT}`);
    optional(session.title, 'session.title');
    optional(session.recordedWith, 'session.recordedWith');
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
function record(value, path) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
        throw new Error(`${path} must be an object`);
    return value;
}
function optional(value, path) {
    if (value !== undefined && (typeof value !== 'string' || !value))
        throw new Error(`${path} must be a non-empty string`);
}
