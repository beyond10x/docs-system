/**
 * Documentation pages with `status`, `lede` or `source` in their front matter open with a page
 * header: kicker (sidebar category and position), title, lede, status badge and source line. Pages
 * without those keys render exactly as the theme does.
 */
import type {ReactNode} from 'react';
import InitDocItemContent from '@theme-init/DocItem/Content';
import MDXContent from '@theme/MDXContent';
import {useDoc, useDocsSidebar} from '@docusaurus/plugin-content-docs/client';
import {StatusBadge} from '../../../components.js';
import {docHeaderFields, docKicker, sidebarPosition} from '../../../doc-header.js';
import type {SidebarItemLike} from '../../../doc-header.js';

export default function DocItemContent({children}: {children?: ReactNode}): ReactNode {
  const {metadata, frontMatter, contentTitle} = useDoc();
  const sidebar = useDocsSidebar();
  const fields = docHeaderFields(frontMatter as Record<string, unknown>);
  if (!fields) return <InitDocItemContent>{children}</InitDocItemContent>;
  const kicker = docKicker(sidebarPosition(sidebar?.items as SidebarItemLike[] | undefined, metadata.permalink), fields.kicker);
  return <div className={['theme-doc-markdown', 'markdown', 'b10x-doc--headed', contentTitle !== undefined && 'b10x-doc--own-title'].filter(Boolean).join(' ')}>
    <header className="b10x-doc-header">
      {kicker && <p className="b10x-kicker"><span className="b10x-kicker__dot" aria-hidden="true" />{kicker}</p>}
      <h1>{metadata.title}</h1>
      {fields.lede && <p className="b10x-doc-header__lede">{fields.lede}</p>}
      {(fields.status || fields.source) && <p className="b10x-doc-header__meta">
        {fields.status && <StatusBadge status={fields.status} />}
        {fields.source && <span className="b10x-doc-header__source">{fields.source_url ? <a href={fields.source_url}>{fields.source}</a> : fields.source}</span>}
      </p>}
    </header>
    <MDXContent>{children}</MDXContent>
  </div>;
}
