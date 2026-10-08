import { Check, LoaderCircle, Minus, TriangleAlert, X } from 'lucide-react';

export type LampState = 'clear' | 'stop' | 'caution' | 'pending' | 'idle';

const ICON = { clear: Check, stop: X, caution: TriangleAlert, pending: LoaderCircle, idle: Minus };

/** A signal lamp: colour, glyph and (via the caller) a label always travel together. */
export function Lamp({ state, size = 'md', delay }: { state: LampState; size?: 'sm' | 'md'; delay?: number }) {
  const Icon = ICON[state];
  return (
    <span
      className={`lamp lamp--${state} lamp--${size}`}
      style={delay === undefined ? undefined : { animationDelay: `${delay}ms` }}
      aria-hidden="true"
    >
      <Icon strokeWidth={3} />
    </span>
  );
}
