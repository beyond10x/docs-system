/**
 * The not-found page: says the address has no page and links to the docs and the home page, in
 * place of the stock copy that only asks the reader to contact the site owner. It carries a meta
 * description like every other page, and `noindex` in place of a canonical link: a 404 has no
 * address of its own.
 */
import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {useAllDocsData} from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {PageMetadata} from '@docusaurus/theme-common';
import {docsEntry, NOT_FOUND_ROBOTS, notFoundDescription} from '../../../not-found.js';

export default function NotFoundContent({className}: {className?: string}): ReactNode {
  const docs = docsEntry(useAllDocsData());
  const {siteConfig} = useDocusaurusContext();
  return (
    <>
      <PageMetadata description={notFoundDescription(siteConfig.title)}>
        <meta name="robots" content={NOT_FOUND_ROBOTS} />
      </PageMetadata>
      <main className={['container margin-vert--xl b10x-not-found', className].filter(Boolean).join(' ')}>
        <div className="row">
          <div className="col col--6 col--offset-3">
            <p className="b10x-kicker">404</p>
            <h1 className="hero__title">Page not found</h1>
            <p>There is no page at this address. It may have moved, or the link that brought you here is out of date.</p>
            <p className="b10x-not-found__actions">
              {docs ? <Link className="b10x-button" to={docs}>Go to the documentation</Link> : null}
              <Link className={docs ? 'b10x-text-link' : 'b10x-button'} to="/">Back to the home page</Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
