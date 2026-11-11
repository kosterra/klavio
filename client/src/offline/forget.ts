import { KEYS, readJson, writeJson } from './storage';
import type { QueuedResult } from './queue';

/** Settings kept on the device per profile – as maps or lists keyed by the profile's id. */
const MAP_KEYS = ['klavio-read-aloud', 'klavio-worlds-revealed'];
const LIST_KEYS = ['klavio-mic-hint-hidden'];
/** … or as one entry per profile: `<prefix>:<profileId>` */
const PREFIXES = ['klavio-rain-best', 'klavio-play-on', 'klavio-metronome'];

function edit<T>(key: string, change: (v: T) => T) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return;
    localStorage.setItem(key, JSON.stringify(change(JSON.parse(raw) as T)));
  } catch {
    // unreadable – nothing to forget
  }
}

/**
 * Logging out on a shared device (the family tablet): besides the cached
 * state, the account's results not sent yet and its profiles' settings go –
 * the next person sees nothing of them. Device settings (language, colour
 * scheme, sidebar, «Klavi spielt mit») stay.
 */
export function forgetAccount(userId: string | null, profileIds: string[]): void {
  if (userId) {
    const queue = readJson<QueuedResult[]>(KEYS.queue) ?? [];
    writeJson(
      KEYS.queue,
      queue.filter((q) => q.userId !== userId),
    );
  }
  const ids = new Set(profileIds);
  for (const key of MAP_KEYS) {
    edit<Record<string, unknown>>(key, (m) =>
      Object.fromEntries(Object.entries(m).filter(([id]) => !ids.has(id))),
    );
  }
  for (const key of LIST_KEYS) edit<string[]>(key, (l) => l.filter((id) => !ids.has(id)));
  try {
    for (const prefix of PREFIXES) for (const id of ids) localStorage.removeItem(`${prefix}:${id}`);
  } catch {
    // storage blocked – nothing stored either
  }
}
