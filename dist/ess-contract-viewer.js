import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { CodeExample, Diagram, ScrollableTable } from './components.js';
import { essText, parseEssDocument, resolveEssTarget, safeEssUrl } from './ess-document.js';
export function EssContractViewer(props) {
    const parsed = useMemo(() => {
        try {
            return { index: parseEssDocument(props.document) };
        }
        catch (error) {
            return { error: error instanceof Error ? error.message : 'Invalid ESS documentation' };
        }
    }, [props.document]);
    if (!parsed.index)
        return _jsxs("div", { className: "b10x-contract-error", role: "alert", children: [_jsx("strong", { children: "Contract reference unavailable." }), _jsx("p", { children: parsed.error })] });
    return _jsx(ContractBook, { ...props, index: parsed.index }, `${props.id ?? parsed.index.document.system}:${parsed.index.document.version}`);
}
function ContractBook({ index, id = `ess-${index.document.system}`, title, sourceUrl, sourceRepository, initialPage }) {
    const prefix = `contract-${encodeURIComponent(id)}`;
    const first = index.pages.has(initialPage ?? '') ? initialPage : index.pages.has('index') ? 'index' : index.document.pages[0].id;
    const [location, setLocation] = useState({ page: first });
    const [query, setQuery] = useState('');
    const page = index.pages.get(location.page) ?? index.pages.get(first);
    const sections = index.sections.get(page.id) ?? [];
    const results = query.trim() ? index.search.filter(entry => query.toLowerCase().trim().split(/\s+/).every(word => entry.text.includes(word))) : [];
    const href = (location) => `#${prefix}/${encodeURIComponent(location.page)}/${encodeURIComponent(location.anchor ?? '')}`;
    const anchorId = (location) => `${prefix}-${encodeURIComponent(location.page)}-${encodeURIComponent(location.anchor ?? '')}`;
    useEffect(() => {
        function follow() {
            if (!window.location.hash.startsWith(`#${prefix}/`))
                return;
            const parts = window.location.hash.slice(prefix.length + 2).split('/');
            try {
                const target = { page: decodeURIComponent(parts[0]), ...(parts[1] ? { anchor: decodeURIComponent(parts[1]) } : {}) };
                if (resolveEssTarget(index, target.anchor ? { target: 'anchor', page: target.page, anchor: target.anchor } : { target: 'page', page: target.page }))
                    setLocation(target);
            }
            catch { /* A malformed fragment does not select a different contract. */ }
        }
        follow();
        window.addEventListener('hashchange', follow);
        return () => window.removeEventListener('hashchange', follow);
    }, [prefix, index]);
    useEffect(() => {
        if (!window.location.hash.startsWith(`#${prefix}/`))
            return;
        const frame = window.requestAnimationFrame(() => {
            const target = document.getElementById(anchorId(location));
            target?.scrollIntoView({ block: 'start' });
            target?.focus({ preventScroll: true });
        });
        return () => window.cancelAnimationFrame(frame);
    }, [prefix, location]);
    const navigationLink = (target, children, current = false) => _jsx("a", { href: href(target), "aria-current": current ? 'page' : undefined, onClick: () => setQuery(''), children: children });
    const context = { index, href, anchorId, page: page.id };
    return _jsxs("section", { className: "b10x-contract-viewer", "aria-label": title ?? `${index.document.system} contract reference`, children: [_jsxs("header", { className: "b10x-contract-header", children: [_jsxs("div", { children: [_jsx("p", { className: "b10x-eyebrow", children: "EXECUTABLE SYSTEM SPECIFICATION" }), _jsx("h2", { children: title ?? `${index.document.system} contracts` }), _jsx("p", { children: "Explore the declared model: entities, commands, events, relationships, and lifecycles." })] }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "Specification" }), _jsx("dd", { children: index.document.version })] }), _jsxs("div", { children: [_jsx("dt", { children: "Pages" }), _jsx("dd", { children: index.document.pages.length })] }), _jsxs("div", { children: [_jsx("dt", { children: "Format" }), _jsx("dd", { children: "ess-docs/1" })] })] })] }), _jsx("p", { className: "b10x-contract-boundary", children: "These are contract declarations. They do not establish runtime implementation or enforcement." }), _jsxs("div", { className: "b10x-contract-layout", children: [_jsxs("aside", { className: "b10x-contract-sidebar", children: [_jsx("label", { htmlFor: `${prefix}-search`, children: "Find a contract" }), _jsx("input", { id: `${prefix}-search`, type: "search", value: query, onChange: event => setQuery(event.target.value), placeholder: "Principal, credential, lifecycle\u2026" }), query.trim() ? _jsxs("div", { className: "b10x-contract-results", children: [_jsxs("p", { role: "status", children: [results.length, " matching ", results.length === 1 ? 'section' : 'sections'] }), _jsx("nav", { "aria-label": "Contract search results", children: results.map(result => _jsx("div", { children: navigationLink(result, _jsxs(_Fragment, { children: [_jsx("strong", { children: result.title }), _jsx("small", { children: result.page })] })) }, `${result.page}#${result.anchor ?? ''}`)) }), !results.length && _jsx("p", { children: "Try an entity, command, event, or domain name." })] }) : _jsx("nav", { "aria-label": "Contract pages", children: index.document.pages.map(candidate => _jsx("div", { children: navigationLink({ page: candidate.id }, _jsxs(_Fragment, { children: [_jsx("span", { children: essText(candidate.title) }), candidate.about && _jsx("small", { children: candidate.about.kind })] }), candidate.id === page.id) }, candidate.id)) })] }), _jsxs("article", { className: "b10x-contract-page", "aria-labelledby": anchorId({ page: page.id }), children: [_jsxs("header", { children: [_jsx("p", { className: "b10x-eyebrow", children: page.about?.kind ?? 'System reference' }), _jsx("h3", { id: anchorId({ page: page.id }), tabIndex: -1, children: essText(page.title) })] }), sections.length > 0 && _jsxs("details", { className: "b10x-contract-contents", children: [_jsxs("summary", { children: ["On this page \u00B7 ", sections.length, " sections"] }), _jsx("nav", { "aria-label": "Contract sections", children: sections.map(section => _jsx("div", { children: navigationLink(section, section.title) }, section.anchor)) })] }), _jsx(Blocks, { blocks: page.blocks, context: context }), _jsxs("details", { className: "b10x-contract-provenance", children: [_jsx("summary", { children: "Source and provenance" }), _jsx("p", { children: "Generated by ESS from the owning specification. This viewer displays the projection without executing its commands." }), _jsxs("dl", { children: [_jsx("dt", { children: "System" }), _jsx("dd", { children: page.provenance.provenance.system }), _jsx("dt", { children: "Specification version" }), _jsx("dd", { children: page.provenance.provenance.specification_version }), _jsx("dt", { children: "Source digest" }), _jsx("dd", { children: _jsx("code", { children: page.provenance.provenance.source_digest }) }), _jsx("dt", { children: "Contract digest" }), _jsx("dd", { children: _jsx("code", { children: page.provenance.provenance.contract_digest }) })] }), sourceUrl && _jsx(SafeSourceLink, { href: sourceUrl, children: "Download documentation projection" }), sourceRepository && _jsxs(_Fragment, { children: [" \u00B7 ", _jsx(SafeSourceLink, { href: sourceRepository, children: "View owning source" })] })] })] })] })] });
}
function SafeSourceLink({ href, children }) {
    return safeEssUrl(href) ? _jsx("a", { href: href, children: children }) : _jsxs("span", { children: [children, " (unavailable)"] });
}
function Inlines({ nodes, context }) {
    return nodes.map((node, i) => {
        switch (node.inline) {
            case 'text': return _jsx("span", { children: node.text }, i);
            case 'code': return _jsx("code", { children: node.text }, i);
            case 'strong': return _jsx("strong", { children: _jsx(Inlines, { nodes: node.text, context: context }) }, i);
            case 'emphasis': return _jsx("em", { children: _jsx(Inlines, { nodes: node.text, context: context }) }, i);
            case 'link': {
                const target = resolveEssTarget(context.index, node.to);
                const children = _jsx(Inlines, { nodes: node.text, context: context });
                if (!target)
                    return _jsxs("span", { className: "b10x-contract-unresolved", title: "The projection does not publish a unique destination", children: [children, " ", _jsx("small", { children: "(unresolved reference)" })] }, i);
                return _jsx("a", { href: typeof target === 'string' ? target : context.href(target), children: children }, i);
            }
        }
    });
}
function Blocks({ blocks, context }) {
    return blocks.map((block, i) => {
        switch (block.block) {
            case 'prose': return _jsx("p", { children: _jsx(Inlines, { nodes: block.text, context: context }) }, i);
            case 'section': {
                const Heading = `h${Math.min(6, block.level + 2)}`;
                return _jsxs("section", { className: "b10x-contract-section", children: [_jsx(Heading, { id: context.anchorId({ page: context.page, anchor: block.anchor }), tabIndex: -1, children: _jsx(Inlines, { nodes: block.title, context: context }) }), _jsx(Blocks, { blocks: block.blocks, context: context })] }, i);
            }
            case 'list': {
                const List = block.ordered ? 'ol' : 'ul';
                return _jsx(List, { children: block.items.map((item, j) => _jsx("li", { children: _jsx(Blocks, { blocks: item, context: context }) }, j)) }, i);
            }
            case 'table': return _jsxs(ScrollableTable, { label: "Contract fields", children: [_jsx("thead", { children: _jsx("tr", { children: block.columns.map((cell, j) => _jsx("th", { scope: "col", children: _jsx(Inlines, { nodes: cell, context: context }) }, j)) }) }), _jsx("tbody", { children: block.rows.map((row, j) => _jsx("tr", { children: row.map((cell, k) => _jsx("td", { children: _jsx(Inlines, { nodes: cell, context: context }) }, k)) }, j)) })] }, i);
            case 'quote': return _jsx("blockquote", { children: _jsx(Blocks, { blocks: block.blocks, context: context }) }, i);
            case 'code': return _jsx(CodeExample, { language: block.language ?? 'text', children: block.text }, i);
            case 'diagram': return _jsx(ContractDiagram, { source: block.source, kind: block.kind }, i);
            case 'rule': return _jsx("hr", {}, i);
        }
    });
}
function ContractDiagram({ source, kind }) {
    const [open, setOpen] = useState(kind === 'lifecycle');
    const title = kind === 'lifecycle' ? 'Lifecycle' : kind === 'system' ? 'System relationships' : kind === 'binding_flow' ? 'Binding flow' : 'Interaction';
    return _jsxs("details", { className: "b10x-contract-diagram", open: open, onToggle: event => setOpen(event.currentTarget.open), children: [_jsx("summary", { children: title }), open && _jsx(Diagram, { kind: "mermaid", source: source, title: title, description: "Relationships and transitions declared by the ESS contract. The surrounding contract text provides their names and conditions.", minWidth: kind === 'lifecycle' ? '24rem' : '48rem' }), _jsxs("details", { children: [_jsx("summary", { children: "Diagram source" }), _jsx(CodeExample, { language: "mermaid", children: source })] })] });
}
