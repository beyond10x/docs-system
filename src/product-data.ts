/**
 * Data contracts for product-site pages: recorded terminal sessions and the landing page.
 * Node-safe; the React renderers live in `product.tsx`.
 */
import type {DomainGraphDocument, ProtocolGraphDocument} from './product-graphs.js';
import type {FamilyRelatedTool} from './family.js';

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
  /** A protocol kind whose glyph heads the card, in the kind colour. */
  icon?: 'action' | 'evidence' | 'claim' | 'outcome' | 'obligation';
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

/** A related tool written out in full, or named by its family id plus a relation word. */
export type RelatedToolEntry = RelatedTool | FamilyRelatedTool;

// ---------------------------------------------------------------------------------------------
// b10x-status/1: one status file for the landing strip and the status page
// ---------------------------------------------------------------------------------------------

export const STATUS_FORMAT = 'b10x-status/1';
export const PRODUCT_STATUSES: readonly ProductStatus[] = ['shipped', 'decided', 'planned'];

export interface StatusDocumentItem extends ProductStatusItem {
  /** Optional grouping on the status page, for example "Evaluation". */
  area?: string;
}

/**
 * What exists and what does not, generated by the repository. The landing's status section and
 * `<StatusTable/>` read the same file, so the two can never disagree.
 */
export interface StatusDocument {
  format: typeof STATUS_FORMAT;
  /** The date the statuses were last checked, `YYYY-MM-DD`. */
  asOf?: string;
  /** Provenance: what produced this file. */
  source?: string;
  items: StatusDocumentItem[];
}

export function parseStatusDocument(value: unknown): StatusDocument {
  const document = record(value, 'status');
  if (document.format !== STATUS_FORMAT) throw new Error(`status.format must be ${STATUS_FORMAT}`);
  optional(document.source, 'status.source');
  if (document.asOf !== undefined && (typeof document.asOf !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(document.asOf))) throw new Error('status.asOf must be a date, YYYY-MM-DD');
  parseStatusItems(document.items, 'status.items');
  return value as StatusDocument;
}

export function parseStatusItems(value: unknown, path: string): ProductStatusItem[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  const labels = new Set<string>();
  value.forEach((entry: unknown, index: number) => {
    const item = record(entry, `${path}[${index}]`);
    if (typeof item.label !== 'string' || !item.label) throw new Error(`${path}[${index}].label must be a non-empty string`);
    if (labels.has(item.label)) throw new Error(`${path}[${index}].label ${JSON.stringify(item.label)} is listed twice`);
    labels.add(item.label);
    if (!PRODUCT_STATUSES.includes(item.status as ProductStatus)) throw new Error(`${path}[${index}].status must be one of ${PRODUCT_STATUSES.join(', ')}`);
    for (const key of ['detail', 'href', 'area'] as const) optional(item[key], `${path}[${index}].${key}`);
  });
  return value as ProductStatusItem[];
}

// ---------------------------------------------------------------------------------------------
// Hero art: b10x-case/1 and b10x-code-pair/1
// ---------------------------------------------------------------------------------------------

export const CASE_FORMAT = 'b10x-case/1';
export const CODE_PAIR_FORMAT = 'b10x-code-pair/1';

export type TruthValueName = 'true' | 'false' | 'unknown';

/** One evaluation of a case, as a recorder captured it. */
export interface CaseFrame {
  /** For example "Revision r1". */
  label: string;
  /** The frame that describes the case as it stands now. */
  current?: boolean;
  claims?: Array<{name: string; value: TruthValueName}>;
  /** Outcome and action states are words, not truth values: `legitimate`, `blocked`, `admissible`. */
  outcomes?: Array<{name: string; state: string}>;
  actions?: Array<{name: string; state: string}>;
  /** Short recorded remarks, for example "2 records excluded: revision_mismatch". */
  notes?: string[];
}

/**
 * A case evaluated more than once: what changed between evaluations. Generate it from real
 * evaluator output (for example two `canon evaluate` runs); never type the values by hand.
 */
export interface CaseDocument {
  format: typeof CASE_FORMAT;
  case: string;
  protocol?: string;
  frames: CaseFrame[];
  recordedWith?: string;
}

export function parseCaseDocument(value: unknown): CaseDocument {
  const document = record(value, 'case');
  if (document.format !== CASE_FORMAT) throw new Error(`case.format must be ${CASE_FORMAT}`);
  if (typeof document.case !== 'string' || !document.case) throw new Error('case.case must be a non-empty string');
  optional(document.protocol, 'case.protocol');
  optional(document.recordedWith, 'case.recordedWith');
  if (!Array.isArray(document.frames) || document.frames.length === 0) throw new Error('case.frames must be a non-empty array');
  document.frames.forEach((entry: unknown, index: number) => {
    const path = `case.frames[${index}]`;
    const frame = record(entry, path);
    if (typeof frame.label !== 'string' || !frame.label) throw new Error(`${path}.label must be a non-empty string`);
    if (frame.current !== undefined && typeof frame.current !== 'boolean') throw new Error(`${path}.current must be a boolean`);
    const rows = (key: 'claims' | 'outcomes' | 'actions', field: 'value' | 'state', allowed?: readonly string[]): void => {
      if (frame[key] === undefined) return;
      if (!Array.isArray(frame[key])) throw new Error(`${path}.${key} must be an array`);
      (frame[key] as unknown[]).forEach((row, rowIndex) => {
        const item = record(row, `${path}.${key}[${rowIndex}]`);
        if (typeof item.name !== 'string' || !item.name) throw new Error(`${path}.${key}[${rowIndex}].name must be a non-empty string`);
        if (typeof item[field] !== 'string' || !item[field] || (allowed && !allowed.includes(item[field] as string))) throw new Error(`${path}.${key}[${rowIndex}].${field} must be ${allowed ? `one of ${allowed.join(', ')}` : 'a non-empty string'}`);
      });
    };
    rows('claims', 'value', ['true', 'false', 'unknown']);
    rows('outcomes', 'state');
    rows('actions', 'state');
    if (frame.notes !== undefined && (!Array.isArray(frame.notes) || frame.notes.some((note) => typeof note !== 'string' || !note))) throw new Error(`${path}.notes must be an array of non-empty strings`);
  });
  if (document.frames.filter((frame: {current?: boolean}) => frame.current).length > 1) throw new Error('case.frames may mark at most one frame current');
  return value as CaseDocument;
}

export interface CodePane {
  /** File name or label above the pane. */
  title: string;
  language: string;
  code: string;
}

/** A source and what was generated from it, side by side (for example a specification and its OpenAPI). */
export interface CodePairDocument {
  format: typeof CODE_PAIR_FORMAT;
  from: CodePane;
  to: CodePane;
  /** The step between them, for example `ess generate --kind openapi`. */
  via?: string;
  recordedWith?: string;
}

export function parseCodePairDocument(value: unknown): CodePairDocument {
  const document = record(value, 'code pair');
  if (document.format !== CODE_PAIR_FORMAT) throw new Error(`codePair.format must be ${CODE_PAIR_FORMAT}`);
  for (const side of ['from', 'to'] as const) {
    const pane = record(document[side], `codePair.${side}`);
    for (const key of ['title', 'language', 'code'] as const) if (typeof pane[key] !== 'string' || !pane[key]) throw new Error(`codePair.${side}.${key} must be a non-empty string`);
  }
  optional(document.via, 'codePair.via');
  optional(document.recordedWith, 'codePair.recordedWith');
  return value as CodePairDocument;
}

export type ProductArt =
  | {kind: 'terminal'; session: TerminalSession | string; caption?: string}
  | {kind: 'protocol-graph'; data: ProtocolGraphDocument | string; caption?: string}
  | {kind: 'domain-graph'; data: DomainGraphDocument | string; caption?: string}
  | {kind: 'case'; data: CaseDocument | string; caption?: string}
  | {kind: 'code-pair'; data: CodePairDocument | string; caption?: string};

export const ART_KINDS: readonly ProductArt['kind'][] = ['terminal', 'protocol-graph', 'domain-graph', 'case', 'code-pair'];

// ---------------------------------------------------------------------------------------------
// KPI row: counted from the landing's own data, never typed
// ---------------------------------------------------------------------------------------------

export type KpiCount =
  | 'entities' | 'relations' | 'lifecycles'
  | 'nodes' | 'actions' | 'evidence' | 'claims' | 'outcomes' | 'obligations'
  | 'commands'
  | 'capabilities' | 'shipped' | 'decided' | 'planned';

export const KPI_COUNTS: readonly KpiCount[] = ['entities', 'relations', 'lifecycles', 'nodes', 'actions', 'evidence', 'claims', 'outcomes', 'obligations', 'commands', 'capabilities', 'shipped', 'decided', 'planned'];

/** A count name, or a count with its own label. */
export type ProductKpi = KpiCount | {count: KpiCount; label?: string};

export interface ResolvedKpi {
  count: KpiCount;
  value: number;
  label: string;
  /** `product` counts come from the art or graphs; status counts take their status tone. */
  tone: 'product' | ProductStatus;
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
  /** `items` may be a path to a `b10x-status/1` file; the plugin reads it and records its provenance. */
  | (SectionCopy & {kind: 'status'; items: ProductStatusItem[] | string; asOf?: string; source?: string})
  | (SectionCopy & {kind: 'protocol-graph'; data: ProtocolGraphDocument | string; caption?: string})
  | (SectionCopy & {kind: 'domain-graph'; data: DomainGraphDocument | string; caption?: string})
  | (SectionCopy & {kind: 'related'; tools: RelatedToolEntry[]})
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
    /**
     * Hero art rendered from the product's own data: a terminal, a protocol or domain graph, a
     * case card or a code pair. Takes precedence over `terminal`.
     */
    art?: ProductArt;
    /** The KPI row under the hero, counted from the art, the graphs and the status section. */
    kpis?: ProductKpi[];
  };
  sections: ProductLandingSection[];
}

const KPI_LABELS: Record<KpiCount, string> = {
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

const PROTOCOL_COUNTS: Partial<Record<KpiCount, string>> = {actions: 'action', evidence: 'evidence', claims: 'claim', outcomes: 'outcome', obligations: 'obligation'};

/**
 * Resolve a landing's KPI row from its inlined data. Graph counts read the hero art first, then the
 * first graph section of that kind; status counts read the first status section; `commands` reads
 * the hero terminal. A count with no source throws, so a build cannot show an invented number.
 */
export function landingKpis(landing: ProductLandingData): ResolvedKpi[] {
  const art = landing.product.art;
  const graph = (kind: 'protocol-graph' | 'domain-graph'): unknown => {
    if (art?.kind === kind) return art.data;
    return (landing.sections.find((section) => section.kind === kind) as {data?: unknown} | undefined)?.data;
  };
  const statusSection = landing.sections.find((section) => section.kind === 'status') as {items: ProductStatusItem[] | string} | undefined;
  const terminal = art?.kind === 'terminal' ? art.session : landing.product.terminal;
  return (landing.product.kpis ?? []).map((entry, index) => {
    const spec = typeof entry === 'string' ? {count: entry} : entry;
    if (!KPI_COUNTS.includes(spec.count)) throw new Error(`product.kpis[${index}] must name one of ${KPI_COUNTS.join(', ')}`);
    const missing = (source: string): Error => new Error(`product.kpis[${index}] counts ${spec.count}, but the landing has no ${source} to count`);
    let value: number;
    let label = KPI_LABELS[spec.count];
    let tone: ResolvedKpi['tone'] = 'product';
    if (spec.count === 'entities' || spec.count === 'relations' || spec.count === 'lifecycles') {
      const domain = graph('domain-graph') as DomainGraphDocument | undefined;
      if (!domain || typeof domain !== 'object') throw missing('domain graph');
      if (spec.count === 'entities') value = domain.entities.length;
      else if (spec.count === 'lifecycles') value = domain.entities.filter((entity) => entity.lifecycle).length;
      else {
        value = domain.relations.length;
        const owning = domain.relations.filter((relation) => relation.kind === 'owns').length;
        if (owning) label = `relations, ${owning} owning`;
      }
    } else if (spec.count === 'nodes' || PROTOCOL_COUNTS[spec.count]) {
      const protocol = graph('protocol-graph') as ProtocolGraphDocument | undefined;
      if (!protocol || typeof protocol !== 'object') throw missing('protocol graph');
      value = spec.count === 'nodes' ? protocol.nodes.length : protocol.nodes.filter((node) => node.kind === PROTOCOL_COUNTS[spec.count]).length;
    } else if (spec.count === 'commands') {
      if (!terminal || typeof terminal !== 'object') throw missing('hero terminal');
      value = terminal.entries.length;
      const recorded = terminal.entries.filter((item) => item.exitCode !== undefined);
      if (recorded.length) label = `recorded commands, ${recorded.filter((item) => item.exitCode === 0).length} exit 0`;
    } else {
      if (!statusSection || !Array.isArray(statusSection.items)) throw missing('status section');
      const items = statusSection.items;
      if (spec.count === 'capabilities') value = items.length;
      else {
        value = items.filter((item) => item.status === spec.count).length;
        tone = spec.count as ProductStatus;
      }
    }
    return {count: spec.count, value, label: spec.label ?? label, tone};
  });
}

function record(value: unknown, path: string): Record<string, unknown> & {entries?: unknown} {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${path} must be an object`);
  return value as Record<string, unknown>;
}

function optional(value: unknown, path: string): void {
  if (value !== undefined && (typeof value !== 'string' || !value)) throw new Error(`${path} must be a non-empty string`);
}
