import { createContext, useContext } from 'react';
import type { MeResponse, ProfileDto, PublicConfigResponse } from '@klavio/shared';

export type SessionStatus = 'loading' | 'anonymous' | 'authenticated' | 'offline';

export interface SessionValue {
  status: SessionStatus;
  /** Showing the last known state because the server can't be reached. */
  offline: boolean;
  /** Increases whenever server data changed in the background (e.g. after a sync). */
  dataVersion: number;
  config: PublicConfigResponse | null;
  me: MeResponse | null;
  profiles: ProfileDto[];
  activeProfile: ProfileDto | null;
  refresh: () => Promise<void>;
  selectProfile: (id: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Update XP/level/streak locally after a lesson played offline. */
  applyLocalResult: (
    profileId: string,
    changes: Pick<ProfileDto, 'xp' | 'level' | 'streak'>,
  ) => void;
}

export const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
