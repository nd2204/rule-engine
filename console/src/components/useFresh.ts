import { useEffect, useRef } from 'react';

/**
 * The keys that were not there at the last commit; nothing is fresh on the first one. A key that
 * changes means what a thing says changed, so it can acknowledge that, where a re-render cannot.
 */
export function useFresh(keys: string[]): Set<string> {
  const seen = useRef<Set<string> | null>(null);
  const fresh = new Set(seen.current ? keys.filter((k) => !seen.current?.has(k)) : []);
  useEffect(() => {
    seen.current = new Set(keys);
  });
  return fresh;
}
