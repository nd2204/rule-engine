import { Info, LayoutList, Palette } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { href, type Route } from '../router';
import { ThemeSelect } from './ThemeSelect';

/** Shell nav: global destinations only. Decision and Draft state live in the workspace. */
export function ShellNav({ route }: { route: Route }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

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

  return (
    <nav className="shell" aria-label="Điều hướng chính">
      <a className="shell__brand" href={href.home()} aria-label="bre console, danh sách Decision" title="bre console">
        <span className="shell__mark" aria-hidden="true">
          <span />
          <span />
        </span>
        <span className="shell__name">bre</span>
      </a>

      <ul className="shell__items">
        <li>
          <a
            className="shell__item"
            href={href.home()}
            aria-current={route.name === 'home' ? 'page' : undefined}
            aria-label="Decisions"
            title="Decisions"
          >
            <LayoutList size={20} aria-hidden="true" />
            <span className="shell__label" aria-hidden="true">
              Decisions
            </span>
          </a>
        </li>
      </ul>

      <div className="shell__foot" ref={wrapRef}>
        <button
          ref={btnRef}
          type="button"
          className="shell__item"
          aria-label="Giao diện"
          title="Giao diện"
          aria-expanded={open}
          aria-controls="shell-pop"
          onClick={() => setOpen((o) => !o)}
        >
          <Palette size={20} aria-hidden="true" />
        </button>
        {open && (
          <div id="shell-pop" className="shell__pop">
            <ThemeSelect />
            <p className="shell__note">
              <Info size={14} aria-hidden="true" />
              <span>Mock API trong trình duyệt. Dữ liệu là minh họa và reset khi tải lại trang.</span>
            </p>
          </div>
        )}
      </div>
    </nav>
  );
}
