/**
 * The not-found page: says the address has no page and links to the docs and the home page, in
 * place of the stock copy that only asks the reader to contact the site owner. It carries a meta
 * description like every other page, and `noindex` in place of a canonical link: a 404 has no
 * address of its own.
 */
import type { ReactNode } from 'react';
export default function NotFoundContent({ className }: {
    className?: string;
}): ReactNode;
