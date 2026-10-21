import type { ComponentPropsWithoutRef, ReactNode } from 'react';
export interface ScrollableTableProps extends ComponentPropsWithoutRef<'table'> {
    label?: string;
}
/** Keep native table semantics while making overflowing columns reachable without page scrolling. */
export declare function ScrollableTable({ children, label, ...props }: ScrollableTableProps): ReactNode;
