import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import InitDocItemContent from '@theme-init/DocItem/Content';
import MDXContent from '@theme/MDXContent';
import { useDoc, useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import { StatusBadge } from '../../../components.js';
import { docHeaderFields, docKicker, sidebarPosition } from '../../../doc-header.js';
export default function DocItemContent({ children }) {
    const { metadata, frontMatter, contentTitle } = useDoc();
    const sidebar = useDocsSidebar();
    const fields = docHeaderFields(frontMatter);
    if (!fields)
        return _jsx(InitDocItemContent, { children: children });
    const kicker = docKicker(sidebarPosition(sidebar?.items, metadata.permalink), fields.kicker);
    return _jsxs("div", { className: ['theme-doc-markdown', 'markdown', 'b10x-doc--headed', contentTitle !== undefined && 'b10x-doc--own-title'].filter(Boolean).join(' '), children: [_jsxs("header", { className: "b10x-doc-header", children: [kicker && _jsxs("p", { className: "b10x-kicker", children: [_jsx("span", { className: "b10x-kicker__dot", "aria-hidden": "true" }), kicker] }), _jsx("h1", { children: metadata.title }), fields.lede && _jsx("p", { className: "b10x-doc-header__lede", children: fields.lede }), (fields.status || fields.source) && _jsxs("p", { className: "b10x-doc-header__meta", children: [fields.status && _jsx(StatusBadge, { status: fields.status }), fields.source && _jsx("span", { className: "b10x-doc-header__source", children: fields.source_url ? _jsx("a", { href: fields.source_url, children: fields.source }) : fields.source })] })] }), _jsx(MDXContent, { children: children })] });
}
