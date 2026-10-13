// Illustrative Callers for the Theo dõi screen: four systems calling the
// Published Decisions of the mock store, at a steady synthetic rate. Each
// call is really evaluated by the mock engine on the version it would be
// served, so a Publish or Rollback in the console moves the traffic with it.
// Synthetic, for the console demo only: the service keeps no Decision Log.

import type { CallerInfo, MonitorEvent, MonitorSnapshot, PointerKind, PointerMove, Requested } from '../domain/monitor';
import { sampleBatch, type DecisionRecord } from './data';
import { evaluate } from './engine';

const KEEP_MS = 30 * 60_000;
const MAX_EVENTS = 4000;
const TICK_MS = 250;

interface Stream {
  callerId: string;
  decisionId: string;
  requested: Requested;
  /** Calls per minute. */
  rate: number;
  /** A Caller-side bug that shows up now and then: changes the Facts it sends. */
  quirk?: (facts: Record<string, unknown>) => void;
}

interface CallerSpec extends Omit<CallerInfo, 'targets'> {
  prefix: string;
}

const CALLERS: CallerSpec[] = [
  { id: 'pos-hn01', label: 'POS quầy · cửa hàng HN01', domain: 'Retail POS', prefix: 'hn01' },
  { id: 'pos-mobile', label: 'App bán hàng di động', domain: 'Retail POS', prefix: 'mob' },
  { id: 'crm-sync', label: 'Đồng bộ hạng khách hàng CRM', domain: 'Retail POS', prefix: 'crm' },
  { id: 'iot-dalat-a', label: 'Trạm tưới Đà Lạt · khu A', domain: 'Smart IoT', prefix: 'dla' },
];

export type MonitorMessage = { type: 'evaluation'; event: MonitorEvent } | { type: 'pointer'; move: PointerMove };

const hex = () => Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');

export function createMonitor(db: Record<string, DecisionRecord>) {
  const pos = db['calculate-pos-discounts'];
  const all: Stream[] = [
    { callerId: 'pos-hn01', decisionId: 'calculate-pos-discounts', requested: 'latest', rate: 16 },
    { callerId: 'pos-hn01', decisionId: 'classify-customer-tier', requested: 'latest', rate: 5 },
    // The mobile app pinned the version before Latest and has not moved on.
    { callerId: 'pos-mobile', decisionId: 'calculate-pos-discounts', requested: Math.max(1, (pos?.latest ?? 2) - 1), rate: 6 },
    {
      callerId: 'crm-sync',
      decisionId: 'classify-customer-tier',
      requested: 'latest',
      rate: 4,
      // About one call in ten sends annualSpend as a string, which Input Schema Validation rejects.
      quirk: (f) => {
        if (Math.random() < 0.1) f.annualSpend = String(f.annualSpend);
      },
    },
    { callerId: 'iot-dalat-a', decisionId: 'determine-irrigation-action', requested: 'latest', rate: 8 },
    { callerId: 'iot-dalat-a', decisionId: 'determine-alert-level', requested: 'latest', rate: 8 },
  ];
  const streams = all.filter((s) => db[s.decisionId]);

  const pools = new Map<string, Record<string, unknown>[]>();
  for (const s of streams) if (!pools.has(s.decisionId)) pools.set(s.decisionId, sampleBatch(s.decisionId, 256));

  const events: MonitorEvent[] = [];
  const moves: PointerMove[] = [];
  const listeners = new Set<(m: MonitorMessage) => void>();
  let seq = 0;
  let timer: number | undefined;

  function call(s: Stream, at: number): MonitorEvent | null {
    const d = db[s.decisionId];
    const version = s.requested === 'latest' ? d.latest : s.requested;
    const v = d.versions[version - 1];
    if (!v) return null;
    const pool = pools.get(s.decisionId)!;
    const facts = structuredClone(pool[Math.floor(Math.random() * pool.length)]);
    s.quirk?.(facts);
    const t0 = performance.now();
    const r = evaluate(v.ruleSet, facts);
    const executionTimeMs = Math.round((performance.now() - t0) * 1000) / 1000;
    const prefix = CALLERS.find((c) => c.id === s.callerId)?.prefix ?? 'req';
    return {
      id: `e${++seq}`,
      at: new Date(at).toISOString(),
      callerId: s.callerId,
      requestId: `${prefix}-${hex()}`,
      decisionId: d.id,
      requested: s.requested,
      version,
      latest: d.latest,
      facts,
      outputs: r.outputs,
      matchedRuleIds: r.matchedRuleIds,
      winnerRuleIds: r.winnerRuleIds,
      warnings: r.warnings,
      ...(r.error ? { error: r.error } : {}),
      executionTimeMs,
    };
  }

  function prune(now: number) {
    const cut = now - KEEP_MS;
    let i = 0;
    while (i < events.length && (Date.parse(events[i].at) < cut || events.length - i > MAX_EVENTS)) i++;
    if (i) events.splice(0, i);
    while (moves.length && Date.parse(moves[0].at) < cut) moves.shift();
  }

  function emit(m: MonitorMessage) {
    for (const l of listeners) l(m);
  }

  // Backfill the window as if the Callers had been running all along (on today's versions).
  {
    const now = Date.now();
    const backfill: MonitorEvent[] = [];
    for (const s of streams) {
      let t = now - KEEP_MS;
      for (;;) {
        t += (-Math.log(1 - Math.random()) * 60_000) / s.rate;
        if (t >= now) break;
        const e = call(s, t);
        if (e) backfill.push(e);
      }
    }
    backfill.sort((a, b) => a.at.localeCompare(b.at));
    events.push(...backfill);
  }

  function tick() {
    const now = Date.now();
    for (const s of streams) {
      if (Math.random() >= (s.rate / 60_000) * TICK_MS) continue;
      const e = call(s, now);
      if (!e) continue;
      events.push(e);
      emit({ type: 'evaluation', event: e });
    }
    prune(now);
  }

  timer = window.setInterval(tick, TICK_MS);

  return {
    snapshot(): MonitorSnapshot {
      const callers: CallerInfo[] = CALLERS.map(({ prefix: _prefix, ...c }) => ({
        ...c,
        targets: streams.filter((s) => s.callerId === c.id).map((s) => ({ decisionId: s.decisionId, requested: s.requested })),
      }));
      const decisionIds = [...new Set(streams.map((s) => s.decisionId))];
      return {
        now: new Date().toISOString(),
        keepMs: KEEP_MS,
        decisions: decisionIds.map((id) => {
          const d = db[id];
          return { id, title: d.title, hitPolicy: d.versions[d.latest - 1].ruleSet.hitPolicy, latest: d.latest };
        }),
        callers,
        events: [...events],
        moves: [...moves],
      };
    },
    /** The handlers call this when Publish or Rollback moves a Latest Pointer. */
    pointerMoved(decisionId: string, from: number, to: number, kind?: PointerKind) {
      if (from === to) return;
      const move: PointerMove = {
        id: `p${++seq}`,
        at: new Date().toISOString(),
        decisionId,
        from,
        to,
        kind: kind ?? (to < from ? 'rollback' : 'move'),
      };
      moves.push(move);
      emit({ type: 'pointer', move });
    },
    subscribe(fn: (m: MonitorMessage) => void) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    stop() {
      window.clearInterval(timer);
    },
  };
}
