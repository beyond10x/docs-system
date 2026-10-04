import { jsx as _jsx } from "react/jsx-runtime";
import ThemeLayout from '@theme/Layout';
import { usePluginData } from '@docusaurus/useGlobalData';
import { ProductLanding } from '../product.js';
const Layout = ThemeLayout;
export default function ProductLandingPage({ landing }) {
    const current = usePluginData('b10x-product-site')?.product;
    return _jsx(Layout, { title: `${landing.product.name} — ${landing.product.promise.join(' ')}`, description: landing.product.lede, wrapperClassName: "b10x-product-page", children: _jsx("main", { id: "b10x-product-main", children: _jsx(ProductLanding, { data: landing, current: current }) }) });
}
