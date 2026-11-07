import { z } from 'zod';
import { displayNameSchema } from './auth.ts';

export const uiModeSchema = z.enum(['kids', 'classic']);
export type UiMode = z.infer<typeof uiModeSchema>;

/** Figures a profile can choose; "klavi" (the app's mascot) is the default. */
export const avatarSchema = z.enum(['klavi', 'fox', 'owl', 'cat', 'bear', 'frog', 'whale']);
export type Avatar = z.infer<typeof avatarSchema>;

export const calibrationSchema = z.object({
  a4Hz: z.number().min(415).max(466).default(440),
  noiseFloorDb: z.number().min(-120).max(0).nullable().default(null),
  inputGain: z.number().min(0.1).max(10).default(1),
});
export type Calibration = z.infer<typeof calibrationSchema>;

export const profileCreateSchema = z.object({
  name: displayNameSchema,
  avatar: avatarSchema.default('klavi'),
  uiMode: uiModeSchema.default('kids'),
  dailyGoalMinutes: z.number().int().min(5).max(60).default(10),
});

export const profileUpdateSchema = z
  .object({
    name: displayNameSchema,
    avatar: avatarSchema,
    uiMode: uiModeSchema,
    dailyGoalMinutes: z.number().int().min(5).max(60),
    calibration: calibrationSchema.partial(),
  })
  .partial();

export const selectProfileSchema = z.object({ profileId: z.string().regex(/^[a-f0-9]{24}$/) });

export interface ProfileDto {
  id: string;
  name: string;
  avatar: Avatar;
  uiMode: UiMode;
  dailyGoalMinutes: number;
  calibration: Calibration;
  xp: number;
  level: number;
  streak: { current: number; longest: number; lastActiveDate: string | null };
  badges: { id: string; earnedAt: string }[];
}

export const MAX_PROFILES_PER_ACCOUNT = 8;
