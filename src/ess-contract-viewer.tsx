import {useEffect, useMemo, useState, type ReactNode} from 'react';
import {CodeExample, Diagram, ScrollableTable} from './components.js';
import {essText, parseEssDocument, resolveEssTarget, safeEssUrl, type EssBlock, type EssDocumentIndex, type EssInline, type EssLocation} from './ess-document.js';

export interface EssContractViewerProps {
  document: unknown;
  /** Stable, unique prefix for shareable links when a page embeds multiple viewers. */
  id?: string;
  title?: string;
  sourceUrl?: string;
  sourceRepository?: string;
  initialPage?: string;
}

export function EssContractViewer(props: EssContractViewerProps): ReactNode {
  const parsed = useMemo(() => {
    try { return {index: parseEssDocument(props.document)}; }
    catch (error) { return {error: error instanceof Error ? error.message : 'Invalid ESS documentation'}; }
  }, [props.document]);
  if (!parsed.index) return <div className="b10x-contract-error" role="alert"><strong>Contract reference unavailable.</strong><p>{parsed.error}</p></div>;
  return <ContractBook key={`${props.id ?? parsed.index.document.system}:${parsed.index.document.version}`} {...props} index={parsed.index} />;
}

function ContractBook({index, id = `ess-${index.document.system}`, title, sourceUrl, sourceRepository, initialPage}: EssContractViewerProps & {index: EssDocumentIndex}): ReactNode {
  const prefix = `contract-${encodeURIComponent(id)}`;
  const first = index.pages.has(initialPage ?? '') ? initialPage! : index.pages.has('index') ? 'index' : index.document.pages[0].id;
  const [location, setLocation] = useState<EssLocation>({page: first});
  const [query, setQuery] = useState('');
  const page = index.pages.get(location.page) ?? index.pages.get(first)!;
  const sections = index.sections.get(page.id) ?? [];
  const results = query.trim() ? index.search.filter(entry => query.toLowerCase().trim().split(/\s+/).every(word => entry.text.includes(word))) : [];
  const href = (location: EssLocation) => `#${prefix}/${encodeURIComponent(location.page)}/${encodeURIComponent(location.anchor ?? '')}`;
  const anchorId = (location: EssLocation) => `${prefix}-${encodeURIComponent(location.page)}-${encodeURIComponent(location.anchor ?? '')}`;
  useEffect(() => {
    function follow() {
      if (!window.location.hash.startsWith(`#${prefix}/`)) return;
      const parts = window.location.hash.slice(prefix.length + 2).split('/');
      try {
        const target: EssLocation = {page: decodeURIComponent(parts[0]), ...(parts[1] ? {anchor: decodeURIComponent(parts[1])} : {})};
        if (resolveEssTarget(index, target.anchor ? {target: 'anchor', page: target.page, anchor: target.anchor} : {target: 'page', page: target.page})) setLocation(target);
      } catch { /* A malformed fragment does not select a different contract. */ }
    }
    follow(); window.addEventListener('hashchange', follow); return () => window.removeEventListener('hashchange', follow);
  }, [prefix, index]);
  useEffect(() => {
    if (!window.location.hash.startsWith(`#${prefix}/`)) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(anchorId(location));
      target?.scrollIntoView({block: 'start'});
      target?.focus({preventScroll: true});
    });
    return () => window.cancelAnimationFrame(frame);
  }, [prefix, location]);
  const navigationLink = (target: EssLocation, children: ReactNode, current = false) => <a href={href(target)} aria-current={current ? 'page' : undefined} onClick={() => setQuery('')}>{children}</a>;
  const context: RenderContext = {index, href, anchorId, page: page.id};
  return <section className="b10x-contract-viewer" aria-label={title ?? `${index.document.system} contract reference`}>
    <header className="b10x-contract-header">
      <div><p className="b10x-eyebrow">EXECUTABLE SYSTEM SPECIFICATION</p><h2>{title ?? `${index.document.system} contracts`}</h2><p>Explore the declared model: entities, commands, events, relationships, and lifecycles.</p></div>
      <dl><div><dt>Specification</dt><dd>{index.document.version}</dd></div><div><dt>Pages</dt><dd>{index.document.pages.length}</dd></div><div><dt>Format</dt><dd>ess-docs/1</dd></div></dl>
    </header>
    <p className="b10x-contract-boundary">These are contract declarations. They do not establish runtime implementation or enforcement.</p>
    <div className="b10x-contract-layout">
      <aside className="b10x-contract-sidebar">
        <label htmlFor={`${prefix}-search`}>Find a contract</label>
        <input id={`${prefix}-search`} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Principal, credential, lifecycle…" />
        {query.trim() ? <div className="b10x-contract-results"><p role="status">{results.length} matching {results.length === 1 ? 'section' : 'sections'}</p><nav aria-label="Contract search results">{results.map(result => <div key={`${result.page}#${result.anchor ?? ''}`}>{navigationLink(result, <><strong>{result.title}</strong><small>{result.page}</small></>)}</div>)}</nav>{!results.length && <p>Try an entity, command, event, or domain name.</p>}</div> : <nav aria-label="Contract pages">{index.document.pages.map(candidate => <div key={candidate.id}>{navigationLink({page: candidate.id}, <><span>{essText(candidate.title)}</span>{candidate.about && <small>{candidate.about.kind}</small>}</>, candidate.id === page.id)}</div>)}</nav>}
      </aside>
      <article className="b10x-contract-page" aria-labelledby={anchorId({page: page.id})}>
        <header><p className="b10x-eyebrow">{page.about?.kind ?? 'System reference'}</p><h3 id={anchorId({page: page.id})} tabIndex={-1}>{essText(page.title)}</h3></header>
        {sections.length > 0 && <details className="b10x-contract-contents"><summary>On this page · {sections.length} sections</summary><nav aria-label="Contract sections">{sections.map(section => <div key={section.anchor}>{navigationLink(section, section.title)}</div>)}</nav></details>}
        <Blocks blocks={page.blocks} context={context} />
        <details className="b10x-contract-provenance"><summary>Source and provenance</summary><p>Generated by ESS from the owning specification. This viewer displays the projection without executing its commands.</p><dl><dt>System</dt><dd>{page.provenance.provenance.system}</dd><dt>Specification version</dt><dd>{page.provenance.provenance.specification_version}</dd><dt>Source digest</dt><dd><code>{page.provenance.provenance.source_digest}</code></dd><dt>Contract digest</dt><dd><code>{page.provenance.provenance.contract_digest}</code></dd></dl>{sourceUrl && <SafeSourceLink href={sourceUrl}>Download documentation projection</SafeSourceLink>}{sourceRepository && <> · <SafeSourceLink href={sourceRepository}>View owning source</SafeSourceLink></>}</details>
      </article>
    </div>
  </section>;
}

interface RenderContext {index: EssDocumentIndex; page: string; href: (location: EssLocation) => string; anchorId: (location: EssLocation) => string}
function SafeSourceLink({href, children}: {href: string; children: ReactNode}): ReactNode {
  return safeEssUrl(href) ? <a href={href}>{children}</a> : <span>{children} (unavailable)</span>;
}
function Inlines({nodes, context}: {nodes: EssInline[]; context: RenderContext}): ReactNode {
  return nodes.map((node, i) => {
    switch (node.inline) {
      case 'text': return <span key={i}>{node.text}</span>;
      case 'code': return <code key={i}>{node.text}</code>;
      case 'strong': return <strong key={i}><Inlines nodes={node.text} context={context} /></strong>;
      case 'emphasis': return <em key={i}><Inlines nodes={node.text} context={context} /></em>;
      case 'link': {
        const target = resolveEssTarget(context.index, node.to); const children = <Inlines nodes={node.text} context={context} />;
        if (!target) return <span className="b10x-contract-unresolved" title="The projection does not publish a unique destination" key={i}>{children} <small>(unresolved reference)</small></span>;
        return <a key={i} href={typeof target === 'string' ? target : context.href(target)}>{children}</a>;
      }
    }
  });
}
function Blocks({blocks, context}: {blocks: EssBlock[]; context: RenderContext}): ReactNode {
  return blocks.map((block, i) => {
    switch (block.block) {
      case 'prose': return <p key={i}><Inlines nodes={block.text} context={context} /></p>;
      case 'section': {
        const Heading = `h${Math.min(6, block.level + 2)}` as 'h4' | 'h5' | 'h6';
        return <section key={i} className="b10x-contract-section"><Heading id={context.anchorId({page: context.page, anchor: block.anchor})} tabIndex={-1}><Inlines nodes={block.title} context={context} /></Heading><Blocks blocks={block.blocks} context={context} /></section>;
      }
      case 'list': { const List = block.ordered ? 'ol' : 'ul'; return <List key={i}>{block.items.map((item, j) => <li key={j}><Blocks blocks={item} context={context} /></li>)}</List>; }
      case 'table': return <ScrollableTable key={i} label="Contract fields"><thead><tr>{block.columns.map((cell, j) => <th key={j} scope="col"><Inlines nodes={cell} context={context} /></th>)}</tr></thead><tbody>{block.rows.map((row, j) => <tr key={j}>{row.map((cell, k) => <td key={k}><Inlines nodes={cell} context={context} /></td>)}</tr>)}</tbody></ScrollableTable>;
      case 'quote': return <blockquote key={i}><Blocks blocks={block.blocks} context={context} /></blockquote>;
      case 'code': return <CodeExample key={i} language={block.language ?? 'text'}>{block.text}</CodeExample>;
      case 'diagram': return <ContractDiagram key={i} source={block.source} kind={block.kind} />;
      case 'rule': return <hr key={i} />;
    }
  });
}
function ContractDiagram({source, kind}: {source: string; kind: string}): ReactNode {
  const [open, setOpen] = useState(kind === 'lifecycle');
  const title = kind === 'lifecycle' ? 'Lifecycle' : kind === 'system' ? 'System relationships' : kind === 'binding_flow' ? 'Binding flow' : 'Interaction';
  return <details className="b10x-contract-diagram" open={open} onToggle={event => setOpen(event.currentTarget.open)}><summary>{title}</summary>{open && <Diagram kind="mermaid" source={source} title={title} description="Relationships and transitions declared by the ESS contract. The surrounding contract text provides their names and conditions." minWidth={kind === 'lifecycle' ? '24rem' : '48rem'} />}<details><summary>Diagram source</summary><CodeExample language="mermaid">{source}</CodeExample></details></details>;
}
