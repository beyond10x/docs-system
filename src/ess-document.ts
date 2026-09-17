/** Passive ESS documentation projection, owned by ESS's ess-docs/1 wire contract. */
export type EssSemanticRef = {kind: string; name: string | {command: string; outcome: string} | {entity: string; transition: string}};
export type EssTarget = {target: 'page'; page: string} | {target: 'anchor'; page: string; anchor: string} | {target: 'construct'; ref: EssSemanticRef} | {target: 'external'; url: string};
export type EssInline = {inline: 'text' | 'code'; text: string} | {inline: 'strong' | 'emphasis'; text: EssInline[]} | {inline: 'link'; text: EssInline[]; to: EssTarget};
export type EssBlock =
  | {block: 'prose'; text: EssInline[]}
  | {block: 'section'; level: number; title: EssInline[]; anchor: string; about?: EssSemanticRef; blocks: EssBlock[]}
  | {block: 'list'; ordered: boolean; items: EssBlock[][]}
  | {block: 'table'; columns: EssInline[][]; rows: EssInline[][][]}
  | {block: 'quote'; blocks: EssBlock[]}
  | {block: 'code'; language?: string; text: string}
  | {block: 'diagram'; kind: 'system' | 'lifecycle' | 'binding_flow' | 'interaction'; source: string}
  | {block: 'rule'};
export interface EssPage {
  id: string;
  title: EssInline[];
  about?: EssSemanticRef;
  provenance: {provenance: {system: string; specification_version: string; source_digest: string; contract_digest: string}; slice: unknown};
  blocks: EssBlock[];
}
export interface EssDocument {format: 'ess-docs/1'; system: string; version: string; pages: EssPage[]}
export interface EssLocation {page: string; anchor?: string}
export interface EssSection extends EssLocation {title: string; level: number; kind?: string}
export interface EssDocumentIndex {
  document: EssDocument;
  pages: Map<string, EssPage>;
  sections: Map<string, EssSection[]>;
  constructs: Map<string, EssLocation>;
  search: Array<EssSection & {text: string}>;
}

export function essText(nodes: EssInline[]): string {
  return nodes.map(node => typeof node.text === 'string' ? node.text : essText(node.text)).join('');
}
export function essReferenceKey(ref: EssSemanticRef): string {
  const name = typeof ref.name === 'string' ? ref.name : JSON.stringify(Object.entries(ref.name).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
  return `${ref.kind}:${name}`;
}
export function safeEssUrl(value: string): boolean {
  if (!value || /[\u0000-\u0020\u007f\\]/.test(value) || value.startsWith('//')) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password; } catch { return false; }
  }
  return true;
}

/** Refuse unsupported or malformed presentation data before it reaches a renderer. */
export function parseEssDocument(input: unknown): EssDocumentIndex {
  let count = 0;
  function node(value: unknown, depth = 0): Record<string, unknown> {
    if (++count > 100_000 || depth > 40) throw new Error('ESS document exceeds presentation limits');
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('ESS document contains an invalid record');
    return value as Record<string, unknown>;
  }
  function text(value: unknown): asserts value is string { if (typeof value !== 'string') throw new Error('ESS document requires text'); }
  function list(value: unknown): asserts value is unknown[] { if (!Array.isArray(value)) throw new Error('ESS document requires a list'); }
  function ref(value: unknown) {
    const r = node(value); text(r.kind);
    if (!['domain', 'type', 'entity', 'command', 'outcome', 'event', 'error', 'view', 'actor', 'transition', 'binding', 'component'].includes(r.kind)) throw new Error('Unsupported ESS semantic reference');
    if (r.kind === 'outcome' || r.kind === 'transition') {
      const name = node(r.name); text(name[r.kind === 'outcome' ? 'command' : 'entity']); text(name[r.kind]);
    } else text(r.name);
  }
  function inlines(value: unknown, depth: number) {
    list(value);
    for (const item of value) {
      const n = node(item, depth);
      switch (n.inline) {
        case 'text': case 'code': text(n.text); break;
        case 'strong': case 'emphasis': inlines(n.text, depth + 1); break;
        case 'link': {
          inlines(n.text, depth + 1); const to = node(n.to, depth + 1);
          switch (to.target) {
            case 'page': text(to.page); break;
            case 'anchor': text(to.page); text(to.anchor); break;
            case 'construct': ref(to.ref); break;
            case 'external': text(to.url); if (!safeEssUrl(to.url)) throw new Error('Unsafe ESS link destination'); break;
            default: throw new Error('Unsupported ESS link target');
          }
          break;
        }
        default: throw new Error('Unsupported ESS inline node');
      }
    }
  }
  function blocks(value: unknown, depth: number, anchors: Set<string>) {
    list(value);
    for (const item of value) {
      const n = node(item, depth);
      switch (n.block) {
        case 'prose': inlines(n.text, depth + 1); break;
        case 'section':
          text(n.anchor);
          if (!n.anchor || anchors.has(n.anchor)) throw new Error('Duplicate or empty ESS section identity');
          anchors.add(n.anchor);
          if (!Number.isInteger(n.level) || Number(n.level) < 2 || Number(n.level) > 255) throw new Error('Invalid ESS section level');
          inlines(n.title, depth + 1); if (n.about !== undefined) ref(n.about); blocks(n.blocks, depth + 1, anchors); break;
        case 'list':
          if (typeof n.ordered !== 'boolean') throw new Error('Invalid ESS list ordering');
          list(n.items); for (const item of n.items) blocks(item, depth + 1, anchors); break;
        case 'table':
          list(n.columns); for (const cell of n.columns) inlines(cell, depth + 1);
          list(n.rows); for (const row of n.rows) { list(row); if (row.length !== n.columns.length) throw new Error('Invalid ESS table width'); for (const cell of row) inlines(cell, depth + 1); } break;
        case 'quote': blocks(n.blocks, depth + 1, anchors); break;
        case 'code': text(n.text); if (n.language !== undefined) text(n.language); break;
        case 'diagram':
          text(n.source);
          if (!['system', 'lifecycle', 'binding_flow', 'interaction'].includes(String(n.kind))) throw new Error('Unsupported ESS diagram kind');
          if (/%%\{|^\s*---|\bclick\s|@\{|<\s*\/?\s*[a-z]|!\[|\]\(|\b(?:href|src)\s*=/im.test(n.source)) throw new Error('Active ESS diagram content is not supported');
          break;
        case 'rule': break;
        default: throw new Error('Unsupported ESS block');
      }
    }
  }
  const root = node(input);
  if (root.format !== 'ess-docs/1') throw new Error('Expected an ess-docs/1 documentation projection');
  text(root.system); text(root.version); list(root.pages);
  if (!root.pages.length) throw new Error('ESS document has no pages');
  const ids = new Set<string>();
  for (const value of root.pages) {
    const page = node(value); text(page.id);
    if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(page.id) || ids.has(page.id.toLowerCase())) throw new Error('Invalid or duplicate ESS page identity');
    ids.add(page.id.toLowerCase()); inlines(page.title, 1); if (page.about !== undefined) ref(page.about);
    const provenance = node(node(page.provenance).provenance);
    for (const key of ['system', 'specification_version', 'source_digest', 'contract_digest']) text(provenance[key]);
    if (!/^[a-f0-9]{64}$/.test(String(provenance.source_digest)) || !/^(?:slice-sha256\/[12]:)?[a-f0-9]{64}$/.test(String(provenance.contract_digest))) throw new Error('Invalid ESS provenance digest');
    blocks(page.blocks, 1, new Set());
  }
  const document = input as EssDocument;
  const index: EssDocumentIndex = {document, pages: new Map(), sections: new Map(), constructs: new Map(), search: []};
  const ambiguous = new Set<string>();
  function construct(ref: EssSemanticRef | undefined, location: EssLocation) {
    if (!ref) return;
    const key = essReferenceKey(ref); const held = index.constructs.get(key);
    if (held && (held.page !== location.page || held.anchor !== location.anchor)) ambiguous.add(key);
    else index.constructs.set(key, location);
  }
  for (const page of document.pages) {
    index.pages.set(page.id, page); const sections: EssSection[] = []; index.sections.set(page.id, sections);
    const location = {page: page.id}; construct(page.about, location);
    index.search.push({...location, title: essText(page.title), level: 1, kind: page.about?.kind, text: essText(page.title).toLowerCase()});
    function visit(blocks: EssBlock[]) {
      for (const block of blocks) {
        if (block.block === 'section') {
          const section = {page: page.id, anchor: block.anchor, title: essText(block.title), level: block.level, kind: block.about?.kind};
          sections.push(section); construct(block.about, section);
          index.search.push({...section, text: `${section.title} ${section.kind ?? ''} ${block.about ? essReferenceKey(block.about) : ''}`.toLowerCase()}); visit(block.blocks);
        } else if (block.block === 'quote') visit(block.blocks);
        else if (block.block === 'list') for (const item of block.items) visit(item);
      }
    }
    visit(page.blocks);
  }
  for (const key of ambiguous) index.constructs.delete(key);
  return index;
}

export function resolveEssTarget(index: EssDocumentIndex, target: EssTarget): EssLocation | string | undefined {
  if (target.target === 'external') return safeEssUrl(target.url) ? target.url : undefined;
  const location = target.target === 'construct' ? index.constructs.get(essReferenceKey(target.ref)) : target;
  if (!location || !index.pages.has(location.page)) return undefined;
  if ('anchor' in location && location.anchor && !index.sections.get(location.page)?.some(section => section.anchor === location.anchor)) return undefined;
  return {page: location.page, ...('anchor' in location && location.anchor ? {anchor: location.anchor} : {})};
}
