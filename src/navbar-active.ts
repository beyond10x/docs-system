/**
 * Exactly one active navbar item: the most specific route match.
 *
 * Docusaurus marks every link whose path prefixes the current route, so `/docs/` and
 * `/docs/reference/ess` are both active on the reference page. This module scores each item by how
 * much of the route it matches and picks one winner; ties go to the earlier item. Node-safe.
 */

export interface NavbarItemLike {
  type?: string;
  to?: string;
  href?: string;
  label?: string;
  activeBasePath?: string;
  activeBaseRegex?: string;
  sidebarId?: string;
  docId?: string;
  docsPluginId?: string;
  items?: unknown;
}

export interface DocsGlobalDoc {id: string; path: string; sidebar?: string}
export interface DocsGlobalVersion {name?: string; isLast?: boolean; docs: DocsGlobalDoc[]; sidebars?: Record<string, {link?: {path: string; label: string}}>}
/** The docs plugin's global data, keyed by plugin id. */
export type DocsGlobalData = Record<string, {path: string; versions: DocsGlobalVersion[]}>;

const trim = (path: string): string => path.length > 1 ? path.replace(/\/+$/, '') : path;

/** `useBaseUrl` semantics: prefix site-relative paths once. */
export function withBaseUrl(baseUrl: string, path: string): string {
  if (/^[a-z]+:/i.test(path) || path.startsWith('//')) return path;
  if (path.startsWith(baseUrl)) return path;
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

export function currentDoc(pathname: string, docs: DocsGlobalData, pluginId = 'default'): DocsGlobalDoc | undefined {
  const target = trim(pathname);
  for (const version of docs[pluginId]?.versions ?? []) {
    const found = version.docs.find((doc) => trim(doc.path) === target);
    if (found) return found;
  }
  return undefined;
}

/** How specifically an item matches the route: the matched length, or -1 when it does not match. */
export function navbarItemScore(item: NavbarItemLike, pathname: string, baseUrl: string, docs: DocsGlobalData = {}): number {
  const route = trim(pathname);
  const pluginId = item.docsPluginId ?? 'default';
  if (item.type === 'docSidebar' && item.sidebarId) {
    const doc = currentDoc(pathname, docs, pluginId);
    return doc?.sidebar === item.sidebarId ? trim(docs[pluginId]?.path ?? '/').length : -1;
  }
  if (item.type === 'doc' && item.docId) {
    const doc = currentDoc(pathname, docs, pluginId);
    if (!doc) return -1;
    if (doc.id === item.docId) return route.length;
    const target = docs[pluginId]?.versions.flatMap((version) => version.docs).find((candidate) => candidate.id === item.docId);
    return target?.sidebar && target.sidebar === doc.sidebar ? trim(docs[pluginId]?.path ?? '/').length : -1;
  }
  if (item.type && item.type !== 'default') return -1;
  if (item.href || item.items || !item.to) return -1;
  if (item.activeBaseRegex) {
    const match = new RegExp(item.activeBaseRegex).exec(pathname);
    return match ? match[0].length : -1;
  }
  const base = trim(withBaseUrl(baseUrl, item.activeBasePath ?? item.to));
  if (route === base || route.startsWith(base === '/' ? '/' : `${base}/`)) return base.length;
  return -1;
}

/** Index of the one item that should render active, or -1. */
export function activeNavbarItem(items: readonly NavbarItemLike[], pathname: string, baseUrl: string, docs: DocsGlobalData = {}): number {
  let winner = -1;
  let best = -1;
  items.forEach((item, index) => {
    const score = navbarItemScore(item, pathname, baseUrl, docs);
    if (score > best) { best = score; winner = index; }
  });
  return winner;
}

/** Whether a rendered navbar item's props describe this configured item. */
export function sameNavbarItem(config: NavbarItemLike, props: NavbarItemLike): boolean {
  return (['type', 'to', 'href', 'label', 'sidebarId', 'docId', 'docsPluginId', 'activeBasePath', 'activeBaseRegex'] as const)
    .every((key) => (config[key] ?? undefined) === (props[key] ?? undefined) || (key === 'type' && (config.type ?? 'default') === (props.type ?? 'default')));
}

/** The link a docSidebar or doc item points at, from the docs global data. */
export function docItemLink(item: NavbarItemLike, docs: DocsGlobalData, pathname: string): {path: string; label?: string} | undefined {
  const pluginId = item.docsPluginId ?? 'default';
  const versions = docs[pluginId]?.versions ?? [];
  const doc = currentDoc(pathname, docs, pluginId);
  const version = versions.find((candidate) => candidate.docs.some((entry) => entry === doc)) ?? versions.find((candidate) => candidate.isLast) ?? versions[0];
  if (!version) return undefined;
  if (item.type === 'docSidebar' && item.sidebarId) return version.sidebars?.[item.sidebarId]?.link;
  const target = version.docs.find((entry) => entry.id === item.docId);
  return target ? {path: target.path} : undefined;
}
