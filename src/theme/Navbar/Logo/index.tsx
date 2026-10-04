/**
 * The navbar wordmark, followed by the family switcher when the site names its product
 * (`withProductSite(config, {product: 'canon'})`). Otherwise the theme's logo, unchanged.
 */
import type {ReactNode} from 'react';
import InitNavbarLogo from '@theme-init/Navbar/Logo';
import {usePluginData} from '@docusaurus/useGlobalData';
import {ProductSwitcher} from '../../../product.js';
import type {ProductSiteGlobalData} from '../../../family.js';

export default function NavbarLogo(props: Record<string, unknown>): ReactNode {
  const data = usePluginData('b10x-product-site') as ProductSiteGlobalData | undefined;
  if (!data?.product) return <InitNavbarLogo {...props} />;
  return <>
    <InitNavbarLogo {...props} />
    <ProductSwitcher current={data.product} />
  </>;
}
