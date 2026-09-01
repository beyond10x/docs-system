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
