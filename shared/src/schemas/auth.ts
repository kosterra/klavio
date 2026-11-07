import { z } from 'zod';

export const displayNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  // printable characters only, no control chars
  .regex(/^[^\p{C}]+$/u);

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

export const emailCodeSchema = z.string().regex(/^\d{6}$/);

export const recoveryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .transform((s) => s.replace(/[^A-Z0-9]/g, ''))
  .pipe(z.string().length(10));

export const registerOptionsRequestSchema = z.object({
  displayName: displayNameSchema,
});

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

export const emailRequestSchema = z.object({ email: emailSchema });

export const emailVerifySchema = z.object({
  email: emailSchema,
  code: emailCodeSchema,
  /** Required only when no account exists for this e-mail yet (sign-up via e-mail). */
  displayName: displayNameSchema.optional(),
});

export const recoveryLoginSchema = z.object({ code: recoveryCodeSchema });

export const passkeyRenameSchema = z.object({ name: z.string().trim().min(1).max(60) });

export const accountEmailVerifySchema = z.object({ code: emailCodeSchema });

export type UserRole = 'user' | 'admin';

export interface MeResponse {
  user: {
    id: string;
    displayName: string;
    email: string | null;
    role: UserRole;
    recoveryCodesRemaining: number;
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

export interface PublicConfigResponse {
  appName: string;
  emailLoginEnabled: boolean;
}

export interface AdminSettingsDto {
  emailLoginEnabled: boolean;
}

export const adminSettingsSchema = z.object({ emailLoginEnabled: z.boolean() });
