/**
 * Data contracts for product-site pages: recorded terminal sessions and the landing page.
 * Node-safe; the React renderers live in `product.tsx`.
 */
import type {DomainGraphDocument, ProtocolGraphDocument} from './product-graphs.js';

export const TERMINAL_FORMAT = 'b10x-terminal/1';
export const PRODUCT_LANDING_FORMAT = 'b10x-product-landing/1';

/** One command and the output it actually printed. */
export interface TerminalEntry {
  command: string;
  output?: string;
  /** The recorded exit status; a non-zero status renders the output in the danger tone. */
  exitCode?: number;
  /** A comment line shown before the command. */
  comment?: string;
}

/**
 * A recorded command-line session. Generate it by running the commands (or quote a transcript
 * verbatim); never write output by hand.
 */
export interface TerminalSession {
  format: typeof TERMINAL_FORMAT;
  title?: string;
  entries: TerminalEntry[];
  /** Provenance: the tool version and revision that produced the output. */
  recordedWith?: string;
  /**
   * Output words and their meaning, written by the recorder (for example `{"passed:": "true",
   * "failed:": "false"}`). Every occurrence in the output takes that tone. Additive to
   * b10x-terminal/1: a session without it renders as before.
   */
  tones?: Record<string, TerminalTone>;
}

export type TerminalTone = 'true' | 'false' | 'unknown' | 'muted';
export const TERMINAL_TONES: readonly TerminalTone[] = ['true', 'false', 'unknown', 'muted'];

export function parseTerminalSession(value: unknown): TerminalSession {
  const session = record(value, 'session');
  if (session.format !== TERMINAL_FORMAT) throw new Error(`session.format must be ${TERMINAL_FORMAT}`);
  optional(session.title, 'session.title');
  optional(session.recordedWith, 'session.recordedWith');
  if (session.tones !== undefined) {
    const tones = record(session.tones, 'session.tones');
    for (const [word, tone] of Object.entries(tones)) {
      if (!word) throw new Error('session.tones keys must be non-empty');
      if (!TERMINAL_TONES.includes(tone as TerminalTone)) throw new Error(`session.tones[${JSON.stringify(word)}] must be one of ${TERMINAL_TONES.join(', ')}`);
    }
  }
  if (!Array.isArray(session.entries) || session.entries.length === 0) throw new Error('session.entries must be a non-empty array');
  session.entries.forEach((entry: unknown, index: number) => {
    const item = record(entry, `session.entries[${index}]`);
    if (typeof item.command !== 'string' || !item.command.trim()) throw new Error(`session.entries[${index}].command must be a non-empty string`);
    if (item.output !== undefined && typeof item.output !== 'string') throw new Error(`session.entries[${index}].output must be a string`);
    if (item.comment !== undefined && typeof item.comment !== 'string') throw new Error(`session.entries[${index}].comment must be a string`);
    if (item.exitCode !== undefined && !Number.isInteger(item.exitCode)) throw new Error(`session.entries[${index}].exitCode must be an integer`);
  });
  return value as TerminalSession;
}

/**
 * Parse a verbatim transcript: `$ ` starts a command, `# ` a comment, anything else is output of
 * the preceding command.
 */
export function parseTranscript(transcript: string): TerminalEntry[] {
  const entries: TerminalEntry[] = [];
  const pending: string[] = [];
  const append = (line: string): void => {
    const last = entries[entries.length - 1];
    if (last) last.output = last.output === undefined ? line : `${last.output}\n${line}`;
  };
  // A `# ` line is a comment only when a command follows it; otherwise it was output.
  const flush = (): void => { for (const line of pending.splice(0)) append(`# ${line}`); };
  for (const line of transcript.replace(/^\n+|\s+$/g, '').split('\n')) {
    if (line.startsWith('$ ')) entries.push({command: line.slice(2), ...(pending.length ? {comment: pending.splice(0).join(' ')} : {})});
    else if (line.startsWith('# ')) pending.push(line.slice(2));
    else { flush(); append(line); }
  }
  flush();
  for (const entry of entries) if (entry.output !== undefined) entry.output = entry.output.replace(/\s+$/, '');
  return entries;
}

export type ProductStatus = 'shipped' | 'decided' | 'planned';

export interface ProductAction {
  label: string;
  href: string;
  /** `primary` renders the filled button; the default is a text link. */
  kind?: 'primary' | 'text';
}

export interface ProductFeature {
  title: string;
  description: string;
  href?: string;
  status?: ProductStatus;
}

export interface ProductFlowStep {
  label?: string;
  title: string;
  description?: string;
}

export interface ProductStatusItem {
  label: string;
  status: ProductStatus;
  detail?: string;
  href?: string;
}

export interface RelatedTool {
  name: string;
  description: string;
  href: string;
  /** One or two characters for the mark; defaults to the first letter of the name. */
  mark?: string;
  status?: ProductStatus;
}

interface SectionCopy {
  /** Short label above the title; the landing prefixes it with the section number. */
  eyebrow?: string;
  title: string;
  lede?: string;
}

export type ProductLandingSection =
  | (SectionCopy & {kind: 'features'; items: ProductFeature[]})
  | (SectionCopy & {kind: 'flow'; steps: ProductFlowStep[]})
  | (SectionCopy & {kind: 'status'; items: ProductStatusItem[]})
  | (SectionCopy & {kind: 'protocol-graph'; data: ProtocolGraphDocument | string; caption?: string})
  | (SectionCopy & {kind: 'domain-graph'; data: DomainGraphDocument | string; caption?: string})
  | (SectionCopy & {kind: 'related'; tools: RelatedTool[]})
  | (SectionCopy & {kind: 'terminal'; session: TerminalSession | string});

export interface ProductLandingData {
  format: typeof PRODUCT_LANDING_FORMAT;
  product: {
    name: string;
    mark?: string;
    /** The line above the promise, for example "Protocol calculus · bootstrap". */
    eyebrow?: string;
    /** The one-line promise, one entry per rendered line; the last line is emphasised. */
    promise: string[];
    lede: string;
    actions: ProductAction[];
    /** A quiet line under the actions: language, formats, licence. */
    meta?: string;
    /** Shown beside the promise. A string is a path the site plugin resolves at build time. */
    terminal?: TerminalSession | string;
    /** Footer of the hero terminal. */
    terminalCaption?: string;
  };
  sections: ProductLandingSection[];
}

function record(value: unknown, path: string): Record<string, unknown> & {entries?: unknown} {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${path} must be an object`);
  return value as Record<string, unknown>;
}

function optional(value: unknown, path: string): void {
  if (value !== undefined && (typeof value !== 'string' || !value)) throw new Error(`${path} must be a non-empty string`);
}
