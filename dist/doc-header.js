const STATUSES = ['shipped', 'decided', 'planned'];
/** The header fields of a page's front matter, or `undefined` when the page keeps today's layout. */
export function docHeaderFields(frontMatter) {
    const text = (key) => {
        const value = frontMatter[key];
        if (value === undefined)
            return undefined;
        if (typeof value !== 'string' || !value.trim())
            throw new Error(`front matter ${key} must be a non-empty string`);
        return value.trim();
    };
    const status = frontMatter.status;
    if (status !== undefined && !STATUSES.includes(status))
        throw new Error(`front matter status must be one of ${STATUSES.join(', ')}, received ${JSON.stringify(status)}`);
    const fields = {
        ...(status ? { status: status } : {}),
        ...(text('lede') ? { lede: text('lede') } : {}),
        ...(text('source') ? { source: text('source') } : {}),
        ...(text('source_url') ? { source_url: text('source_url') } : {}),
        ...(text('kicker') ? { kicker: text('kicker') } : {}),
    };
    return fields.status || fields.lede || fields.source ? fields : undefined;
}
const normalise = (href) => href.replace(/[?#].*$/, '').replace(/\/+$/, '') || '/';
/** Where `permalink` sits among its siblings. Categories count as one sibling each; HTML items do not count. */
export function sidebarPosition(items, permalink) {
    if (!items)
        return undefined;
    const target = normalise(permalink);
    const visit = (level, category) => {
        const siblings = level.filter((item) => item.type === 'link' || item.type === 'category');
        for (const [index, item] of siblings.entries()) {
            if (item.type === 'link' && item.href && normalise(item.href) === target)
                return { category, index: index + 1, total: siblings.length };
            if (item.type === 'category') {
                // A category's own index page sits at the head of its children.
                if (item.href && normalise(item.href) === target)
                    return { category: item.label, index: 1, total: (item.items ?? []).filter((child) => child.type === 'link' || child.type === 'category').length + 1 };
                const found = visit(item.items ?? [], item.label);
                if (found)
                    return item.href ? { ...found, index: found.index + 1, total: found.total + 1 } : found;
            }
        }
        return undefined;
    };
    return visit(items, undefined);
}
/** "Concepts · 2 of 4", or "2 of 6" at the top level. */
export function docKicker(position, override) {
    const label = override ?? position?.category;
    const count = position ? `${position.index} of ${position.total}` : undefined;
    return [label, count].filter(Boolean).join(' · ') || undefined;
}
