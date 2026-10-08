import { ChevronDown, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { DecisionSummary } from '../domain/types';
import { href, type Tab } from '../router';

type Scope = { kind: 'draft'; id: string } | { kind: 'version'; version: number };

/**
 * The `@draft` qualifier of the identifier headline: opens the Drafts and
 * Published versions of the current Decision, keeping the current tab.
 */
export function ScopePicker({ decision, scope, tab }: { decision: DecisionSummary; scope: Scope; tab: Tab }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const label = scope.kind === 'draft' ? scope.id : `v${scope.version}`;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const versions = [...decision.versions].reverse();

  return (
    <span className="scope" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className="scope__btn"
        aria-expanded={open}
        aria-controls="scope-menu"
        aria-label={`Đang xem ${label}. Đổi Draft hoặc version`}
        onClick={() => setOpen((o) => !o)}
      >
        @{label}
        <ChevronDown size={18} aria-hidden="true" />
      </button>
      {open && (
        <div id="scope-menu" className="scope__menu" onClick={() => setOpen(false)}>
          <p className="scope__label">Draft</p>
          {decision.drafts.length === 0 ? (
            <p className="scope__empty">Chưa có Draft. Mở một version để tạo.</p>
          ) : (
            <ul>
              {decision.drafts.map((dr) => {
                const stale = dr.baseVersion !== decision.latest;
                return (
                  <li key={dr.id}>
                    <a
                      className="scope__item"
                      href={href.draft(decision.id, dr.id, tab)}
                      aria-current={scope.kind === 'draft' && scope.id === dr.id ? 'page' : undefined}
                    >
                      <span className="scope__id">{dr.id}</span>
                      <span className="scope__title">{dr.title}</span>
                      <span
                        className={`scope__tag${stale ? ' is-stale' : ''}`}
                        title={stale ? `Stale Draft: Latest đã là v${decision.latest}` : undefined}
                      >
                        {stale && <TriangleAlert size={11} aria-label="Stale Draft" />}
                        từ v{dr.baseVersion}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="scope__label">Published</p>
          <ul>
            {versions.map((v) => (
              <li key={v.version}>
                <a
                  className="scope__item"
                  href={href.version(decision.id, v.version, tab)}
                  aria-current={scope.kind === 'version' && scope.version === v.version ? 'page' : undefined}
                >
                  <span className="scope__id">v{v.version}</span>
                  <span className="scope__title">{v.note}</span>
                  {v.version === decision.latest && <span className="latest-mark">Latest</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </span>
  );
}
