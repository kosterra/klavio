import { createContext, useContext } from 'react';
import type { MeResponse, ProfileDto, PublicConfigResponse } from '@klavio/shared';

export type SessionStatus = 'loading' | 'anonymous' | 'authenticated' | 'offline';

export interface SessionValue {
  status: SessionStatus;
  config: PublicConfigResponse | null;
  me: MeResponse | null;
  profiles: ProfileDto[];
  activeProfile: ProfileDto | null;
  refresh: () => Promise<void>;
  selectProfile: (id: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
