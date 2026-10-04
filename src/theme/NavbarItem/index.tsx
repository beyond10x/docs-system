/**
 * Wraps the theme's navbar item so exactly one link renders active: the most specific route match
 * (see navbar-active.ts). Dropdowns, external links and other item types pass through unchanged.
 */
import type {ReactNode} from 'react';
import InitNavbarItem from '@theme-init/NavbarItem';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useGlobalData from '@docusaurus/useGlobalData';
import {activeNavbarItem, docItemLink, sameNavbarItem} from '../../navbar-active.js';
import type {DocsGlobalData, NavbarItemLike} from '../../navbar-active.js';

export default function NavbarItem(props: NavbarItemLike & Record<string, unknown>): ReactNode {
  const {pathname} = useLocation();
  const {siteConfig} = useDocusaurusContext();
  const docs = (useGlobalData()['docusaurus-plugin-content-docs'] ?? {}) as DocsGlobalData;
  const items = ((siteConfig.themeConfig as {navbar?: {items?: NavbarItemLike[]}}).navbar?.items ?? []);
  const index = items.findIndex((item) => sameNavbarItem(item, props));
  const linkLike = !props.href && !props.items && (props.to || props.type === 'docSidebar' || props.type === 'doc');
  if (index < 0 || !linkLike) return <InitNavbarItem {...props} />;
  const active = activeNavbarItem(items, pathname, siteConfig.baseUrl, docs) === index;
  if (props.type === 'docSidebar' || props.type === 'doc') {
    const link = docItemLink(props, docs, pathname);
    if (!link || (props.type === 'doc' && !props.label)) return <InitNavbarItem {...props} />;
    const {type: _type, sidebarId: _sidebar, docId: _doc, docsPluginId: _plugin, label, ...rest} = props;
    return <InitNavbarItem {...rest} type="default" exact label={label ?? link.label} to={link.path} isActive={() => active} />;
  }
  return <InitNavbarItem {...props} isActive={() => active} />;
}
