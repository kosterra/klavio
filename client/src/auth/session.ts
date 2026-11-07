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
  /** Freshly generated recovery codes, kept in memory only until confirmed. */
  pendingRecoveryCodes: { codes: string[]; next: string } | null;
  setPendingRecoveryCodes: (value: { codes: string[]; next: string } | null) => void;
  /**
   * Where the anonymous-only route guard sends the user once a login completed
   * (default: profile picker). Set by a login page right before `refresh()`.
   */
  afterLogin: { to: string; notice?: string } | null;
  setAfterLogin: (value: { to: string; notice?: string } | null) => void;
}

export const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
