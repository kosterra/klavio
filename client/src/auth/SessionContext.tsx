import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { MeResponse, ProfileDto, PublicConfigResponse } from '@klavio/shared';
import { ApiError } from '../api/client';
import { endpoints } from '../api/endpoints';
import { SessionContext, type SessionStatus, type SessionValue } from './session';
import { KEYS, readJson, removeKey, removeKeysWithPrefix, writeJson } from '../offline/storage';
import { flushQueue, hasQueued } from '../offline/sync';
import { notify } from '../components/notify';
import i18n from '../i18n';

interface Snapshot {
  status: SessionStatus;
  offline: boolean;
  config: PublicConfigResponse | null;
  me: MeResponse | null;
  profiles: ProfileDto[];
}

type Cached = Pick<Snapshot, 'config' | 'me' | 'profiles'>;

const initial: Snapshot = {
  status: 'loading',
  offline: false,
  config: null,
  me: null,
  profiles: [],
};

function clearCaches() {
  removeKey(KEYS.snapshot);
  removeKeysWithPrefix(KEYS.progressPrefix);
}

/**
 * Fetches everything the shell needs; never throws. Without a connection the
 * last known state is used, so lessons can be played offline.
 */
async function loadSnapshot(): Promise<Snapshot> {
  let config: PublicConfigResponse | null = null;
  try {
    config = await endpoints.config();
    const [me, profiles] = await Promise.all([endpoints.me(), endpoints.profiles()]);
    writeJson(KEYS.snapshot, { config, me, profiles } satisfies Cached);
    return { status: 'authenticated', offline: false, config, me, profiles };
  } catch (err) {
    if (err instanceof ApiError && err.code === 'NETWORK') {
      const cached = readJson<Cached>(KEYS.snapshot);
      if (cached?.me) return { status: 'authenticated', offline: true, ...cached };
      return { ...initial, status: 'offline' };
    }
    clearCaches(); // logged out or session expired
    return { status: 'anonymous', offline: false, config, me: null, profiles: [] };
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<Snapshot>(initial);

  useEffect(() => {
    let cancelled = false;
    void loadSnapshot().then((s) => {
      if (!cancelled) setSnap(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const [dataVersion, setDataVersion] = useState(0);
  const refresh = useCallback(async () => setSnap(await loadSnapshot()), []);

  /** Update state and the offline cache together. */
  const update = useCallback((fn: (s: Snapshot) => Snapshot) => {
    setSnap((s) => {
      const next = fn(s);
      if (next.me)
        writeJson(KEYS.snapshot, { config: next.config, me: next.me, profiles: next.profiles });
      return next;
    });
  }, []);

  const selectProfile = useCallback(
    async (id: string) => {
      try {
        await endpoints.selectProfile(id);
      } catch (err) {
        // offline: switch locally, results carry their profile and sync later
        if (!(err instanceof ApiError && err.code === 'NETWORK')) throw err;
      }
      // Like the server: choosing a profile hands the device over → parent area locks.
      update((s) =>
        s.me
          ? {
              ...s,
              me: {
                ...s.me,
                activeProfileId: id,
                user: { ...s.me.user, parentPin: { ...s.me.user.parentPin, unlockedUntil: null } },
              },
            }
          : s,
      );
    },
    [update],
  );

  const logout = useCallback(async () => {
    await endpoints.logout().catch(() => undefined);
    clearCaches();
    setSnap((s) => ({ ...s, status: 'anonymous', offline: false, me: null, profiles: [] }));
  }, []);

  const applyLocalResult = useCallback<SessionValue['applyLocalResult']>(
    (profileId, changes) =>
      update((s) => ({
        ...s,
        profiles: s.profiles.map((p) => (p.id === profileId ? { ...p, ...changes } : p)),
      })),
    [update],
  );

  // Back online: reload and send results played offline.
  const userId = snap.me?.user.id;
  const activeProfileId = snap.me?.activeProfileId ?? null;
  const online = !snap.offline && snap.status === 'authenticated';
  useEffect(() => {
    if (!userId || !online || !hasQueued(userId)) return;
    let cancelled = false;
    void flushQueue(userId, activeProfileId).then(async (n) => {
      if (cancelled || n === 0) return;
      notify(i18n.t('offline.synced', { count: n }));
      setSnap(await loadSnapshot());
      setDataVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, activeProfileId, online]);

  useEffect(() => {
    const goOnline = () => void loadSnapshot().then(setSnap);
    const goOffline = () =>
      setSnap((s) => (s.status === 'authenticated' ? { ...s, offline: true } : s));
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      ...snap,
      activeProfile: snap.profiles.find((p) => p.id === snap.me?.activeProfileId) ?? null,
      dataVersion,
      refresh,
      selectProfile,
      logout,
      applyLocalResult,
    }),
    [snap, dataVersion, refresh, selectProfile, logout, applyLocalResult],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
