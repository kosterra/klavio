import { useEffect, useState } from 'react';
import { useSession } from './session';

/** Current time, refreshed every 30 s (so an expired unlock is noticed). */
function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Is the parent area open right now (no PIN set, or entered recently)? */
export function useParentUnlocked(): boolean {
  const { me } = useSession();
  const now = useNow();
  const pin = me?.user.parentPin;
  // a child's PIN login opens the parent area only with the parent PIN
  if (!pin?.set) return !me?.childLogin;
  return !!pin.unlockedUntil && new Date(pin.unlockedUntil).getTime() > now;
}
