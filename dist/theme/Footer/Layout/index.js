import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import InitFooterLayout from '@theme-init/Footer/Layout';
import { usePluginData } from '@docusaurus/useGlobalData';
import { BuildLine, FamilyStrip } from '../../../product.js';
export default function FooterLayout(props) {
    const data = usePluginData('b10x-product-site');
    if (!data)
        return _jsx(InitFooterLayout, { ...props });
    return _jsx("footer", { className: ['theme-layout-footer', 'footer', 'b10x-footer', props.style === 'dark' && 'footer--dark'].filter(Boolean).join(' '), children: _jsxs("div", { className: "container container-fluid", children: [data.product && _jsx(FamilyStrip, { current: data.product }), props.links, _jsxs("div", { className: "footer__bottom b10x-footer__bottom", children: [props.logo && _jsx("div", { className: "b10x-footer__logo", children: props.logo }), props.copyright && _jsx("div", { className: "b10x-footer__copyright", children: props.copyright }), data.build && _jsx(BuildLine, { build: data.build })] })] }) });
}
