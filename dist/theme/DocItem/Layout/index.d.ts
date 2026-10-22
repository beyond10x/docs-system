/**
 * The doc column keeps the theme's 75% width cap only when a table of contents can render beside
 * it. The theme reserves that quarter whenever `hide_table_of_contents` is unset, so a page without
 * headings, such as an ESS contract explorer, lost a quarter of its width to an empty column.
 */
import type { ReactNode } from 'react';
export default function DocItemLayout({ children }: {
    children?: ReactNode;
}): ReactNode;
