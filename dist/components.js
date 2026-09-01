import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import CodeBlock from '@theme/CodeBlock';
import Mermaid from '@theme/Mermaid';
export function StatusBadge({ maturity, children }) {
    return _jsx("span", { className: `b10x-status b10x-status--${maturity}`, children: children ?? maturity });
}
export function BoundaryNotice({ title = 'Current boundary', children }) {
    return _jsxs("aside", { className: "b10x-boundary", children: [_jsx("p", { className: "b10x-eyebrow", children: title }), _jsx("div", { children: children })] });
}
export function CodeExample({ language, title, children }) {
    return _jsx("div", { className: "b10x-code", children: _jsx(CodeBlock, { language: language, title: title, showLineNumbers: true, children: children.trimEnd() }) });
}
export function CommandExample({ command, output, title }) {
    return _jsx("div", { className: "b10x-command", children: _jsx(CodeBlock, { language: "console", title: title ?? 'Terminal', children: `$ ${command.trim()}${output ? `\n${output.trimEnd()}` : ''}` }) });
}
export function CodeTabs({ items }) {
    return _jsx("div", { className: "b10x-code-tabs", children: items.map((item) => _jsxs("details", { open: items[0] === item, children: [_jsx("summary", { children: item.label }), _jsx(CodeExample, { language: item.language, children: item.code })] }, item.label)) });
}
export function Diagram({ kind, source, src, title, description, download }) {
    if (kind === 'mermaid' && !source)
        throw new Error('a Mermaid diagram requires source');
    if (kind === 'svg' && !src)
        throw new Error('an SVG diagram requires src');
    return _jsxs("figure", { className: "b10x-diagram", "aria-label": title, children: [kind === 'mermaid' ? _jsx(Mermaid, { value: source }) : _jsx("img", { src: src, alt: description, loading: "lazy" }), _jsxs("figcaption", { children: [_jsx("strong", { children: title }), _jsx("span", { children: description }), download && _jsx("a", { href: download, download: true, children: "Download source" })] })] });
}
export function ProjectCard({ surface }) {
    return _jsxs("article", { className: "b10x-project-card", style: { '--b10x-project-accent': surface.accent }, children: [_jsxs("div", { children: [_jsx(StatusBadge, { maturity: surface.maturity }), _jsx("span", { children: surface.kind })] }), _jsx("h3", { children: _jsx("a", { href: surface.canonicalUrl, children: surface.name }) }), _jsx("p", { children: surface.summary }), _jsx("ul", { children: surface.capabilities.map((capability) => _jsx("li", { children: capability.replaceAll('-', ' ') }, capability)) })] });
}
export function EcosystemSwitcher({ registry, current }) {
    const groups = new Map();
    for (const surface of registry.surfaces) {
        const journey = surface.journeys[0] ?? 'understand';
        groups.set(journey, [...(groups.get(journey) ?? []), surface]);
    }
    return _jsxs("nav", { className: "b10x-switcher", "aria-label": "beyond10x ecosystem", children: [_jsx("a", { href: "https://beyond10x.github.io/getting-started/", children: "Start" }), [...groups].map(([journey, surfaces]) => _jsxs("details", { children: [_jsx("summary", { children: journey.replaceAll('-', ' ') }), surfaces.map((surface) => _jsxs("a", { "aria-current": surface.key === current ? 'page' : undefined, href: surface.canonicalUrl, children: [surface.name, _jsx("small", { children: surface.summary })] }, surface.key))] }, journey)), _jsx("a", { href: "https://beyond10x.github.io/getting-started/ecosystem", children: "All projects" })] });
}
