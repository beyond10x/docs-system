import type { ReactNode } from 'react';
import type { TocHeading } from '../../../toc.js';
interface TOCItemsTreeProps {
    toc: readonly TocHeading[];
    className?: string;
    linkClassName?: string | null;
    isChild?: boolean;
}
export default function TOCItemsTree({ toc, ...props }: TOCItemsTreeProps): ReactNode;
export {};
