import type {
  AdminSettingsDto,
  MeResponse,
  PasskeyDto,
  ProfileDto,
  PublicConfigResponse,
} from '@klavio/shared';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/browser';
import { api } from './client';

export type ProfileInput = Pick<ProfileDto, 'name' | 'avatar' | 'uiMode' | 'dailyGoalMinutes'>;

export const endpoints = {
  config: () => api<PublicConfigResponse>('GET', '/config'),
  me: () => api<MeResponse>('GET', '/auth/me'),
  logout: () => api('POST', '/auth/logout'),

  registerOptions: (displayName: string) =>
    api<PublicKeyCredentialCreationOptionsJSON>('POST', '/auth/register/options', { displayName }),
  registerVerify: (response: RegistrationResponseJSON) =>
    api<{ recoveryCodes: string[] }>('POST', '/auth/register/verify', { response }),
  loginOptions: () => api<PublicKeyCredentialRequestOptionsJSON>('POST', '/auth/login/options'),
  loginVerify: (response: AuthenticationResponseJSON) =>
    api('POST', '/auth/login/verify', { response }),
  recoveryLogin: (code: string) =>
    api<{ ok: true; recoveryCodesRemaining: number }>('POST', '/auth/recovery', { code }),

  emailRequest: (email: string) => api('POST', '/auth/email/request', { email }),
  emailVerify: (body: { email: string; code: string; displayName?: string }) =>
    api<
      | { status: 'ok' }
      | { status: 'needs-display-name' }
      | { status: 'created'; recoveryCodes: string[] }
    >('POST', '/auth/email/verify', body),

  passkeys: () => api<PasskeyDto[]>('GET', '/passkeys'),
  addPasskeyOptions: () => api<PublicKeyCredentialCreationOptionsJSON>('POST', '/passkeys/options'),
  addPasskeyVerify: (response: RegistrationResponseJSON) =>
    api<PasskeyDto>('POST', '/passkeys/verify', { response }),
  renamePasskey: (id: string, name: string) =>
    api<PasskeyDto>('PATCH', `/passkeys/${id}`, { name }),
  deletePasskey: (id: string) => api('DELETE', `/passkeys/${id}`),

  accountEmailRequest: (email: string) => api('POST', '/account/email/request', { email }),
  accountEmailVerify: (code: string) =>
    api<{ email: string }>('POST', '/account/email/verify', { code }),
  accountEmailRemove: () => api('DELETE', '/account/email'),
  regenerateRecoveryCodes: () =>
    api<{ recoveryCodes: string[] }>('POST', '/account/recovery-codes'),
  deleteAccount: () => api('DELETE', '/account'),

  profiles: () => api<ProfileDto[]>('GET', '/profiles'),
  createProfile: (body: ProfileInput) => api<ProfileDto>('POST', '/profiles', body),
  updateProfile: (id: string, body: Partial<ProfileInput>) =>
    api<ProfileDto>('PATCH', `/profiles/${id}`, body),
  deleteProfile: (id: string) => api('DELETE', `/profiles/${id}`),
  selectProfile: (profileId: string) => api('POST', '/profiles/select', { profileId }),

  adminSettings: () => api<AdminSettingsDto>('GET', '/admin/settings'),
  updateAdminSettings: (body: AdminSettingsDto) =>
    api<AdminSettingsDto>('PUT', '/admin/settings', body),
};
