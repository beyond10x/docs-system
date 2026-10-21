import {useEffect, useId, useRef, useState} from 'react';
import type {ComponentPropsWithoutRef, ReactNode} from 'react';

export interface ScrollableTableProps extends ComponentPropsWithoutRef<'table'> {
  label?: string;
}

/** Keep native table semantics while making overflowing columns reachable without page scrolling. */
export function ScrollableTable({children, label = 'Table', ...props}: ScrollableTableProps): ReactNode {
  const viewport = useRef<HTMLDivElement>(null);
  const instructionsId = `b10x-table-${useId().replaceAll(':', '')}-instructions`;
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const measure = (): void => setOverflow(element.scrollWidth > element.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    observer.observe(element.querySelector('table')!);
    return () => observer.disconnect();
  }, []);
  return <>
    <div ref={viewport} className="b10x-table-wrap" tabIndex={overflow ? 0 : undefined} role={overflow ? 'region' : undefined} aria-label={overflow ? label : undefined} aria-describedby={overflow ? instructionsId : undefined}>
      <table {...props}>{children}</table>
    </div>
    <p className="b10x-table-guidance" id={instructionsId} hidden={!overflow} data-pagefind-ignore>More columns: swipe horizontally, or focus the table and use the arrow keys.</p>
  </>;
}
