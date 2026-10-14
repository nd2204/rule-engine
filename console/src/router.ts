import { useEffect, useState } from 'react';

/** Tabs of the Decision Workspace, in their fixed order (DESIGN.md, Layout). */
export const TABS = ['rules', 'testcases', 'flow', 'simulation', 'versions', 'schema'] as const;
export type Tab = (typeof TABS)[number];

/** `ruleId`: one Rule's condition as a node graph, opened from the Rules tab (`…/rule/:ruleId`). */
export type Route =
  | { name: 'home' }
  | { name: 'replay' }
  | { name: 'monitor' }
  | { name: 'draft'; decisionId: string; draftId: string; tab: Tab; ruleId?: string }
  | { name: 'version'; decisionId: string; version: number; tab: Tab; ruleId?: string };

function parseTab(part: string | undefined): Tab {
  return TABS.includes(part as Tab) ? (part as Tab) : 'rules';
}

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'replay') return { name: 'replay' };
  if (parts[0] === 'monitor') return { name: 'monitor' };
  if (parts[0] === 'd' && parts[1]) {
    const rule = parts[4] === 'rule' && parts[5] ? { tab: 'rules' as const, ruleId: parts[5] } : { tab: parseTab(parts[4]) };
    if (parts[2] === 'draft' && parts[3]) return { name: 'draft', decisionId: parts[1], draftId: parts[3], ...rule };
    if (parts[2] === 'v' && parts[3] && /^\d+$/.test(parts[3])) {
      return { name: 'version', decisionId: parts[1], version: Number(parts[3]), ...rule };
    }
  }
  return { name: 'home' };
}

const tabSuffix = (tab?: Tab) => (tab && tab !== 'rules' ? `/${tab}` : '');

export const href = {
  home: () => '#/',
  replay: () => '#/replay',
  monitor: () => '#/monitor',
  draft: (decisionId: string, draftId: string, tab?: Tab) =>
    `#/d/${encodeURIComponent(decisionId)}/draft/${encodeURIComponent(draftId)}${tabSuffix(tab)}`,
  version: (decisionId: string, version: number, tab?: Tab) =>
    `#/d/${encodeURIComponent(decisionId)}/v/${version}${tabSuffix(tab)}`,
  draftRule: (decisionId: string, draftId: string, ruleId: string) =>
    `#/d/${encodeURIComponent(decisionId)}/draft/${encodeURIComponent(draftId)}/rule/${encodeURIComponent(ruleId)}`,
  versionRule: (decisionId: string, version: number, ruleId: string) =>
    `#/d/${encodeURIComponent(decisionId)}/v/${version}/rule/${encodeURIComponent(ruleId)}`,
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
