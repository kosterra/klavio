import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { MeResponse, ProfileDto, PublicConfigResponse } from '@klavio/shared';
import { ApiError, isTransient } from '../api/client';
import { endpoints } from '../api/endpoints';
import { SessionContext, type SessionStatus, type SessionValue } from './session';
import { KEYS, readJson, removeKey, removeKeysWithPrefix, writeJson } from '../offline/storage';
import { forgetAccount } from '../offline/forget';
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
  removeKey(KEYS.pendingSelect);
  removeKeysWithPrefix(KEYS.progressPrefix);
}

interface PendingSelect {
  userId: string;
  profileId: string;
}

/** A profile chosen without a connection: the server learns it once it is reachable. */
async function applyPendingSelect(me: MeResponse, profiles: ProfileDto[]): Promise<MeResponse> {
  const pending = readJson<PendingSelect>(KEYS.pendingSelect);
  if (!pending || pending.userId !== me.user.id) return me;
  if (
    pending.profileId === me.activeProfileId ||
    !profiles.some((p) => p.id === pending.profileId)
  ) {
    removeKey(KEYS.pendingSelect);
    return me;
  }
  try {
    await endpoints.selectProfile(pending.profileId);
  } catch (err) {
    if (isTransient(err)) return { ...me, activeProfileId: pending.profileId };
  }
  removeKey(KEYS.pendingSelect);
  return {
    ...me,
    activeProfileId: pending.profileId,
    user: { ...me.user, parentPin: { ...me.user.parentPin, unlockedUntil: null } },
  };
}

/**
 * Fetches everything the shell needs; never throws. Without a connection – or
 * while the server is busy or restarting – the last known state is used, so
 * lessons can be played. Only the server saying «not logged in» logs out.
 */
async function loadSnapshot(): Promise<Snapshot> {
  let config: PublicConfigResponse | null = null;
  try {
    config = await endpoints.config();
    const [me0, profiles] = await Promise.all([endpoints.me(), endpoints.profiles()]);
    const me = await applyPendingSelect(me0, profiles);
    writeJson(KEYS.snapshot, { config, me, profiles } satisfies Cached);
    return { status: 'authenticated', offline: false, config, me, profiles };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      clearCaches(); // logged out or session expired
      return { status: 'anonymous', offline: false, config, me: null, profiles: [] };
    }
    const cached = readJson<Cached>(KEYS.snapshot);
    if (cached?.me) {
      const pending = readJson<PendingSelect>(KEYS.pendingSelect);
      const me =
        pending && pending.userId === cached.me.user.id
          ? { ...cached.me, activeProfileId: pending.profileId }
          : cached.me;
      return { status: 'authenticated', offline: true, ...cached, me };
    }
    return { ...initial, status: 'offline' };
  }
}

/** While offline (or the server unreachable): look again this often. */
const RETRY_MS = 30_000;

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
        removeKey(KEYS.pendingSelect);
      } catch (err) {
        // offline: switch locally – results carry their profile, and the
        // server learns the choice once it is reachable again
        if (!isTransient(err)) throw err;
        const userId = readJson<Cached>(KEYS.snapshot)?.me?.user.id;
        if (userId)
          writeJson(KEYS.pendingSelect, { userId, profileId: id } satisfies PendingSelect);
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
    // a deliberate logout also forgets the account's unsent results and its
    // profiles' settings on this device (an expired session keeps them to sync later)
    const cached = readJson<Cached>(KEYS.snapshot);
    forgetAccount(
      cached?.me?.user.id ?? null,
      (cached?.profiles ?? []).map((p) => p.id),
    );
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
  const online = !snap.offline && snap.status === 'authenticated';
  useEffect(() => {
    if (!userId || !online || !hasQueued(userId)) return;
    let cancelled = false;
    void flushQueue(userId).then(async ({ synced }) => {
      if (cancelled || synced === 0) return;
      notify(i18n.t('offline.synced', { count: synced }));
      setSnap(await loadSnapshot());
      setDataVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, online]);

  // Offline or the server unreachable: look again now and then, and when the
  // app comes back to the front (the browser's «online» does not fire when
  // only the server was away).
  const away = snap.offline || snap.status === 'offline';
  useEffect(() => {
    if (!away) return;
    const retry = () => void loadSnapshot().then(setSnap);
    const timer = window.setInterval(retry, RETRY_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') retry();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [away]);

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
