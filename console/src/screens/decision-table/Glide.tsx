import { useLayoutEffect, useRef, type MutableRefObject, type ReactNode } from 'react';

const MS = 200;
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
/** Rows below a change follow it one after another, not all at once. */
const STAGGER_MS = 22;

/**
 * Rows glide to their new place when the Rule set changes shape (a Rule added, removed or
 * duplicated), instead of jumping; a new Rule slides in from the left. Positions are read from
 * layout, so a drag's own transforms never count, and the caller raises `skip` for a drag's drop,
 * since the dragged rows are already where they land.
 */
export function Glide(props: { skip: MutableRefObject<boolean>; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const tops = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const rows = [...el.querySelectorAll<HTMLElement>('tbody tr[data-rule]')];
    const next = new Map(rows.map((r) => [r.dataset.rule ?? '', r.offsetTop]));
    const prev = tops.current;
    tops.current = next;

    if (props.skip.current || prev.size === 0) return;
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let rank = 0;
    for (const row of rows) {
      const id = row.dataset.rule ?? '';
      const before = prev.get(id);
      const to = next.get(id) ?? 0;
      const options = { duration: MS, easing: EASE, delay: rank * STAGGER_MS, fill: 'backwards' as const };
      if (before === undefined) {
        row.animate([{ opacity: 0, transform: 'translateX(-14px)' }, { opacity: 1, transform: 'none' }], options);
        rank += 1;
      } else if (before !== to) {
        row.animate([{ transform: `translateY(${before - to}px)` }, { transform: 'none' }], options);
        rank += 1;
      }
    }
  });

  return (
    <div ref={root} style={{ display: 'contents' }}>
      {props.children}
    </div>
  );
}
