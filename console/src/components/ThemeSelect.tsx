import { Palette } from 'lucide-react';
import { useState } from 'react';
import { applyTheme, readTheme, saveTheme, THEMES, type ThemeId } from '../theme';

export function ThemeSelect() {
  const [theme, setTheme] = useState<ThemeId>(readTheme);
  const current = THEMES.find((t) => t.id === theme)!;

  return (
    <div className="theme">
      <label className="theme__label" htmlFor="theme-select">
        <Palette size={14} aria-hidden="true" /> Giao diện
      </label>
      <div className="theme__control">
        <span
          className="theme__swatch"
          aria-hidden="true"
          style={{ background: `linear-gradient(90deg, ${current.swatch[0]} 50%, ${current.swatch[1]} 50%)` }}
        />
        <select
          id="theme-select"
          className="theme__select"
          value={theme}
          onChange={(e) => {
            const next = e.target.value as ThemeId;
            setTheme(next);
            applyTheme(next);
            saveTheme(next);
          }}
        >
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
