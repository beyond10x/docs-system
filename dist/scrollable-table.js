import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from 'react';
/** Keep native table semantics while making overflowing columns reachable without page scrolling. */
export function ScrollableTable({ children, label = 'Table', ...props }) {
    const viewport = useRef(null);
    const instructionsId = `b10x-table-${useId().replaceAll(':', '')}-instructions`;
    const [overflow, setOverflow] = useState(false);
    useEffect(() => {
        const element = viewport.current;
        if (!element)
            return;
        const measure = () => setOverflow(element.scrollWidth > element.clientWidth + 1);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        observer.observe(element.querySelector('table'));
        return () => observer.disconnect();
    }, []);
    return _jsxs(_Fragment, { children: [_jsx("div", { ref: viewport, className: "b10x-table-wrap", tabIndex: overflow ? 0 : undefined, role: overflow ? 'region' : undefined, "aria-label": overflow ? label : undefined, "aria-describedby": overflow ? instructionsId : undefined, children: _jsx("table", { ...props, children: children }) }), _jsx("p", { className: "b10x-table-guidance", id: instructionsId, hidden: !overflow, "data-pagefind-ignore": true, children: "More columns: swipe horizontally, or focus the table and use the arrow keys." })] });
}
