import { jsx as _jsx } from "react/jsx-runtime";
import InitNavbarItem from '@theme-init/NavbarItem';
import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useGlobalData from '@docusaurus/useGlobalData';
import { activeNavbarItem, docItemLink, sameNavbarItem } from '../../navbar-active.js';
export default function NavbarItem(props) {
    const { pathname } = useLocation();
    const { siteConfig } = useDocusaurusContext();
    const docs = (useGlobalData()['docusaurus-plugin-content-docs'] ?? {});
    const items = (siteConfig.themeConfig.navbar?.items ?? []);
    const index = items.findIndex((item) => sameNavbarItem(item, props));
    const linkLike = !props.href && !props.items && (props.to || props.type === 'docSidebar' || props.type === 'doc');
    if (index < 0 || !linkLike)
        return _jsx(InitNavbarItem, { ...props });
    const active = activeNavbarItem(items, pathname, siteConfig.baseUrl, docs) === index;
    if (props.type === 'docSidebar' || props.type === 'doc') {
        const link = docItemLink(props, docs, pathname);
        if (!link || (props.type === 'doc' && !props.label))
            return _jsx(InitNavbarItem, { ...props });
        const { type: _type, sidebarId: _sidebar, docId: _doc, docsPluginId: _plugin, label, ...rest } = props;
        return _jsx(InitNavbarItem, { ...rest, type: "default", exact: true, label: label ?? link.label, to: link.path, isActive: () => active });
    }
    return _jsx(InitNavbarItem, { ...props, isActive: () => active });
}
