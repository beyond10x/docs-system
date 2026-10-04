import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Children, isValidElement, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import useBrokenLinks from '@docusaurus/useBrokenLinks';
import { DomainGraph, ProtocolGraph } from './charts.js';
import { StatusBadge } from './components.js';
import { parseTerminalSession, parseTranscript } from './product-data.js';
export { StatusBadge };
export function Terminal({ session, transcript, children, title, caption, animate = false, prompt = '$', tilt = false }) {
    const resolved = useMemo(() => {
        if (session !== undefined) {
            const parsed = parseTerminalSession(session);
            return { entries: parsed.entries, title: parsed.title, provenance: parsed.recordedWith, tones: parsed.tones };
        }
        const text = transcript ?? (typeof children === 'string' ? children : Children.toArray(children).filter((child) => typeof child === 'string').join(''));
        if (!text.trim())
            throw new Error('Terminal requires a session, a transcript, or transcript children');
        return { entries: parseTranscript(text), title: undefined, provenance: undefined, tones: undefined };
    }, [session, transcript, children]);
    const label = title ?? resolved.title ?? 'Terminal';
    const footer = caption ?? resolved.provenance;
    const gutter = resolved.entries.some((entry) => entry.exitCode !== undefined);
    const summary = terminalSummary(resolved.entries, resolved.tones);
    const commands = resolved.entries.map((entry) => entry.command).join('\n');
    const figure = useRef(null);
    const progress = useTyping(resolved.entries, animate, figure);
    const [copied, setCopied] = useState(false);
    const statusId = `b10x-terminal-${useId().replaceAll(':', '')}-status`;
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(commands);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        }
        catch {
            setCopied(false);
        }
    };
    return _jsxs("figure", { ref: figure, className: ['b10x-terminal', tilt && 'b10x-terminal--tilt'].filter(Boolean).join(' '), "aria-label": label, children: [_jsxs("div", { className: "b10x-terminal__bar", children: [_jsxs("span", { className: "b10x-terminal__lights", "aria-hidden": "true", children: [_jsx("i", {}), _jsx("i", {}), _jsx("i", {})] }), _jsx("span", { className: "b10x-terminal__title", children: label }), _jsx("button", { type: "button", className: "b10x-terminal__copy", onClick: copy, "aria-describedby": statusId, children: copied ? 'Copied' : 'Copy commands' }), _jsx("span", { className: "b10x-sr-only", role: "status", id: statusId, children: copied ? 'Commands copied to the clipboard' : '' })] }), _jsx("pre", { className: "b10x-terminal__body", tabIndex: 0, children: _jsx("code", { children: resolved.entries.map((entry, index) => _jsx(TerminalLines, { entry: entry, prompt: prompt, shown: progress?.[index], last: index === resolved.entries.length - 1, gutter: gutter, tones: resolved.tones }, index)) }) }), (footer || summary) && _jsxs("figcaption", { className: "b10x-terminal__foot", children: [footer && _jsxs(_Fragment, { children: [_jsx("span", { className: "b10x-terminal__dot", "aria-hidden": "true" }), _jsx("span", { className: "b10x-terminal__provenance", children: footer })] }), summary && _jsx("span", { className: "b10x-terminal__summary", children: summary })] })] });
}
function TerminalLines({ entry, prompt, shown, last, gutter, tones }) {
    const typed = shown ? entry.command.slice(0, shown.command) : entry.command;
    const rest = shown ? entry.command.slice(shown.command) : '';
    const outputVisible = !shown || shown.output;
    const failed = entry.exitCode !== undefined && entry.exitCode !== 0;
    const blank = gutter ? _jsx("span", { className: "b10x-terminal__gutter", "aria-hidden": "true", children: " " }) : null;
    const exit = entry.exitCode === undefined ? blank : _jsx("span", { className: `b10x-terminal__gutter b10x-terminal__gutter--${failed ? 'failed' : 'passed'}`, title: `exit ${entry.exitCode}`, "aria-hidden": "true", children: failed ? '✕' : '✓' });
    const json = /^\s*[[{]/.test(entry.output ?? '');
    return _jsxs(_Fragment, { children: [entry.comment && _jsxs("span", { className: "b10x-terminal__comment", children: [blank, "# ", entry.comment, '\n'] }), _jsxs("span", { className: "b10x-terminal__line", children: [exit, _jsxs("span", { className: "b10x-terminal__prompt", "aria-hidden": "true", children: [prompt, " "] }), _jsxs("span", { className: "b10x-terminal__command", children: [typed, _jsx("span", { className: "b10x-terminal__pending", children: rest })] }), '\n'] }), entry.output !== undefined && entry.output !== '' && _jsx("span", { className: ['b10x-terminal__output', failed && 'b10x-terminal__output--failed', !outputVisible && 'b10x-terminal__pending'].filter(Boolean).join(' '), children: entry.output.split('\n').map((line, index) => _jsxs("span", { children: [blank, toneLine(line, tones, json), '\n'] }, index)) }), !last && '\n'] });
}
/** Colour recorded output: the session's tone words first, then JSON tokens when the output is JSON. */
export function toneLine(line, tones, json) {
    const words = Object.keys(tones ?? {}).sort((left, right) => right.length - left.length);
    const pattern = words.length ? new RegExp(words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g') : undefined;
    const parts = [];
    let cursor = 0;
    const plain = (text) => { if (text)
        parts.push(...(json ? jsonTokens(text, parts.length) : [text])); };
    if (pattern) {
        for (const match of line.matchAll(pattern)) {
            plain(line.slice(cursor, match.index));
            parts.push(_jsx("span", { className: `b10x-terminal__tone b10x-terminal__tone--${tones[match[0]]}`, children: match[0] }, `t${parts.length}`));
            cursor = match.index + match[0].length;
        }
    }
    plain(line.slice(cursor));
    return parts;
}
function jsonTokens(text, offset) {
    const parts = [];
    const token = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|[{}[\],:]/g;
    let cursor = 0;
    for (const match of text.matchAll(token)) {
        if (match.index > cursor)
            parts.push(text.slice(cursor, match.index));
        const kind = match[1] !== undefined ? (match[2] !== undefined ? 'key' : 'string') : match[3] !== undefined ? 'literal' : /^[-\d]/.test(match[0]) ? 'literal' : 'punctuation';
        if (kind === 'key') {
            parts.push(_jsx("span", { className: "b10x-terminal__json--key", children: match[1] }, `j${offset}-${parts.length}`), _jsx("span", { className: "b10x-terminal__json--punctuation", children: match[2] }, `j${offset}-${parts.length + 1}`));
        }
        else
            parts.push(_jsx("span", { className: `b10x-terminal__json--${kind}`, children: match[0] }, `j${offset}-${parts.length}`));
        cursor = match.index + match[0].length;
    }
    if (cursor < text.length)
        parts.push(text.slice(cursor));
    return parts;
}
/** "3/3 exit 0 · 6 ✓ · 0 ✕": exits from the recording, tone counts from its tone words. */
export function terminalSummary(entries, tones) {
    const recorded = entries.filter((entry) => entry.exitCode !== undefined);
    if (!recorded.length)
        return undefined;
    const clean = recorded.filter((entry) => entry.exitCode === 0).length;
    const parts = [`${clean}/${recorded.length} exit 0`];
    if (tones && Object.keys(tones).length) {
        const count = (tone) => Object.entries(tones).filter(([, value]) => value === tone).reduce((sum, [word]) => sum + entries.reduce((total, entry) => total + ((entry.output ?? '').split(word).length - 1), 0), 0);
        parts.push(`${count('true')} ✓`, `${count('false')} ✕`);
    }
    return parts.join(' · ');
}
/** Type the commands once, when the terminal first scrolls into view; the full text is shown until then. */
function useTyping(entries, enabled, element) {
    const [state, setState] = useState(undefined);
    const started = useRef(false);
    useEffect(() => {
        if (!enabled || started.current || typeof window === 'undefined')
            return;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
            return;
        let frame = 0;
        const run = () => {
            started.current = true;
            const schedule = [];
            let time = 300;
            entries.forEach((entry, index) => {
                for (let chars = 1; chars <= entry.command.length; chars += 1)
                    schedule.push({ entry: index, at: (time += 28), chars, output: false });
                schedule.push({ entry: index, at: (time += 260), chars: entry.command.length, output: true });
                time += 420;
            });
            setState(entries.map(() => ({ command: 0, output: false })));
            const begin = performance.now();
            const tick = (now) => {
                const elapsed = now - begin;
                const next = entries.map(() => ({ command: 0, output: false }));
                for (const step of schedule) {
                    if (step.at > elapsed)
                        break;
                    next[step.entry] = { command: step.chars, output: step.output };
                }
                setState(next);
                if (elapsed <= time)
                    frame = window.requestAnimationFrame(tick);
                else
                    setState(undefined);
            };
            frame = window.requestAnimationFrame(tick);
        };
        const target = element.current;
        if (!target || !('IntersectionObserver' in window)) {
            run();
            return () => window.cancelAnimationFrame(frame);
        }
        const observer = new IntersectionObserver((records) => {
            if (records.some((record) => record.isIntersecting) && !started.current) {
                observer.disconnect();
                run();
            }
        }, { threshold: 0.6 });
        observer.observe(target);
        return () => { observer.disconnect(); window.cancelAnimationFrame(frame); };
    }, [enabled, entries, element]);
    return state;
}
/** One card of a `FeatureGrid`, for MDX authors who prefer children to an `items` array. */
export function Feature({ title, description, href, status, children }) {
    return _jsxs("li", { className: "b10x-feature", children: [_jsx("h3", { children: href ? _jsx(Link, { to: href, children: title }) : title }), status && _jsx(StatusBadge, { status: status }), description && _jsx("p", { children: description }), children && _jsx("div", { className: "b10x-feature__body", children: children })] });
}
export function FeatureGrid({ items, children, columns = 3, label = 'What it does' }) {
    return _jsxs("ol", { className: `b10x-feature-grid b10x-feature-grid--${columns}`, "aria-label": label, children: [items?.map((item) => _jsx(Feature, { ...item }, item.title)), children] });
}
export function FlowStep({ label, title, description, children }) {
    return _jsxs("li", { className: "b10x-flow__step", children: [label && _jsx("span", { className: "b10x-flow__label", children: label }), _jsx("strong", { children: title }), description && _jsx("p", { children: description }), children] });
}
/** Steps with arrows between them; wraps to a vertical sequence on narrow screens. */
export function Flow({ steps, children, label = 'How it works' }) {
    const count = (steps?.length ?? 0) + Children.toArray(children).filter(isValidElement).length;
    return _jsxs("ol", { className: "b10x-flow", "aria-label": label, style: { '--b10x-flow-count': count }, children: [steps?.map((step) => _jsx(FlowStep, { ...step }, step.title)), children] });
}
const STATUS_ORDER = ['shipped', 'decided', 'planned'];
const STATUS_LABELS = { shipped: 'Shipped', decided: 'Decided', planned: 'Planned' };
const STATUS_GROUP_LABELS = { shipped: 'Shipped · runs today', decided: 'Decided · recorded, not built', planned: 'Planned · roadmap only' };
/** What exists today and what does not, counted from the items themselves and grouped by state. */
export function StatusStrip({ items, label = 'Status', groupLabels = {} }) {
    const groups = STATUS_ORDER.map((status) => ({ status, items: items.filter((item) => item.status === status) })).filter((group) => group.items.length > 0);
    const summary = groups.map(({ status, items: members }) => `${members.length} ${STATUS_LABELS[status].toLowerCase()}`).join(', ');
    return _jsxs("section", { className: "b10x-status-strip", "aria-label": label, children: [_jsx("div", { className: "b10x-status-strip__bar", role: "img", "aria-label": `${items.length} capabilities: ${summary}`, children: groups.map(({ status, items: members }) => _jsx("span", { className: `b10x-status-strip__segment b10x-status-strip__segment--${status}`, style: { flexGrow: members.length } }, status)) }), _jsx("ul", { className: "b10x-status-strip__legend", "aria-hidden": "true", children: groups.map(({ status, items: members }) => _jsxs("li", { children: [_jsx(StatusBadge, { status: status }), _jsx("strong", { children: members.length })] }, status)) }), groups.map(({ status, items: members }) => _jsxs("div", { className: `b10x-status-strip__group b10x-status-strip__group--${status}`, children: [_jsx("p", { className: "b10x-status-strip__group-title", children: groupLabels[status] ?? STATUS_GROUP_LABELS[status] }), _jsx("ul", { className: "b10x-status-strip__items", children: members.map((item) => _jsxs("li", { children: [_jsx(StatusBadge, { status: item.status }), _jsx("span", { className: "b10x-status-strip__label", children: item.href ? _jsx(Link, { to: item.href, children: item.label }) : item.label }), item.detail && _jsx("span", { className: "b10x-status-strip__detail", children: item.detail })] }, item.label)) })] }, status))] });
}
export function RelatedTools({ tools, label = 'Related tools' }) {
    return _jsx("ul", { className: "b10x-related", "aria-label": label, children: tools.map((tool) => _jsx("li", { children: _jsxs(Link, { className: "b10x-related__card", to: tool.href, children: [_jsx("span", { className: "b10x-mark", "aria-hidden": "true", children: tool.mark ?? tool.name.slice(0, 1) }), _jsxs("span", { className: "b10x-related__copy", children: [_jsx("strong", { children: tool.name }), _jsx("span", { children: tool.description })] }), tool.status && _jsx(StatusBadge, { status: tool.status }), _jsx("span", { className: "b10x-related__arrow", "aria-hidden": "true", children: "\u2192" })] }) }, tool.name)) });
}
export function ProductHero({ eyebrow, promise, lede, actions = [], meta, aside }) {
    const lines = promise.length > 1 ? promise.slice(0, -1) : [];
    const emphasis = promise[promise.length - 1];
    return _jsxs("section", { className: ['b10x-hero', aside ? '' : 'b10x-hero--solo'].filter(Boolean).join(' '), "aria-labelledby": "b10x-hero-title", children: [_jsxs("div", { className: "b10x-hero__copy", children: [eyebrow && _jsxs("p", { className: "b10x-kicker", children: [_jsx("span", { className: "b10x-kicker__dot", "aria-hidden": "true" }), eyebrow] }), _jsxs("h1", { id: "b10x-hero-title", children: [lines.map((line) => _jsxs("span", { children: [line, _jsx("br", {})] }, line)), _jsx("em", { children: emphasis })] }), _jsx("p", { className: "b10x-hero__lede", children: lede }), actions.length > 0 && _jsx("div", { className: "b10x-hero__actions", children: actions.map((action) => _jsxs(Link, { to: action.href, className: action.kind === 'primary' ? 'b10x-button' : 'b10x-text-link', children: [action.label, " ", _jsx("span", { "aria-hidden": "true", children: action.kind === 'primary' ? '→' : action.href.startsWith('#') ? '↓' : '→' })] }, action.href)) }), meta && _jsx("p", { className: "b10x-hero__meta", children: meta })] }), aside && _jsx("div", { className: "b10x-hero__aside", children: aside })] });
}
export function ProductSection({ id, number, eyebrow, title, lede, children }) {
    // Register the anchor so Docusaurus link checking knows `#id` exists.
    const links = useBrokenLinks();
    if (id)
        links.collectAnchor(id);
    const titleId = id ? `${id}-title` : undefined;
    const kicker = [number !== undefined ? String(number).padStart(2, '0') : undefined, eyebrow].filter(Boolean).join(' / ');
    return _jsxs("section", { className: "b10x-product-section", id: id, "aria-labelledby": titleId, children: [_jsxs("header", { className: "b10x-product-section__header", children: [kicker && _jsx("p", { className: "b10x-kicker", children: kicker }), _jsx("h2", { id: titleId, children: title }), lede && _jsx("p", { className: "b10x-product-section__lede", children: lede })] }), children] });
}
export function ProductLanding({ data }) {
    const terminal = data.product.terminal;
    return _jsxs("div", { className: "b10x-product", children: [_jsx(ProductHero, { eyebrow: data.product.eyebrow, promise: data.product.promise, lede: data.product.lede, actions: data.product.actions, meta: data.product.meta, aside: terminal !== undefined ? _jsx(Terminal, { session: terminal, tilt: true, caption: data.product.terminalCaption }) : undefined }), data.sections.map((section, index) => _jsx(ProductSection, { id: sectionId(data.sections, index), number: index + 1, eyebrow: section.eyebrow, title: section.title, lede: section.lede, children: _jsx(LandingSection, { section: section }) }, `${section.kind}-${index}`))] });
}
function LandingSection({ section }) {
    switch (section.kind) {
        case 'features': return _jsx(FeatureGrid, { items: section.items });
        case 'flow': return _jsx(Flow, { steps: section.steps });
        case 'status': return _jsx(StatusStrip, { items: section.items });
        case 'related': return _jsx(RelatedTools, { tools: section.tools });
        case 'terminal': return _jsx(Terminal, { session: section.session });
        case 'protocol-graph': return _jsx(ProtocolGraph, { data: section.data, caption: section.caption });
        case 'domain-graph': return _jsx(DomainGraph, { data: section.data, caption: section.caption });
        default: return null;
    }
}
const SECTION_IDS = { features: 'what', flow: 'how', status: 'status', related: 'related', terminal: 'try', 'protocol-graph': 'protocol', 'domain-graph': 'domain' };
function sectionId(sections, index) {
    const base = SECTION_IDS[sections[index].kind];
    const earlier = sections.slice(0, index).filter((section) => section.kind === sections[index].kind).length;
    return earlier ? `${base}-${earlier + 1}` : base;
}
