/** Route component for the landing page the product-site plugin adds. Swizzle to customise. */
import type {ComponentType, ReactNode} from 'react';
import ThemeLayout from '@theme/Layout';
import {usePluginData} from '@docusaurus/useGlobalData';
import {ProductLanding} from '../product.js';
import type {ProductLandingData} from '../product-data.js';
import type {ProductSiteGlobalData} from '../family.js';

const Layout = ThemeLayout as unknown as ComponentType<{title?: string; description?: string; wrapperClassName?: string; children?: ReactNode}>;

export default function ProductLandingPage({landing}: {landing: ProductLandingData}): ReactNode {
  const current = (usePluginData('b10x-product-site') as ProductSiteGlobalData | undefined)?.product;
  return <Layout title={`${landing.product.name} — ${landing.product.promise.join(' ')}`} description={landing.product.lede} wrapperClassName="b10x-product-page">
    <main id="b10x-product-main">
      <ProductLanding data={landing} current={current} />
    </main>
  </Layout>;
}
