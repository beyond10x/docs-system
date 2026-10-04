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

declare module '@theme-init/NavbarItem' {
  import type {ComponentType} from 'react';
  const NavbarItem: ComponentType<Record<string, unknown>>;
  export default NavbarItem;
}

declare module '@docusaurus/router' {
  export function useLocation(): {pathname: string; search: string; hash: string};
}

declare module '@docusaurus/useDocusaurusContext' {
  export default function useDocusaurusContext(): {siteConfig: {baseUrl: string; themeConfig: unknown}};
}

declare module '@docusaurus/useGlobalData' {
  export default function useGlobalData(): Record<string, unknown>;
  export function usePluginData(pluginName: string, pluginId?: string, options?: {failfast?: boolean}): unknown;
}

declare module '@theme-init/Admonition' {
  import type {ComponentType} from 'react';
  const Admonition: ComponentType<Record<string, unknown>>;
  export default Admonition;
}

declare module '@docusaurus/ErrorBoundary' {
  import type {ComponentType, ReactNode} from 'react';
  const ErrorBoundary: ComponentType<{fallback?: (params: Record<string, unknown>) => ReactNode; children?: ReactNode}>;
  export default ErrorBoundary;
}

declare module '@theme-init/Footer/Layout' {
  import type {ComponentType, ReactNode} from 'react';
  const FooterLayout: ComponentType<{style?: 'dark' | 'light'; links?: ReactNode; logo?: ReactNode; copyright?: ReactNode}>;
  export default FooterLayout;
}

declare module '@theme-init/Navbar/Logo' {
  import type {ComponentType} from 'react';
  const NavbarLogo: ComponentType<Record<string, unknown>>;
  export default NavbarLogo;
}

declare module '@theme-init/DocItem/Content' {
  import type {ComponentType, ReactNode} from 'react';
  const DocItemContent: ComponentType<{children?: ReactNode}>;
  export default DocItemContent;
}

declare module '@theme/MDXContent' {
  import type {ComponentType, ReactNode} from 'react';
  const MDXContent: ComponentType<{children?: ReactNode}>;
  export default MDXContent;
}

declare module '@docusaurus/plugin-content-docs/client' {
  export function useDoc(): {metadata: {title: string; permalink: string; id: string}; frontMatter: Record<string, unknown>; contentTitle?: string};
  export function useDocsSidebar(): {name: string; items: unknown[]} | null;
}
