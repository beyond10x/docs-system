/**
 * Status admonitions. `:::shipped[Claim evaluation]`, `:::planned`, `:::decided`, or any admonition
 * whose title starts with Shipped, Decided or Planned, takes the status tone, glyph and badge.
 * Every other admonition renders unchanged.
 */
import {isValidElement} from 'react';
import type {ReactNode} from 'react';
import InitAdmonition from '@theme-init/Admonition';
import {StatusBadge} from '../../components.js';
import type {ProductStatus} from '../../product-data.js';

const STATUSES: readonly ProductStatus[] = ['shipped', 'decided', 'planned'];

function plainText(node: ReactNode): string | undefined {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) {
    const parts = node.map(plainText);
    return parts.every((part) => part !== undefined) ? parts.join('') : undefined;
  }
  if (isValidElement<{children?: ReactNode}>(node)) return plainText(node.props.children);
  return undefined;
}

/** The status an admonition declares by its type or title, and the rest of its title. */
export function admonitionStatus(type: string | undefined, title: ReactNode): {status: ProductStatus; rest?: string} | undefined {
  if (type && STATUSES.includes(type as ProductStatus)) return {status: type as ProductStatus, rest: plainText(title)};
  const text = plainText(title)?.trim();
  const match = text ? /^(shipped|decided|planned)\b\s*[:·—–-]?\s*(.*)$/i.exec(text) : null;
  return match ? {status: match[1].toLowerCase() as ProductStatus, rest: match[2] || undefined} : undefined;
}

export default function Admonition(props: {type?: string; title?: ReactNode; className?: string; children?: ReactNode} & Record<string, unknown>): ReactNode {
  const declared = admonitionStatus(props.type, props.title);
  if (!declared) return <InitAdmonition {...props} />;
  const title = <span className="b10x-admonition__title"><StatusBadge status={declared.status} />{declared.rest && <span className="b10x-admonition__rest">{declared.rest}</span>}</span>;
  return <InitAdmonition {...props} type="note" icon={null} title={title} className={['b10x-admonition', `b10x-admonition--${declared.status}`, props.className].filter(Boolean).join(' ')} />;
}
