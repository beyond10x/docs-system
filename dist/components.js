import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useRef } from 'react';
import CodeBlock from '@theme/CodeBlock';
import Mermaid from '@theme/Mermaid';
import { normalizeMarkdownFenceLanguage } from './code.js';
import { deriveEcosystemNavigation, surfaceNavigation } from './navigation.js';
export function PageHeader({ title, description, eyebrow, actions, children, headingLevel = 1 }) {
    const Heading = headingTag(headingLevel);
    return _jsxs("header", { className: "b10x-page-header", children: [_jsxs("div", { className: "b10x-page-header__copy", children: [eyebrow && _jsx("p", { className: "b10x-eyebrow", children: eyebrow }), _jsx(Heading, { children: title }), description && _jsx("div", { className: "b10x-page-header__description", children: description }), children && _jsx("div", { className: "b10x-page-header__meta", children: children })] }), actions && _jsx("div", { className: "b10x-page-header__actions", children: actions })] });
}
export function SectionHeader({ title, description, eyebrow, action, headingLevel = 2, id }) {
    const Heading = headingTag(headingLevel);
    return _jsxs("header", { className: "b10x-section-header", children: [_jsxs("div", { children: [eyebrow && _jsx("p", { className: "b10x-eyebrow", children: eyebrow }), _jsx(Heading, { id: id, children: title }), description && _jsx("div", { className: "b10x-section-header__description", children: description })] }), action && _jsx("div", { className: "b10x-section-header__action", children: action })] });
}
export function FactGrid({ items, label = 'Key facts' }) {
    return _jsx("dl", { className: "b10x-fact-grid", "aria-label": label, children: items.map((item, index) => _jsxs("div", { children: [_jsx("dt", { children: item.label }), _jsx("dd", { children: item.url ? _jsx("a", { href: item.url, children: item.value }) : item.value }), item.detail && _jsx("dd", { className: "b10x-fact-grid__detail", children: item.detail })] }, index)) });
}
const calloutTitles = { note: 'Note', success: 'Ready', warning: 'Attention', danger: 'Important' };
export function Callout({ children, title, tone = 'note', className }) {
    return _jsxs("aside", { className: ['b10x-callout', `b10x-callout--${tone}`, className].filter(Boolean).join(' '), children: [_jsx("p", { className: "b10x-callout__title b10x-eyebrow", children: title ?? calloutTitles[tone] }), _jsx("div", { className: "b10x-callout__content", children: children })] });
}
export function SearchField({ label = 'Search', hint, containerClassName, id, ...input }) {
    const generatedId = useId().replaceAll(':', '');
    const inputId = id ?? `b10x-search-${generatedId}`;
    const hintId = hint ? `${inputId}-hint` : undefined;
    return _jsxs("div", { className: ['b10x-search-field', containerClassName].filter(Boolean).join(' '), children: [_jsx("label", { htmlFor: inputId, children: label }), _jsxs("div", { children: [_jsx("span", { "aria-hidden": "true", children: "\u2315" }), _jsx("input", { ...input, id: inputId, type: "search", "aria-describedby": joinIds(input['aria-describedby'], hintId) })] }), hint && _jsx("small", { id: hintId, children: hint })] });
}
export function FilterChipGroup({ label, options, selected, onToggle }) {
    const active = new Set(selected);
    return _jsxs("fieldset", { className: "b10x-filter-chips", children: [_jsx("legend", { children: label }), _jsx("div", { children: options.map((option) => {
                    const isSelected = active.has(option.value);
                    return _jsxs("button", { type: "button", "aria-pressed": isSelected, disabled: option.disabled, onClick: () => onToggle?.(option.value, !isSelected), children: [_jsx("span", { children: option.label }), option.count !== undefined && _jsx("small", { children: option.count })] }, option.value);
                }) })] });
}
export function CardGrid({ children, columns = 'auto', label }) {
    return _jsx("section", { className: `b10x-card-grid b10x-card-grid--${columns}`, "aria-label": label, children: children });
}
export function ContentCard({ title, description, eyebrow, meta, children, footer, titleUrl, actionUrl, actionLabel = 'Learn more', accent, headingLevel = 3 }) {
    const Heading = headingTag(headingLevel);
    const style = accent ? { '--b10x-project-accent': accent } : undefined;
    return _jsxs("article", { className: "b10x-content-card", style: style, children: [(eyebrow || meta) && _jsxs("header", { children: [eyebrow && _jsx("span", { className: "b10x-eyebrow", children: eyebrow }), meta && _jsx("span", { children: meta })] }), _jsx(Heading, { children: titleUrl ? _jsx("a", { href: titleUrl, children: title }) : title }), description && _jsx("div", { className: "b10x-content-card__description", children: description }), children && _jsx("div", { className: "b10x-content-card__body", children: children }), (footer || actionUrl) && _jsxs("footer", { children: [footer, actionUrl && _jsxs("a", { className: "b10x-card-action", href: actionUrl, children: [actionLabel, " ", _jsx("span", { "aria-hidden": "true", children: "\u2192" })] })] })] });
}
export function StatusBadge({ maturity, children }) {
    return _jsx("span", { className: `b10x-status b10x-status--${maturity}`, children: children ?? maturity });
}
export function BoundaryNotice({ title = 'Current boundary', children }) {
    return _jsx(Callout, { className: "b10x-boundary", title: title, tone: "warning", children: children });
}
export function CodeExample({ language, title, children }) {
    return _jsx("div", { className: "b10x-code", children: _jsx(CodeBlock, { language: normalizeMarkdownFenceLanguage(language), title: title, showLineNumbers: true, children: children.trimEnd() }) });
}
export function CommandExample({ command, output, title }) {
    return _jsx("div", { className: "b10x-command", children: _jsx(CodeBlock, { language: "shell-session", title: title ?? 'Terminal', children: `$ ${command.trim()}${output ? `\n${output.trimEnd()}` : ''}` }) });
}
export function CodeTabs({ items }) {
    return _jsx("div", { className: "b10x-code-tabs", children: items.map((item) => _jsxs("details", { open: items[0] === item, children: [_jsx("summary", { children: item.label }), _jsx(CodeExample, { language: item.language, children: item.code })] }, item.label)) });
}
export function DataCatalog({ items, title = 'Data catalog' }) {
    return _jsx("section", { className: "b10x-data-catalog", "aria-label": title, children: items.map((item) => _jsxs("article", { children: [_jsxs("header", { children: [item.kind && _jsx("span", { children: item.kind }), _jsx("code", { children: item.id })] }), _jsx("h3", { children: item.url ? _jsx("a", { href: item.url, children: item.name }) : item.name }), item.summary && _jsx("p", { children: item.summary })] }, item.id)) });
}
export function DependencyGraph({ nodes, edges, title = 'Dependencies', description = 'Declared dependencies between components.', minWidth }) {
    validateDiagramNodes(nodes, 'dependency graph');
    const identifiers = new Map(nodes.map((node, index) => [node.id, `n${index}`]));
    const lines = ['flowchart LR', ...nodes.map((node) => `  ${identifiers.get(node.id)}["${mermaidLabel(node.label)}"]`)];
    for (const edge of edges) {
        const from = identifiers.get(edge.from);
        const to = identifiers.get(edge.to);
        if (!from || !to)
            throw new Error(`dependency edge ${edge.from} -> ${edge.to} references an unknown node`);
        lines.push(`  ${from} -->${edge.label ? `|"${mermaidLabel(edge.label)}"|` : ''} ${to}`);
    }
    return _jsx(Diagram, { kind: "mermaid", source: lines.join('\n'), title: title, description: description, minWidth: minWidth, alternative: { nodes, edges } });
}
export function Diagram({ kind, source, src, title, description, download, minWidth = '48rem', initialPosition = 'center', alternative }) {
    if (kind === 'mermaid' && !source)
        throw new Error('a Mermaid diagram requires source');
    if (kind === 'svg' && !src)
        throw new Error('an SVG diagram requires src');
    validateDiagramAlternative(alternative);
    const componentId = useId().replaceAll(':', '');
    const titleId = `b10x-diagram-${componentId}-title`;
    const descriptionId = `b10x-diagram-${componentId}-description`;
    const instructionsId = `b10x-diagram-${componentId}-instructions`;
    const alternativeId = `b10x-diagram-${componentId}-alternative`;
    const minimum = typeof minWidth === 'number' ? `${minWidth}px` : minWidth;
    const style = { '--b10x-diagram-min-width': minimum };
    const viewport = useRef(null);
    useEffect(() => {
        const element = viewport.current;
        if (!element || initialPosition === 'start')
            return;
        let animationFrame = 0;
        let positioned = false;
        let mutationObserver;
        let resizeObserver;
        const position = () => {
            animationFrame = 0;
            if (positioned)
                return;
            const visual = element.querySelector('svg, img');
            if (!visual || visual.getBoundingClientRect().width === 0 || visual.getBoundingClientRect().height === 0)
                return;
            element.scrollLeft = Math.max(0, (element.scrollWidth - element.clientWidth) / 2);
            element.scrollTop = Math.max(0, (element.scrollHeight - element.clientHeight) / 2);
            positioned = true;
            mutationObserver?.disconnect();
            resizeObserver?.disconnect();
        };
        const schedule = () => {
            if (positioned || animationFrame)
                return;
            animationFrame = window.requestAnimationFrame(() => {
                animationFrame = window.requestAnimationFrame(position);
            });
        };
        mutationObserver = new MutationObserver(schedule);
        mutationObserver.observe(element, { attributes: true, childList: true, subtree: true });
        if ('ResizeObserver' in window) {
            resizeObserver = new ResizeObserver(schedule);
            resizeObserver.observe(element);
            resizeObserver.observe(element.querySelector('.b10x-diagram__canvas'));
        }
        const image = element.querySelector('img');
        image?.addEventListener('load', schedule, { once: true });
        schedule();
        return () => {
            if (animationFrame)
                window.cancelAnimationFrame(animationFrame);
            mutationObserver?.disconnect();
            resizeObserver?.disconnect();
            image?.removeEventListener('load', schedule);
        };
    }, [initialPosition, kind, minimum, source, src]);
    return _jsxs("figure", { className: "b10x-diagram", "aria-labelledby": titleId, children: [_jsx("div", { ref: viewport, className: "b10x-diagram__viewport", style: style, tabIndex: 0, role: "region", "aria-labelledby": titleId, "aria-describedby": `${descriptionId} ${instructionsId}`, "aria-details": alternative ? alternativeId : undefined, children: _jsx("div", { className: "b10x-diagram__canvas", role: "img", "aria-label": description, children: _jsx("div", { "aria-hidden": "true", children: kind === 'mermaid' ? _jsx(Mermaid, { value: source }) : _jsx("img", { src: src, alt: "", loading: "lazy" }) }) }) }), _jsxs("p", { className: "b10x-diagram__guidance", id: instructionsId, children: [_jsx("span", { "aria-hidden": "true", children: "\u2194" }), _jsxs("span", { children: [_jsx("strong", { children: "Pan the full-size diagram:" }), " swipe or scroll, or focus the canvas and use the arrow keys."] })] }), _jsxs("figcaption", { children: [_jsx("strong", { id: titleId, children: title }), _jsx("span", { id: descriptionId, children: description }), download && _jsx("a", { className: "b10x-touch-link", href: download, download: true, children: "Download source" })] }), alternative && _jsx(DiagramTextAlternative, { alternative: alternative, id: alternativeId })] });
}
export function ProjectCard({ surface, headingLevel = 3, title = surface.name, titleUrl = surface.canonicalUrl, actionUrl, actionLabel }) {
    const action = declaredAdoption(surface) ?? fallbackAdoption(surface);
    const Heading = headingTag(headingLevel);
    return _jsxs("article", { className: "b10x-project-card", style: { '--b10x-project-accent': surface.accent }, children: [_jsxs("div", { children: [_jsx(StatusBadge, { maturity: surface.maturity }), _jsx("span", { children: surface.kind })] }), _jsx(Heading, { children: _jsx("a", { href: titleUrl, children: title }) }), _jsx("p", { children: surface.summary }), _jsx("ul", { children: surface.capabilities.map((capability) => _jsx("li", { children: capability.replaceAll('-', ' ') }, capability)) }), _jsxs("a", { className: "b10x-adoption-link", href: actionUrl ?? action.url, children: [actionLabel ?? action.label, " ", _jsx("span", { "aria-hidden": "true", children: "\u2192" })] })] });
}
export function AdoptionCard({ surface, journey, headingLevel = 3, title = surface.name, titleUrl, actionUrl, actionLabel }) {
    const action = declaredAdoption(surface) ?? fallbackAdoption(surface);
    const Heading = headingTag(headingLevel);
    return _jsxs("article", { className: "b10x-adoption-card", style: { '--b10x-project-accent': surface.accent }, children: [_jsxs("header", { children: [_jsx(StatusBadge, { maturity: surface.maturity }), journey && _jsx("span", { children: journey.replaceAll('-', ' ') })] }), _jsx(Heading, { children: titleUrl ? _jsx("a", { href: titleUrl, children: title }) : title }), _jsx("p", { children: action.outcome }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "Path" }), _jsx("dd", { children: action.mode.replaceAll('-', ' ') })] }), _jsxs("div", { children: [_jsx("dt", { children: "Time" }), _jsxs("dd", { children: ["about ", action.estimatedMinutes, " min"] })] })] }), action.prerequisites?.length ? _jsxs("p", { children: [_jsx("strong", { children: "Needs:" }), " ", action.prerequisites.join(', ')] }) : null, _jsxs("a", { href: actionUrl ?? action.url, children: [actionLabel ?? action.label, " ", _jsx("span", { "aria-hidden": "true", children: "\u2192" })] })] });
}
export function ChangeTimelineEntry({ change, surfaces }) {
    return _jsxs("article", { className: `b10x-change b10x-change--${change.impact}`, id: change.key.replaceAll('/', '-'), children: [_jsxs("header", { children: [_jsx("time", { dateTime: change.publishedAt, children: new Date(change.publishedAt).toLocaleDateString('en', { dateStyle: 'medium', timeZone: 'UTC' }) }), _jsx("span", { children: change.repository }), _jsx("span", { children: change.kind }), _jsx("strong", { children: change.impact.replaceAll('-', ' ') })] }), _jsx("h2", { children: _jsx("a", { href: change.source.url, children: change.title }) }), _jsx("p", { children: change.summary }), _jsx("ul", { "aria-label": "Affected public surfaces", children: change.affectedSurfaces.map((key) => _jsx("li", { children: _jsx("a", { href: surfaces?.get(key)?.canonicalUrl, children: surfaces?.get(key)?.name ?? key }) }, key)) }), change.relations?.length ? _jsx("dl", { className: "b10x-change-relations", children: change.relations.map((relation) => _jsxs("div", { children: [_jsx("dt", { children: relation.kind.replaceAll('-', ' ') }), _jsx("dd", { children: relation.label ?? relation.target.replace(/^(surface|change):/, '') })] }, `${relation.kind}-${relation.target}`)) }) : null, change.action && _jsxs("a", { className: "b10x-change-action", href: change.action.url, children: [change.action.label, " ", _jsx("span", { "aria-hidden": "true", children: "\u2192" })] })] });
}
export function EcosystemSwitcher({ registry, current, familyOrder, startUrl = 'https://beyond10x.github.io/', allProjectsUrl = 'https://beyond10x.github.io/ecosystem/' }) {
    const navigation = deriveEcosystemNavigation(registry, { familyOrder });
    return _jsxs("nav", { className: "b10x-switcher", "aria-label": "beyond10x ecosystem", children: [navigation.frontDoors.length ? navigation.frontDoors.map((surface) => _jsx("a", { className: "b10x-switcher__start", "aria-current": surface.key === current ? 'page' : undefined, href: surface.canonicalUrl, children: surfaceNavigation(surface)?.label ?? surface.name }, surface.key)) : _jsx("a", { className: "b10x-switcher__start", href: startUrl, children: "Start" }), navigation.families.map((family) => _jsxs("details", { children: [_jsx("summary", { children: family.name }), family.surfaces.map((surface) => _jsxs("a", { "aria-current": surface.key === current ? 'page' : undefined, href: surface.canonicalUrl, children: [surfaceNavigation(surface)?.label ?? surface.name, _jsx("small", { children: surface.summary })] }, surface.key))] }, family.name)), _jsx("a", { href: allProjectsUrl, children: "All projects" })] });
}
export function EcosystemFamilyGateway({ registry, surfaces, current, familyOrder, title = 'Explore the ecosystem', description = 'Choose a family, then follow the project path that matches your work.', headingLevel = 2, }) {
    const available = surfaces ?? registry?.surfaces;
    if (!available)
        throw new Error('EcosystemFamilyGateway requires registry or surfaces');
    const navigation = deriveEcosystemNavigation(available, { familyOrder });
    const componentId = useId().replaceAll(':', '');
    const titleId = `b10x-family-gateway-${componentId}-title`;
    const TitleHeading = headingLevel === 2 ? 'h2' : 'h3';
    const FamilyHeading = headingLevel === 2 ? 'h3' : 'h4';
    return _jsxs("section", { className: "b10x-family-gateway", "aria-labelledby": titleId, children: [_jsxs("header", { className: "b10x-family-gateway__header", children: [_jsx("p", { className: "b10x-eyebrow", children: "Ecosystem" }), _jsx(TitleHeading, { id: titleId, children: title }), _jsx("p", { children: description })] }), navigation.frontDoors.length > 0 && _jsx("nav", { className: "b10x-family-gateway__start", "aria-label": "Start here", children: navigation.frontDoors.map((surface) => _jsxs("a", { "aria-current": surface.key === current ? 'page' : undefined, href: surface.canonicalUrl, children: [_jsxs("span", { children: [_jsx("strong", { children: surfaceNavigation(surface)?.label ?? surface.name }), _jsx("small", { children: surface.summary })] }), _jsx("span", { "aria-hidden": "true", children: "\u2192" })] }, surface.key)) }), _jsx("div", { className: "b10x-family-gateway__families", children: navigation.families.map((family, index) => {
                    const familyId = `b10x-family-gateway-${componentId}-${slugId(family.name)}-${index}`;
                    return _jsxs("section", { className: "b10x-family-card", "aria-labelledby": familyId, children: [_jsxs("header", { children: [_jsx(FamilyHeading, { id: familyId, children: family.name }), _jsxs("span", { children: [family.surfaces.length, " ", family.surfaces.length === 1 ? 'project' : 'projects'] })] }), _jsx("ul", { children: family.surfaces.map((surface) => _jsx("li", { children: _jsxs("a", { "aria-current": surface.key === current ? 'page' : undefined, href: surface.canonicalUrl, children: [_jsxs("span", { children: [_jsx("strong", { children: surfaceNavigation(surface)?.label ?? surface.name }), _jsx("small", { children: surface.summary })] }), _jsx("span", { "aria-hidden": "true", children: "\u2192" })] }) }, surface.key)) })] }, family.name);
                }) })] });
}
function declaredAdoption(surface) {
    return 'adoption' in surface ? surface.adoption : undefined;
}
function fallbackAdoption(surface) {
    const quickstart = surface.sections.find((section) => section.kind === 'quickstart' || section.kind === 'guide');
    return { label: quickstart?.label ?? `Explore ${surface.name}`, url: quickstart?.url ?? surface.canonicalUrl, mode: 'browser', estimatedMinutes: 10, outcome: surface.summary };
}
function headingTag(level) {
    return `h${level}`;
}
function joinIds(...ids) {
    const value = ids.filter(Boolean).join(' ');
    return value || undefined;
}
function mermaidLabel(value) { return value.replaceAll('"', "'").replaceAll('\n', ' '); }
function slugId(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'family'; }
function validateDiagramAlternative(alternative) {
    if (!alternative)
        return;
    validateDiagramNodes(alternative.nodes ?? [], 'diagram alternative');
    if (!alternative.edges?.length)
        return;
    const identifiers = new Set(alternative.nodes?.map((node) => node.id) ?? []);
    for (const edge of alternative.edges) {
        if (!identifiers.has(edge.from) || !identifiers.has(edge.to)) {
            throw new Error(`diagram alternative edge ${edge.from} -> ${edge.to} references an unknown node`);
        }
    }
}
function validateDiagramNodes(nodes, context) {
    const identifiers = new Set();
    for (const node of nodes) {
        if (identifiers.has(node.id))
            throw new Error(`${context} contains duplicate node ${node.id}`);
        identifiers.add(node.id);
    }
}
function DiagramTextAlternative({ alternative, id }) {
    const labels = new Map(alternative.nodes?.map((node) => [node.id, node.label]) ?? []);
    return _jsxs("details", { className: "b10x-diagram__alternative", id: id, children: [_jsx("summary", { children: alternative.label ?? 'Diagram as text' }), _jsxs("div", { children: [alternative.content, alternative.nodes?.length ? _jsxs("section", { "aria-label": "Diagram nodes", children: [_jsx("p", { className: "b10x-eyebrow", children: "Nodes" }), _jsx("ul", { children: alternative.nodes.map((node) => _jsxs("li", { children: [_jsx("strong", { children: node.label }), " ", _jsx("code", { children: node.id })] }, node.id)) })] }) : null, alternative.edges?.length ? _jsxs("section", { "aria-label": "Diagram relationships", children: [_jsx("p", { className: "b10x-eyebrow", children: "Relationships" }), _jsx("ol", { children: alternative.edges.map((edge, index) => _jsxs("li", { children: [_jsx("strong", { children: labels.get(edge.from) ?? edge.from }), " to ", _jsx("strong", { children: labels.get(edge.to) ?? edge.to }), edge.label ? _jsxs(_Fragment, { children: [": ", edge.label] }) : null] }, `${edge.from}-${edge.to}-${index}`)) })] }) : null] })] });
}
