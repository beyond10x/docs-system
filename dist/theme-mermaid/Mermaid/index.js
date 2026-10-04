import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Mermaid themed from the product tokens. Docusaurus passes one `options` object for both colour
 * modes, so this renderer builds the `base` theme variables per mode itself. Registered by
 * `withProductSite` only when the site uses `@docusaurus/theme-mermaid`.
 */
import { useEffect, useMemo, useRef } from 'react';
import ErrorBoundary from '@docusaurus/ErrorBoundary';
import { ErrorBoundaryErrorMessageFallback, useColorMode } from '@docusaurus/theme-common';
import { MermaidContainerClassName, useMermaidConfig, useMermaidRenderResult } from '@docusaurus/theme-mermaid/client';
import { mermaidThemeVariables } from '../../product-palette.js';
function MermaidRenderer({ value }) {
    const { colorMode } = useColorMode();
    const base = useMermaidConfig();
    const config = useMemo(() => ({
        ...base,
        theme: 'base',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        themeVariables: { ...mermaidThemeVariables(colorMode === 'dark' ? 'dark' : 'light'), ...(base.themeVariables ?? {}) },
    }), [base, colorMode]);
    const result = useMermaidRenderResult({ text: value, config });
    const ref = useRef(null);
    useEffect(() => { if (result && ref.current)
        result.bindFunctions?.(ref.current); }, [result]);
    if (result === null)
        return null;
    return _jsx("div", { ref: ref, className: `${MermaidContainerClassName} b10x-mermaid`, dangerouslySetInnerHTML: { __html: result.svg } });
}
export default function Mermaid(props) {
    return _jsx(ErrorBoundary, { fallback: (params) => _jsx(ErrorBoundaryErrorMessageFallback, { ...params }), children: _jsx(MermaidRenderer, { ...props }) });
}
