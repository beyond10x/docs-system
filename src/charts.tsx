import {useEffect, useId, useMemo, useRef, useState} from 'react';
import type {CSSProperties, KeyboardEvent, ReactNode} from 'react';
import {
  DOMAIN_NODE_HEIGHT,
  PROTOCOL_KIND_LABELS,
  layoutDomainGraph,
  layoutProtocolGraph,
  parseDomainGraph,
  parseProtocolGraph,
  predicateLines,
  protocolLineage,
} from './product-graphs.js';
import type {
  DomainEntity,
  DomainGraphDocument,
  DomainGraphLayout,
  DomainRelation,
  ProtocolGraphDocument,
  ProtocolGraphEdge,
  ProtocolGraphLayout,
  ProtocolGraphNode,
  ProtocolNodeKind,
  ProtocolPredicate,
} from './product-graphs.js';

/** Text never shrinks below this share of its design size; wider graphs scroll instead. */
const MINIMUM_SCALE = 0.78;

/**
 * `default` is the documentation figure. `hero` is the compact landing-page art: scaled to fit its
 * column but never below `HERO_MIN_SCALE` (a wider graph is cropped at the column edge and scrolls),
 * no header, tooltip or text table (the full figure and its table live further down the page), and
 * edges that draw once when motion is allowed.
 */
export type GraphVariant = 'default' | 'hero';

/** The smallest hero scale: 13 px node names stay at least 10 px on screen. */
export const HERO_MIN_SCALE = 0.8;

function heroCanvasStyle(width: number): CSSProperties {
  const px = Math.ceil(width);
  return {maxWidth: `${px}px`, minWidth: `${Math.ceil(px * HERO_MIN_SCALE)}px`};
}

export interface ProtocolGraphProps {
  /** A `b10x-protocol-graph/1` document, usually imported from the repository's generated JSON. */
  data: unknown;
  title?: string;
  description?: ReactNode;
  caption?: ReactNode;
  variant?: GraphVariant;
}

const KIND_ORDER: readonly ProtocolNodeKind[] = ['action', 'evidence', 'claim', 'outcome', 'obligation'];

/**
 * A graph wider than its frame scrolls at no less than MINIMUM_SCALE. When it does, a toggle offers
 * "Fit to width"; the measurement runs only in the browser, so the server render has no toggle.
 */
function useFit(width: number): {fit: boolean; overflowing: boolean; toggle(): void; viewport: {current: HTMLDivElement | null}; style: CSSProperties} {
  const [fit, setFit] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = viewport.current;
    if (!element || typeof window === 'undefined') return;
    const measure = (): void => setOverflowing(width * MINIMUM_SCALE > element.clientWidth + 1);
    measure();
    if (!('ResizeObserver' in window)) return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [width]);
  return {
    fit,
    overflowing,
    toggle: () => setFit((value) => !value),
    viewport,
    style: {minWidth: fit ? '0px' : `${Math.round(width * MINIMUM_SCALE)}px`, maxWidth: `${Math.ceil(width)}px`} as CSSProperties,
  };
}

function FitToggle({fit, overflowing, toggle}: {fit: boolean; overflowing: boolean; toggle(): void}): ReactNode {
  if (!overflowing && !fit) return null;
  return <button type="button" className="b10x-graph__fit" aria-pressed={fit} onClick={toggle}>{fit ? 'Actual size' : 'Fit to width'}</button>;
}

export function ProtocolGraph({data, title, description, caption, variant = 'default'}: ProtocolGraphProps): ReactNode {
  const prepared = useMemo(() => {
    try {
      const document = parseProtocolGraph(data);
      return {document, layout: layoutProtocolGraph(document)};
    } catch (error) {
      return {error: error instanceof Error ? error.message : String(error)};
    }
  }, [data]);
  if ('error' in prepared) return <GraphError kind="protocol graph" message={prepared.error!} />;
  return <ProtocolGraphView document={prepared.document} layout={prepared.layout} title={title} description={description} caption={caption} variant={variant} />;
}

function ProtocolGraphView({document, layout, title, description, caption, variant}: {document: ProtocolGraphDocument; layout: ProtocolGraphLayout; title?: string; description?: ReactNode; caption?: ReactNode; variant: GraphVariant}): ReactNode {
  const base = `b10x-pg-${useId().replaceAll(':', '')}`;
  const hero = variant === 'hero';
  const sizing = useFit(layout.width);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const current = hovered ?? pinned;
  const lineage = useMemo(() => current ? protocolLineage(document, current) : null, [document, current]);
  const byId = useMemo(() => new Map(document.nodes.map((node) => [node.id, node])), [document]);
  const counts = KIND_ORDER.map((kind) => ({kind, count: document.nodes.filter((node) => node.kind === kind).length})).filter((entry) => entry.count > 0);
  const heading = title ?? `${document.protocol.id}/${document.protocol.revision}`;
  const placed = layout.nodes.find((node) => node.node.id === current);
  const hasGates = document.edges.some((edge) => edge.kind === 'gates');
  const hasSupports = document.edges.some((edge) => edge.kind === 'supports');
  const onKeyDown = (event: KeyboardEvent): void => { if (event.key === 'Escape') { setPinned(null); setHovered(null); } };

  const legend = <ul className="b10x-graph__legend" aria-label="Legend">
    {counts.map(({kind, count}) => <li key={kind}><span className={`b10x-graph__swatch b10x-graph__swatch--${kind}`} aria-hidden="true" />{PROTOCOL_KIND_LABELS[kind].plural}<span className="b10x-graph__count">{count}</span></li>)}
    {!hero && hasSupports && <li><svg className="b10x-graph__key" viewBox="0 0 22 12" aria-hidden="true"><path d="M2,2 C14,2 14,10 2,10" /></svg>Claim supports claim</li>}
    {!hero && hasGates && <li><Glyph kind="lock" legend />Precondition, traced on hover</li>}
    {!hero && document.nodes.some((node) => node.capabilities?.length) && <li><Glyph kind="key" legend />Needs authority</li>}
  </ul>;

  return <figure className={classes('b10x-graph', 'b10x-protocol-graph', hero && 'b10x-graph--hero')} aria-labelledby={`${base}-title`} onKeyDown={onKeyDown}>
    {hero
      ? <p className="b10x-graph__kicker b10x-graph__hero-title"><span id={`${base}-title`}>{heading}</span> · protocol graph</p>
      : <header className="b10x-graph__header">
        <div className="b10x-graph__heading">
          <p className="b10x-graph__kicker">Protocol · revision {document.protocol.revision}</p>
          <strong id={`${base}-title`} className="b10x-graph__title">{heading}</strong>
          {(description ?? document.protocol.description) && <p className="b10x-graph__description" id={`${base}-description`}>{description ?? document.protocol.description}</p>}
        </div>
        {legend}
      </header>}
    <div className="b10x-graph__viewport" ref={sizing.viewport}>
      <div className="b10x-graph__canvas" style={hero ? heroCanvasStyle(layout.width) : sizing.style}>
        <svg viewBox={`-2 -2 ${f(layout.width + 4)} ${f(layout.height + 4)}`} className="b10x-graph__svg" role="group" aria-labelledby={`${base}-title`} aria-describedby={`${base}-hint`}>
          <defs>
            <marker id={`${base}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" className="b10x-graph__arrow" /></marker>
            <marker id={`${base}-arrow-lit`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" className="b10x-graph__arrow b10x-graph__arrow--lit" /></marker>
          </defs>
          <g className="b10x-graph__columns" aria-hidden="true">
            {layout.columns.map((column, index) => <g key={column.kind} transform={`translate(${f(column.x)},0)`}>
              <text className="b10x-graph__column-label" x={0} y={14}><tspan className="b10x-graph__column-index">{String(index + 1).padStart(2, '0')}</tspan>{`  ${column.plural.toUpperCase()}`}</text>
              <line className={`b10x-graph__column-rule b10x-graph__column-rule--${column.kind}`} x1={0} x2={column.width} y1={26} y2={26} />
            </g>)}
          </g>
          <g className="b10x-graph__edges" aria-hidden="true">
            {layout.edges.map(({edge, index, path}) => {
              const touchesCurrent = edge.from === current || edge.to === current;
              if (edge.kind === 'gates' && !touchesCurrent) return null;
              const lit = lineage ? lineage.has(edge.from) && lineage.has(edge.to) && (edge.kind !== 'gates' || touchesCurrent) : false;
              const dim = lineage !== null && !lit;
              return <path key={index} d={path} pathLength={hero && edge.kind !== 'gates' ? 1 : undefined} className={classes('b10x-graph__edge', `b10x-graph__edge--${edge.kind}`, lit && 'is-lit', dim && 'is-dimmed')} markerEnd={`url(#${base}-${lit ? 'arrow-lit' : 'arrow'})`} />;
            })}
          </g>
          {lineage && <g className="b10x-graph__qualifiers" aria-hidden="true">
            {layout.edges.filter(({edge}) => edge.qualifier && lineage.has(edge.from) && lineage.has(edge.to) && (edge.kind !== 'gates' || edge.from === current || edge.to === current)).map(({edge, index, label}) => {
              const width = edge.qualifier!.length * 6.6 + 12;
              return <g key={index} transform={`translate(${f(label.x - width / 2)},${f(label.y - 9)})`}><rect width={f(width)} height={18} rx={9} className="b10x-graph__qualifier-bg" /><text x={f(width / 2)} y={12.5} textAnchor="middle" className="b10x-graph__qualifier">{edge.qualifier}</text></g>;
            })}
          </g>}
          <g className="b10x-graph__nodes">
            {layout.nodes.map(({node, x, y, width, height, displayName}) => {
              const dim = lineage !== null && !lineage.has(node.id);
              const isCurrent = node.id === current;
              return <g
                key={node.id}
                transform={`translate(${f(x)},${f(y)})`}
                className={classes('b10x-graph__node', `b10x-graph__node--${node.kind}`, dim && 'is-dimmed', isCurrent && 'is-current')}
                tabIndex={0}
                role="button"
                aria-pressed={pinned === node.id}
                aria-label={`${PROTOCOL_KIND_LABELS[node.kind].singular} ${node.name}${node.description ? `. ${node.description}` : ''}`}
                aria-describedby={isCurrent ? `${base}-tooltip` : undefined}
                onPointerEnter={() => setHovered(node.id)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(node.id)}
                onBlur={() => setHovered(null)}
                onClick={() => setPinned((value) => value === node.id ? null : node.id)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setPinned((value) => value === node.id ? null : node.id); } }}
              >
                <rect className="b10x-graph__hit" x={-6} y={-6} width={width + 12} height={height + 12} rx={12} />
                <rect className="b10x-graph__body" width={width} height={height} rx={8} />
                <rect className="b10x-graph__accent" x={0} y={10} width={3} height={height - 20} rx={1.5} />
                <text className="b10x-graph__node-kicker" x={16} y={22}>{kicker(node)}</text>
                <text className="b10x-graph__node-name" x={16} y={42}>{displayName}</text>
                <NodeGlyphs node={node} width={width} />
              </g>;
            })}
          </g>
        </svg>
        {placed && !hero && <ProtocolTooltip id={`${base}-tooltip`} placed={placed} layout={layout} document={document} byId={byId} />}
      </div>
    </div>
    {hero
      ? <>{legend}<p className="b10x-sr-only" id={`${base}-hint`}>Hover or focus a node to trace what it rests on.</p></>
      : <div className="b10x-graph__tools"><p className="b10x-graph__hint" id={`${base}-hint`} data-pagefind-ignore>Hover or focus a node to trace what it rests on and what rests on it. Press Enter to pin it, Escape to clear.</p><FitToggle {...sizing} /></div>}
    {caption && <figcaption className="b10x-graph__caption">{caption}</figcaption>}
    {!hero && <ProtocolTable document={document} />}
    {!hero && document.protocol.source && <p className="b10x-graph__source">Source: {document.protocol.source}</p>}
  </figure>;
}

function kicker(node: ProtocolGraphNode): string {
  const label = PROTOCOL_KIND_LABELS[node.kind].singular.toUpperCase();
  return node.kind === 'action' && node.effect ? `${label} · ${node.effect.toUpperCase()}` : label;
}

function NodeGlyphs({node, width}: {node: ProtocolGraphNode; width: number}): ReactNode {
  const glyphs: Array<'key' | 'lock'> = [];
  if (node.kind === 'action' && node.predicate) glyphs.push('lock');
  if (node.capabilities?.length) glyphs.push('key');
  return <>{glyphs.map((glyph, index) => <g key={glyph} transform={`translate(${width - 24 - index * 18},11)`}><Glyph kind={glyph} /></g>)}</>;
}

function Glyph({kind, legend = false}: {kind: 'key' | 'lock'; legend?: boolean}): ReactNode {
  const shape = kind === 'lock'
    ? <><rect x={2.5} y={6} width={9} height={7} rx={1.5} /><path d="M4.5,6 V4.5 a2.5,2.5 0 0 1 5,0 V6" /></>
    : <><circle cx={4.5} cy={7} r={3} /><path d="M7.5,7 H13 M11,7 V9.5 M13,7 V9" /></>;
  return legend
    ? <svg className={`b10x-graph__glyph b10x-graph__glyph--${kind}`} viewBox="0 0 14 14" aria-hidden="true">{shape}</svg>
    : <g className={`b10x-graph__glyph b10x-graph__glyph--${kind}`} aria-hidden="true">{shape}</g>;
}

function ProtocolTooltip({id, placed, layout, document, byId}: {id: string; placed: ProtocolGraphLayout['nodes'][number]; layout: ProtocolGraphLayout; document: ProtocolGraphDocument; byId: Map<string, ProtocolGraphNode>}): ReactNode {
  const {node} = placed;
  const style = tooltipPosition(placed, layout.width, layout.height);
  const related = (kind: ProtocolGraphEdge['kind'], direction: 'from' | 'to'): ProtocolGraphEdge[] => document.edges.filter((edge) => edge.kind === kind && edge[direction] === node.id);
  const produces = related('produces', 'from');
  const producedBy = related('produces', 'to');
  const establishes = related('establishes', 'from');
  const gates = related('gates', 'from');
  const neededBy = [...related('supports', 'from'), ...related('requires', 'from')];
  const nameOf = (edgeId: string): string => byId.get(edgeId)?.name ?? edgeId;
  return <div className={`b10x-graph__tooltip b10x-graph__tooltip--${node.kind}`} role="tooltip" id={id} style={style}>
    <p className="b10x-graph__tooltip-kicker">{kicker(node)}</p>
    <p className="b10x-graph__tooltip-name"><code>{node.name}</code></p>
    {node.description && <p className="b10x-graph__tooltip-text">{node.description}</p>}
    {node.predicate && <TooltipSection title={node.kind === 'claim' ? 'True when' : node.kind === 'action' ? 'Admissible when' : 'Requires'}><Predicate value={node.predicate} /></TooltipSection>}
    {node.capabilities?.length ? <TooltipSection title="Needs authority">{node.capabilities.map((capability) => <code key={capability}>{capability}</code>)}</TooltipSection> : null}
    {produces.length > 0 && <TooltipSection title="May produce">{produces.map((edge) => <code key={edge.to}>{nameOf(edge.to)}</code>)}</TooltipSection>}
    {producedBy.length > 0 && <TooltipSection title="Produced by">{producedBy.map((edge) => <code key={edge.from}>{nameOf(edge.from)}</code>)}</TooltipSection>}
    {establishes.length > 0 && <TooltipSection title="Establishes">{establishes.map((edge) => <span key={edge.to}><code>{nameOf(edge.to)}</code>{edge.qualifier && <> on <b>{edge.qualifier}</b></>}</span>)}</TooltipSection>}
    {neededBy.length > 0 && <TooltipSection title="Needed by">{neededBy.map((edge) => <span key={edge.to}><code>{nameOf(edge.to)}</code>{edge.qualifier && <> as <b>{edge.qualifier}</b></>}</span>)}</TooltipSection>}
    {gates.length > 0 && <TooltipSection title="Gates">{gates.map((edge) => <code key={edge.to}>{nameOf(edge.to)}</code>)}</TooltipSection>}
  </div>;
}

function TooltipSection({title, children}: {title: string; children: ReactNode}): ReactNode {
  return <div className="b10x-graph__tooltip-section"><p>{title}</p><div>{children}</div></div>;
}

function Predicate({value}: {value: ProtocolPredicate}): ReactNode {
  return <ul className="b10x-graph__predicate">{predicateLines(value).map((line, index) => <li key={index} style={{'--b10x-depth': line.depth} as CSSProperties}>{line.reference ? <>{line.text} <code>{line.reference}</code></> : <span>{line.text}</span>}</li>)}</ul>;
}

function ProtocolTable({document}: {document: ProtocolGraphDocument}): ReactNode {
  const names = new Map(document.nodes.map((node) => [node.id, node.name]));
  const links = (node: ProtocolGraphNode): string => {
    const outgoing = document.edges.filter((edge) => edge.from === node.id).map((edge) => `${edge.kind} ${names.get(edge.to)}${edge.qualifier ? ` (${edge.qualifier})` : ''}`);
    return outgoing.join('; ') || '—';
  };
  return <details className="b10x-graph__table">
    <summary>Protocol as text</summary>
    {KIND_ORDER.map((kind) => {
      const nodes = document.nodes.filter((node) => node.kind === kind);
      if (!nodes.length) return null;
      return <div className="b10x-table-wrap" key={kind}><table>
        <caption>{PROTOCOL_KIND_LABELS[kind].plural}</caption>
        <thead><tr><th scope="col">Name</th><th scope="col">Description</th><th scope="col">Rule</th><th scope="col">Leads to</th></tr></thead>
        <tbody>{nodes.map((node) => <tr key={node.id}>
          <th scope="row"><code>{node.name}</code></th>
          <td>{node.description ?? '—'}</td>
          <td>{[node.predicate ? predicateLines(node.predicate).map((line) => `${'  '.repeat(line.depth)}${line.text}${line.reference ? ` ${line.reference}` : ''}`).join('\n') : '', node.capabilities?.length ? `needs ${node.capabilities.join(', ')}` : '', node.effect ? `effect ${node.effect}` : ''].filter(Boolean).join('\n') || '—'}</td>
          <td>{links(node)}</td>
        </tr>)}</tbody>
      </table></div>;
    })}
  </details>;
}

// ---------------------------------------------------------------------------------------------

export interface DomainGraphProps {
  /** A `b10x-domain-graph/1` document emitted from a compiled ESS model. */
  data: unknown;
  title?: string;
  description?: ReactNode;
  caption?: ReactNode;
  variant?: GraphVariant;
}

export function DomainGraph({data, title, description, caption, variant = 'default'}: DomainGraphProps): ReactNode {
  const prepared = useMemo(() => {
    try {
      const document = parseDomainGraph(data);
      return {document, layout: layoutDomainGraph(document)};
    } catch (error) {
      return {error: error instanceof Error ? error.message : String(error)};
    }
  }, [data]);
  if ('error' in prepared) return <GraphError kind="domain graph" message={prepared.error!} />;
  return <DomainGraphView document={prepared.document} layout={prepared.layout} title={title} description={description} caption={caption} variant={variant} />;
}

function DomainGraphView({document, layout, title, description, caption, variant}: {document: DomainGraphDocument; layout: DomainGraphLayout; title?: string; description?: ReactNode; caption?: ReactNode; variant: GraphVariant}): ReactNode {
  const base = `b10x-dg-${useId().replaceAll(':', '')}`;
  const hero = variant === 'hero';
  const sizing = useFit(layout.width);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const current = hovered ?? pinned;
  const neighbours = useMemo(() => {
    if (!current) return null;
    const result = new Set([current]);
    for (const relation of document.relations) if (relation.from === current || relation.to === current) { result.add(relation.from); result.add(relation.to); }
    return result;
  }, [document, current]);
  const placed = layout.nodes.find((node) => node.entity.id === current);
  const kinds = new Set(document.relations.map((relation) => relation.kind));
  const lifecycles = document.entities.filter((entity) => (entity.lifecycle?.transitions?.length ?? 0) > 0);
  const onKeyDown = (event: KeyboardEvent): void => { if (event.key === 'Escape') { setPinned(null); setHovered(null); } };
  const heading = title ?? document.domain.display ?? document.domain.id;

  const legend = <ul className="b10x-graph__legend" aria-label="Legend">
    <li><span className="b10x-graph__swatch b10x-graph__swatch--entity" aria-hidden="true" />Entities<span className="b10x-graph__count">{document.entities.length}</span></li>
    {kinds.has('owns') && <li><svg className="b10x-graph__key" viewBox="0 0 26 12" aria-hidden="true"><path d="M1,6 L5,3 L9,6 L5,9 z" className="b10x-graph__key-fill" /><path d="M9,6 H25" /></svg>Owns</li>}
    {kinds.has('references') && <li><svg className="b10x-graph__key" viewBox="0 0 26 12" aria-hidden="true"><circle cx={4} cy={6} r={2.6} /><path d="M7,6 H25" /></svg>References</li>}
    {!hero && <li><svg className="b10x-graph__key" viewBox="0 0 26 12" aria-hidden="true"><path d="M1,6 H25 M19,1 V11" /></svg>One</li>}
    {!hero && <li><svg className="b10x-graph__key" viewBox="0 0 26 12" aria-hidden="true"><path d="M1,6 H25 M17,6 L25,1 M17,6 L25,11" /></svg>Many</li>}
    {!hero && <li><span className="b10x-graph__state-key" aria-hidden="true">●</span>Initial state</li>}
  </ul>;

  return <figure className={classes('b10x-graph', 'b10x-domain-graph', hero && 'b10x-graph--hero')} aria-labelledby={`${base}-title`} onKeyDown={onKeyDown}>
    {hero
      ? <p className="b10x-graph__kicker b10x-graph__hero-title"><code id={`${base}-title`}>{document.domain.id}</code> · ESS domain</p>
      : <header className="b10x-graph__header">
        <div className="b10x-graph__heading">
          <p className="b10x-graph__kicker">ESS domain · <code>{document.domain.id}</code></p>
          <strong id={`${base}-title`} className="b10x-graph__title">{heading}</strong>
          {(description ?? document.domain.summary) && <p className="b10x-graph__description">{description ?? document.domain.summary}</p>}
        </div>
        {legend}
      </header>}
    <div className="b10x-graph__viewport" ref={sizing.viewport}>
      <div className="b10x-graph__canvas" style={hero ? heroCanvasStyle(layout.width) : sizing.style}>
        <svg viewBox={`-4 -4 ${f(layout.width + 8)} ${f(layout.height + 8)}`} className="b10x-graph__svg" role="group" aria-labelledby={`${base}-title`} aria-describedby={`${base}-hint`}>
          <defs>
            <marker id={`${base}-owns`} viewBox="0 0 12 10" refX="1" refY="5" markerWidth="12" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto"><path d="M1,5 L6,1.5 L11,5 L6,8.5 z" className="b10x-graph__marker-fill" /></marker>
            <marker id={`${base}-references`} viewBox="0 0 10 10" refX="2" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><circle cx={5} cy={5} r={3} className="b10x-graph__marker-open" /></marker>
            <marker id={`${base}-one`} viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto"><path d="M5,1 V11" className="b10x-graph__marker-line" /></marker>
            <marker id={`${base}-many`} viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto"><path d="M1,6 L11,1 M1,6 L11,11 M1,6 H11" className="b10x-graph__marker-line" /></marker>
          </defs>
          <g className="b10x-graph__edges" aria-hidden="true">
            {layout.edges.map(({relation, index, path}) => {
              const lit = neighbours !== null && (relation.from === current || relation.to === current);
              return <path key={index} d={path} pathLength={hero ? 1 : undefined} className={classes('b10x-graph__edge', `b10x-graph__edge--${relation.kind}`, lit && 'is-lit', neighbours !== null && !lit && 'is-dimmed')} markerStart={`url(#${base}-${relation.kind})`} markerEnd={`url(#${base}-${relation.cardinality})`} />;
            })}
          </g>
          <g className="b10x-graph__relation-labels" aria-hidden="true">
            {layout.edges.map(({relation, index, start, end, route}) => {
              const dim = neighbours !== null && relation.from !== current && relation.to !== current;
              const anchorEnd = route === 'backward';
              return <text key={index} x={f(start.x + (anchorEnd ? -10 : 10))} y={f(start.y + (end.y < start.y - 4 ? 13 : -6))} textAnchor={anchorEnd ? 'end' : 'start'} className={classes('b10x-graph__relation-label', dim && 'is-dimmed')}>{relation.name}</text>;
            })}
          </g>
          <g className="b10x-graph__nodes">
            {layout.nodes.map(({entity, x, y, width, height, displayName}) => {
              const isCurrent = entity.id === current;
              return <g
                key={entity.id}
                transform={`translate(${f(x)},${f(y)})`}
                className={classes('b10x-graph__node', 'b10x-graph__node--entity', neighbours !== null && !neighbours.has(entity.id) && 'is-dimmed', isCurrent && 'is-current')}
                tabIndex={0}
                role="button"
                aria-pressed={pinned === entity.id}
                aria-label={`Entity ${entity.name}${entity.summary ? `. ${entity.summary}` : ''}`}
                aria-describedby={isCurrent ? `${base}-tooltip` : undefined}
                onPointerEnter={() => setHovered(entity.id)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(entity.id)}
                onBlur={() => setHovered(null)}
                onClick={() => setPinned((value) => value === entity.id ? null : entity.id)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setPinned((value) => value === entity.id ? null : entity.id); } }}
              >
                <rect className="b10x-graph__hit" x={-6} y={-6} width={width + 12} height={height + 12} rx={12} />
                <rect className="b10x-graph__body" width={width} height={height} rx={8} />
                <rect className="b10x-graph__accent" x={0} y={10} width={3} height={height - 20} rx={1.5} />
                <text className="b10x-graph__node-kicker" x={16} y={21}>{`ENTITY · ${entity.fields.length + 1} FIELD${entity.fields.length ? 'S' : ''}`}</text>
                <text className="b10x-graph__entity-name" x={16} y={42}>{displayName}</text>
                <StateChips entity={entity} width={width} />
              </g>;
            })}
          </g>
        </svg>
        {placed && !hero && <DomainTooltip id={`${base}-tooltip`} placed={placed} layout={layout} document={document} />}
      </div>
    </div>
    {hero
      ? <>{legend}<p className="b10x-sr-only" id={`${base}-hint`}>Hover or focus an entity to see what it relates to.</p></>
      : <div className="b10x-graph__tools"><p className="b10x-graph__hint" id={`${base}-hint`} data-pagefind-ignore>Hover or focus an entity to see its fields, lifecycle and relations. Press Enter to pin it, Escape to clear.</p><FitToggle {...sizing} /></div>}
    {!hero && lifecycles.length > 0 && <section className="b10x-lifecycles" aria-label="Lifecycles">
      <p className="b10x-graph__kicker">Lifecycles with transitions</p>
      <div>{lifecycles.map((entity) => <Lifecycle key={entity.id} entity={entity} />)}</div>
    </section>}
    {caption && <figcaption className="b10x-graph__caption">{caption}</figcaption>}
    {!hero && <DomainTable document={document} />}
    {!hero && document.domain.source && <p className="b10x-graph__source">Source: {document.domain.source}</p>}
  </figure>;
}

function StateChips({entity, width}: {entity: DomainEntity; width: number}): ReactNode {
  const lifecycle = entity.lifecycle;
  if (!lifecycle) return <text className="b10x-graph__node-meta" x={16} y={DOMAIN_NODE_HEIGHT - 20}>No lifecycle</text>;
  const chips: ReactNode[] = [];
  let x = 16;
  const limit = width - 16;
  lifecycle.states.forEach((state, index) => {
    const initial = state === lifecycle.initial;
    const chipWidth = state.length * 6.3 + (initial ? 26 : 16);
    if (x + chipWidth > limit) {
      if (chips.length && !chips.some((chip) => (chip as {key?: string}).key === 'more')) chips.push(<text key="more" className="b10x-graph__node-meta" x={x} y={DOMAIN_NODE_HEIGHT - 20}>{`+${lifecycle.states.length - index}`}</text>);
      x = limit + 1;
      return;
    }
    chips.push(<g key={state} transform={`translate(${f(x)},${DOMAIN_NODE_HEIGHT - 34})`} className={classes('b10x-graph__state', initial && 'is-initial')}>
      <rect width={f(chipWidth)} height={20} rx={10} />
      {initial && <circle cx={10} cy={10} r={3} />}
      <text x={initial ? 18 : 8} y={14}>{state}</text>
    </g>);
    x += chipWidth + 6;
  });
  return <>{chips}</>;
}

function DomainTooltip({id, placed, layout, document}: {id: string; placed: DomainGraphLayout['nodes'][number]; layout: DomainGraphLayout; document: DomainGraphDocument}): ReactNode {
  const {entity} = placed;
  const names = new Map(document.entities.map((item) => [item.id, item.name]));
  const outgoing = document.relations.filter((relation) => relation.from === entity.id);
  const incoming = document.relations.filter((relation) => relation.to === entity.id);
  return <div className="b10x-graph__tooltip b10x-graph__tooltip--entity" role="tooltip" id={id} style={tooltipPosition(placed, layout.width, layout.height)}>
    <p className="b10x-graph__tooltip-kicker">Entity</p>
    <p className="b10x-graph__tooltip-name"><code>{entity.name}</code></p>
    {entity.summary && <p className="b10x-graph__tooltip-text">{entity.summary}</p>}
    <TooltipSection title="Fields">
      <ul className="b10x-graph__fields">
        <li><code>{entity.identity.name}</code><span>{entity.identity.type}</span><b>identity</b></li>
        {entity.fields.map((field) => <li key={field.name}><code>{field.name}</code><span>{field.type}</span></li>)}
      </ul>
    </TooltipSection>
    {entity.lifecycle && <TooltipSection title="Lifecycle">{entity.lifecycle.states.map((state) => <code key={state}>{state === entity.lifecycle!.initial ? `● ${state}` : state}</code>)}</TooltipSection>}
    {entity.createdBy?.length ? <TooltipSection title="Created by">{entity.createdBy.map((command) => <code key={command}>{command}</code>)}</TooltipSection> : null}
    {outgoing.length > 0 && <TooltipSection title="Relations">{outgoing.map((relation) => <span key={relation.name}>{relationText(relation, names)}</span>)}</TooltipSection>}
    {incoming.length > 0 && <TooltipSection title="Referenced by">{incoming.map((relation) => <span key={`${relation.from}-${relation.name}`}><code>{names.get(relation.from)}</code>.{relation.name}</span>)}</TooltipSection>}
  </div>;
}

function relationText(relation: DomainRelation, names: Map<string, string>): ReactNode {
  return <><code>{relation.name}</code> {relation.kind} {relation.cardinality === 'many' ? 'many' : 'one'} <code>{names.get(relation.to)}</code>{relation.via && <> via <code>{relation.via}</code></>}</>;
}

function Lifecycle({entity}: {entity: DomainEntity}): ReactNode {
  const lifecycle = entity.lifecycle!;
  const transitions = lifecycle.transitions ?? [];
  const order = lifecycle.states;
  const widths = order.map((state) => state.length * 7.4 + 30);
  const gap = Math.max(110, ...transitions.map((transition) => (transition.name.length + (transition.commands?.[0]?.length ?? 0) + 3) * 6.2 + 20));
  const lead = entity.createdBy?.length ? 56 : 8;
  const xs: number[] = [];
  let cursor = lead;
  widths.forEach((width) => { xs.push(cursor); cursor += width + gap; });
  const width = cursor - gap + 8;
  const height = 132;
  const middle = 66;
  const centre = (state: string): number => { const index = order.indexOf(state); return xs[index] + widths[index] / 2; };
  const edge = (state: string, side: 'left' | 'right'): number => { const index = order.indexOf(state); return side === 'left' ? xs[index] : xs[index] + widths[index]; };
  const markerId = `b10x-lc-${entity.id.replace(/[^a-zA-Z0-9]+/g, '-')}`;
  return <figure className="b10x-lifecycle" aria-label={`${entity.name} lifecycle: ${transitions.map((transition) => `${transition.name} from ${transition.from.join(' or ')} to ${transition.to}`).join('; ')}`}>
    <figcaption><code>{entity.name}</code></figcaption>
    <svg viewBox={`0 0 ${f(width)} ${height}`} style={{maxWidth: `${Math.ceil(width)}px`}} aria-hidden="true">
      <defs><marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" className="b10x-graph__arrow b10x-graph__arrow--lit" /></marker></defs>
      {entity.createdBy?.length ? <g className="b10x-lifecycle__entry"><circle cx={10} cy={middle} r={5} /><path d={`M16,${middle} H${f(xs[order.indexOf(lifecycle.initial)] - 4)}`} markerEnd={`url(#${markerId})`} /><text x={8} y={middle + 24}>{entity.createdBy[0]}</text></g> : null}
      {transitions.flatMap((transition, tIndex) => transition.from.map((from) => {
        const forward = order.indexOf(transition.to) >= order.indexOf(from);
        const startX = forward ? edge(from, 'right') - 10 : edge(from, 'left') + 10;
        const endX = forward ? edge(transition.to, 'left') + 10 : edge(transition.to, 'right') - 10;
        const lift = forward ? -1 : 1;
        const y = middle + lift * 14;
        const peak = middle + lift * 48;
        const label = `${transition.name}${transition.commands?.length ? ` · ${transition.commands.join(', ')}` : ''}`;
        return <g key={`${tIndex}-${from}`} className="b10x-lifecycle__transition">
          <path d={`M${f(startX)},${f(y)} C${f(startX)},${f(peak)} ${f(endX)},${f(peak)} ${f(endX)},${f(y)}`} markerEnd={`url(#${markerId})`} />
          <text x={f((centre(from) + centre(transition.to)) / 2)} y={f(middle + lift * 44 + (forward ? -4 : 12))} textAnchor="middle">{label}</text>
        </g>;
      }))}
      {order.map((state, index) => <g key={state} transform={`translate(${f(xs[index])},${middle - 14})`} className={classes('b10x-lifecycle__state', state === lifecycle.initial && 'is-initial', lifecycle.terminal?.includes(state) && 'is-terminal')}>
        <rect width={f(widths[index])} height={28} rx={14} />
        <text x={f(widths[index] / 2)} y={18.5} textAnchor="middle">{state}</text>
      </g>)}
    </svg>
  </figure>;
}

function DomainTable({document}: {document: DomainGraphDocument}): ReactNode {
  const names = new Map(document.entities.map((entity) => [entity.id, entity.name]));
  return <details className="b10x-graph__table">
    <summary>Domain as text</summary>
    <div className="b10x-table-wrap"><table>
      <caption>Entities</caption>
      <thead><tr><th scope="col">Entity</th><th scope="col">Identity and fields</th><th scope="col">Lifecycle</th><th scope="col">Relations</th></tr></thead>
      <tbody>{document.entities.map((entity) => <tr key={entity.id}>
        <th scope="row"><code>{entity.name}</code></th>
        <td>{[`${entity.identity.name}: ${entity.identity.type} (identity)`, ...entity.fields.map((field) => `${field.name}: ${field.type}`)].join('\n')}</td>
        <td>{entity.lifecycle ? [`states ${entity.lifecycle.states.join(', ')}; initial ${entity.lifecycle.initial}`, ...(entity.lifecycle.transitions ?? []).map((transition) => `${transition.name}: ${transition.from.join(' or ')} → ${transition.to}${transition.commands?.length ? ` (${transition.commands.join(', ')})` : ''}`)].join('\n') : '—'}</td>
        <td>{document.relations.filter((relation) => relation.from === entity.id).map((relation) => `${relation.name} ${relation.kind} ${relation.cardinality} ${names.get(relation.to)}`).join('\n') || '—'}</td>
      </tr>)}</tbody>
    </table></div>
  </details>;
}

// ---------------------------------------------------------------------------------------------

function tooltipPosition(placed: {x: number; y: number; width: number; height: number}, width: number, height: number): CSSProperties {
  const style: Record<string, string> = {};
  // The tooltip is about 330 layout units wide at full scale; never let it leave the canvas.
  const needed = 340;
  const rightRoom = width - (placed.x + placed.width);
  const below = placed.y + placed.height / 2 > height * 0.55;
  if (rightRoom >= needed) style.left = pct(placed.x + placed.width + 14, width);
  else if (placed.x >= needed) style.right = pct(width - placed.x + 14, width);
  else {
    // Neither side has room: sit under (or over) the node, aligned to whichever edge fits.
    if (placed.x + needed <= width) style.left = pct(placed.x, width);
    else style.right = pct(width - placed.x - placed.width, width);
    if (below) style.bottom = pct(height - placed.y + 10, height);
    else style.top = pct(placed.y + placed.height + 10, height);
    return style as CSSProperties;
  }
  if (below) style.bottom = pct(height - placed.y - placed.height, height);
  else style.top = pct(placed.y, height);
  return style as CSSProperties;
}

function GraphError({kind, message}: {kind: string; message: string}): ReactNode {
  return <aside className="b10x-callout b10x-callout--danger b10x-graph-error" role="alert"><p className="b10x-callout__title b10x-eyebrow">Cannot render {kind}</p><div className="b10x-callout__content"><p><code>{message}</code></p></div></aside>;
}

function classes(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

function pct(value: number, total: number): string {
  return `${Math.round((value / total) * 10000) / 100}%`;
}

function f(value: number): string {
  return String(Math.round(value * 10) / 10);
}
