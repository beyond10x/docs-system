/** Route component for the landing page the product-site plugin adds. Swizzle to customise. */
import type { ReactNode } from 'react';
import type { ProductLandingData } from '../product-data.js';
export default function ProductLandingPage({ landing }: {
    landing: ProductLandingData;
}): ReactNode;
