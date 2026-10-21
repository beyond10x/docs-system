/**
 * The table-of-contents tree, with each word of a code heading kept whole and a break opportunity
 * after every `/`, so a long command or path wraps inside the rail instead of mid-word.
 */
import {useMemo} from 'react';
import type {ReactNode} from 'react';
import InitTOCItemsTree from '@theme-init/TOCItems/Tree';
import {breakableToc} from '../../../toc.js';
import type {TocHeading} from '../../../toc.js';

interface TOCItemsTreeProps {toc: readonly TocHeading[]; className?: string; linkClassName?: string | null; isChild?: boolean}

export default function TOCItemsTree({toc, ...props}: TOCItemsTreeProps): ReactNode {
  const breakable = useMemo(() => breakableToc(toc), [toc]);
  return <InitTOCItemsTree {...props} toc={breakable} />;
}
