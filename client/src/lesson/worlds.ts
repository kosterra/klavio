import type { StickerKind } from './stickerKinds';

export type WorldId = 'keys' | 'forest' | 'sea' | 'village' | 'mountain';

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
}

const LINE = 'var(--klavio-road-line)';

/**
 * Every chapter is a world of its own: landscape, stickers and road surface.
 * Chapters are matched by id; new chapters without an entry cycle through the list.
 */
export const WORLDS: Record<WorldId, World> = {
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
};

const BY_CHAPTER: Record<string, WorldId> = {
  keys: 'keys',
  hand: 'forest',
  read: 'sea',
  songs: 'village',
  rhythm: 'mountain',
};

const ORDER: WorldId[] = ['keys', 'forest', 'sea', 'village', 'mountain'];

export function worldOf(chapterId: string, index: number): World {
  return WORLDS[BY_CHAPTER[chapterId] ?? ORDER[index % ORDER.length]!];
}

/**
 * Christmas season: from the first Sunday of Advent until 26 December every
 * world is snowed in and decorated.
 */
export function isChristmasSeason(now = new Date()): boolean {
  const year = now.getFullYear();
  const christmas = new Date(year, 11, 25);
  // 4th Advent is the last Sunday before Christmas (a week before when Christmas is a Sunday)
  const fourth = 25 - (christmas.getDay() || 7);
  const firstAdvent = new Date(year, 11, fourth - 21);
  const end = new Date(year, 11, 27); // until 26 December inclusive
  return now >= firstAdvent && now < end;
}

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
