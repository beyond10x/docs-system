import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Children, isValidElement, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import useBrokenLinks from '@docusaurus/useBrokenLinks';
import CodeBlock from '@theme/CodeBlock';
import { DomainGraph, ProtocolGraph } from './charts.js';
import { StatusBadge, StatusGlyph, Truth } from './components.js';
import { buildHref, buildLabel, FAMILY, familyMembers, isFamilyRelatedTool, relationPhrase } from './family.js';
import { landingKpis, parseCaseDocument, parseCodePairDocument, parseStatusDocument, parseTerminalSession, parseTranscript } from './product-data.js';
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
    return _jsxs("figure", { ref: figure, className: ['b10x-terminal', tilt && 'b10x-terminal--tilt', gutter && 'b10x-terminal--gutter'].filter(Boolean).join(' '), "aria-label": label, children: [_jsxs("div", { className: "b10x-terminal__bar", children: [_jsxs("span", { className: "b10x-terminal__lights", "aria-hidden": "true", children: [_jsx("i", {}), _jsx("i", {}), _jsx("i", {})] }), _jsx("span", { className: "b10x-terminal__title", children: label }), _jsx("button", { type: "button", className: "b10x-terminal__copy", onClick: copy, "aria-describedby": statusId, children: copied ? 'Copied' : 'Copy commands' }), _jsx("span", { className: "b10x-sr-only", role: "status", id: statusId, children: copied ? 'Commands copied to the clipboard' : '' })] }), _jsx("pre", { className: "b10x-terminal__body", tabIndex: 0, children: _jsx("code", { children: resolved.entries.map((entry, index) => _jsx(TerminalLines, { entry: entry, prompt: prompt, shown: progress?.[index], last: index === resolved.entries.length - 1, gutter: gutter, tones: resolved.tones }, index)) }) }), (footer || summary) && _jsxs("figcaption", { className: "b10x-terminal__foot", children: [footer && _jsxs(_Fragment, { children: [_jsx("span", { className: "b10x-terminal__dot", "aria-hidden": "true" }), _jsx("span", { className: "b10x-terminal__provenance", children: footer })] }), summary && _jsx("span", { className: "b10x-terminal__summary", children: summary })] })] });
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
export function Feature({ title, description, href, status, icon, children }) {
    return _jsxs("li", { className: ['b10x-feature', icon && 'b10x-feature--icon'].filter(Boolean).join(' '), children: [icon && _jsx(KindIcon, { kind: icon }), _jsx("h3", { children: href ? _jsx(Link, { to: href, children: title }) : title }), status && _jsx(StatusBadge, { status: status }), description && _jsx("p", { children: description }), children && _jsx("div", { className: "b10x-feature__body", children: children })] });
}
/** A protocol kind's glyph as a 16 px icon in the kind colour (the same glyph as kind chips and legends). */
export function KindIcon({ kind, label }) {
    return _jsx("span", { className: `b10x-kind-icon b10x-kind-icon--${kind}`, role: label ? 'img' : undefined, "aria-label": label, "aria-hidden": label ? undefined : true });
}
/** Columns that leave no orphan row for common counts. */
export function featureColumns(count) {
    if (count === 4 || count <= 2)
        return 2;
    if (count === 7 || count === 8)
        return 4;
    return 3;
}
export function FeatureGrid({ items, children, columns, label = 'What it does' }) {
    const count = (items?.length ?? 0) + Children.toArray(children).filter(isValidElement).length;
    const resolved = columns ?? featureColumns(count);
    return _jsxs("ol", { className: `b10x-feature-grid b10x-feature-grid--${resolved}`, "aria-label": label, children: [items?.map((item) => _jsx(Feature, { ...item }, item.title)), children] });
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
function statusGroups(items) {
    return STATUS_ORDER.map((status) => ({ status, items: items.filter((item) => item.status === status) })).filter((group) => group.items.length > 0);
}
/** The proportion bar and its legend: counts per status, glyph and word beside every colour. */
export function StatusSummary({ items }) {
    const groups = statusGroups(items);
    const summary = groups.map(({ status, items: members }) => `${members.length} ${STATUS_LABELS[status].toLowerCase()}`).join(', ');
    return _jsxs(_Fragment, { children: [_jsx("div", { className: "b10x-status-strip__bar", role: "img", "aria-label": `${items.length} capabilities: ${summary}`, children: groups.map(({ status, items: members }) => _jsx("span", { className: `b10x-status-strip__segment b10x-status-strip__segment--${status}`, style: { flexGrow: members.length } }, status)) }), _jsx("ul", { className: "b10x-status-strip__legend", "aria-hidden": "true", children: groups.map(({ status, items: members }) => _jsxs("li", { children: [_jsx(StatusBadge, { status: status }), _jsx("strong", { children: members.length })] }, status)) })] });
}
function StatusProvenance({ asOf, source }) {
    if (!asOf && !source)
        return null;
    return _jsx("p", { className: "b10x-status-strip__source", children: [asOf && `As of ${asOf}`, source].filter(Boolean).join(' · ') });
}
/** What exists today and what does not, counted from the items themselves and grouped by state. */
export function StatusStrip({ items, label = 'Status', groupLabels = {}, asOf, source }) {
    const groups = statusGroups(items);
    return _jsxs("section", { className: "b10x-status-strip", "aria-label": label, children: [_jsx(StatusSummary, { items: items }), groups.map(({ status, items: members }) => _jsxs("div", { className: `b10x-status-strip__group b10x-status-strip__group--${status}`, children: [_jsx("p", { className: "b10x-status-strip__group-title", children: groupLabels[status] ?? STATUS_GROUP_LABELS[status] }), _jsx("ul", { className: "b10x-status-strip__items", children: members.map((item) => _jsxs("li", { children: [_jsx(StatusBadge, { status: item.status }), _jsx("span", { className: "b10x-status-strip__label", children: item.href ? _jsx(Link, { to: item.href, children: item.label }) : item.label }), item.detail && _jsx("span", { className: "b10x-status-strip__detail", children: item.detail })] }, item.label)) })] }, status)), _jsx(StatusProvenance, { asOf: asOf, source: source })] });
}
/**
 * The status page table: every item with its badge and detail, grouped by area when the file has
 * areas, under the same proportion bar as the landing strip.
 */
export function StatusTable({ data, label = 'Status of every capability', only }) {
    const parsed = useMemo(() => {
        try {
            return { document: parseStatusDocument(data) };
        }
        catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }, [data]);
    if ('error' in parsed)
        return _jsxs("aside", { className: "b10x-callout b10x-callout--danger", role: "alert", children: [_jsx("p", { className: "b10x-callout__title b10x-eyebrow", children: "Cannot render status table" }), _jsx("div", { className: "b10x-callout__content", children: _jsx("p", { children: _jsx("code", { children: parsed.error }) }) })] });
    const items = parsed.document.items.filter((item) => !only || only.includes(item.status));
    // Array.from, not a spread: the site's loose Babel transform turns a spread Set into [Set].
    const areas = Array.from(new Set(items.map((item) => item.area ?? '')));
    const grouped = areas.some(Boolean);
    const row = (item) => _jsxs("tr", { children: [_jsx("th", { scope: "row", children: item.href ? _jsx(Link, { to: item.href, children: item.label }) : item.label }), _jsx("td", { children: _jsx(StatusBadge, { status: item.status }) }), _jsx("td", { children: item.detail ?? '—' })] }, item.label);
    return _jsxs("section", { className: "b10x-status-table", "aria-label": label, children: [_jsx(StatusSummary, { items: items }), _jsx("div", { className: "b10x-table-wrap", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Capability" }), _jsx("th", { scope: "col", children: "Status" }), _jsx("th", { scope: "col", children: "Detail" })] }) }), grouped
                            ? areas.map((area) => _jsxs("tbody", { children: [_jsx("tr", { className: "b10x-status-table__area", children: _jsx("th", { scope: "rowgroup", colSpan: 3, children: area || 'Other' }) }), items.filter((item) => (item.area ?? '') === area).map(row)] }, area || 'other'))
                            : _jsx("tbody", { children: items.map(row) })] }) }), _jsx(StatusProvenance, { asOf: parsed.document.asOf, source: parsed.document.source })] });
}
export function RelatedTools({ tools, label = 'Related tools', current }) {
    return _jsx("ul", { className: "b10x-related", "aria-label": label, children: tools.map((tool) => {
            if (isFamilyRelatedTool(tool)) {
                const member = FAMILY[tool.id];
                if (!member)
                    throw new Error(`RelatedTools: unknown family id ${JSON.stringify(tool.id)}`);
                return _jsx("li", { children: _jsxs(Link, { className: `b10x-related__card b10x-related__card--family b10x-family--${member.id}`, to: member.url, children: [_jsx("span", { className: "b10x-mark b10x-mark--family", "aria-hidden": "true", children: member.mark }), _jsxs("span", { className: "b10x-related__copy", children: [_jsx("strong", { children: member.name }), _jsx("span", { children: member.description }), _jsxs("span", { className: "b10x-related__relation", children: [relationPhrase(tool.relation, current), tool.via && _jsxs(_Fragment, { children: [" ", _jsx("span", { "aria-hidden": "true", children: "\u2192" }), " ", tool.via] })] })] }), _jsx("span", { className: "b10x-related__arrow", "aria-hidden": "true", children: "\u2192" })] }) }, member.id);
            }
            return _jsx("li", { children: _jsxs(Link, { className: "b10x-related__card", to: tool.href, children: [_jsx("span", { className: "b10x-mark", "aria-hidden": "true", children: tool.mark ?? tool.name.slice(0, 1) }), _jsxs("span", { className: "b10x-related__copy", children: [_jsx("strong", { children: tool.name }), _jsx("span", { children: tool.description })] }), tool.status && _jsx(StatusBadge, { status: tool.status }), _jsx("span", { className: "b10x-related__arrow", "aria-hidden": "true", children: "\u2192" })] }) }, tool.name);
        }) });
}
/** Every family product as a chip, the current one highlighted. Rendered in the product-site footer. */
export function FamilyStrip({ current, label = 'beyond10x tools' }) {
    return _jsxs("nav", { className: "b10x-family-strip", "aria-label": label, children: [_jsx("p", { className: "b10x-family-strip__label", "aria-hidden": "true", children: label }), _jsx("ul", { children: familyMembers().map((member) => _jsx("li", { children: _jsxs("a", { className: ['b10x-family-chip', `b10x-family--${member.id}`, member.id === current && 'is-current'].filter(Boolean).join(' '), href: member.url, "aria-current": member.id === current ? 'true' : undefined, title: member.tagline, children: [_jsx("span", { className: "b10x-mark b10x-mark--family b10x-mark--small", "aria-hidden": "true", children: member.mark }), member.name, member.id === current && _jsx("span", { className: "b10x-sr-only", children: " (this site)" })] }) }, member.id)) })] });
}
/** "This build: docs-system 929f965", linked to the commit when it is one. */
export function BuildLine({ build }) {
    const href = buildHref(build);
    return _jsxs("p", { className: "b10x-build-line", children: [_jsx("span", { className: "b10x-build-line__label", children: "This build" }), href ? _jsx("a", { href: href, children: buildLabel(build) }) : _jsx("span", { children: buildLabel(build) })] });
}
/** The navbar product switcher: a disclosure next to the wordmark listing the family. */
export function ProductSwitcher({ current }) {
    const ref = useRef(null);
    useEffect(() => {
        const close = (event) => {
            const element = ref.current;
            if (!element?.open)
                return;
            if (event instanceof KeyboardEvent ? event.key === 'Escape' : !element.contains(event.target)) {
                element.open = false;
                if (event instanceof KeyboardEvent)
                    element.querySelector('summary')?.focus();
            }
        };
        document.addEventListener('pointerdown', close);
        document.addEventListener('keydown', close);
        return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
    }, []);
    return _jsxs("details", { className: "b10x-product-switcher", ref: ref, children: [_jsx("summary", { className: "b10x-product-switcher__toggle", "aria-label": "Switch to another beyond10x tool", children: _jsx("svg", { viewBox: "0 0 12 12", "aria-hidden": "true", children: _jsx("path", { d: "M3 4.5 6 7.5 9 4.5" }) }) }), _jsx("ul", { className: "b10x-product-switcher__panel", children: familyMembers().map((member) => _jsx("li", { children: _jsxs("a", { className: ['b10x-product-switcher__item', `b10x-family--${member.id}`, member.id === current && 'is-current'].filter(Boolean).join(' '), href: member.url, "aria-current": member.id === current ? 'true' : undefined, children: [_jsx("span", { className: "b10x-mark b10x-mark--family", "aria-hidden": "true", children: member.mark }), _jsxs("span", { className: "b10x-product-switcher__copy", children: [_jsx("strong", { children: member.name }), _jsx("span", { children: member.tagline })] }), member.id === current && _jsx("span", { className: "b10x-product-switcher__here", children: "You are here" })] }) }, member.id)) })] });
}
export function ProductHero({ eyebrow, promise, lede, actions = [], meta, aside, kpis, titleId = 'b10x-hero-title' }) {
    const lines = promise.length > 1 ? promise.slice(0, -1) : [];
    const emphasis = promise[promise.length - 1];
    return _jsxs("section", { className: ['b10x-hero', aside ? '' : 'b10x-hero--solo'].filter(Boolean).join(' '), "aria-labelledby": titleId, children: [_jsxs("div", { className: "b10x-hero__copy", children: [eyebrow && _jsxs("p", { className: "b10x-kicker", children: [_jsx("span", { className: "b10x-kicker__dot", "aria-hidden": "true" }), eyebrow] }), _jsxs("h1", { id: titleId, children: [lines.map((line) => _jsxs("span", { children: [line, _jsx("br", {})] }, line)), _jsx("em", { children: emphasis })] }), _jsx("p", { className: "b10x-hero__lede", children: lede }), actions.length > 0 && _jsx("div", { className: "b10x-hero__actions", children: actions.map((action) => _jsxs(Link, { to: action.href, className: action.kind === 'primary' ? 'b10x-button' : 'b10x-text-link', children: [action.label, " ", _jsx("span", { "aria-hidden": "true", children: action.kind === 'primary' ? '→' : action.href.startsWith('#') ? '↓' : '→' })] }, action.href)) }), meta && _jsx("p", { className: "b10x-hero__meta", children: meta })] }), aside && _jsx("div", { className: "b10x-hero__aside", children: aside }), kpis && kpis.length > 0 && _jsx(KpiRow, { items: kpis })] });
}
/** Numbered KPI tiles. Values are counted from data (see `landingKpis`), never typed. */
export function KpiRow({ items, label = 'Key figures' }) {
    return _jsx("dl", { className: "b10x-kpis", "aria-label": label, style: { '--b10x-kpi-count': items.length }, children: items.map((item, index) => _jsxs("div", { className: `b10x-kpi b10x-kpi--${item.tone}`, children: [_jsxs("dt", { className: "b10x-kpi__label", children: [_jsx("span", { className: "b10x-kpi__index", "aria-hidden": "true", children: String(index + 1).padStart(2, '0') }), item.tone !== 'product' && _jsx(StatusGlyph, { status: item.tone, className: "b10x-kpi__glyph" }), item.label] }), _jsx("dd", { className: "b10x-kpi__value", children: item.value })] }, `${item.count}-${index}`)) });
}
/** The hero aside drawn from the product's own data. */
export function HeroArt({ art }) {
    const body = (() => {
        switch (art.kind) {
            case 'terminal': return _jsx(Terminal, { session: art.session, tilt: true, animate: true, caption: art.caption });
            case 'protocol-graph': return _jsx(ProtocolGraph, { data: art.data, variant: "hero", caption: art.caption });
            case 'domain-graph': return _jsx(DomainGraph, { data: art.data, variant: "hero", caption: art.caption });
            case 'case': return _jsx(CaseCard, { data: art.data, caption: art.caption });
            case 'code-pair': return _jsx(CodePair, { data: art.data, caption: art.caption });
            default: return null;
        }
    })();
    return _jsx("div", { className: `b10x-hero-art b10x-hero-art--${art.kind}`, children: body });
}
function DataError({ kind, message }) {
    return _jsxs("aside", { className: "b10x-callout b10x-callout--danger", role: "alert", children: [_jsxs("p", { className: "b10x-callout__title b10x-eyebrow", children: ["Cannot render ", kind] }), _jsx("div", { className: "b10x-callout__content", children: _jsx("p", { children: _jsx("code", { children: message }) }) })] });
}
function useParsed(data, parse) {
    return useMemo(() => {
        try {
            return { value: parse(data) };
        }
        catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }, [data, parse]);
}
const STATE_GLYPHS = { blocked: '⊘', legitimate: '✓', admissible: '○', inadmissible: '⊘', earned: '✓' };
/**
 * A case evaluated more than once, frame by frame: claims as truth chips, outcome and action states
 * as neutral outlined chips (they are not truth values). From a `b10x-case/1` recording.
 */
export function CaseCard({ data, caption }) {
    const parsed = useParsed(data, parseCaseDocument);
    if ('error' in parsed)
        return _jsx(DataError, { kind: "case card", message: parsed.error });
    const document = parsed.value;
    return _jsxs("figure", { className: "b10x-case", "aria-label": `Case ${document.case}${document.protocol ? ` under ${document.protocol}` : ''}`, children: [_jsxs("p", { className: "b10x-case__kicker", children: ["Case ", _jsx("code", { children: document.case }), document.protocol && _jsxs(_Fragment, { children: [" \u00B7 ", _jsx("code", { children: document.protocol })] })] }), _jsx("ol", { className: "b10x-case__frames", style: { '--b10x-case-frames': document.frames.length }, children: document.frames.map((frame, index) => _jsxs("li", { className: ['b10x-case__frame', frame.current && 'is-current'].filter(Boolean).join(' '), children: [_jsxs("p", { className: "b10x-case__label", children: [frame.label, frame.current && _jsx("span", { className: "b10x-case__current", children: " \u00B7 current" })] }), _jsxs("ul", { className: "b10x-case__rows", children: [frame.claims?.map((claim) => _jsxs("li", { children: [_jsx("code", { children: claim.name }), _jsx(Truth, { value: claim.value })] }, `c-${claim.name}`)), frame.outcomes?.map((outcome) => _jsxs("li", { children: [_jsx("code", { children: outcome.name }), _jsxs("span", { className: "b10x-chip b10x-chip--state", children: [_jsx("span", { className: "b10x-chip__glyph", "aria-hidden": "true", children: STATE_GLYPHS[outcome.state] ?? '·' }), _jsx("span", { className: "b10x-chip__text", children: outcome.state })] })] }, `o-${outcome.name}`)), frame.actions?.map((action) => _jsxs("li", { children: [_jsx("code", { children: action.name }), _jsxs("span", { className: "b10x-chip b10x-chip--state", children: [_jsx("span", { className: "b10x-chip__glyph", "aria-hidden": "true", children: STATE_GLYPHS[action.state] ?? '·' }), _jsx("span", { className: "b10x-chip__text", children: action.state })] })] }, `a-${action.name}`))] }), frame.notes?.map((note) => _jsx("p", { className: "b10x-case__note", children: note }, note))] }, `${frame.label}-${index}`)) }), caption && _jsx("figcaption", { className: "b10x-case__caption", children: caption }), document.recordedWith && _jsx("p", { className: "b10x-case__source", children: document.recordedWith })] });
}
/** A source and what was generated from it, from a `b10x-code-pair/1` document. */
export function CodePair({ data, caption }) {
    const parsed = useParsed(data, parseCodePairDocument);
    if ('error' in parsed)
        return _jsx(DataError, { kind: "code pair", message: parsed.error });
    const document = parsed.value;
    return _jsxs("figure", { className: "b10x-code-pair", children: [_jsxs("div", { className: "b10x-code-pair__panes", children: [_jsx("div", { className: "b10x-code-pair__pane", children: _jsx(CodeBlock, { language: document.from.language, title: document.from.title, children: document.from.code.replace(/\s+$/, '') }) }), _jsxs("p", { className: "b10x-code-pair__via", children: [_jsx("span", { className: "b10x-code-pair__arrow", "aria-hidden": "true" }), document.via ? _jsx("code", { children: document.via }) : _jsx("span", { children: "generates" })] }), _jsx("div", { className: "b10x-code-pair__pane", children: _jsx(CodeBlock, { language: document.to.language, title: document.to.title, children: document.to.code.replace(/\s+$/, '') }) })] }), caption && _jsx("figcaption", { className: "b10x-code-pair__caption", children: caption }), document.recordedWith && _jsx("p", { className: "b10x-code-pair__source", children: document.recordedWith })] });
}
export function ProductSection({ id, number, eyebrow, title, lede, kind, children }) {
    // Register the anchor so Docusaurus link checking knows `#id` exists.
    const links = useBrokenLinks();
    if (id)
        links.collectAnchor(id);
    const titleId = id ? `${id}-title` : undefined;
    const kicker = [number !== undefined ? String(number).padStart(2, '0') : undefined, eyebrow].filter(Boolean).join(' / ');
    return _jsxs("section", { className: ['b10x-product-section', kind && `b10x-product-section--${kind}`].filter(Boolean).join(' '), id: id, "aria-labelledby": titleId, children: [_jsxs("header", { className: "b10x-product-section__header", children: [kicker && _jsx("p", { className: "b10x-kicker", children: kicker }), _jsx("h2", { id: titleId, children: title }), lede && _jsx("p", { className: "b10x-product-section__lede", children: lede })] }), children] });
}
/** The landing hero: art from `product.art` (or the older `product.terminal`) and the KPI row. */
export function LandingHero({ data, titleId }) {
    const { product } = data;
    const art = product.art ?? (product.terminal !== undefined ? { kind: 'terminal', session: product.terminal, ...(product.terminalCaption ? { caption: product.terminalCaption } : {}) } : undefined);
    const kpis = useMemo(() => landingKpis(data), [data]);
    return _jsx(ProductHero, { eyebrow: product.eyebrow, promise: product.promise, lede: product.lede, actions: product.actions, meta: product.meta, aside: art ? _jsx(HeroArt, { art: art }) : undefined, kpis: kpis, titleId: titleId });
}
export function ProductLanding({ data, current }) {
    return _jsxs("div", { className: "b10x-product", children: [_jsx(LandingHero, { data: data }), data.sections.map((section, index) => _jsx(ProductSection, { id: sectionId(data.sections, index), number: index + 1, eyebrow: section.eyebrow, title: section.title, lede: section.lede, kind: section.kind, children: _jsx(LandingSection, { section: section, current: current }) }, `${section.kind}-${index}`))] });
}
function LandingSection({ section, current }) {
    switch (section.kind) {
        case 'features': return _jsx(FeatureGrid, { items: section.items });
        case 'flow': return _jsx(Flow, { steps: section.steps });
        case 'status': return typeof section.items === 'string' ? _jsx(DataError, { kind: "status", message: `status file ${section.items} was not read; the product-site plugin reads it at build time` }) : _jsx(StatusStrip, { items: section.items, asOf: section.asOf, source: section.source });
        case 'related': return _jsx(RelatedTools, { tools: section.tools, current: current });
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
