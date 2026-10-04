/**
 * The product-site footer: the family strip with the current product highlighted, the site's own
 * link columns, and a bottom row with the copyright and the docs-system build it was rendered with.
 * Without the product-site plugin's data it renders exactly as the theme does.
 */
import type { ReactNode } from 'react';
interface FooterLayoutProps {
    style?: 'dark' | 'light';
    links?: ReactNode;
    logo?: ReactNode;
    copyright?: ReactNode;
}
export default function FooterLayout(props: FooterLayoutProps): ReactNode;
export {};
