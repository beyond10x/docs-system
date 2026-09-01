import type {ReactNode} from 'react';
import CodeBlock from '@theme/CodeBlock';
import Mermaid from '@theme/Mermaid';
import type {AnyDocumentationSurface, ChangeLedgerEntry, EcosystemRegistry, Journey, Maturity} from './types.js';

export function StatusBadge({maturity, children}: {maturity: Maturity; children?: ReactNode}): ReactNode {
  return <span className={`b10x-status b10x-status--${maturity}`}>{children ?? maturity}</span>;
}

export function BoundaryNotice({title = 'Current boundary', children}: {title?: string; children: ReactNode}): ReactNode {
  return <aside className="b10x-boundary"><p className="b10x-eyebrow">{title}</p><div>{children}</div></aside>;
}

export function CodeExample({language, title, children}: {language: string; title?: string; children: string}): ReactNode {
  return <div className="b10x-code"><CodeBlock language={language} title={title} showLineNumbers>{children.trimEnd()}</CodeBlock></div>;
}

export function CommandExample({command, output, title}: {command: string; output?: string; title?: string}): ReactNode {
  return <div className="b10x-command"><CodeBlock language="console" title={title ?? 'Terminal'}>{`$ ${command.trim()}${output ? `\n${output.trimEnd()}` : ''}`}</CodeBlock></div>;
}

export function CodeTabs({items}: {items: Array<{label: string; language: string; code: string}>}): ReactNode {
  return <div className="b10x-code-tabs">{items.map((item) => <details key={item.label} open={items[0] === item}><summary>{item.label}</summary><CodeExample language={item.language}>{item.code}</CodeExample></details>)}</div>;
}

export function Diagram({kind, source, src, title, description, download}: {kind: 'mermaid' | 'svg'; source?: string; src?: string; title: string; description: string; download?: string}): ReactNode {
  if (kind === 'mermaid' && !source) throw new Error('a Mermaid diagram requires source');
  if (kind === 'svg' && !src) throw new Error('an SVG diagram requires src');
  return <figure className="b10x-diagram" aria-label={title}>{kind === 'mermaid' ? <Mermaid value={source!} /> : <img src={src} alt={description} loading="lazy" />}<figcaption><strong>{title}</strong><span>{description}</span>{download && <a href={download} download>Download source</a>}</figcaption></figure>;
}

export function ProjectCard({surface}: {surface: AnyDocumentationSurface}): ReactNode {
  const action = surface.adoption ?? fallbackAdoption(surface);
  return <article className="b10x-project-card" style={{'--b10x-project-accent': surface.accent} as React.CSSProperties}><div><StatusBadge maturity={surface.maturity} /><span>{surface.kind}</span></div><h3><a href={surface.canonicalUrl}>{surface.name}</a></h3><p>{surface.summary}</p><ul>{surface.capabilities.map((capability) => <li key={capability}>{capability.replaceAll('-', ' ')}</li>)}</ul><a className="b10x-adoption-link" href={action.url}>{action.label} <span aria-hidden="true">→</span></a></article>;
}

export function AdoptionCard({surface, journey}: {surface: AnyDocumentationSurface; journey?: Journey}): ReactNode {
  const action = surface.adoption ?? fallbackAdoption(surface);
  return <article className="b10x-adoption-card" style={{'--b10x-project-accent': surface.accent} as React.CSSProperties}>
    <header><StatusBadge maturity={surface.maturity} />{journey && <span>{journey.replaceAll('-', ' ')}</span>}</header>
    <h3>{surface.name}</h3><p>{action.outcome}</p>
    <dl><div><dt>Path</dt><dd>{action.mode.replaceAll('-', ' ')}</dd></div><div><dt>Time</dt><dd>about {action.estimatedMinutes} min</dd></div></dl>
    {action.prerequisites?.length ? <p><strong>Needs:</strong> {action.prerequisites.join(', ')}</p> : null}
    <a href={action.url}>{action.label} <span aria-hidden="true">→</span></a>
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

export function EcosystemSwitcher({registry, current}: {registry: EcosystemRegistry; current?: string}): ReactNode {
  const groups = new Map<string, typeof registry.surfaces>();
  for (const surface of registry.surfaces) {
    const journey = surface.journeys[0] ?? 'understand';
    groups.set(journey, [...(groups.get(journey) ?? []), surface]);
  }
  return <nav className="b10x-switcher" aria-label="beyond10x ecosystem"><a href="https://beyond10x.github.io/">Start</a>{[...groups].map(([journey, surfaces]) => <details key={journey}><summary>{journey.replaceAll('-', ' ')}</summary>{surfaces.map((surface) => <a aria-current={surface.key === current ? 'page' : undefined} key={surface.key} href={surface.canonicalUrl}>{surface.name}<small>{surface.summary}</small></a>)}</details>)}<a href="https://beyond10x.github.io/ecosystem/">All projects</a></nav>;
}

function fallbackAdoption(surface: AnyDocumentationSurface): NonNullable<AnyDocumentationSurface['adoption']> {
  const quickstart = surface.sections.find((section) => section.kind === 'quickstart' || section.kind === 'guide');
  return {label: quickstart?.label ?? `Explore ${surface.name}`, url: quickstart?.url ?? surface.canonicalUrl, mode: 'browser', estimatedMinutes: 10, outcome: surface.summary};
}
