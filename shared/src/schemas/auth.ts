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
  /** Required only when no account exists for this e-mail yet (sign-up). */
  displayName: displayNameSchema.optional(),
});

export const passkeyRenameSchema = z.object({ name: z.string().trim().min(1).max(60) });

export const accountEmailVerifySchema = z.object({ code: emailCodeSchema });

export const accountUpdateSchema = z.object({ displayName: displayNameSchema });

/** Parent PIN: 4–6 digits, protects the parent area from children (not an account password). */
export const parentPinSchema = z.object({ pin: z.string().regex(/^\d{4,6}$/) });

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
    parentPin: { set: boolean; unlockedUntil: string | null };
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
  registrationOpen: boolean;
}

export interface AdminSettingsDto {
  registrationOpen: boolean;
}

export const adminSettingsSchema = z.object({ registrationOpen: z.boolean() });
