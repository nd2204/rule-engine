import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import type { RuleSet, SimScope, SimulationRun, TestCase } from '../../domain/types';
import { AUTO_RUN_MAX, type FactBatch } from './batch';

export type SourceFilter = 'all' | 'test-case' | 'batch';

/** What the Fact ledger lists: every changed Fact, or one row of the impact table seen from one side. */
export type LedgerScope = { kind: 'changed' } | { kind: 'all' } | { kind: 'row'; id: string; side: 'gained' | 'lost' | 'reshaped' | 'wins' };

interface Options {
  decisionId: string;
  scope: SimScope;
  /** The Draft as edited; absent for a Published version (the service reads its own copy). */
  ruleSet?: RuleSet;
  testCases: TestCase[] | null;
  defaultBaseline: number | null;
  /** The Simulation tab is open: Test Cases alone are run only then. */
  active: boolean;
}

/**
 * Simulation state for one Draft or version. It lives with the screen, not the tab,
 * so the Fact Batch, the run and the selection survive a tab switch and the release bay can read them.
 */
export function useSimulation({ decisionId, scope, ruleSet, testCases, defaultBaseline, active }: Options) {
  const [batch, setBatch] = useState<FactBatch | null>(null);
  const [baseline, setBaselineState] = useState<number | null>(defaultBaseline);
  // The default follows the Decision as it loads (or as the Latest Pointer moves) until the author picks one.
  const picked = useRef(false);
  useEffect(() => {
    if (!picked.current) setBaselineState(defaultBaseline);
  }, [defaultBaseline]);
  const setBaseline = useCallback((v: number | null) => {
    picked.current = true;
    setBaselineState(v);
  }, []);
  const [run, setRun] = useState<SimulationRun | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<SourceFilter>('all');
  const [ledger, setLedger] = useState<LedgerScope>({ kind: 'changed' });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [manual, setManual] = useState(0);

  // What the current run was made from, to tell when it no longer describes the screen.
  const ranWith = useRef<{ ruleSet?: RuleSet; testCases: TestCase[] | null; batch: FactBatch | null; baseline: number | null } | null>(null);
  const seq = useRef(0);
  const scopeKey = scope.kind === 'draft' ? scope.draftId : `v${scope.version}`;

  const big = (batch?.facts.length ?? 0) > AUTO_RUN_MAX;
  const wanted = active || batch !== null;
  // Runs asked for by hand ("Chạy Simulation"); the last one served is remembered so it runs once.
  const handled = useRef(0);
  // Requests on the wire, and a debounce waiting to fire: "running" ends only when both are done.
  const inFlight = useRef(0);
  const pending = useRef(false);

  useEffect(() => {
    const idle = () => {
      if (inFlight.current === 0) setRunning(false);
    };
    if (!testCases || !wanted) return idle();
    const asked = manual !== handled.current;
    const last = ranWith.current;
    // A big batch is not re-run after every edit: loading it, or changing the baseline, runs it; an edit waits for a hand.
    if (big && !asked && last && last.batch === batch && last.baseline === baseline) return idle();
    handled.current = manual;
    const n = ++seq.current;
    setRunning(true);
    pending.current = true;
    const t = window.setTimeout(
      async () => {
        const inputs = { ruleSet, testCases, batch, baseline };
        pending.current = false;
        inFlight.current += 1;
        try {
          const r = await api.simulationRun(decisionId, scope, {
            ...(ruleSet ? { ruleSet } : {}),
            baseline,
            batch: batch?.facts ?? [],
          });
          if (n !== seq.current) return;
          ranWith.current = inputs;
          setRun(r);
          setError(null);
        } catch (e) {
          if (n === seq.current) setError((e as Error).message);
        } finally {
          inFlight.current -= 1;
          if (n === seq.current || (inFlight.current === 0 && !pending.current)) setRunning(false);
        }
      },
      asked ? 0 : 400,
    );
    return () => {
      window.clearTimeout(t);
      pending.current = false;
    };
    // scope is described by scopeKey; the object itself is rebuilt on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisionId, scopeKey, ruleSet, testCases, batch, baseline, wanted, big, manual]);

  const last = ranWith.current;
  const stale = !!run && !!last && (last.ruleSet !== ruleSet || last.testCases !== testCases || last.batch !== batch || last.baseline !== baseline);

  // The baseline's own Rules: the impact table registers against them and the trace reads them.
  const [baselineRuleSet, setBaselineRuleSet] = useState<RuleSet | null>(null);
  useEffect(() => {
    setBaselineRuleSet(null);
    if (baseline === null) return;
    let live = true;
    api.getVersion(decisionId, baseline).then(
      (v) => live && setBaselineRuleSet(v.ruleSet),
      () => live && setBaselineRuleSet(null),
    );
    return () => {
      live = false;
    };
  }, [decisionId, baseline]);

  const loadBatch = useCallback((b: FactBatch | null) => {
    setBatch(b);
    setSource('all');
    setLedger({ kind: 'changed' });
    setSelectedKey(null);
  }, []);

  return {
    batch,
    loadBatch,
    baseline,
    setBaseline,
    baselineRuleSet,
    run,
    running,
    error,
    stale,
    /** The batch is too big for runs after every edit. */
    manualOnly: big,
    runNow: () => setManual((m) => m + 1),
    source,
    setSource,
    ledger,
    setLedger,
    selectedKey,
    setSelectedKey,
  };
}

export type Simulation = ReturnType<typeof useSimulation>;
