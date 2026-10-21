import { jsx as _jsx } from "react/jsx-runtime";
/**
 * The table-of-contents tree, with each word of a code heading kept whole and a break opportunity
 * after every `/`, so a long command or path wraps inside the rail instead of mid-word.
 */
import { useMemo } from 'react';
import InitTOCItemsTree from '@theme-init/TOCItems/Tree';
import { breakableToc } from '../../../toc.js';
export default function TOCItemsTree({ toc, ...props }) {
    const breakable = useMemo(() => breakableToc(toc), [toc]);
    return _jsx(InitTOCItemsTree, { ...props, toc: breakable });
}
