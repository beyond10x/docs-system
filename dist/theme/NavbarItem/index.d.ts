/**
 * Wraps the theme's navbar item so exactly one link renders active: the most specific route match
 * (see navbar-active.ts). Dropdowns, external links and other item types pass through unchanged.
 */
import type { ReactNode } from 'react';
import type { NavbarItemLike } from '../../navbar-active.js';
export default function NavbarItem(props: NavbarItemLike & Record<string, unknown>): ReactNode;
