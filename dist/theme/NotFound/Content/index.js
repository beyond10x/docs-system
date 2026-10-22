import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import Link from '@docusaurus/Link';
import { useAllDocsData } from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { PageMetadata } from '@docusaurus/theme-common';
import { docsEntry, NOT_FOUND_ROBOTS, notFoundDescription } from '../../../not-found.js';
export default function NotFoundContent({ className }) {
    const docs = docsEntry(useAllDocsData());
    const { siteConfig } = useDocusaurusContext();
    return (_jsxs(_Fragment, { children: [_jsx(PageMetadata, { description: notFoundDescription(siteConfig.title), children: _jsx("meta", { name: "robots", content: NOT_FOUND_ROBOTS }) }), _jsx("main", { className: ['container margin-vert--xl b10x-not-found', className].filter(Boolean).join(' '), children: _jsx("div", { className: "row", children: _jsxs("div", { className: "col col--6 col--offset-3", children: [_jsx("p", { className: "b10x-kicker", children: "404" }), _jsx("h1", { className: "hero__title", children: "Page not found" }), _jsx("p", { children: "There is no page at this address. It may have moved, or the link that brought you here is out of date." }), _jsxs("p", { className: "b10x-not-found__actions", children: [docs ? _jsx(Link, { className: "b10x-button", to: docs, children: "Go to the documentation" }) : null, _jsx(Link, { className: docs ? 'b10x-text-link' : 'b10x-button', to: "/", children: "Back to the home page" })] })] }) }) })] }));
}
