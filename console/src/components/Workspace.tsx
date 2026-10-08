import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { TABS, type Tab } from '../router';

const TAB_LABEL: Record<Tab, string> = {
  rules: 'Rules',
  versions: 'Version',
  schema: 'Schema',
};

interface Props {
  /** Context head: the title block. */
  head: ReactNode;
  /** Present on screens scoped to one Decision. */
  tabs?: { active: Tab; href: (tab: Tab) => string };
  primary: ReactNode;
  inspector?: ReactNode;
  inspectorLabel?: string;
  /** What the inspector says while it is shut (below 1200px): shown on its toggle at the end of the tab row. */
  inspectorSummary?: ReactNode;
  /** Below 1200px the inspector is a drawer; the screen owns whether it is open. */
  drawerOpen?: boolean;
  onDrawerOpenChange?: (open: boolean) => void;
  commit?: ReactNode;
  className?: string;
}

/**
 * The Decision Workspace: every screen fills the same five slots
 * (shell nav lives in the app shell; this draws the other four).
 */
export function Workspace(props: Props) {
  const { drawerOpen = false, onDrawerOpenChange } = props;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const inspectorRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    inspectorRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      // The Rule panel and text editors handle their own Escape first.
      if ((e.target as HTMLElement).closest('.rule-panel, textarea, input')) return;
      onDrawerOpenChange?.(false);
      toggleRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, onDrawerOpenChange]);

  return (
    <div className={`screen${props.tabs ? ' has-tabs' : ''}${props.commit ? ' has-commit' : ''}${props.className ? ` ${props.className}` : ''}`}>
      <div className="screen__head">
        {props.head}
        {props.tabs && (
          <nav className="screen__tabs" aria-label="Màn hình của Decision">
            <ul className="tabs">
              {TABS.map((t) => (
                <li key={t}>
                  <a className="tabs__tab" href={props.tabs!.href(t)} aria-current={t === props.tabs!.active ? 'page' : undefined}>
                    {TAB_LABEL[t]}
                  </a>
                </li>
              ))}
            </ul>
            {props.inspector && (
              <button
                ref={toggleRef}
                type="button"
                className="tabs__inspector"
                aria-expanded={drawerOpen}
                aria-controls="inspector"
                onClick={() => onDrawerOpenChange?.(!drawerOpen)}
              >
                {props.inspectorSummary ?? props.inspectorLabel}
              </button>
            )}
          </nav>
        )}
      </div>

      <div className="screen__body">
        <div className="screen__primary">{props.primary}</div>
        {props.inspector && (
          <aside
            id="inspector"
            ref={inspectorRef}
            tabIndex={-1}
            className={`screen__inspector${drawerOpen ? ' is-open' : ''}`}
            aria-label={props.inspectorLabel}
          >
            <button
              type="button"
              className="icon-btn screen__inspector-close"
              aria-label={`Đóng ${props.inspectorLabel ?? 'ngăn bên'}`}
              onClick={() => {
                onDrawerOpenChange?.(false);
                toggleRef.current?.focus();
              }}
            >
              <X size={16} aria-hidden="true" />
            </button>
            {props.inspector}
          </aside>
        )}
      </div>

      {props.commit && <div className="screen__commit">{props.commit}</div>}
    </div>
  );
}
