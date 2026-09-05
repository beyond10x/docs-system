import {createContext, useContext, useEffect, useId, useRef, useState} from 'react';
import type {ComponentPropsWithoutRef, CSSProperties, InputHTMLAttributes, ReactNode} from 'react';
import CodeBlock from '@theme/CodeBlock';
import Mermaid from '@theme/Mermaid';
import {describeMarkdownFenceLanguage} from './code.js';
import {deriveEcosystemNavigation, surfaceNavigation} from './navigation.js';
import type {AdoptionAction, AnyDocumentationSurface, ChangeLedgerEntry, EcosystemRegistry, Journey, Maturity, RegistrySurface} from './types.js';

export type HeadingLevel = 1 | 2 | 3 | 4;

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  headingLevel?: 1 | 2;
}

export function PageHeader({title, description, eyebrow, actions, children, headingLevel = 1}: PageHeaderProps): ReactNode {
  const Heading = headingTag(headingLevel);
  return <header className="b10x-page-header">
    <div className="b10x-page-header__copy">
      {eyebrow && <p className="b10x-eyebrow">{eyebrow}</p>}
      <Heading>{title}</Heading>
      {description && <div className="b10x-page-header__description">{description}</div>}
      {children && <div className="b10x-page-header__meta">{children}</div>}
    </div>
    {actions && <div className="b10x-page-header__actions">{actions}</div>}
  </header>;
}

export interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  id?: string;
}

export function SectionHeader({title, description, eyebrow, action, headingLevel = 2, id}: SectionHeaderProps): ReactNode {
  const Heading = headingTag(headingLevel);
  return <header className="b10x-section-header">
    <div>
      {eyebrow && <p className="b10x-eyebrow">{eyebrow}</p>}
      <Heading id={id}>{title}</Heading>
      {description && <div className="b10x-section-header__description">{description}</div>}
    </div>
    {action && <div className="b10x-section-header__action">{action}</div>}
  </header>;
}

export interface FactGridItem {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  url?: string;
}

export interface FactGridProps {
  items: readonly FactGridItem[];
  label?: string;
}

export function FactGrid({items, label = 'Key facts'}: FactGridProps): ReactNode {
  return <dl className="b10x-fact-grid" aria-label={label}>{items.map((item, index) => <div key={index}>
    <dt>{item.label}</dt>
    <dd>{item.url ? <a href={item.url}>{item.value}</a> : item.value}</dd>
    {item.detail && <dd className="b10x-fact-grid__detail">{item.detail}</dd>}
  </div>)}</dl>;
}

export type CalloutTone = 'note' | 'success' | 'warning' | 'danger';

export interface CalloutProps {
  children: ReactNode;
  title?: ReactNode;
  tone?: CalloutTone;
  className?: string;
}

const calloutTitles: Record<CalloutTone, string> = {note: 'Note', success: 'Ready', warning: 'Attention', danger: 'Important'};

export function Callout({children, title, tone = 'note', className}: CalloutProps): ReactNode {
  return <aside className={['b10x-callout', `b10x-callout--${tone}`, className].filter(Boolean).join(' ')}>
    <p className="b10x-callout__title b10x-eyebrow">{title ?? calloutTitles[tone]}</p>
    <div className="b10x-callout__content">{children}</div>
  </aside>;
}

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  hint?: ReactNode;
  containerClassName?: string;
}

export function SearchField({label = 'Search', hint, containerClassName, id, ...input}: SearchFieldProps): ReactNode {
  const generatedId = useId().replaceAll(':', '');
  const inputId = id ?? `b10x-search-${generatedId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  return <div className={['b10x-search-field', containerClassName].filter(Boolean).join(' ')}>
    <label htmlFor={inputId}>{label}</label>
    <div><span aria-hidden="true">⌕</span><input {...input} id={inputId} type="search" aria-describedby={joinIds(input['aria-describedby'], hintId)} /></div>
    {hint && <small id={hintId}>{hint}</small>}
  </div>;
}

export interface FilterChipOption {
  value: string;
  label: ReactNode;
  count?: number;
  disabled?: boolean;
}

export interface FilterChipGroupProps {
  label: string;
  options: readonly FilterChipOption[];
  selected: readonly string[];
  onToggle?: (value: string, selected: boolean) => void;
}

export function FilterChipGroup({label, options, selected, onToggle}: FilterChipGroupProps): ReactNode {
  const active = new Set(selected);
  return <fieldset className="b10x-filter-chips">
    <legend>{label}</legend>
    <div>{options.map((option) => {
      const isSelected = active.has(option.value);
      return <button key={option.value} type="button" aria-pressed={isSelected} disabled={option.disabled} onClick={() => onToggle?.(option.value, !isSelected)}>
        <span>{option.label}</span>{option.count !== undefined && <small>{option.count}</small>}
      </button>;
    })}</div>
  </fieldset>;
}

export interface CardGridProps {
  children: ReactNode;
  columns?: 'auto' | 2 | 3 | 4;
  label?: string;
}

export function CardGrid({children, columns = 'auto', label}: CardGridProps): ReactNode {
  return <section className={`b10x-card-grid b10x-card-grid--${columns}`} aria-label={label}>{children}</section>;
}

export interface ContentCardProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  titleUrl?: string;
  actionUrl?: string;
  actionLabel?: ReactNode;
  accent?: string;
  headingLevel?: 2 | 3 | 4;
}

export function ContentCard({title, description, eyebrow, meta, children, footer, titleUrl, actionUrl, actionLabel = 'Learn more', accent, headingLevel = 3}: ContentCardProps): ReactNode {
  const Heading = headingTag(headingLevel);
  const style = accent ? {'--b10x-project-accent': accent} as CSSProperties : undefined;
  return <article className="b10x-content-card" style={style}>
    {(eyebrow || meta) && <header>{eyebrow && <span className="b10x-eyebrow">{eyebrow}</span>}{meta && <span>{meta}</span>}</header>}
    <Heading>{titleUrl ? <a href={titleUrl}>{title}</a> : title}</Heading>
    {description && <div className="b10x-content-card__description">{description}</div>}
    {children && <div className="b10x-content-card__body">{children}</div>}
    {(footer || actionUrl) && <footer>{footer}{actionUrl && <a className="b10x-card-action" href={actionUrl}>{actionLabel} <span aria-hidden="true">→</span></a>}</footer>}
  </article>;
}

export function StatusBadge({maturity, children}: {maturity: Maturity; children?: ReactNode}): ReactNode {
  return <span className={`b10x-status b10x-status--${maturity}`}>{children ?? maturity}</span>;
}

export function BoundaryNotice({title = 'Current boundary', children}: {title?: string; children: ReactNode}): ReactNode {
  return <Callout className="b10x-boundary" title={title} tone="warning">{children}</Callout>;
}

export function CodeExample({language, title, children}: {language: string; title?: string; children: string}): ReactNode {
  const presentation = describeMarkdownFenceLanguage(language);
  return <div className="b10x-code" data-b10x-code-language={presentation.language} data-b10x-code-kind={presentation.kind} data-b10x-code-label={presentation.label}>
    <CodeBlock language={presentation.language} title={title} showLineNumbers>{children.trimEnd()}</CodeBlock>
  </div>;
}

export function CommandExample({command, output, title}: {command: string; output?: string; title?: string}): ReactNode {
  const presentation = describeMarkdownFenceLanguage('shell-session');
  return <div className="b10x-command" data-b10x-code-language={presentation.language} data-b10x-code-kind={presentation.kind} data-b10x-code-label={presentation.label}>
    <CodeBlock language={presentation.language} title={title ?? presentation.label}>{`$ ${command.trim()}${output ? `\n${output.trimEnd()}` : ''}`}</CodeBlock>
  </div>;
}

export function CodeTabs({items}: {items: Array<{label: string; language: string; code: string}>}): ReactNode {
  return <div className="b10x-code-tabs">{items.map((item) => <details key={item.label} open={items[0] === item}><summary>{item.label}</summary><CodeExample language={item.language}>{item.code}</CodeExample></details>)}</div>;
}

export interface DataCatalogItem {
  id: string;
  name: string;
  summary?: string;
  kind?: string;
  url?: string;
}

export function DataCatalog({items, title = 'Data catalog'}: {items: DataCatalogItem[]; title?: string}): ReactNode {
  return <section className="b10x-data-catalog" aria-label={title}>{items.map((item) => <article key={item.id}><header>{item.kind && <span>{item.kind}</span>}<code>{item.id}</code></header><h3>{item.url ? <a href={item.url}>{item.name}</a> : item.name}</h3>{item.summary && <p>{item.summary}</p>}</article>)}</section>;
}

export interface DependencyGraphNode {id: string; label: string}
export interface DependencyGraphEdge {from: string; to: string; label?: string}

export interface DiagramAlternative {
  /** Optional prose for relationships that do not fit a node/edge model. */
  content?: ReactNode;
  nodes?: readonly DependencyGraphNode[];
  edges?: readonly DependencyGraphEdge[];
  label?: string;
}

export interface DiagramFrameProps {
  children: ReactNode;
  title: string;
  description: string;
  download?: string;
  /** Minimum visual canvas width inside the keyboard-scrollable viewport. */
  minWidth?: number | string;
  /** Initial pan position after the visual renderer has measured its canvas. */
  initialPosition?: 'center' | 'start';
  /** Complete prose or node/edge representation offered alongside the visual. */
  alternative?: DiagramAlternative;
}

export interface DiagramProps extends Omit<DiagramFrameProps, 'children'> {
  kind: 'mermaid' | 'svg';
  source?: string;
  src?: string;
}

const DiagramFrameContext = createContext(false);

export function DependencyGraph({nodes, edges, title = 'Dependencies', description = 'Declared dependencies between components.', minWidth}: {nodes: DependencyGraphNode[]; edges: DependencyGraphEdge[]; title?: string; description?: string; minWidth?: number | string}): ReactNode {
  validateDiagramNodes(nodes, 'dependency graph');
  const identifiers = new Map(nodes.map((node, index) => [node.id, `n${index}`]));
  const lines = ['flowchart LR', ...nodes.map((node) => `  ${identifiers.get(node.id)}["${mermaidLabel(node.label)}"]`)];
  for (const edge of edges) {
    const from = identifiers.get(edge.from);
    const to = identifiers.get(edge.to);
    if (!from || !to) throw new Error(`dependency edge ${edge.from} -> ${edge.to} references an unknown node`);
    lines.push(`  ${from} -->${edge.label ? `|"${mermaidLabel(edge.label)}"|` : ''} ${to}`);
  }
  return <Diagram kind="mermaid" source={lines.join('\n')} title={title} description={description} minWidth={minWidth} alternative={{nodes, edges}} />;
}

export function Diagram({kind, source, src, title, description, download, minWidth = '48rem', initialPosition = 'center', alternative}: DiagramProps): ReactNode {
  if (kind === 'mermaid' && !source) throw new Error('a Mermaid diagram requires source');
  if (kind === 'svg' && !src) throw new Error('an SVG diagram requires src');
  return <DiagramFrame key={source ?? src} title={title} description={description} download={download} minWidth={minWidth} initialPosition={initialPosition} alternative={alternative}>
    <div role="img" aria-label={description}>
      <div aria-hidden="true">{kind === 'mermaid' ? <Mermaid value={source!} /> : <img src={src} alt="" loading="lazy" />}</div>
    </div>
  </DiagramFrame>;
}

/** Frame already-rendered content without invoking a diagram renderer or nesting viewports. */
export function DiagramFrame(props: DiagramFrameProps): ReactNode {
  const framed = useContext(DiagramFrameContext);
  return framed ? props.children : <DiagramViewport {...props} />;
}

function DiagramViewport({children, title, description, download, minWidth = 0, initialPosition = 'start', alternative}: DiagramFrameProps): ReactNode {
  validateDiagramAlternative(alternative);
  const componentId = useId().replaceAll(':', '');
  const titleId = `b10x-diagram-${componentId}-title`;
  const descriptionId = `b10x-diagram-${componentId}-description`;
  const instructionsId = `b10x-diagram-${componentId}-instructions`;
  const alternativeId = `b10x-diagram-${componentId}-alternative`;
  const minimum = typeof minWidth === 'number' ? `${minWidth}px` : minWidth;
  const style = {'--b10x-diagram-min-width': minimum} as CSSProperties;
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const canvas = element.querySelector<HTMLElement>('.b10x-diagram__canvas')!;
    let animationFrame = 0;
    let positioned = false;
    let mutationObserver: MutationObserver | undefined;
    let resizeObserver: ResizeObserver | undefined;
    const position = (): void => {
      animationFrame = 0;
      const visual = element.querySelector('svg, img');
      if (!visual || visual.getBoundingClientRect().width === 0 || visual.getBoundingClientRect().height === 0) return;
      const width = visual instanceof SVGSVGElement ? visual.viewBox.baseVal.width : (visual as HTMLImageElement).naturalWidth;
      if (Number.isFinite(width) && width > 0) {
        const intrinsic = `${width}px`;
        if (canvas.style.getPropertyValue('--b10x-diagram-intrinsic-width') !== intrinsic) {
          canvas.style.setProperty('--b10x-diagram-intrinsic-width', intrinsic);
        }
      }
      if (positioned) return;
      element.scrollLeft = initialPosition === 'center' ? Math.max(0, (element.scrollWidth - element.clientWidth) / 2) : 0;
      element.scrollTop = initialPosition === 'center' ? Math.max(0, (element.scrollHeight - element.clientHeight) / 2) : 0;
      positioned = true;
    };
    const schedule = (): void => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = window.requestAnimationFrame(position);
      });
    };
    mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(element, {attributes: true, childList: true, subtree: true});
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(schedule);
      resizeObserver.observe(element);
      resizeObserver.observe(canvas);
    }
    const image = element.querySelector('img');
    image?.addEventListener('load', schedule, {once: true});
    schedule();
    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      image?.removeEventListener('load', schedule);
    };
  }, [initialPosition, minimum]);
  return <DiagramFrameContext.Provider value={true}><figure className="b10x-diagram" aria-labelledby={titleId}>
    <div
      ref={viewport}
      className="b10x-diagram__viewport"
      style={style}
      tabIndex={0}
      role="region"
      aria-labelledby={titleId}
      aria-describedby={`${descriptionId} ${instructionsId}`}
      aria-details={alternative ? alternativeId : undefined}
    >
      <div className="b10x-diagram__canvas"><div>{children}</div></div>
    </div>
    <p className="b10x-diagram__guidance" id={instructionsId} data-pagefind-ignore><span aria-hidden="true">↔</span><span><strong>Pan the full-size diagram:</strong> swipe or scroll, or focus the canvas and use the arrow keys.</span></p>
    <figcaption><strong id={titleId}>{title}</strong><span id={descriptionId}>{description}</span>{download && <a className="b10x-touch-link" href={download} download>Download source</a>}</figcaption>
    {alternative && <DiagramTextAlternative alternative={alternative} id={alternativeId} />}
  </figure></DiagramFrameContext.Provider>;
}

export interface ScrollableTableProps extends ComponentPropsWithoutRef<'table'> {
  label?: string;
}

/** Keep native table semantics while making overflowing columns reachable without page scrolling. */
export function ScrollableTable({children, label = 'Table', ...props}: ScrollableTableProps): ReactNode {
  const viewport = useRef<HTMLDivElement>(null);
  const instructionsId = `b10x-table-${useId().replaceAll(':', '')}-instructions`;
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const measure = (): void => setOverflow(element.scrollWidth > element.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    observer.observe(element.querySelector('table')!);
    return () => observer.disconnect();
  }, []);
  return <>
    <div ref={viewport} className="b10x-table-wrap" tabIndex={overflow ? 0 : undefined} role={overflow ? 'region' : undefined} aria-label={overflow ? label : undefined} aria-describedby={overflow ? instructionsId : undefined}>
      <table {...props}>{children}</table>
    </div>
    <p className="b10x-table-guidance" id={instructionsId} hidden={!overflow} data-pagefind-ignore>More columns: swipe horizontally, or focus the table and use the arrow keys.</p>
  </>;
}

export interface ProjectCardProps {
  surface: AnyDocumentationSurface;
  headingLevel?: 2 | 3 | 4;
  title?: ReactNode;
  titleUrl?: string;
  actionUrl?: string;
  actionLabel?: ReactNode;
}

export function ProjectCard({surface, headingLevel = 3, title = surface.name, titleUrl = surface.canonicalUrl, actionUrl, actionLabel}: ProjectCardProps): ReactNode {
  const action = declaredAdoption(surface) ?? fallbackAdoption(surface);
  const Heading = headingTag(headingLevel);
  return <article className="b10x-project-card" style={{'--b10x-project-accent': surface.accent} as CSSProperties}><div><StatusBadge maturity={surface.maturity} /><span>{surface.kind}</span></div><Heading><a href={titleUrl}>{title}</a></Heading><p>{surface.summary}</p><ul>{surface.capabilities.map((capability) => <li key={capability}>{capability.replaceAll('-', ' ')}</li>)}</ul><a className="b10x-adoption-link" href={actionUrl ?? action.url}>{actionLabel ?? action.label} <span aria-hidden="true">→</span></a></article>;
}

export interface AdoptionCardProps {
  surface: AnyDocumentationSurface;
  journey?: Journey;
  headingLevel?: 2 | 3 | 4;
  title?: ReactNode;
  titleUrl?: string;
  actionUrl?: string;
  actionLabel?: ReactNode;
}

export function AdoptionCard({surface, journey, headingLevel = 3, title = surface.name, titleUrl, actionUrl, actionLabel}: AdoptionCardProps): ReactNode {
  const action = declaredAdoption(surface) ?? fallbackAdoption(surface);
  const Heading = headingTag(headingLevel);
  return <article className="b10x-adoption-card" style={{'--b10x-project-accent': surface.accent} as CSSProperties}>
    <header><StatusBadge maturity={surface.maturity} />{journey && <span>{journey.replaceAll('-', ' ')}</span>}</header>
    <Heading>{titleUrl ? <a href={titleUrl}>{title}</a> : title}</Heading><p>{action.outcome}</p>
    <dl><div><dt>Path</dt><dd>{action.mode.replaceAll('-', ' ')}</dd></div><div><dt>Time</dt><dd>about {action.estimatedMinutes} min</dd></div></dl>
    {action.prerequisites?.length ? <p><strong>Needs:</strong> {action.prerequisites.join(', ')}</p> : null}
    <a href={actionUrl ?? action.url}>{actionLabel ?? action.label} <span aria-hidden="true">→</span></a>
  </article>;
}

export function ChangeTimelineEntry({change, surfaces}: {change: ChangeLedgerEntry; surfaces?: Map<string, AnyDocumentationSurface>}): ReactNode {
  return <article className={`b10x-change b10x-change--${change.impact}`} id={change.key.replaceAll('/', '-')}>
    <header><time dateTime={change.publishedAt}>{new Date(change.publishedAt).toLocaleDateString('en', {dateStyle: 'medium', timeZone: 'UTC'})}</time><span>{change.repository}</span><span>{change.kind}</span><strong>{change.impact.replaceAll('-', ' ')}</strong></header>
    <h2><a href={change.source.url}>{change.title}</a></h2><p>{change.summary}</p>
    <ul aria-label="Affected public surfaces">{change.affectedSurfaces.map((key) => <li key={key}><a href={surfaces?.get(key)?.canonicalUrl}>{surfaces?.get(key)?.name ?? key}</a></li>)}</ul>
    {change.relations?.length ? <dl className="b10x-change-relations">{change.relations.map((relation) => <div key={`${relation.kind}-${relation.target}`}><dt>{relation.kind.replaceAll('-', ' ')}</dt><dd>{relation.label ?? relation.target.replace(/^(surface|change):/, '')}</dd></div>)}</dl> : null}
    {change.action && <a className="b10x-change-action" href={change.action.url}>{change.action.label} <span aria-hidden="true">→</span></a>}
  </article>;
}

export interface EcosystemSwitcherProps {
  registry: EcosystemRegistry;
  current?: string;
  familyOrder?: readonly string[];
  startUrl?: string;
  allProjectsUrl?: string;
}

export function EcosystemSwitcher({registry, current, familyOrder, startUrl = 'https://beyond10x.github.io/', allProjectsUrl = 'https://beyond10x.github.io/ecosystem/'}: EcosystemSwitcherProps): ReactNode {
  const navigation = deriveEcosystemNavigation(registry, {familyOrder});
  return <nav className="b10x-switcher" aria-label="beyond10x ecosystem">
    {navigation.frontDoors.length ? navigation.frontDoors.map((surface) => <a className="b10x-switcher__start" aria-current={surface.key === current ? 'page' : undefined} key={surface.key} href={surface.canonicalUrl}>{surfaceNavigation(surface)?.label ?? surface.name}</a>) : <a className="b10x-switcher__start" href={startUrl}>Start</a>}
    {navigation.families.map((family) => <details key={family.name}><summary>{family.name}</summary>{family.surfaces.map((surface) => <a aria-current={surface.key === current ? 'page' : undefined} key={surface.key} href={surface.canonicalUrl}>{surfaceNavigation(surface)?.label ?? surface.name}<small>{surface.summary}</small></a>)}</details>)}
    <a href={allProjectsUrl}>All projects</a>
  </nav>;
}

export interface EcosystemFamilyGatewayOptions {
  current?: string;
  /** Shell-owned family sequence; membership still comes from source.navigation.group. */
  familyOrder?: readonly string[];
  title?: string;
  description?: string;
  headingLevel?: 2 | 3;
}

export type EcosystemFamilyGatewayProps = EcosystemFamilyGatewayOptions & (
  | {registry: EcosystemRegistry; surfaces?: never}
  | {registry?: never; surfaces: readonly RegistrySurface[]}
);

export function EcosystemFamilyGateway({
  registry,
  surfaces,
  current,
  familyOrder,
  title = 'Explore the ecosystem',
  description = 'Choose a family, then follow the project path that matches your work.',
  headingLevel = 2,
}: EcosystemFamilyGatewayProps): ReactNode {
  const available = surfaces ?? registry?.surfaces;
  if (!available) throw new Error('EcosystemFamilyGateway requires registry or surfaces');
  const navigation = deriveEcosystemNavigation(available, {familyOrder});
  const componentId = useId().replaceAll(':', '');
  const titleId = `b10x-family-gateway-${componentId}-title`;
  const TitleHeading = headingLevel === 2 ? 'h2' : 'h3';
  const FamilyHeading = headingLevel === 2 ? 'h3' : 'h4';
  return <section className="b10x-family-gateway" aria-labelledby={titleId}>
    <header className="b10x-family-gateway__header"><p className="b10x-eyebrow">Ecosystem</p><TitleHeading id={titleId}>{title}</TitleHeading><p>{description}</p></header>
    {navigation.frontDoors.length > 0 && <nav className="b10x-family-gateway__start" aria-label="Start here">{navigation.frontDoors.map((surface) => <a aria-current={surface.key === current ? 'page' : undefined} key={surface.key} href={surface.canonicalUrl}><span><strong>{surfaceNavigation(surface)?.label ?? surface.name}</strong><small>{surface.summary}</small></span><span aria-hidden="true">→</span></a>)}</nav>}
    <div className="b10x-family-gateway__families">{navigation.families.map((family, index) => {
      const familyId = `b10x-family-gateway-${componentId}-${slugId(family.name)}-${index}`;
      return <section className="b10x-family-card" aria-labelledby={familyId} key={family.name}>
        <header><FamilyHeading id={familyId}>{family.name}</FamilyHeading><span>{family.surfaces.length} {family.surfaces.length === 1 ? 'project' : 'projects'}</span></header>
        <ul>{family.surfaces.map((surface) => <li key={surface.key}><a aria-current={surface.key === current ? 'page' : undefined} href={surface.canonicalUrl}><span><strong>{surfaceNavigation(surface)?.label ?? surface.name}</strong><small>{surface.summary}</small></span><span aria-hidden="true">→</span></a></li>)}</ul>
      </section>;
    })}</div>
  </section>;
}

function declaredAdoption(surface: AnyDocumentationSurface): AdoptionAction | undefined {
  return 'adoption' in surface ? surface.adoption : undefined;
}

function fallbackAdoption(surface: AnyDocumentationSurface): AdoptionAction {
  const quickstart = surface.sections.find((section) => section.kind === 'quickstart' || section.kind === 'guide');
  return {label: quickstart?.label ?? `Explore ${surface.name}`, url: quickstart?.url ?? surface.canonicalUrl, mode: 'browser', estimatedMinutes: 10, outcome: surface.summary};
}

function headingTag(level: HeadingLevel): 'h1' | 'h2' | 'h3' | 'h4' {
  return `h${level}` as 'h1' | 'h2' | 'h3' | 'h4';
}

function joinIds(...ids: Array<string | undefined>): string | undefined {
  const value = ids.filter(Boolean).join(' ');
  return value || undefined;
}

function mermaidLabel(value: string): string { return value.replaceAll('"', "'").replaceAll('\n', ' '); }

function slugId(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'family'; }

function validateDiagramAlternative(alternative?: DiagramAlternative): void {
  if (!alternative) return;
  validateDiagramNodes(alternative.nodes ?? [], 'diagram alternative');
  if (!alternative.edges?.length) return;
  const identifiers = new Set(alternative.nodes?.map((node) => node.id) ?? []);
  for (const edge of alternative.edges) {
    if (!identifiers.has(edge.from) || !identifiers.has(edge.to)) {
      throw new Error(`diagram alternative edge ${edge.from} -> ${edge.to} references an unknown node`);
    }
  }
}

function validateDiagramNodes(nodes: readonly DependencyGraphNode[], context: string): void {
  const identifiers = new Set<string>();
  for (const node of nodes) {
    if (identifiers.has(node.id)) throw new Error(`${context} contains duplicate node ${node.id}`);
    identifiers.add(node.id);
  }
}

function DiagramTextAlternative({alternative, id}: {alternative: DiagramAlternative; id: string}): ReactNode {
  const labels = new Map(alternative.nodes?.map((node) => [node.id, node.label]) ?? []);
  return <details className="b10x-diagram__alternative" id={id}>
    <summary>{alternative.label ?? 'Diagram as text'}</summary>
    <div>
      {alternative.content}
      {alternative.nodes?.length ? <section aria-label="Diagram nodes"><p className="b10x-eyebrow">Nodes</p><ul>{alternative.nodes.map((node) => <li key={node.id}><strong>{node.label}</strong> <code>{node.id}</code></li>)}</ul></section> : null}
      {alternative.edges?.length ? <section aria-label="Diagram relationships"><p className="b10x-eyebrow">Relationships</p><ol>{alternative.edges.map((edge, index) => <li key={`${edge.from}-${edge.to}-${index}`}><strong>{labels.get(edge.from) ?? edge.from}</strong> to <strong>{labels.get(edge.to) ?? edge.to}</strong>{edge.label ? <>: {edge.label}</> : null}</li>)}</ol></section> : null}
    </div>
  </details>;
}
