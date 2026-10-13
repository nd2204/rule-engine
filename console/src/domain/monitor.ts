// Theo dõi: the calls Callers make to Published Decisions, as the console
// watches them live. The wire shapes are provisional: the service keeps no
// Decision Log (BRD 14), so a live tap is a bounded in-memory window only.

import type { EvalError, HitPolicy, OutputRow } from './types';

/** What a Caller asks for: the Decision's Latest Pointer, or a pinned Decision Version. */
export type Requested = 'latest' | number;

export interface CallerTarget {
  decisionId: string;
  requested: Requested;
}

export interface CallerInfo {
  id: string;
  label: string;
  domain: string;
  targets: CallerTarget[];
}

/** One evaluation, as the engine answered it, with the Facts it was given. */
export interface MonitorEvent {
  id: string;
  at: string;
  callerId: string;
  requestId: string;
  decisionId: string;
  requested: Requested;
  /** The Decision Version that answered. */
  version: number;
  /** Where the Latest Pointer was at the time of the call. */
  latest: number;
  facts: Record<string, unknown>;
  outputs: OutputRow[];
  matchedRuleIds: string[];
  winnerRuleIds: string[];
  warnings: string[];
  error?: EvalError;
  executionTimeMs: number;
}

export type PointerKind = 'publish' | 'rollback' | 'move';

/** The Latest Pointer of a Decision moved: a Publish, a Rollback, or a move forward to an existing version. */
export interface PointerMove {
  id: string;
  at: string;
  decisionId: string;
  from: number;
  to: number;
  kind: PointerKind;
}

export interface MonitorDecision {
  id: string;
  title: string;
  hitPolicy: HitPolicy;
  latest: number;
}

export interface MonitorSnapshot {
  now: string;
  /** How far back the service keeps calls, in ms. */
  keepMs: number;
  decisions: MonitorDecision[];
  callers: CallerInfo[];
  events: MonitorEvent[];
  moves: PointerMove[];
}

export type EventState = 'clear' | 'idle' | 'caution' | 'stop';

/** stop: an error; caution: answered with a warning; idle: no Rule matched; clear: a result. */
export function eventState(e: MonitorEvent): EventState {
  if (e.error) return 'stop';
  if (e.warnings.length) return 'caution';
  if (!e.matchedRuleIds.length) return 'idle';
  return 'clear';
}

export const POINTER_LABEL: Record<PointerKind, string> = {
  publish: 'Publish',
  rollback: 'Rollback',
  move: 'Chuyển Latest',
};

export interface Bin {
  /** Calls served by the version the Latest Pointer held at call time. */
  onLatest: number;
  /** Calls served by any other version (a pinned Caller). */
  other: number;
  errors: number;
}

/** Calls of one Decision in `count` equal time bins ending at `now`. */
export function binEvents(events: MonitorEvent[], now: number, windowMs: number, count: number): Bin[] {
  const bins: Bin[] = Array.from({ length: count }, () => ({ onLatest: 0, other: 0, errors: 0 }));
  const start = now - windowMs;
  const width = windowMs / count;
  for (const e of events) {
    const t = Date.parse(e.at);
    if (t < start || t > now) continue;
    const b = bins[Math.min(count - 1, Math.floor((t - start) / width))];
    if (e.version === e.latest) b.onLatest++;
    else b.other++;
    if (e.error) b.errors++;
  }
  return bins;
}

export interface VersionShare {
  version: number;
  calls: number;
  /** Callers that pinned this version (not following Latest). */
  pinnedBy: string[];
}

/** How the calls of one Decision split across the versions that answered them, largest first. */
export function versionShares(events: MonitorEvent[]): VersionShare[] {
  const by = new Map<number, VersionShare>();
  for (const e of events) {
    const s = by.get(e.version) ?? { version: e.version, calls: 0, pinnedBy: [] };
    s.calls++;
    if (e.requested !== 'latest' && !s.pinnedBy.includes(e.callerId)) s.pinnedBy.push(e.callerId);
    by.set(e.version, s);
  }
  return [...by.values()].sort((a, b) => b.calls - a.calls || b.version - a.version);
}

/** The record a Caller would have kept for this call, in the shape Replay reads. */
export function callerRecord(e: MonitorEvent) {
  const result = e.error
    ? { decisionId: e.decisionId, version: e.version, error: { code: e.error.code, message: e.error.message, ...(e.error.ruleIds ? { ruleIds: e.error.ruleIds } : {}) } }
    : {
        decisionId: e.decisionId,
        version: e.version,
        outputs: e.outputs,
        traceSummary: { decisionVersion: e.version, matchedRules: e.matchedRuleIds, winningRules: e.winnerRuleIds, executionTimeMs: e.executionTimeMs },
      };
  return { requestId: e.requestId, recordedAt: e.at, facts: e.facts, result };
}
