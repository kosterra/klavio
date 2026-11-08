import { z } from 'zod';
import { mailLangSchema } from '../mail/templates.ts';

export const displayNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  // printable characters only, no control chars
  .regex(/^[^\p{C}]+$/u);

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

export const emailCodeSchema = z.string().regex(/^\d{6}$/);

/** WebAuthn JSON payloads are validated structurally by @simplewebauthn; we only bound size/shape. */
export const webauthnResponseSchema = z
  .object({
    id: z.string().max(1024),
    rawId: z.string().max(1024),
    type: z.literal('public-key'),
    response: z.record(z.string(), z.unknown()),
    clientExtensionResults: z.record(z.string(), z.unknown()).default({}),
    authenticatorAttachment: z.string().optional(),
  })
  .loose();

export const webauthnVerifyRequestSchema = z.object({
  response: webauthnResponseSchema,
});

export const emailRequestSchema = z.object({
  email: emailSchema,
  /** the language the code mail is written in (the app's language) */
  lang: mailLangSchema.optional(),
});

export const emailVerifySchema = z.object({
  email: emailSchema,
  code: emailCodeSchema,
  /** Required only when no account exists for this e-mail yet (sign-up). */
  displayName: displayNameSchema.optional(),
  /** the app's language: later mails to the account use it */
  lang: mailLangSchema.optional(),
});

export const passkeyRenameSchema = z.object({ name: z.string().trim().min(1).max(60) });

export const accountEmailVerifySchema = z.object({ code: emailCodeSchema });

export const accountUpdateSchema = z.object({ displayName: displayNameSchema });

/** Parent PIN: 4–6 digits, protects the parent area from children (not an account password). */
export const parentPinSchema = z.object({ pin: z.string().regex(/^\d{4,6}$/) });
export const parentPasskeySettingSchema = z.object({ enabled: z.boolean() });

export type UserRole = 'user' | 'admin';

export interface MeResponse {
  user: {
    id: string;
    displayName: string;
    /** Always set for accounts created via e-mail sign-up; null only for legacy accounts. */
    email: string | null;
    role: UserRole;
    passkeyCount: number;
    /** Parent PIN set, and until when this session has the parent area unlocked. */
    parentPin: {
      set: boolean;
      unlockedUntil: string | null;
      /** the parent area can also be opened with a passkey (switched on, and a passkey exists) */
      passkey: boolean;
      /** the setting itself (also when there is no passkey yet) */
      passkeyEnabled: boolean;
    };
  };
  activeProfileId: string | null;
}

export interface PasskeyDto {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  backedUp: boolean;
  deviceType: string;
}

/** Who runs this instance – shown in the footer and on the privacy page. */
export interface OperatorInfo {
  /** person or organisation responsible, e.g. «Familie Muster» or «Musikschule Bern» */
  operatorName: string;
  /** where to write about the data (privacy, deletion, questions) */
  contactEmail: string;
}

export interface PublicConfigResponse extends OperatorInfo {
  appName: string;
  registrationOpen: boolean;
  /** from this age a profile can choose between the kids' worlds and the journey */
  journeyMinAge: number;
}

export interface AdminSettingsDto extends OperatorInfo {
  registrationOpen: boolean;
  journeyMinAge: number;
  /** false: the instance asks search engines not to list it */
  searchIndexing: boolean;
  /** accounts without sign-in for this many months are deleted after a warning (0 = never) */
  inactiveDeleteMonths: number;
}

export const adminSettingsSchema = z.object({
  registrationOpen: z.boolean().optional(),
  operatorName: z
    .string()
    .trim()
    .max(120)
    .regex(/^[^\p{C}]*$/u)
    .optional(),
  contactEmail: z.union([emailSchema, z.literal('')]).optional(),
  journeyMinAge: z.number().int().min(0).max(99).optional(),
  searchIndexing: z.boolean().optional(),
  inactiveDeleteMonths: z.number().int().min(0).max(120).optional(),
});
