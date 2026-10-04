import type { ReactNode } from 'react';
import type { ProductStatus } from '../../product-data.js';
/** The status an admonition declares by its type or title, and the rest of its title. */
export declare function admonitionStatus(type: string | undefined, title: ReactNode): {
    status: ProductStatus;
    rest?: string;
} | undefined;
export default function Admonition(props: {
    type?: string;
    title?: ReactNode;
    className?: string;
    children?: ReactNode;
} & Record<string, unknown>): ReactNode;
