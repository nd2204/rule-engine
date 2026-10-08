import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from './api/client';
import type { DecisionSummary } from './domain/types';

// ---------- decisions catalogue (rail) ----------

interface DecisionsState {
  decisions: DecisionSummary[] | null;
  error: string | null;
  refresh: () => Promise<void>;
}

const DecisionsContext = createContext<DecisionsState | null>(null);

export function DecisionsProvider({ children }: { children: ReactNode }) {
  const [decisions, setDecisions] = useState<DecisionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      setDecisions(await api.listDecisions());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return <DecisionsContext.Provider value={{ decisions, error, refresh }}>{children}</DecisionsContext.Provider>;
}

export function useDecisions() {
  const ctx = useContext(DecisionsContext);
  if (!ctx) throw new Error('useDecisions outside DecisionsProvider');
  return ctx;
}

// ---------- toasts ----------

export interface Toast {
  id: number;
  tone: 'info' | 'clear' | 'stop';
  message: string;
  action?: { label: string; run: () => void };
  /** A toast with a key replaces any live toast with the same key (one Latest Pointer story per Decision). */
  key?: string;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
  /** Timers stand still while the reader is on a toast (hover or keyboard focus). */
  setPaused: (paused: boolean) => void;
}

const ToastContext = createContext<ToastState | null>(null);

const TICK = 250;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const remaining = useRef(new Map<number, number>());
  const paused = useRef(false);
  const dismiss = useCallback((id: number) => {
    remaining.current.delete(id);
    setToasts((all) => all.filter((t) => t.id !== id));
  }, []);
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++seq.current;
    // An action is a way back (undo, rollback): it gets longer to be read and reached.
    remaining.current.set(id, t.action ? 10000 : 5000);
    setToasts((all) => {
      const kept = t.key ? all.filter((x) => x.key !== t.key) : all;
      for (const gone of all) if (!kept.includes(gone)) remaining.current.delete(gone.id);
      return [...kept.slice(-2), { ...t, id }];
    });
  }, []);
  const setPaused = useCallback((p: boolean) => {
    paused.current = p;
  }, []);
  // A toast closed under the pointer or the focus takes no leave event with it: an empty stack never stays paused.
  useEffect(() => {
    if (toasts.length === 0) paused.current = false;
  }, [toasts.length]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (paused.current || remaining.current.size === 0) return;
      const expired: number[] = [];
      remaining.current.forEach((ms, id) => {
        if (ms - TICK <= 0) expired.push(id);
        else remaining.current.set(id, ms - TICK);
      });
      if (expired.length) {
        expired.forEach((id) => remaining.current.delete(id));
        setToasts((all) => all.filter((t) => !expired.includes(t.id)));
      }
    }, TICK);
    return () => window.clearInterval(timer);
  }, []);
  return <ToastContext.Provider value={{ toasts, push, dismiss, setPaused }}>{children}</ToastContext.Provider>;
}

export function useToasts() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToasts outside ToastProvider');
  return ctx;
}

// ---------- viewport ----------

export function useNarrow(query = '(max-width: 959px)') {
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return narrow;
}
