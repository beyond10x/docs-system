declare module '@theme/CodeBlock' {
  import type {ComponentType, ReactNode} from 'react';
  const CodeBlock: ComponentType<{language?: string; title?: string; showLineNumbers?: boolean; children: ReactNode}>;
  export default CodeBlock;
}

declare module '@theme/Mermaid' {
  import type {ComponentType} from 'react';
  const Mermaid: ComponentType<{value: string}>;
  export default Mermaid;
}

declare module '@docusaurus/Link' {
  import type {AnchorHTMLAttributes, ComponentType} from 'react';
  const Link: ComponentType<AnchorHTMLAttributes<HTMLAnchorElement> & {to?: string; href?: string}>;
  export default Link;
}

declare module '@theme/Layout' {
  import type {ComponentType, ReactNode} from 'react';
  const Layout: ComponentType<{title?: string; description?: string; wrapperClassName?: string; children?: ReactNode}>;
  export default Layout;
}

declare module '@theme-init/MDXComponents' {
  import type {ComponentType} from 'react';
  const MDXComponents: Record<string, ComponentType<never> | string>;
  export default MDXComponents;
}

declare module '@docusaurus/useBrokenLinks' {
  export default function useBrokenLinks(): {collectAnchor(anchor: string | undefined): void; collectLink(link: string | undefined): void};
}
