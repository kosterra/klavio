/**
 * Small, failure-tolerant wrapper around localStorage (it can be unavailable
 * or throw in private mode / with blocked site data). Only used for things the
 * app can also live without: the last known session state, cached progress
 * and the queue of results played offline.
 */
export function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable – the app works without the cache */
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function removeKeysWithPrefix(prefix: string): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(prefix)) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

export const KEYS = {
  snapshot: 'klavio.snapshot.v1',
  progressPrefix: 'klavio.progress.v1.',
  queue: 'klavio.queue.v1',
  installDismissed: 'klavio.installHint.dismissed',
  installSnoozedUntil: 'klavio.installHint.snoozedUntil',
} as const;
