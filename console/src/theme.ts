// Console themes. The light drawing-office sheet is the base token set in
// tokens.css; every other theme overrides it from themes.css via data-theme.

export const THEMES = [
  { id: 'signal-night', label: 'Signal Night', swatch: ['#0c0f13', '#5b9cff'] },
  { id: 'gruvbox', label: 'Gruvbox Material Mix', swatch: ['#181818', '#8aa98a'] },
  { id: 'catppuccin', label: 'Catppuccin Mocha', swatch: ['#1e1e2e', '#cba6f7'] },
  { id: 'tokyonight', label: 'Tokyo Night', swatch: ['#1a1b26', '#7aa2f7'] },
  { id: 'nord', label: 'Nord', swatch: ['#2e3440', '#88c0d0'] },
  { id: 'dracula', label: 'Dracula', swatch: ['#282a36', '#bd93f9'] },
  { id: 'drawing', label: 'Bản vẽ (sáng)', swatch: ['#1b3a6b', '#f9faf9'] },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

export const DEFAULT_THEME: ThemeId = 'gruvbox';
const STORAGE_KEY = 'bre-console-theme';

function isTheme(v: string | null): v is ThemeId {
  return THEMES.some((t) => t.id === v);
}

/** URL `?theme=` wins (shareable link), then the viewer's stored choice, then the default. */
export function readTheme(): ThemeId {
  const fromUrl = new URLSearchParams(window.location.search).get('theme');
  if (isTheme(fromUrl)) return fromUrl;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    /* storage unavailable: fall through to the default */
  }
  return DEFAULT_THEME;
}

export function applyTheme(theme: ThemeId) {
  const root = document.documentElement;
  if (theme === 'drawing') delete root.dataset.theme;
  else root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    getComputedStyle(root).getPropertyValue('--rail').trim() || '#1b3a6b',
  );
}

export function saveTheme(theme: ThemeId) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage unavailable: the choice lasts for this page only */
  }
  const url = new URL(window.location.href);
  if (url.searchParams.has('theme')) {
    url.searchParams.delete('theme');
    window.history.replaceState(null, '', url);
  }
}
