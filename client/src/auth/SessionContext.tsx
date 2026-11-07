import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { MeResponse, ProfileDto, PublicConfigResponse } from '@klavio/shared';
import { ApiError } from '../api/client';
import { endpoints } from '../api/endpoints';
import { SessionContext, type SessionStatus, type SessionValue } from './session';

interface Snapshot {
  status: SessionStatus;
  config: PublicConfigResponse | null;
  me: MeResponse | null;
  profiles: ProfileDto[];
}

const initial: Snapshot = { status: 'loading', config: null, me: null, profiles: [] };

/** Fetches everything the shell needs; never throws. */
async function loadSnapshot(): Promise<Snapshot> {
  let config: PublicConfigResponse | null = null;
  try {
    config = await endpoints.config();
    const [me, profiles] = await Promise.all([endpoints.me(), endpoints.profiles()]);
    return { status: 'authenticated', config, me, profiles };
  } catch (err) {
    const offline = err instanceof ApiError && err.code === 'NETWORK';
    return { status: offline ? 'offline' : 'anonymous', config, me: null, profiles: [] };
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

  const refresh = useCallback(async () => setSnap(await loadSnapshot()), []);

  const selectProfile = useCallback(async (id: string) => {
    await endpoints.selectProfile(id);
    setSnap((s) => (s.me ? { ...s, me: { ...s.me, activeProfileId: id } } : s));
  }, []);

  const logout = useCallback(async () => {
    await endpoints.logout().catch(() => undefined);
    setSnap((s) => ({ ...s, status: 'anonymous', me: null, profiles: [] }));
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      ...snap,
      activeProfile: snap.profiles.find((p) => p.id === snap.me?.activeProfileId) ?? null,
      refresh,
      selectProfile,
      logout,
    }),
    [snap, refresh, selectProfile, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
