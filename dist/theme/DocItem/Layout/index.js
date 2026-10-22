import { jsx as _jsx } from "react/jsx-runtime";
import InitDocItemLayout from '@theme-init/DocItem/Layout';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
export default function DocItemLayout({ children }) {
    const { frontMatter, toc } = useDoc();
    const layout = _jsx(InitDocItemLayout, { children: children });
    return frontMatter.hide_table_of_contents || toc.length > 0 ? layout : _jsx("div", { className: "b10x-doc-item--no-toc", children: layout });
}
