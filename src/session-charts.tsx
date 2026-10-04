import {useId, useMemo, useState} from 'react';
import type {CSSProperties, ReactNode} from 'react';
import {layeredLayout} from './graph-layout.js';
import {decisionSteps, formatDuration, parseSessionComposition, sessionClock, sessionKpis} from './session-data.js';
import type {CompositionGraphData, SessionCompositionDocument, SessionKpiOptions, StatTileData} from './session-data.js';

interface Tip {x: number; y: number; width: number; height: number; title: string; lines: string[]; key?: string}

/** One HTML tooltip per chart, anchored to the mark in viewBox units so it scales with the SVG. */
function useTip(): [Tip | null, (tip: Tip) => {onPointerEnter(): void; onPointerLeave(): void; onFocus(): void; onBlur(): void}] {
  const [tip, setTip] = useState<Tip | null>(null);
  const bind = (next: Tip) => ({
    onPointerEnter: () => setTip(next),
    onPointerLeave: () => setTip(null),
    onFocus: () => setTip(next),
    onBlur: () => setTip(null),
  });
  return [tip, bind];
}

function TipBox({tip, viewWidth, viewHeight, id}: {tip: Tip; viewWidth: number; viewHeight: number; id: string}): ReactNode {
  const style: Record<string, string> = {};
  const centre = tip.x + tip.width / 2;
  if (centre > viewWidth * 0.62) style.right = `${pct(viewWidth - tip.x + 8, viewWidth)}`;
  else style.left = `${pct(tip.x + Math.min(tip.width, 40) + 8, viewWidth)}`;
  if (tip.y > viewHeight * 0.6) style.bottom = pct(viewHeight - tip.y + 6, viewHeight);
  else style.top = pct(tip.y + tip.height + 6, viewHeight);
  return <div className="b10x-chart-tip" role="tooltip" id={id} style={style as CSSProperties}>
    <p className="b10x-chart-tip__title">{tip.key && <span className="b10x-chart-tip__key" style={{background: tip.key}} aria-hidden="true" />}{tip.title}</p>
    {tip.lines.map((line) => <p key={line}>{line}</p>)}
  </div>;
}

function useSession(data: unknown): {document: SessionCompositionDocument} | {error: string} {
  return useMemo(() => {
    try {
      return {document: parseSessionComposition(data)};
    } catch (error) {
      return {error: error instanceof Error ? error.message : String(error)};
    }
  }, [data]);
}

const series = (slot: number | undefined): string => slot && slot >= 1 && slot <= 4 ? `var(--b10x-series-${slot})` : 'var(--b10x-series-neutral)';

// ---------------------------------------------------------------------------------------------
// Stat tiles
// ---------------------------------------------------------------------------------------------

export function StatTiles({items, label = 'Key figures'}: {items: readonly StatTileData[]; label?: string}): ReactNode {
  return <dl className="b10x-stat-tiles" aria-label={label}>{items.map((item) => <div className="b10x-stat-tile" key={item.label}>
    <dt>{item.label}</dt>
    <dd className="b10x-stat-tile__value">{item.value}</dd>
    {item.detail && <dd className="b10x-stat-tile__detail">{item.detail}</dd>}
  </div>)}</dl>;
}

/** The headline figures of a session document, computed rather than typed. */
export function SessionKpis({data, ...options}: {data: unknown} & SessionKpiOptions): ReactNode {
  const session = useSession(data);
  if ('error' in session) return <ChartError kind="session figures" message={session.error} />;
  return <StatTiles items={sessionKpis(session.document, options)} />;
}

// ---------------------------------------------------------------------------------------------
// Session timeline
// ---------------------------------------------------------------------------------------------

export interface SessionTimelineProps {
  data: unknown;
  title?: string;
  description?: ReactNode;
  /** Where decision spans and markers are drawn; defaults fit the reference document. */
  decisionLanes?: {question?: string; draft?: string; marks?: string};
  decisionProtocol?: string;
}

export function SessionTimeline({data, title = 'Who did what, when', description = 'One lane per participant. Colour is the protocol the work belonged to; hollow bars were built and then discarded.', decisionLanes = {}, decisionProtocol = 'design.decision'}: SessionTimelineProps): ReactNode {
  const session = useSession(data);
  const base = `b10x-tl-${useId().replaceAll(':', '')}`;
  const [tip, bind] = useTip();
  if ('error' in session) return <ChartError kind="session timeline" message={session.error} />;
  const document = session.document;
  const at = sessionClock(document);
  const start = Date.parse(document.window.start) / 1000;
  const end = Date.parse(document.window.end) / 1000;
  const W = 1200; const left = 196; const right = 18; const rowH = 30; const top = 10; const barH = 16;
  const H = top + document.lanes.length * rowH + 30;
  const x = (time: number): number => left + ((time - start) / (end - start)) * (W - left - right);
  const laneIndex = new Map(document.lanes.map((lane, index) => [lane.id, index]));
  const laneY = (lane: string): number => top + (laneIndex.get(lane) ?? 0) * rowH + (rowH - barH) / 2;
  const slot = new Map(document.protocols.map((protocol) => [protocol.id, protocol.slot]));
  const protocolLabel = new Map(document.protocols.map((protocol) => [protocol.id, protocol.label]));
  const marksLane = decisionLanes.marks ?? document.lanes.find((lane) => lane.principal?.startsWith('human:'))?.id ?? document.lanes[0]?.id;
  const questionLane = decisionLanes.question ?? 'design';
  const draftLane = decisionLanes.draft ?? 'orchestrator';
  const ticks: number[] = [];
  for (let time = Math.ceil(start / 1800) * 1800; time <= end; time += 1800) ticks.push(time);
  const steps = decisionSteps(document);

  const bars: ReactNode[] = [];
  const bar = (key: string, lane: string, from: number, to: number, protocol: string, tipTitle: string, lines: string[], flags: {discarded?: boolean; approximate?: boolean; open?: boolean} = {}): void => {
    if (!laneIndex.has(lane)) return;
    const x0 = x(from); const width = Math.max(3, x(to) - x0); const y = laneY(lane);
    const colour = series(slot.get(protocol));
    const shape = flags.discarded
      ? <rect x={f(x0 + 1)} y={f(y + 1)} width={f(Math.max(1, width - 2))} height={barH - 2} rx={4} className="b10x-timeline__bar b10x-timeline__bar--discarded" style={{stroke: colour, strokeDasharray: flags.approximate ? '4 3' : undefined}} />
      : flags.approximate
        ? <rect x={f(x0 + 1)} y={f(y + 1)} width={f(Math.max(1, width - 2))} height={barH - 2} rx={4} className="b10x-timeline__bar b10x-timeline__bar--approximate" style={{stroke: colour, fill: colour}} />
        : <rect x={f(x0)} y={f(y)} width={f(width)} height={barH} rx={4} className={['b10x-timeline__bar', flags.open && 'b10x-timeline__bar--open'].filter(Boolean).join(' ')} style={{fill: colour}} />;
    bars.push(<g key={key} className="b10x-chart-mark" tabIndex={0} aria-label={`${tipTitle}. ${lines.join('. ')}`} aria-describedby={tip?.title === tipTitle ? `${base}-tip` : undefined} {...bind({x: x0, y, width, height: barH, title: tipTitle, lines, key: colour})}>
      <rect className="b10x-chart-hit" x={f(x0 - 3)} y={f(y - 5)} width={f(width + 6)} height={barH + 10} />
      {shape}
    </g>);
  };
  document.episodes.forEach((episode, index) => {
    const from = at(episode.start); const to = at(episode.end);
    bar(`e${index}`, episode.lane, from, to, episode.protocol, episode.label, [
      protocolLabel.get(episode.protocol) ?? episode.protocol,
      `${episode.start}–${episode.end} UTC · ${formatDuration(to - from)}`,
      ...(episode.discarded ? ['Discarded'] : []), ...(episode.approximate ? ['Times approximate'] : []), ...(episode.open ? ['Still running'] : []),
    ], episode);
  });
  steps.forEach(({decision, questionToDecision, relayToDraft}) => {
    bar(`q${decision.n}`, questionLane, at(decision.question), at(decision.decided), decisionProtocol, `#${decision.n} ${decision.title}`, [`Question → decision · ${formatDuration(questionToDecision)}`, `${decision.question}–${decision.decided} UTC`]);
    bar(`d${decision.n}`, draftLane, at(decision.relayed), at(decision.drafted), decisionProtocol, `#${decision.n} draft ${decision.adr}`, [`Relay → draft arrived · ${formatDuration(relayToDraft)}`, `${decision.relayed}–${decision.drafted} UTC`]);
  });
  const markers: ReactNode[] = [];
  if (marksLane) {
    const cy = laneY(marksLane) + barH / 2;
    steps.forEach(({decision}) => {
      const cx = x(at(decision.decided));
      markers.push(<g key={`m${decision.n}`} className="b10x-chart-mark" tabIndex={0} aria-label={`Decision ${decision.n}: ${decision.title}, ${decision.decided} UTC`} {...bind({x: cx - 6, y: cy - 6, width: 12, height: 12, title: `Decision #${decision.n}: ${decision.title}`, lines: [`${decision.decided} UTC · ${decision.adr}`], key: series(slot.get(decisionProtocol))})}>
        <circle className="b10x-chart-hit" cx={f(cx)} cy={f(cy)} r={12} />
        <path d={`M${f(cx)} ${f(cy - 6)} L${f(cx + 6)} ${f(cy)} L${f(cx)} ${f(cy + 6)} L${f(cx - 6)} ${f(cy)} Z`} className="b10x-timeline__marker" style={{fill: series(slot.get(decisionProtocol))}} />
      </g>);
    });
    (document.operator_marks ?? []).forEach((mark, index) => {
      const cx = x(at(mark.t));
      markers.push(<g key={`a${index}`} className="b10x-chart-mark" tabIndex={0} aria-label={`Approval at ${mark.t} UTC: ${mark.label}`} {...bind({x: cx - 7, y: cy - 7, width: 14, height: 14, title: mark.kind === 'approval' ? 'Approval' : mark.kind, lines: [mark.label, `${mark.t} UTC`]})}>
        <circle className="b10x-chart-hit" cx={f(cx)} cy={f(cy)} r={12} />
        <path d={`M${f(cx)} ${f(cy - 7)} L${f(cx + 7)} ${f(cy + 6)} L${f(cx - 7)} ${f(cy + 6)} Z`} className="b10x-timeline__marker b10x-timeline__marker--approval" />
      </g>);
    });
  }

  return <figure className="b10x-chart b10x-timeline" aria-labelledby={`${base}-title`}>
    <ChartHeader id={`${base}-title`} title={title} description={description} />
    <ul className="b10x-chart__legend" aria-label="Legend">
      {document.protocols.map((protocol) => <li key={protocol.id}><span className="b10x-chart__swatch" style={{background: series(protocol.slot)}} aria-hidden="true" />{protocol.label}</li>)}
      <li><span className="b10x-chart__swatch b10x-chart__swatch--hollow" aria-hidden="true" />Discarded</li>
      {document.episodes.some((episode) => episode.approximate) && <li><span className="b10x-chart__swatch b10x-chart__swatch--dashed" aria-hidden="true" />Approximate time</li>}
      <li><span className="b10x-chart__glyph" aria-hidden="true">◆</span>Operator decision</li>
      {(document.operator_marks ?? []).length > 0 && <li><span className="b10x-chart__glyph" aria-hidden="true">▲</span>Operator approval</li>}
    </ul>
    <div className="b10x-chart__viewport">
      <div className="b10x-chart__canvas" style={{minWidth: '760px'}}>
        <svg viewBox={`0 0 ${W} ${H}`} className="b10x-chart__svg" role="group" aria-labelledby={`${base}-title`}>
          <g aria-hidden="true">
            {ticks.map((time) => <g key={time}><line x1={f(x(time))} x2={f(x(time))} y1={top - 4} y2={H - 24} className="b10x-chart__grid" /><text x={f(x(time))} y={H - 8} textAnchor={x(time) > W - right - 30 ? 'end' : 'middle'} className="b10x-chart__tick">{`${new Date(time * 1000).toISOString().slice(11, 16)} UTC`}</text></g>)}
            {document.lanes.map((lane, index) => <g key={lane.id}>
              <line x1={left} x2={W - right} y1={top + (index + 1) * rowH} y2={top + (index + 1) * rowH} className="b10x-chart__lane-rule" />
              <text x={left - 14} y={top + index * rowH + rowH / 2 + 4} textAnchor="end" className="b10x-chart__label">{lane.label}</text>
            </g>)}
          </g>
          <g>{bars}</g>
          <g>{markers}</g>
        </svg>
        {tip && <TipBox tip={tip} viewWidth={W} viewHeight={H} id={`${base}-tip`} />}
      </div>
    </div>
    <details className="b10x-chart__table">
      <summary>Table view</summary>
      <div className="b10x-table-wrap"><table>
        <thead><tr><th scope="col">Lane</th><th scope="col">Protocol</th><th scope="col">Episode</th><th scope="col">Start</th><th scope="col">End</th><th scope="col">Duration</th></tr></thead>
        <tbody>{document.episodes.map((episode, index) => <tr key={index}>
          <td>{document.lanes.find((lane) => lane.id === episode.lane)?.label}</td>
          <td>{protocolLabel.get(episode.protocol)}</td>
          <td>{episode.label}{episode.discarded ? ' (discarded)' : ''}{episode.approximate ? ' (approximate)' : ''}</td>
          <td>{episode.start}</td><td>{episode.end}</td><td>{formatDuration(at(episode.end) - at(episode.start))}</td>
        </tr>)}</tbody>
      </table></div>
    </details>
  </figure>;
}

// ---------------------------------------------------------------------------------------------
// Step bars
// ---------------------------------------------------------------------------------------------

export interface StepBarsRow {label: string; values: number[]}
export interface StepBarsPart {label: string; slot: number}

export interface StepBarsProps {
  /** A session document; its decisions become the rows. */
  data?: unknown;
  /** Or explicit rows of durations in seconds, one value per part. */
  rows?: readonly StepBarsRow[];
  parts?: readonly StepBarsPart[];
  title?: string;
  description?: ReactNode;
}

const DECISION_PARTS: StepBarsPart[] = [{label: 'Question → decision', slot: 1}, {label: 'Decision → relay', slot: 2}, {label: 'Relay → draft arrived', slot: 3}];

export function StepBars({data, rows, parts, title = 'Step by step', description}: StepBarsProps): ReactNode {
  const base = `b10x-sb-${useId().replaceAll(':', '')}`;
  const [tip, bind] = useTip();
  const session = useSession(data ?? null);
  let resolvedRows: readonly StepBarsRow[];
  let resolvedParts: readonly StepBarsPart[];
  if (rows && parts) {
    resolvedRows = rows;
    resolvedParts = parts;
  } else if ('document' in session) {
    resolvedRows = decisionSteps(session.document).map((step) => ({label: `#${step.decision.n} ${step.decision.title}`, values: [step.questionToDecision, step.decisionToRelay, step.relayToDraft]}));
    resolvedParts = DECISION_PARTS;
  } else return <ChartError kind="step bars" message={'error' in session ? session.error : 'StepBars needs data, or rows and parts'} />;
  const W = 1200; const left = 270; const right = 90; const rowH = 28; const top = 6; const barH = 16;
  const H = top + resolvedRows.length * rowH + 30;
  const max = Math.max(1, ...resolvedRows.map((row) => row.values.reduce((sum, value) => sum + value, 0)));
  const step = [60, 120, 300, 600, 900, 1800, 3600, 7200].find((candidate) => max / candidate <= 6) ?? 7200;
  const limit = Math.ceil(max / step) * step;
  const x = (seconds: number): number => left + (seconds / limit) * (W - left - right);
  const ticks: number[] = [];
  for (let value = 0; value <= limit; value += step) ticks.push(value);

  return <figure className="b10x-chart b10x-step-bars" aria-labelledby={`${base}-title`}>
    <ChartHeader id={`${base}-title`} title={title} description={description} />
    <ul className="b10x-chart__legend" aria-label="Legend">{resolvedParts.map((part) => <li key={part.label}><span className="b10x-chart__swatch" style={{background: series(part.slot)}} aria-hidden="true" />{part.label}</li>)}</ul>
    <div className="b10x-chart__viewport">
      <div className="b10x-chart__canvas" style={{minWidth: '720px'}}>
        <svg viewBox={`0 0 ${W} ${H}`} className="b10x-chart__svg" role="group" aria-labelledby={`${base}-title`}>
          <g aria-hidden="true">{ticks.map((value) => <g key={value}><line x1={f(x(value))} x2={f(x(value))} y1={top} y2={H - 24} className={value ? 'b10x-chart__grid' : 'b10x-chart__axis'} /><text x={f(x(value))} y={H - 8} textAnchor="middle" className="b10x-chart__tick">{`${value / 60} min`}</text></g>)}</g>
          {resolvedRows.map((row, index) => {
            const y = top + index * rowH + (rowH - barH) / 2;
            let accumulated = 0;
            const total = row.values.reduce((sum, value) => sum + value, 0);
            const visible = row.values.map((value, part) => ({value, part})).filter((entry) => entry.value > 0);
            return <g key={row.label}>
              <text x={left - 12} y={f(y + barH / 2 + 4)} textAnchor="end" className="b10x-chart__label">{row.label}</text>
              {row.values.map((value, part) => {
                const from = accumulated;
                accumulated += value;
                if (value <= 0) return null;
                const isLast = visible[visible.length - 1]?.part === part;
                const x0 = x(from) + (from > 0 ? 1 : 0);
                const width = Math.max(2, x(from + value) - x(from) - (from > 0 ? 1 : 0) - (isLast ? 0 : 1));
                const colour = series(resolvedParts[part]?.slot);
                const label = `${row.label}. ${resolvedParts[part]?.label}: ${formatDuration(value)}`;
                return <g key={part} className="b10x-chart-mark" tabIndex={0} aria-label={label} {...bind({x: x0, y, width, height: barH, title: row.label, lines: [`${resolvedParts[part]?.label}: ${formatDuration(value)}`], key: colour})}>
                  <rect className="b10x-chart-hit" x={f(x0 - 1)} y={f(y - 5)} width={f(width + 2)} height={barH + 10} />
                  <path d={isLast ? roundedEnd(x0, y, width, barH, 4) : `M${f(x0)},${f(y)} h${f(width)} v${barH} h${f(-width)} Z`} style={{fill: colour}} className="b10x-step-bars__segment" />
                </g>;
              })}
              <text x={f(x(total) + 8)} y={f(y + barH / 2 + 4)} className="b10x-chart__value">{formatDuration(total)}</text>
            </g>;
          })}
        </svg>
        {tip && <TipBox tip={tip} viewWidth={W} viewHeight={H} id={`${base}-tip`} />}
      </div>
    </div>
    <details className="b10x-chart__table">
      <summary>Table view</summary>
      <div className="b10x-table-wrap"><table>
        <thead><tr><th scope="col">Item</th>{resolvedParts.map((part) => <th scope="col" key={part.label}>{part.label}</th>)}<th scope="col">Total</th></tr></thead>
        <tbody>{resolvedRows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{row.values.map((value, index) => <td key={index}>{formatDuration(value)}</td>)}<td>{formatDuration(row.values.reduce((sum, value) => sum + value, 0))}</td></tr>)}</tbody>
      </table></div>
    </details>
  </figure>;
}

function roundedEnd(x: number, y: number, width: number, height: number, radius: number): string {
  const r = Math.min(radius, width / 2, height / 2);
  return `M${f(x)},${f(y)} H${f(x + width - r)} Q${f(x + width)},${f(y)} ${f(x + width)},${f(y + r)} V${f(y + height - r)} Q${f(x + width)},${f(y + height)} ${f(x + width - r)},${f(y + height)} H${f(x)} Z`;
}

// ---------------------------------------------------------------------------------------------
// Composition graph
// ---------------------------------------------------------------------------------------------

export interface CompositionGraphProps {
  /** A session document (its `graph`), or the graph object itself. */
  data: unknown;
  title?: string;
  description?: ReactNode;
}

export function CompositionGraph({data, title = 'The composition behind it', description}: CompositionGraphProps): ReactNode {
  const base = `b10x-cg-${useId().replaceAll(':', '')}`;
  const [hovered, setHovered] = useState<string | null>(null);
  const prepared = useMemo(() => {
    try {
      const graph = (data as {graph?: CompositionGraphData})?.graph ?? data as CompositionGraphData;
      if (!graph || !Array.isArray(graph.columns) || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) throw new Error('CompositionGraph needs columns, nodes and edges');
      const known = new Set(graph.nodes.map((node) => node.id));
      for (const [from, to] of graph.edges) if (!known.has(from) || !known.has(to)) throw new Error(`edge ${from} -> ${to} references an unknown node`);
      const layout = layeredLayout(graph.nodes.map((node) => ({id: node.id, layer: node.col, width: 188, height: 46})), graph.edges.map(([from, to]) => ({from, to})), {layerGap: 44, nodeGap: 14, portSpread: 0.5});
      return {graph, layout};
    } catch (error) {
      return {error: error instanceof Error ? error.message : String(error)};
    }
  }, [data]);
  if ('error' in prepared) return <ChartError kind="composition graph" message={prepared.error!} />;
  const {graph, layout} = prepared;
  const header = 34;
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const linked = hovered ? new Set([hovered, ...graph.edges.filter(([from, to]) => from === hovered || to === hovered).flat()]) : null;
  const subtitle = (node: CompositionGraphData['nodes'][number]): string => node.detail ?? node.policy ?? (node.observed !== undefined ? (node.observed ? `${node.observed} case${node.observed === 1 ? '' : 's'} observed` : 'not observed') : '');
  const current = layout.nodes.find((node) => node.id === hovered);
  const currentNode = hovered ? byId.get(hovered) : undefined;
  const W = layout.width; const H = layout.height + header;

  return <figure className="b10x-chart b10x-composition" aria-labelledby={`${base}-title`}>
    <ChartHeader id={`${base}-title`} title={title} description={description} />
    <div className="b10x-chart__viewport">
      <div className="b10x-chart__canvas" style={{minWidth: `${Math.round(W * 0.78)}px`, maxWidth: `${Math.ceil(W)}px`}}>
        <svg viewBox={`-2 -2 ${f(W + 4)} ${f(H + 4)}`} className="b10x-chart__svg" role="group" aria-labelledby={`${base}-title`}>
          <g aria-hidden="true">{layout.columns.map((column) => <text key={column.index} x={f(column.x + column.width / 2)} y={14} textAnchor="middle" className="b10x-chart__column">{(graph.columns[column.index] ?? '').toUpperCase()}</text>)}</g>
          <g transform={`translate(0,${header})`}>
            <g aria-hidden="true">{layout.edges.map((edge) => {
              const lit = linked !== null && (edge.from === hovered || edge.to === hovered);
              return <path key={edge.index} d={edge.path} className={['b10x-chart__edge', lit && 'is-lit', linked !== null && !lit && 'is-dimmed'].filter(Boolean).join(' ')} />;
            })}</g>
            {layout.nodes.map((placed) => {
              const node = byId.get(placed.id)!;
              const sub = subtitle(node);
              const isProtocol = node.observed !== undefined || node.slot !== undefined;
              const room = Math.floor((placed.width - (isProtocol ? 62 : 26)) / 6.1);
              return <g
                key={node.id}
                transform={`translate(${f(placed.x)},${f(placed.y)})`}
                className={['b10x-chart-node', linked !== null && !linked.has(node.id) && 'is-dimmed', hovered === node.id && 'is-current'].filter(Boolean).join(' ')}
                tabIndex={0}
                aria-label={`${graph.columns[node.col]}: ${node.label}${sub ? `, ${sub}` : ''}`}
                aria-describedby={hovered === node.id ? `${base}-tip` : undefined}
                onPointerEnter={() => setHovered(node.id)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(node.id)}
                onBlur={() => setHovered(null)}
              >
                <rect className="b10x-chart-node__body" width={placed.width} height={placed.height} rx={8} />
                {isProtocol && <rect x={0} y={9} width={3} height={placed.height - 18} rx={1.5} style={{fill: series(node.slot)}} />}
                <text x={isProtocol ? 14 : 12} y={19} className="b10x-chart-node__label">{node.label.length > room + 4 ? `${node.label.slice(0, room + 3)}…` : node.label}</text>
                {sub && <text x={isProtocol ? 14 : 12} y={35} className="b10x-chart-node__sub">{sub.length > room ? `${sub.slice(0, room - 1)}…` : sub}</text>}
                {isProtocol && node.observed ? <g transform={`translate(${placed.width - 44},13)`}><rect width={34} height={20} rx={10} className="b10x-chart-node__badge" /><text x={17} y={14} textAnchor="middle" className="b10x-chart-node__count">{`×${node.observed}`}</text></g> : null}
              </g>;
            })}
          </g>
        </svg>
        {current && currentNode && <TipBox id={`${base}-tip`} viewWidth={W + 4} viewHeight={H + 4} tip={{x: current.x, y: current.y + header, width: current.width, height: current.height, title: currentNode.label, lines: [graph.columns[currentNode.col] ?? '', ...(subtitle(currentNode) ? [subtitle(currentNode)] : []), ...(currentNode.policy && currentNode.detail ? [currentNode.policy] : [])], key: currentNode.slot !== undefined ? series(currentNode.slot) : undefined}} />}
      </div>
    </div>
    <details className="b10x-chart__table">
      <summary>Table view</summary>
      <div className="b10x-table-wrap"><table>
        <thead><tr><th scope="col">Column</th><th scope="col">Node</th><th scope="col">Detail</th><th scope="col">Leads to</th></tr></thead>
        <tbody>{graph.nodes.map((node) => <tr key={node.id}><td>{graph.columns[node.col]}</td><th scope="row">{node.label}</th><td>{subtitle(node) || '—'}</td><td>{graph.edges.filter(([from]) => from === node.id).map(([, to]) => byId.get(to)?.label).join(', ') || '—'}</td></tr>)}</tbody>
      </table></div>
    </details>
  </figure>;
}

// ---------------------------------------------------------------------------------------------

function ChartHeader({id, title, description}: {id: string; title: string; description?: ReactNode}): ReactNode {
  return <header className="b10x-chart__header"><strong id={id} className="b10x-chart__title">{title}</strong>{description && <p className="b10x-chart__description">{description}</p>}</header>;
}

function ChartError({kind, message}: {kind: string; message: string}): ReactNode {
  return <aside className="b10x-callout b10x-callout--danger" role="alert"><p className="b10x-callout__title b10x-eyebrow">Cannot render {kind}</p><div className="b10x-callout__content"><p><code>{message}</code></p></div></aside>;
}

function pct(value: number, total: number): string {
  return `${Math.round((value / total) * 10000) / 100}%`;
}

function f(value: number): string {
  return String(Math.round(value * 10) / 10);
}
