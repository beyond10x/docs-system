/**
 * The documentation page header: which front matter turns it on, and where the page sits in its
 * sidebar ("Concepts · 2 of 4"). Node-safe; the renderer is `theme/DocItem/Content`.
 */
import type {ProductStatus} from './product-data.js';

/** Front matter keys the header reads. Any of `status`, `lede` or `source` turns the header on. */
export interface DocHeaderFrontMatter {
  status?: ProductStatus;
  /** One or two sentences under the title. */
  lede?: string;
  /** Where the page's content comes from, for example "Generated from canon-ir/1 by canon-docs". */
  source?: string;
  /** Link for the source line. */
  source_url?: string;
  /** Replaces the whole kicker (category and "n of m"). */
  kicker?: string;
}

const STATUSES: readonly ProductStatus[] = ['shipped', 'decided', 'planned'];

/** The header fields of a page's front matter, or `undefined` when the page keeps today's layout. */
export function docHeaderFields(frontMatter: Record<string, unknown>): DocHeaderFrontMatter | undefined {
  const text = (key: string): string | undefined => {
    const value = frontMatter[key];
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || !value.trim()) throw new Error(`front matter ${key} must be a non-empty string`);
    return value.trim();
  };
  const status = frontMatter.status;
  if (status !== undefined && !STATUSES.includes(status as ProductStatus)) throw new Error(`front matter status must be one of ${STATUSES.join(', ')}, received ${JSON.stringify(status)}`);
  const fields: DocHeaderFrontMatter = {
    ...(status ? {status: status as ProductStatus} : {}),
    ...(text('lede') ? {lede: text('lede')} : {}),
    ...(text('source') ? {source: text('source')} : {}),
    ...(text('source_url') ? {source_url: text('source_url')} : {}),
    ...(text('kicker') ? {kicker: text('kicker')} : {}),
  };
  return fields.status || fields.lede || fields.source ? fields : undefined;
}

export interface SidebarItemLike {
  type: string;
  label?: string;
  href?: string;
  docId?: string;
  items?: SidebarItemLike[];
}

export interface SidebarPosition {
  /** The enclosing category's label; absent at the top level. */
  category?: string;
  index: number;
  total: number;
}

const normalise = (href: string): string => href.replace(/[?#].*$/, '').replace(/\/+$/, '') || '/';

/** Where `permalink` sits among its siblings. Categories count as one sibling each; HTML items do not count. */
export function sidebarPosition(items: readonly SidebarItemLike[] | undefined, permalink: string): SidebarPosition | undefined {
  if (!items) return undefined;
  const target = normalise(permalink);
  const visit = (level: readonly SidebarItemLike[], category: string | undefined): SidebarPosition | undefined => {
    const siblings = level.filter((item) => item.type === 'link' || item.type === 'category');
    for (const [index, item] of siblings.entries()) {
      if (item.type === 'link' && item.href && normalise(item.href) === target) return {category, index: index + 1, total: siblings.length};
      if (item.type === 'category') {
        // A category's own index page sits at the head of its children.
        if (item.href && normalise(item.href) === target) return {category: item.label, index: 1, total: (item.items ?? []).filter((child) => child.type === 'link' || child.type === 'category').length + 1};
        const found = visit(item.items ?? [], item.label);
        if (found) return item.href ? {...found, index: found.index + 1, total: found.total + 1} : found;
      }
    }
    return undefined;
  };
  return visit(items, undefined);
}

/**
 * "Concepts · 2 of 4", or "2 of 6" at the top level. A front-matter `kicker` is the whole kicker,
 * and a category with one page drops the "1 of 1".
 */
export function docKicker(position: SidebarPosition | undefined, override?: string): string | undefined {
  if (override) return override;
  const count = position && position.total > 1 ? `${position.index} of ${position.total}` : undefined;
  return [position?.category, count].filter(Boolean).join(' · ') || undefined;
}
