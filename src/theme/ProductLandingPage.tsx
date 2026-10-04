/** Route component for the landing page the product-site plugin adds. Swizzle to customise. */
import type {ComponentType, ReactNode} from 'react';
import ThemeLayout from '@theme/Layout';
import {ProductLanding} from '../product.js';
import type {ProductLandingData} from '../product-data.js';

const Layout = ThemeLayout as unknown as ComponentType<{title?: string; description?: string; wrapperClassName?: string; children?: ReactNode}>;

export default function ProductLandingPage({landing}: {landing: ProductLandingData}): ReactNode {
  return <Layout title={`${landing.product.name} — ${landing.product.promise.join(' ')}`} description={landing.product.lede} wrapperClassName="b10x-product-page">
    <main id="b10x-product-main">
      <ProductLanding data={landing} />
    </main>
  </Layout>;
}
