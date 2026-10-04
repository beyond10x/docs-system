import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import InitNavbarLogo from '@theme-init/Navbar/Logo';
import { usePluginData } from '@docusaurus/useGlobalData';
import { ProductSwitcher } from '../../../product.js';
export default function NavbarLogo(props) {
    const data = usePluginData('b10x-product-site');
    if (!data?.product)
        return _jsx(InitNavbarLogo, { ...props });
    return _jsxs(_Fragment, { children: [_jsx(InitNavbarLogo, { ...props }), _jsx(ProductSwitcher, { current: data.product })] });
}
