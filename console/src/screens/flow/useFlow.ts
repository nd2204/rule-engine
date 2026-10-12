import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { RuleSet, TestCase } from '../../domain/types';
import { useNarrow } from '../../state';
import type { Simulation } from '../simulation/useSimulation';
import { expectationOf, restingStep, stepsOf, type Orientation } from './graph';

const STEP_MS = 520;
const ORIENTATION_KEY = 'bre-flow-orientation';

function readOrientation(): Orientation | null {
  try {
    const v = window.localStorage.getItem(ORIENTATION_KEY);
    return v === 'lr' || v === 'tb' ? v : null;
  } catch {
    return null;
  }
}

/**
 * Replay state for the track diagram. It lives with the screen, like the Simulation,
 * so the step, the side and the nodes the author moved survive a tab switch.
 */
export function useFlow(sim: Simulation, subject: RuleSet | null, testCases: TestCase[] | null) {
  const results = sim.run?.results ?? [];
  const result = results.find((r) => r.key === sim.selectedKey) ?? null;
  const [side, setSide] = useState<'subject' | 'baseline'>('subject');
  const canBaseline = !!result?.baseline && !!sim.baselineRuleSet;
  const onBaseline = side === 'baseline' && canBaseline;
  const ruleSet = onBaseline ? sim.baselineRuleSet : subject;
  const traced = result ? (onBaseline ? result.baseline! : result.subject) : null;

  // A Test Case answers to its expectation; a Fact of the batch has none.
  const testCase = result?.source === 'test-case' ? testCases?.find((t) => t.id === result.key) : undefined;
  const expect = useMemo(
    () => (ruleSet && traced && testCase && !onBaseline ? expectationOf(ruleSet, traced, testCase.expected) : null),
    [ruleSet, traced, testCase, onBaseline],
  );

  const steps = useMemo(
    () => (ruleSet ? stepsOf(ruleSet, traced, result?.key ?? null, result?.facts ?? null, expect) : []),
    [ruleSet, traced, result?.key, result?.facts, expect],
  );
  const last = steps.length - 1;
  const [current, setCurrent] = useState(last);
  const [playing, setPlaying] = useState(false);

  // A new Fact, or the other side, rests where it parts from its expectation, or shows its whole route.
  const shown = `${result?.key ?? ''}|${onBaseline}`;
  const prevShown = useRef<string | null>(null);
  useEffect(() => {
    if (prevShown.current === shown) {
      setCurrent((c) => Math.min(c, last));
      return;
    }
    prevShown.current = shown;
    setPlaying(false);
    setCurrent(restingStep(steps));
    // steps follow shown; only a change of Fact or side moves the resting point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, last]);

  useEffect(() => {
    if (!playing) return;
    if (current >= last) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setCurrent((c) => c + 1), STEP_MS);
    return () => window.clearTimeout(t);
  }, [playing, current, last]);

  const play = useCallback(() => {
    if (last < 0) return;
    setCurrent(0);
    setPlaying(true);
  }, [last]);

  const go = useCallback(
    (i: number) => {
      setPlaying(false);
      setCurrent(Math.max(0, Math.min(last, i)));
    },
    [last],
  );

  const stepFact = useCallback(
    (delta: number) => {
      if (!results.length) return;
      const i = results.findIndex((r) => r.key === sim.selectedKey);
      const next = i < 0 ? 0 : (i + delta + results.length) % results.length;
      sim.setSelectedKey(results[next].key);
    },
    [results, sim],
  );

  /** The diagram's keys, shared by the canvas and the step list. Returns whether the key was taken. */
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('select, input, textarea')) return false;
      const c = Math.min(current, last);
      const keys: Record<string, () => void> = {
        ArrowRight: () => go(c + 1),
        ArrowDown: () => go(c + 1),
        ArrowLeft: () => go(c - 1),
        ArrowUp: () => go(c - 1),
        Home: () => go(0),
        End: () => go(last),
        PageDown: () => stepFact(1),
        PageUp: () => stepFact(-1),
      };
      const run = keys[e.key];
      if (!run || (!steps.length && !e.key.startsWith('Page'))) return false;
      e.preventDefault();
      run();
      return true;
    },
    [current, last, go, stepFact, steps.length],
  );

  // Orientation: the viewer's choice is remembered; otherwise a narrow canvas reads top to bottom.
  const narrow = useNarrow('(max-width: 959px)');
  const [chosen, setChosen] = useState<Orientation | null>(readOrientation);
  const orientation: Orientation = chosen ?? (narrow ? 'tb' : 'lr');
  const setOrientation = useCallback((o: Orientation) => {
    setChosen(o);
    setMoved({});
    try {
      window.localStorage.setItem(ORIENTATION_KEY, o);
    } catch {
      // A blocked store only means the choice is not remembered.
    }
  }, []);

  // Nodes the author dragged: view state only, never written to the Draft.
  const [moved, setMoved] = useState<Record<string, { x: number; y: number }>>({});

  return {
    result,
    ruleSet,
    traced,
    expect,
    steps,
    current: Math.min(current, last),
    playing,
    play,
    pause: () => setPlaying(false),
    go,
    onKey,
    stepFact,
    side: onBaseline ? 'baseline' : 'subject',
    setSide,
    canBaseline,
    orientation,
    setOrientation,
    moved,
    setMoved,
  } as const;
}

export type Flow = ReturnType<typeof useFlow>;
