import type {
  LessonCompleteInput,
  ReminderDto,
  OwnPieceDto,
  PublicTestimonialDto,
  TestimonialDto,
  TestimonialInput,
  OwnPieceInput,
  ReminderInput,
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
import { ApiError, api } from './client';

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
  setWeeklyReport: (weeklyReport: boolean) => api('PATCH', '/account', { weeklyReport }),
  reminderStatus: (endpoint: string) =>
    api<ReminderDto | null>('POST', '/reminders/status', { endpoint }),
  setReminder: (input: ReminderInput) => api<ReminderDto>('PUT', '/reminders', input),
  reminderOff: (endpoint: string) => api('POST', '/reminders/off', { endpoint }),
  pieces: () => api<OwnPieceDto[]>('GET', '/pieces'),
  piece: (id: string) => api<OwnPieceDto>('GET', `/pieces/${encodeURIComponent(id)}`),
  addPiece: (input: OwnPieceInput) => api<OwnPieceDto>('POST', '/pieces', input),
  deletePiece: (id: string) => api('DELETE', `/pieces/${encodeURIComponent(id)}`),
  library: (q: string) =>
    api<{ source: { name: string; url: string }; results: { id: string; title: string }[] }>(
      'GET',
      `/library?q=${encodeURIComponent(q)}`,
    ),
  /** a file of the library, passed on by Klavio's server (the browser talks to no one else) */
  libraryFile: async (id: string): Promise<File> => {
    let res: Response;
    try {
      res = await fetch(`/api/library/${encodeURIComponent(id)}/file`, {
        credentials: 'same-origin',
      });
    } catch {
      throw new ApiError(0, 'NETWORK');
    }
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new ApiError(res.status, data.error ?? 'UNKNOWN');
    }
    return new File([await res.blob()], id);
  },
  renamePiece: (id: string, body: { title: string; composer: string | null }) =>
    api<OwnPieceDto>('PATCH', `/pieces/${encodeURIComponent(id)}`, body),
  publicTestimonials: () => api<PublicTestimonialDto[]>('GET', '/testimonials/public'),
  myTestimonials: () => api<TestimonialDto[]>('GET', '/testimonials/mine'),
  addTestimonial: (input: TestimonialInput) => api<TestimonialDto>('POST', '/testimonials', input),
  deleteTestimonial: (id: string) => api('DELETE', `/testimonials/${encodeURIComponent(id)}`),
  allTestimonials: () => api<TestimonialDto[]>('GET', '/testimonials/all'),
  setTestimonialStatus: (id: string, status: TestimonialDto['status']) =>
    api<TestimonialDto>('PATCH', `/testimonials/${encodeURIComponent(id)}`, { status }),
  deleteAccount: () => api('DELETE', '/account'),
  logoutOtherDevices: () => api<{ loggedOut: number }>('POST', '/account/sessions/logout-others'),
  setParentPin: (pin: string) => api('PUT', '/account/pin', { pin }),
  removeParentPin: () => api('DELETE', '/account/pin'),
  verifyParentPin: (pin: string) =>
    api<{ unlockedUntil: string | null }>('POST', '/account/pin/verify', { pin }),
  lockParentArea: () => api('POST', '/account/pin/lock'),
  requestPinReset: () => api('POST', '/account/pin/reset/request'),
  confirmPinReset: (code: string) => api('POST', '/account/pin/reset/verify', { code }),
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
      pathOff?: boolean;
    },
  ) => api<ProfileDto>('PATCH', `/profiles/${id}`, body),
  deleteProfile: (id: string) => api('DELETE', `/profiles/${id}`),
  placement: (chapterId: string) => api('POST', '/progress/placement', { chapterId }),
  selectProfile: (profileId: string) => api('POST', '/profiles/select', { profileId }),

  progress: (date: string, profileId?: string) =>
    api<ProgressDto>(
      'GET',
      `/progress?date=${encodeURIComponent(date)}${profileId ? `&profileId=${encodeURIComponent(profileId)}` : ''}`,
    ),
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
