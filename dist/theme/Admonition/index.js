import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Status admonitions. `:::shipped[Claim evaluation]`, `:::planned`, `:::decided`, or any admonition
 * whose title starts with Shipped, Decided or Planned, takes the status tone, glyph and badge.
 * Every other admonition renders unchanged.
 */
import { isValidElement } from 'react';
import InitAdmonition from '@theme-init/Admonition';
import { StatusBadge } from '../../components.js';
const STATUSES = ['shipped', 'decided', 'planned'];
function plainText(node) {
    if (typeof node === 'string' || typeof node === 'number')
        return String(node);
    if (Array.isArray(node)) {
        const parts = node.map(plainText);
        return parts.every((part) => part !== undefined) ? parts.join('') : undefined;
    }
    if (isValidElement(node))
        return plainText(node.props.children);
    return undefined;
}
/** The status an admonition declares by its type or title, and the rest of its title. */
export function admonitionStatus(type, title) {
    if (type && STATUSES.includes(type))
        return { status: type, rest: plainText(title) };
    const text = plainText(title)?.trim();
    const match = text ? /^(shipped|decided|planned)\b\s*[:·—–-]?\s*(.*)$/i.exec(text) : null;
    return match ? { status: match[1].toLowerCase(), rest: match[2] || undefined } : undefined;
}
export default function Admonition(props) {
    const declared = admonitionStatus(props.type, props.title);
    if (!declared)
        return _jsx(InitAdmonition, { ...props });
    const title = _jsxs("span", { className: "b10x-admonition__title", children: [_jsx(StatusBadge, { status: declared.status }), declared.rest && _jsx("span", { className: "b10x-admonition__rest", children: declared.rest })] });
    return _jsx(InitAdmonition, { ...props, type: "note", icon: null, title: title, className: ['b10x-admonition', `b10x-admonition--${declared.status}`, props.className].filter(Boolean).join(' ') });
}
