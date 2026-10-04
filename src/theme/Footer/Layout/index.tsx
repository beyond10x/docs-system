/**
 * The product-site footer: the family strip with the current product highlighted, the site's own
 * link columns, and a bottom row with the copyright and the docs-system build it was rendered with.
 * Without the product-site plugin's data it renders exactly as the theme does.
 */
import type {ReactNode} from 'react';
import InitFooterLayout from '@theme-init/Footer/Layout';
import {usePluginData} from '@docusaurus/useGlobalData';
import {BuildLine, FamilyStrip} from '../../../product.js';
import type {ProductSiteGlobalData} from '../../../family.js';

interface FooterLayoutProps {style?: 'dark' | 'light'; links?: ReactNode; logo?: ReactNode; copyright?: ReactNode}

export default function FooterLayout(props: FooterLayoutProps): ReactNode {
  const data = usePluginData('b10x-product-site') as ProductSiteGlobalData | undefined;
  if (!data) return <InitFooterLayout {...props} />;
  return <footer className={['theme-layout-footer', 'footer', 'b10x-footer', props.style === 'dark' && 'footer--dark'].filter(Boolean).join(' ')}>
    <div className="container container-fluid">
      {data.product && <FamilyStrip current={data.product} />}
      {props.links}
      <div className="footer__bottom b10x-footer__bottom">
        {props.logo && <div className="b10x-footer__logo">{props.logo}</div>}
        {props.copyright && <div className="b10x-footer__copyright">{props.copyright}</div>}
        {data.build && <BuildLine build={data.build} />}
      </div>
    </div>
  </footer>;
}
