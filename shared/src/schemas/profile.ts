import { z } from 'zod';
import { displayNameSchema } from './auth.ts';
import { GOAL_STYLES, SKILL_IDS } from '../curriculum/skills.ts';

export const uiModeSchema = z.enum(['kids', 'classic']);
export type UiMode = z.infer<typeof uiModeSchema>;

/**
 * Which worlds a profile travels through: the colourful kids' worlds or the
 * adults' journey (down into «Die Hölle», up to the dream song). From the
 * age admins set (journeyMinAge) a profile can choose; younger ones always
 * get the kids' worlds.
 */
export const worldSetSchema = z.enum(['kids', 'journey']);
export type WorldSet = z.infer<typeof worldSetSchema>;

/** Default for the admin setting «both worlds from age …». */
export const DEFAULT_JOURNEY_MIN_AGE = 12;

/** Only the year of birth is stored – never a date. */
export const birthYearSchema = z
  .number()
  .int()
  .min(1900)
  .refine((y) => y <= new Date().getFullYear(), { message: 'birth year in the future' });

/** Age in the given year (the age one turns this year – the year is all Klavio knows). */
export function ageIn(birthYear: number, year = new Date().getFullYear()): number {
  return year - birthYear;
}

/** Whether a profile may choose between both worlds. Profiles without a birth year can't. */
export function canChooseWorld(
  birthYear: number | null | undefined,
  minAge: number,
  year?: number,
): boolean {
  return birthYear != null && ageIn(birthYear, year) >= minAge;
}

/**
 * The worlds a profile actually sees. Without a choice yet, Classic profiles
 * travel the journey and Kids profiles the kids' worlds; below the minimum
 * age it is always the kids' worlds. Profiles from before the birth year
 * existed keep what they had.
 */
export function effectiveWorld(
  profile: { birthYear: number | null; world: WorldSet | null; uiMode: UiMode },
  minAge: number,
  year?: number,
): WorldSet {
  const chosen = profile.world ?? (profile.uiMode === 'classic' ? 'journey' : 'kids');
  if (profile.birthYear == null) return chosen;
  return canChooseWorld(profile.birthYear, minAge, year) ? chosen : 'kids';
}

/**
 * The wardrobe: one piece the figure wears. Pieces are unlocked by level –
 * nothing is spent, XP never goes down.
 */
export const OUTFITS = [
  { id: 'cap', level: 2 },
  { id: 'bow', level: 3 },
  { id: 'glasses', level: 4 },
  { id: 'scarf', level: 5 },
  { id: 'headphones', level: 7 },
  { id: 'crown', level: 10 },
] as const;
export const outfitSchema = z.enum(['cap', 'bow', 'glasses', 'scarf', 'headphones', 'crown']);
export type Outfit = z.infer<typeof outfitSchema>;

/** Why someone plays – asked when a profile starts; it sets Klavi's suggestions. */
export const MOTIVES = ['read', 'songs', 'relax', 'fun', 'child'] as const;
export const motiveSchema = z.enum(MOTIVES);
export type Motive = z.infer<typeof motiveSchema>;

/** Where the learner plays: on the real piano (microphone or MIDI) or on the screen keys. */
export const playOnSchema = z.enum(['piano', 'screen']);
export type PlayOn = z.infer<typeof playOnSchema>;

/** Days per week a learner plans to practise (2, 4 or 6 in the start-up flow). */
export const weeklyGoalSchema = z.number().int().min(1).max(7);

/** Figures a profile can choose; "klavi" (the app's mascot) is the default. */
export const avatarSchema = z.enum(['klavi', 'fox', 'owl', 'cat', 'bear', 'frog', 'whale']);
export type Avatar = z.infer<typeof avatarSchema>;

export const calibrationSchema = z.object({
  a4Hz: z.number().min(415).max(466).default(440),
  noiseFloorDb: z.number().min(-120).max(0).nullable().default(null),
  inputGain: z.number().min(0.1).max(10).default(1),
});
export type Calibration = z.infer<typeof calibrationSchema>;

/** The song an (adult) learner would like to play one day – only its title is stored. */
export const goalSongSchema = z.object({
  title: z.string().trim().min(1).max(80),
  style: z.enum(GOAL_STYLES),
  skills: z.array(z.enum(SKILL_IDS)).max(SKILL_IDS.length),
});
export type GoalSong = z.infer<typeof goalSongSchema>;

export const profileCreateSchema = z.object({
  name: displayNameSchema,
  avatar: avatarSchema.default('klavi'),
  uiMode: uiModeSchema.default('kids'),
  dailyGoalMinutes: z.number().int().min(5).max(60).default(10),
  birthYear: birthYearSchema,
  world: worldSetSchema.nullable().default(null),
});

export const profileUpdateSchema = z
  .object({
    name: displayNameSchema,
    avatar: avatarSchema,
    uiMode: uiModeSchema,
    dailyGoalMinutes: z.number().int().min(5).max(60),
    calibration: calibrationSchema.partial(),
    goalSong: goalSongSchema.nullable(),
    birthYear: birthYearSchema,
    world: worldSetSchema.nullable(),
    outfit: outfitSchema.nullable(),
    /** the start-up questions are answered (or skipped) */
    setupDone: z.literal(true),
    motive: motiveSchema.nullable(),
    weeklyGoalDays: weeklyGoalSchema.nullable(),
    playOn: playOnSchema.nullable(),
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
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string | null;
    /** the week whose free day was used */
    freeDayWeek?: string | null;
  };
  badges: { id: string; earnedAt: string }[];
  goalSong: GoalSong | null;
  /** null for profiles created before it was asked */
  birthYear: number | null;
  /** chosen worlds; null = not chosen (follows uiMode) */
  world: WorldSet | null;
  /** the wardrobe piece the figure wears */
  outfit: Outfit | null;
  /** false only for a new profile that hasn't seen the start-up questions */
  setupDone: boolean;
  motive: Motive | null;
  /** planned practice days per week; null = no weekly goal */
  weeklyGoalDays: number | null;
  /** what lessons and free play offer first; null = not chosen yet */
  playOn: PlayOn | null;
}

export const MAX_PROFILES_PER_ACCOUNT = 8;

/** One profile in the family overview (parent area) and «Mein Profil». */
export interface ProfileOverviewDto {
  profile: ProfileDto;
  lessonsDone: number;
  stars: number;
  /** the lesson to play next (null: all done) */
  nextLessonId: string | null;
  /** minutes practised per week, oldest first; the last one is this week */
  weeks: { week: string; minutes: number }[];
  /** days practised in the last 28 days */
  activeDays: number;
}
