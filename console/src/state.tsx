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
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastState | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = ++seq.current;
      setToasts((all) => [...all.slice(-2), { ...t, id }]);
      window.setTimeout(() => dismiss(id), t.action ? 9000 : 5000);
    },
    [dismiss],
  );
  return <ToastContext.Provider value={{ toasts, push, dismiss }}>{children}</ToastContext.Provider>;
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
