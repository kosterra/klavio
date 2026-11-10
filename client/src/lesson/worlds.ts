import type { CSSProperties } from 'react';
import { CURRICULUM, coreLessons, type WorldSet } from '@klavio/shared';
import type { StickerKind } from './stickerKinds';

/** One colour per chapter (Mantine palette names), repeating. */
export const CHAPTER_COLORS = [
  'indigo',
  'teal',
  'grape',
  'orange',
  'cyan',
  'violet',
  'pink',
  'blue',
];

/** CSS variables that colour a chapter's world. */
export function chapterVars(color: string): CSSProperties {
  return {
    '--chapter-color': `var(--mantine-color-${color}-7)`,
    '--chapter-light': `var(--mantine-color-${color}-5)`,
    '--chapter-dark': `var(--mantine-color-${color}-9)`,
    '--chapter-road-light': `var(--mantine-color-${color}-2)`,
    '--chapter-road-dark': `var(--mantine-color-${color}-9)`,
  } as CSSProperties;
}

/** World, colour and index of the chapter a lesson belongs to. */
export function worldOfLesson(lessonId: string, set: WorldSet = 'kids') {
  const ci = Math.max(
    0,
    CURRICULUM.findIndex((c) => c.lessons.some((l) => l.id === lessonId)),
  );
  const chapter = CURRICULUM[ci]!;
  const world = worldOf(chapter.id, ci, set);
  const color = chapterColor(world, ci);
  return { chapter, index: ci, color, world, vars: chapterVars(color) };
}

/** The colour of a chapter: the journey's worlds have their own, the kids' worlds take turns. */
export function chapterColor(world: World, index: number): string {
  return world.color ?? CHAPTER_COLORS[index % CHAPTER_COLORS.length]!;
}

export type KidsWorldId =
  'keys' | 'forest' | 'sea' | 'village' | 'mountain' | 'cave' | 'city' | 'night';

/**
 * The adults' journey (Classic): from the alp down through gorge and mine
 * into «Die Hölle» – the hardest chapter – and then up again, over the ridge
 * to the summit where the dream song waits.
 */
export type JourneyWorldId =
  | 'alp'
  | 'tobel'
  | 'gorge'
  | 'mine'
  | 'embers'
  | 'hell'
  | 'chimney'
  | 'ridge'
  | 'hut'
  | 'pass'
  | 'glacier';

export type WorldId = KidsWorldId | JourneyWorldId;

/** The centre marking of the road – each world has its own surface. */
export interface RoadSurface {
  width: number;
  dash: string;
  cap: 'butt' | 'round';
  /** CSS colour; road-line is the default white/grey marking */
  color: string;
  opacity?: number;
}

export interface World {
  id: WorldId;
  stickers: StickerKind[];
  road: RoadSurface;
  /** own colour (journey); kids' worlds take CHAPTER_COLORS in turn */
  color?: string;
  /** journey only: metres above (or below) sea level */
  altitude?: number;
}

const LINE = 'var(--klavio-road-line)';

/**
 * Every chapter is a world of its own: landscape, stickers and road surface.
 * Chapters are matched by id; new chapters without an entry cycle through the list.
 */
export const WORLDS: Record<KidsWorldId, World> = {
  // Tasten-Tal: black keys across the road
  keys: {
    id: 'keys',
    stickers: ['piano', 'note', 'tuningfork'],
    road: { width: 14, dash: '5 9', cap: 'butt', color: 'var(--chapter-dark)', opacity: 0.2 },
  },
  // Hand-Wald: a trail of dots, like footprints
  forest: {
    id: 'forest',
    stickers: ['hand', 'mushroom', 'star'],
    road: { width: 8, dash: '0 14', cap: 'round', color: LINE },
  },
  // Noten-Meer: a boardwalk of planks
  sea: {
    id: 'sea',
    stickers: ['fish', 'boat', 'notes'],
    road: { width: 26, dash: '3 7', cap: 'butt', color: LINE },
  },
  // Lieder-Dorf: cobblestones
  village: {
    id: 'village',
    stickers: ['duck', 'bell', 'star'],
    road: { width: 11, dash: '9 6', cap: 'round', color: LINE },
  },
  // Rhythmus-Berg: bar lines, like in sheet music
  mountain: {
    id: 'mountain',
    stickers: ['drum', 'metronome', 'heart'],
    road: { width: 26, dash: '3 21', cap: 'butt', color: LINE },
  },
  // Bass-Höhle: glowing crystal dots
  cave: {
    id: 'cave',
    stickers: ['bat', 'crystal', 'note'],
    road: { width: 9, dash: '0 16', cap: 'round', color: 'var(--mantine-color-yellow-3)' },
  },
  // Brücken-Stadt: paving stones
  city: {
    id: 'city',
    stickers: ['balloon', 'bell', 'heart'],
    road: { width: 22, dash: '12 4', cap: 'butt', color: LINE, opacity: 0.8 },
  },
  // Sternen-Nacht: a trail of little stars
  night: {
    id: 'night',
    stickers: ['moon', 'star', 'sparkle'],
    road: { width: 7, dash: '0 12', cap: 'round', color: 'var(--mantine-color-yellow-4)' },
  },
};

const BY_CHAPTER: Record<string, KidsWorldId> = {
  keys: 'keys',
  hand: 'forest',
  read: 'sea',
  songs: 'village',
  rhythm: 'mountain',
  bass: 'cave',
  both: 'city',
  black: 'night',
  meter: 'mountain',
  keysigs: 'sea',
  accomp: 'city',
};

const ORDER: KidsWorldId[] = [
  'keys',
  'forest',
  'sea',
  'village',
  'mountain',
  'cave',
  'city',
  'night',
];

export const JOURNEY: Record<JourneyWorldId, World> = {
  // Alp: the start up in the meadows – a mown path
  alp: {
    id: 'alp',
    color: 'green',
    altitude: 1500,
    stickers: ['note', 'heart', 'star'],
    road: { width: 8, dash: '0 14', cap: 'round', color: LINE },
  },
  // Tobel: the trail drops steeply into the wooded ravine – steps
  tobel: {
    id: 'tobel',
    color: 'teal',
    altitude: 900,
    stickers: ['hand', 'mushroom', 'note'],
    road: { width: 22, dash: '4 10', cap: 'butt', color: LINE },
  },
  // Schlucht: along the wild river – a boardwalk
  gorge: {
    id: 'gorge',
    color: 'blue',
    altitude: 400,
    stickers: ['notes', 'fish', 'boat'],
    road: { width: 26, dash: '3 7', cap: 'butt', color: LINE },
  },
  // Stollen: into the mountain – rails
  mine: {
    id: 'mine',
    color: 'violet',
    altitude: -150,
    stickers: ['crystal', 'bat', 'note'],
    road: { width: 20, dash: '2 8', cap: 'butt', color: 'var(--chapter-dark)', opacity: 0.45 },
  },
  // Glutkammer: glowing embers underfoot
  embers: {
    id: 'embers',
    color: 'orange',
    altitude: -420,
    stickers: ['crystal', 'drum', 'metronome'],
    road: { width: 9, dash: '0 15', cap: 'round', color: 'var(--mantine-color-yellow-4)' },
  },
  // Die Hölle: the lowest point – a trail of fire
  hell: {
    id: 'hell',
    color: 'red',
    altitude: -666,
    stickers: ['metronome', 'drum', 'bat'],
    road: { width: 10, dash: '10 8', cap: 'round', color: 'var(--mantine-color-orange-5)' },
  },
  // Kamin: climbing up through the rock towards the light – a rope ladder
  chimney: {
    id: 'chimney',
    color: 'grape',
    altitude: 600,
    stickers: ['hand', 'crystal', 'star'],
    road: { width: 24, dash: '3 12', cap: 'butt', color: LINE },
  },
  // Gipfelgrat: the last ridge before the summit – stepping stones
  ridge: {
    id: 'ridge',
    color: 'indigo',
    altitude: 2400,
    stickers: ['star', 'sparkle', 'moon'],
    road: { width: 11, dash: '9 6', cap: 'round', color: LINE },
  },
  // Berghütte: a rest high up, before the last climb – new rhythms
  hut: {
    id: 'hut',
    color: 'cyan',
    altitude: 2900,
    stickers: ['drum', 'metronome', 'star'],
    road: { width: 22, dash: '4 10', cap: 'butt', color: LINE },
  },
  // Gletscher: the last stretch on the ice before the summit – accompanying
  glacier: {
    id: 'glacier',
    color: 'blue',
    altitude: 3150,
    stickers: ['crystal', 'snowflake', 'star'],
    road: { width: 9, dash: '0 14', cap: 'round', color: LINE },
  },
  // Passhöhe: the saddle just below the summit – keys and scales
  pass: {
    id: 'pass',
    color: 'teal',
    altitude: 3100,
    stickers: ['notes', 'star', 'sparkle'],
    road: { width: 11, dash: '9 6', cap: 'round', color: LINE },
  },
};

const JOURNEY_BY_CHAPTER: Record<string, JourneyWorldId> = {
  meter: 'hut',
  keysigs: 'pass',
  accomp: 'glacier',
  keys: 'alp',
  hand: 'tobel',
  read: 'gorge',
  songs: 'mine',
  rhythm: 'embers',
  bass: 'hell',
  both: 'chimney',
  black: 'ridge',
};

/** 1500 → «1500», −666 → «−666» (with a real minus sign). */
export function formatAltitude(m: number, lang: string): string {
  return new Intl.NumberFormat(lang, { useGrouping: false }).format(m).replace('-', '−');
}

/** Where the dream song waits, above the last world of the journey. */
export const SUMMIT_ALTITUDE = 3200;

/**
 * The world of a chapter: the colourful kids' worlds, or (chosen from the age
 * admins set) the journey down into «Die Hölle» and up to the summit. New chapters without an
 * entry cycle through the kids' worlds, or climb along the ridge.
 */
export function worldOf(chapterId: string, index: number, set: WorldSet = 'kids'): World {
  if (set === 'journey') return JOURNEY[JOURNEY_BY_CHAPTER[chapterId] ?? 'ridge'];
  return WORLDS[BY_CHAPTER[chapterId] ?? ORDER[index % ORDER.length]!];
}

/** Christmas stickers for the path in Advent (see season/season.ts). */
export const CHRISTMAS_STICKERS: StickerKind[] = [
  'tree',
  'gift',
  'snowflake',
  'candle',
  'bell',
  'star',
];

/** Worlds whose fog has already lifted (per profile) – the lift is shown once. */
const REVEALED_KEY = 'klavio-worlds-revealed';

export function loadRevealed(profileId: string): Set<string> {
  try {
    const all = JSON.parse(localStorage.getItem(REVEALED_KEY) ?? '{}') as Record<string, string[]>;
    return new Set(all[profileId] ?? []);
  } catch {
    return new Set();
  }
}

export function saveRevealed(profileId: string, chapterIds: Iterable<string>) {
  try {
    const all = JSON.parse(localStorage.getItem(REVEALED_KEY) ?? '{}') as Record<string, string[]>;
    all[profileId] = [...chapterIds];
    localStorage.setItem(REVEALED_KEY, JSON.stringify(all));
  } catch {
    // storage unavailable: the lift simply plays again next time
  }
}

/** Whether this lesson just finished its whole world (chapter). */
export function finishesWorld(lessonId: string, completedBefore: Set<string>): boolean {
  const chapter = CURRICULUM.find((c) => c.lessons.some((l) => l.id === lessonId));
  if (!chapter) return false;
  const core = coreLessons(chapter);
  const before = core.every((l) => completedBefore.has(l.id));
  const after = core.every((l) => l.id === lessonId || completedBefore.has(l.id));
  return !before && after;
}
