/**
 * Mermaid themed from the product tokens. Docusaurus passes one `options` object for both colour
 * modes, so this renderer builds the `base` theme variables per mode itself. Registered by
 * `withProductSite` only when the site uses `@docusaurus/theme-mermaid`.
 */
import {useEffect, useMemo, useRef} from 'react';
import type {ReactNode} from 'react';
import ErrorBoundary from '@docusaurus/ErrorBoundary';
import {ErrorBoundaryErrorMessageFallback, useColorMode} from '@docusaurus/theme-common';
import {MermaidContainerClassName, useMermaidConfig, useMermaidRenderResult} from '@docusaurus/theme-mermaid/client';
import {mermaidThemeVariables} from '../../product-palette.js';

function MermaidRenderer({value}: {value: string}): ReactNode {
  const {colorMode} = useColorMode();
  const base = useMermaidConfig();
  const config = useMemo(() => ({
    ...base,
    theme: 'base' as const,
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    themeVariables: {...mermaidThemeVariables(colorMode === 'dark' ? 'dark' : 'light'), ...((base as {themeVariables?: Record<string, string | boolean>}).themeVariables ?? {})},
  }), [base, colorMode]);
  const result = useMermaidRenderResult({text: value, config});
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (result && ref.current) result.bindFunctions?.(ref.current); }, [result]);
  if (result === null) return null;
  return <div ref={ref} className={`${MermaidContainerClassName} b10x-mermaid`} dangerouslySetInnerHTML={{__html: result.svg}} />;
}

export default function Mermaid(props: {value: string}): ReactNode {
  return <ErrorBoundary fallback={(params) => <ErrorBoundaryErrorMessageFallback {...(params as unknown as Parameters<typeof ErrorBoundaryErrorMessageFallback>[0])} />}><MermaidRenderer {...props} /></ErrorBoundary>;
}
