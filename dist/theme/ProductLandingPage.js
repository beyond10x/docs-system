import { jsx as _jsx } from "react/jsx-runtime";
import ThemeLayout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { usePluginData } from '@docusaurus/useGlobalData';
import { ProductLanding } from '../product.js';
import { landingDescription, landingTitle } from '../product-data.js';
const Layout = ThemeLayout;
export default function ProductLandingPage({ landing }) {
    const { siteConfig } = useDocusaurusContext();
    const current = usePluginData('b10x-product-site')?.product;
    return _jsx(Layout, { title: landingTitle(landing.product, siteConfig.title), description: landingDescription(landing.product), wrapperClassName: "b10x-product-page", children: _jsx("main", { id: "b10x-product-main", children: _jsx(ProductLanding, { data: landing, current: current }) }) });
}
