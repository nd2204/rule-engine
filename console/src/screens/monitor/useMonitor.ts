import { useCallback, useEffect, useRef, useState } from 'react';
import { api, MONITOR_STREAM } from '../../api/client';
import type { CallerInfo, MonitorDecision, MonitorEvent, PointerMove } from '../../domain/monitor';

export type Connection = 'loading' | 'live' | 'lost' | 'failed';

export interface MonitorState {
  connection: Connection;
  decisions: MonitorDecision[];
  callers: CallerInfo[];
  /** Oldest first. */
  events: MonitorEvent[];
  moves: PointerMove[];
  keepMs: number;
  /** The clock the view is drawn at: frozen while paused. */
  now: number;
  paused: boolean;
  /** Calls that arrived while paused, not drawn yet. */
  held: number;
  /** Ids of the calls that arrived in the last flush, for their entrance. */
  fresh: Set<string>;
}

const FLUSH_MS = 400;

/** The Callers' calls: a snapshot of the kept window, then the stream, drawn in batches. */
export function useMonitor() {
  const [state, setState] = useState<MonitorState>({
    connection: 'loading',
    decisions: [],
    callers: [],
    events: [],
    moves: [],
    keepMs: 30 * 60_000,
    now: Date.now(),
    paused: false,
    held: 0,
    fresh: new Set(),
  });
  const inbox = useRef<{ events: MonitorEvent[]; moves: PointerMove[] }>({ events: [], moves: [] });
  const paused = useRef(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    let source: EventSource | null = null;
    inbox.current = { events: [], moves: [] };

    api.monitorSnapshot().then(
      (snap) => {
        if (!live) return;
        setState((s) => ({
          ...s,
          connection: 'live',
          decisions: snap.decisions,
          callers: snap.callers,
          events: snap.events,
          moves: snap.moves,
          keepMs: snap.keepMs,
          now: Date.now(),
          held: 0,
          fresh: new Set(),
        }));
        source = new EventSource(MONITOR_STREAM);
        source.addEventListener('evaluation', (e) => inbox.current.events.push(JSON.parse((e as MessageEvent<string>).data) as MonitorEvent));
        source.addEventListener('pointer', (e) => inbox.current.moves.push(JSON.parse((e as MessageEvent<string>).data) as PointerMove));
        source.onopen = () => live && setState((s) => (s.connection === 'live' ? s : { ...s, connection: 'live' }));
        source.onerror = () => live && setState((s) => ({ ...s, connection: 'lost' }));
      },
      () => live && setState((s) => ({ ...s, connection: 'failed' })),
    );

    const flush = window.setInterval(() => {
      const now = Date.now();
      // Drain the inbox outside the state updater: an updater must stay pure (StrictMode runs it twice).
      if (paused.current) {
        const held = inbox.current.events.length;
        setState((s) => (held === s.held ? s : { ...s, held }));
        return;
      }
      const { events: incoming, moves: moved } = inbox.current;
      inbox.current = { events: [], moves: [] };
      setState((s) => {
        if (s.connection === 'loading' || s.connection === 'failed') return s;
        const cut = now - s.keepMs;
        const events = s.events.concat(incoming).filter((e) => Date.parse(e.at) >= cut);
        const moves = moved.length ? s.moves.concat(moved) : s.moves;
        const decisions = moved.length
          ? s.decisions.map((d) => {
              const last = moved.filter((m) => m.decisionId === d.id).at(-1);
              return last ? { ...d, latest: last.to } : d;
            })
          : s.decisions;
        return { ...s, events, moves, decisions, now, held: 0, fresh: new Set(incoming.map((e) => e.id)) };
      });
    }, FLUSH_MS);

    return () => {
      live = false;
      source?.close();
      window.clearInterval(flush);
    };
  }, [attempt]);

  const setPaused = useCallback((p: boolean) => {
    paused.current = p;
    setState((s) => ({ ...s, paused: p }));
  }, []);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, connection: 'loading' }));
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, setPaused, retry };
}
