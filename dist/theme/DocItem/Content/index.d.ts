/**
 * Documentation pages with `status`, `lede` or `source` in their front matter open with a page
 * header: kicker (sidebar category and position), title, lede, status badge and source line. Pages
 * without those keys render exactly as the theme does.
 */
import type { ReactNode } from 'react';
export default function DocItemContent({ children }: {
    children?: ReactNode;
}): ReactNode;
