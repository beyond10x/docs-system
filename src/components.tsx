import type {ReactNode} from 'react';
import CodeBlock from '@theme/CodeBlock';
import Mermaid from '@theme/Mermaid';
import type {DocumentationSurface, EcosystemRegistry, Maturity} from './types.js';

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

export function ProjectCard({surface}: {surface: DocumentationSurface}): ReactNode {
  return <article className="b10x-project-card" style={{'--b10x-project-accent': surface.accent} as React.CSSProperties}><div><StatusBadge maturity={surface.maturity} /><span>{surface.kind}</span></div><h3><a href={surface.canonicalUrl}>{surface.name}</a></h3><p>{surface.summary}</p><ul>{surface.capabilities.map((capability) => <li key={capability}>{capability.replaceAll('-', ' ')}</li>)}</ul></article>;
}

export function EcosystemSwitcher({registry, current}: {registry: EcosystemRegistry; current?: string}): ReactNode {
  const groups = new Map<string, typeof registry.surfaces>();
  for (const surface of registry.surfaces) {
    const journey = surface.journeys[0] ?? 'understand';
    groups.set(journey, [...(groups.get(journey) ?? []), surface]);
  }
  return <nav className="b10x-switcher" aria-label="beyond10x ecosystem"><a href="https://beyond10x.github.io/getting-started/">Start</a>{[...groups].map(([journey, surfaces]) => <details key={journey}><summary>{journey.replaceAll('-', ' ')}</summary>{surfaces.map((surface) => <a aria-current={surface.key === current ? 'page' : undefined} key={surface.key} href={surface.canonicalUrl}>{surface.name}<small>{surface.summary}</small></a>)}</details>)}<a href="https://beyond10x.github.io/getting-started/ecosystem">All projects</a></nav>;
}
