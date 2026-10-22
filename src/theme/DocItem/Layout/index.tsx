/**
 * The doc column keeps the theme's 75% width cap only when a table of contents can render beside
 * it. The theme reserves that quarter whenever `hide_table_of_contents` is unset, so a page without
 * headings, such as an ESS contract explorer, lost a quarter of its width to an empty column.
 */
import type {ReactNode} from 'react';
import InitDocItemLayout from '@theme-init/DocItem/Layout';
import {useDoc} from '@docusaurus/plugin-content-docs/client';

export default function DocItemLayout({children}: {children?: ReactNode}): ReactNode {
  const {frontMatter, toc} = useDoc();
  const layout = <InitDocItemLayout>{children}</InitDocItemLayout>;
  return frontMatter.hide_table_of_contents || toc.length > 0 ? layout : <div className="b10x-doc-item--no-toc">{layout}</div>;
}
