import { useEffect, useState } from 'react';

/** Tabs of the Decision Workspace, in their fixed order (DESIGN.md, Layout). */
export const TABS = ['rules', 'versions', 'schema'] as const;
export type Tab = (typeof TABS)[number];

export type Route =
  | { name: 'home' }
  | { name: 'draft'; decisionId: string; draftId: string; tab: Tab }
  | { name: 'version'; decisionId: string; version: number; tab: Tab };

function parseTab(part: string | undefined): Tab {
  return TABS.includes(part as Tab) ? (part as Tab) : 'rules';
}

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'd' && parts[1]) {
    if (parts[2] === 'draft' && parts[3]) return { name: 'draft', decisionId: parts[1], draftId: parts[3], tab: parseTab(parts[4]) };
    if (parts[2] === 'v' && parts[3] && /^\d+$/.test(parts[3])) {
      return { name: 'version', decisionId: parts[1], version: Number(parts[3]), tab: parseTab(parts[4]) };
    }
  }
  return { name: 'home' };
}

const tabSuffix = (tab?: Tab) => (tab && tab !== 'rules' ? `/${tab}` : '');

export const href = {
  home: () => '#/',
  draft: (decisionId: string, draftId: string, tab?: Tab) =>
    `#/d/${encodeURIComponent(decisionId)}/draft/${encodeURIComponent(draftId)}${tabSuffix(tab)}`,
  version: (decisionId: string, version: number, tab?: Tab) =>
    `#/d/${encodeURIComponent(decisionId)}/v/${version}${tabSuffix(tab)}`,
};

export function navigate(to: string, replace = false) {
  if (replace) window.location.replace(to);
  else window.location.hash = to.replace(/^#/, '');
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
