import type {
  LessonCompleteInput,
  LessonResultDto,
  ProgressDto,
  AdminSettingsDto,
  MeResponse,
  PasskeyDto,
  ProfileDto,
  PublicConfigResponse,
  ProfileOverviewDto,
  MailLang,
  MailTemplateDto,
  MailTemplateId,
  MailTemplateTexts,
} from '@klavio/shared';
import { mailLangOf } from '@klavio/shared';
import i18n from '../i18n';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/browser';
import { api } from './client';

/** Code mails are written in the language the app is shown in. */
const lang = () => mailLangOf(i18n.language);

export type ProfileInput = Pick<
  ProfileDto,
  'name' | 'avatar' | 'uiMode' | 'dailyGoalMinutes' | 'birthYear' | 'world'
>;

export const endpoints = {
  config: () => api<PublicConfigResponse>('GET', '/config'),
  me: () => api<MeResponse>('GET', '/auth/me'),
  logout: () => api('POST', '/auth/logout'),

  loginOptions: () => api<PublicKeyCredentialRequestOptionsJSON>('POST', '/auth/login/options'),
  loginVerify: (response: AuthenticationResponseJSON) =>
    api('POST', '/auth/login/verify', { response }),

  emailRequest: (email: string) => api('POST', '/auth/email/request', { email, lang: lang() }),
  emailVerify: (body: { email: string; code: string; displayName?: string }) =>
    api<{ status: 'ok' | 'needs-display-name' | 'created' }>('POST', '/auth/email/verify', {
      ...body,
      lang: lang(),
    }),

  passkeys: () => api<PasskeyDto[]>('GET', '/passkeys'),
  addPasskeyOptions: () => api<PublicKeyCredentialCreationOptionsJSON>('POST', '/passkeys/options'),
  addPasskeyVerify: (response: RegistrationResponseJSON) =>
    api<PasskeyDto>('POST', '/passkeys/verify', { response }),
  renamePasskey: (id: string, name: string) =>
    api<PasskeyDto>('PATCH', `/passkeys/${id}`, { name }),
  deletePasskey: (id: string) => api('DELETE', `/passkeys/${id}`),

  accountEmailRequest: (email: string) =>
    api('POST', '/account/email/request', { email, lang: lang() }),
  accountEmailVerify: (code: string) =>
    api<{ email: string }>('POST', '/account/email/verify', { code }),
  updateAccount: (displayName: string) =>
    api<{ displayName: string }>('PATCH', '/account', { displayName }),
  deleteAccount: () => api('DELETE', '/account'),
  setParentPin: (pin: string) => api('PUT', '/account/pin', { pin }),
  removeParentPin: () => api('DELETE', '/account/pin'),
  verifyParentPin: (pin: string) =>
    api<{ unlockedUntil: string | null }>('POST', '/account/pin/verify', { pin }),
  lockParentArea: () => api('POST', '/account/pin/lock'),
  setParentPasskey: (enabled: boolean) => api('PUT', '/account/pin/passkey', { enabled }),
  parentPasskeyOptions: () =>
    api<PublicKeyCredentialRequestOptionsJSON>('POST', '/account/pin/passkey/options'),
  parentPasskeyVerify: (response: AuthenticationResponseJSON) =>
    api<{ unlockedUntil: string | null }>('POST', '/account/pin/passkey/verify', { response }),

  profiles: () => api<ProfileDto[]>('GET', '/profiles'),
  profileOverview: (date: string) =>
    api<ProfileOverviewDto[]>('GET', `/profiles/overview?date=${encodeURIComponent(date)}`),
  createProfile: (body: ProfileInput) => api<ProfileDto>('POST', '/profiles', body),
  updateProfile: (
    id: string,
    body: Partial<ProfileInput> & {
      calibration?: Partial<ProfileDto['calibration']>;
      goalSong?: ProfileDto['goalSong'];
      outfit?: ProfileDto['outfit'];
      setupDone?: true;
      motive?: ProfileDto['motive'];
      weeklyGoalDays?: ProfileDto['weeklyGoalDays'];
      playOn?: ProfileDto['playOn'];
    },
  ) => api<ProfileDto>('PATCH', `/profiles/${id}`, body),
  deleteProfile: (id: string) => api('DELETE', `/profiles/${id}`),
  placement: (chapterId: string) => api('POST', '/progress/placement', { chapterId }),
  selectProfile: (profileId: string) => api('POST', '/profiles/select', { profileId }),

  progress: (date: string) => api<ProgressDto>('GET', `/progress?date=${encodeURIComponent(date)}`),
  completeLesson: (lessonId: string, body: LessonCompleteInput) =>
    api<LessonResultDto>('POST', `/progress/lessons/${lessonId}`, body),

  adminSettings: () => api<AdminSettingsDto>('GET', '/admin/settings'),
  updateAdminSettings: (body: Partial<AdminSettingsDto>) =>
    api<AdminSettingsDto>('PUT', '/admin/settings', body),
  mailTemplates: () => api<MailTemplateDto[]>('GET', '/admin/mail-templates'),
  saveMailTemplate: (id: MailTemplateId, texts: MailTemplateTexts) =>
    api<MailTemplateDto>('PUT', `/admin/mail-templates/${id}`, texts),
  resetMailTemplate: (id: MailTemplateId) =>
    api<MailTemplateDto>('DELETE', `/admin/mail-templates/${id}`),
  testMailTemplate: (id: MailTemplateId, mailLang: MailLang) =>
    api('POST', `/admin/mail-templates/${id}/test`, { lang: mailLang }),
};
