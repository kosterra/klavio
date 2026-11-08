import { LESSONS } from './curriculum.ts';
import type { Localized } from './types.ts';

/**
 * Skills a learner builds up. Lessons are tagged with the skills they teach
 * (a skill counts as reached once every lesson teaching it is completed).
 * Some skills are planned for later worlds and not taught yet.
 */
export const SKILL_IDS = [
  'white-keys',
  'right-hand',
  'treble-clef',
  'note-values',
  'melodies',
  'left-hand',
  'bass-clef',
  'both-hands',
  'grand-staff',
  'black-keys',
  'improvise',
  'eighths',
  'three-four',
  'six-eight',
  'dynamics',
  'scales',
  'minor',
  'chords',
  'arpeggios',
  'pedal',
] as const;
export type SkillId = (typeof SKILL_IDS)[number];

const L = (de: string, en: string): Localized => ({ 'de-CH': de, en });

export const SKILL_NAMES: Record<SkillId, Localized> = {
  'white-keys': L('Weisse Tasten finden', 'Finding the white keys'),
  'right-hand': L('Rechte Hand', 'Right hand'),
  'treble-clef': L('Noten im Violinschlüssel', 'Treble clef notes'),
  'note-values': L('Notenwerte und Pausen', 'Note values and rests'),
  melodies: L('Erste Melodien', 'First melodies'),
  'left-hand': L('Linke Hand', 'Left hand'),
  'bass-clef': L('Noten im Bassschlüssel', 'Bass clef notes'),
  'both-hands': L('Beide Hände zusammen', 'Both hands together'),
  'grand-staff': L('Grosses Notensystem', 'Grand staff'),
  'black-keys': L('Schwarze Tasten, ♯ und ♭', 'Black keys, ♯ and ♭'),
  improvise: L('Improvisieren', 'Improvising'),
  eighths: L('Achtelnoten', 'Eighth notes'),
  'three-four': L('Dreivierteltakt', 'Three-four time'),
  'six-eight': L('Sechsachteltakt', 'Six-eight time'),
  dynamics: L('Laut und leise', 'Loud and soft'),
  scales: L('Tonleitern', 'Scales'),
  minor: L('Moll-Tonarten', 'Minor keys'),
  chords: L('Akkorde', 'Chords'),
  arpeggios: L('Gebrochene Akkorde', 'Broken chords'),
  pedal: L('Pedal', 'Pedal'),
};

/** What every piece needs – part of every goal song. */
export const BASE_SKILLS: SkillId[] = [
  'white-keys',
  'right-hand',
  'treble-clef',
  'note-values',
  'melodies',
];

/** Skills taught by each lesson (by lesson id). */
export const LESSON_SKILLS: Record<string, SkillId[]> = {
  'keys-c': ['white-keys'],
  'keys-middle-c': ['white-keys'],
  'keys-d-e': ['white-keys'],
  'keys-cde': ['right-hand'],
  'keys-f-g': ['white-keys'],
  'keys-five': ['right-hand'],
  'hand-a-h': ['white-keys'],
  'hand-white-keys': ['white-keys'],
  'hand-scale': ['right-hand'],
  'hand-entchen': ['melodies'],
  'read-c-d-e': ['treble-clef'],
  'read-f-g': ['treble-clef'],
  'read-a-h-c': ['treble-clef'],
  'song-haenschen': ['melodies'],
  'song-freude': ['melodies'],
  'song-weihnachtsmann': ['melodies'],
  'song-jakob': ['melodies'],
  'song-jingle': ['melodies'],
  'song-macdonald': ['melodies'],
  'rhythm-quarters': ['note-values'],
  'rhythm-rests': ['note-values'],
  'bass-hand': ['left-hand'],
  'bass-clef': ['bass-clef'],
  'bass-low': ['bass-clef'],
  'bass-lamb': ['left-hand'],
  'both-turns': ['both-hands'],
  'both-grand': ['grand-staff'],
  'both-entchen': ['both-hands'],
  'both-freude': ['both-hands'],
  'black-keys': ['black-keys'],
  'black-sharps': ['black-keys'],
  'black-lamb': ['black-keys'],
  'black-improvise': ['improvise'],
  'meter-eighths': ['eighths'],
  'meter-waltz': ['three-four'],
  'keysig-flats': ['black-keys'],
  'keysig-g-scale': ['scales'],
  'keysig-g-read': ['scales'],
  'keysig-f-scale': ['scales'],
  'keysig-f-read': ['scales'],
};

/** Lessons (in learning order) that teach a skill; empty = planned for later. */
export function lessonsForSkill(skill: SkillId): string[] {
  return LESSONS.filter((l) => !l.bonus && LESSON_SKILLS[l.id]?.includes(skill)).map((l) => l.id);
}

export function isSkillTaught(skill: SkillId): boolean {
  return lessonsForSkill(skill).length > 0;
}

export function isSkillReached(skill: SkillId, completed: ReadonlySet<string>): boolean {
  const lessons = lessonsForSkill(skill);
  return lessons.length > 0 && lessons.every((id) => completed.has(id));
}

// ---------------------------------------------------------------- goal song

export const GOAL_STYLES = ['ballad', 'pop', 'classical', 'film', 'melody'] as const;
export type GoalStyle = (typeof GOAL_STYLES)[number];

/** Typical skills per style – a starting point the learner can adjust. */
export const GOAL_STYLE_SKILLS: Record<GoalStyle, SkillId[]> = {
  ballad: ['left-hand', 'bass-clef', 'both-hands', 'minor', 'chords', 'arpeggios', 'pedal'],
  pop: ['left-hand', 'both-hands', 'black-keys', 'eighths', 'chords'],
  classical: [
    'left-hand',
    'bass-clef',
    'both-hands',
    'grand-staff',
    'black-keys',
    'eighths',
    'dynamics',
    'scales',
  ],
  film: ['left-hand', 'both-hands', 'black-keys', 'minor', 'arpeggios', 'dynamics', 'pedal'],
  melody: ['left-hand', 'both-hands', 'black-keys', 'chords'],
};

export interface GoalProgress {
  /** all skills the goal needs, in learning order (taught ones first) */
  skills: { id: SkillId; reached: boolean; taught: boolean }[];
  reached: number;
  total: number;
  percent: number;
  /** the next skill to work on and the first open lesson teaching it */
  next: { skill: SkillId; lessonId: string } | null;
}

/** Order of skills along the curriculum (planned ones last). */
function skillOrder(skill: SkillId): number {
  const first = LESSONS.findIndex((l) => LESSON_SKILLS[l.id]?.includes(skill));
  return first >= 0 ? first : 1000 + SKILL_IDS.indexOf(skill);
}

export function goalProgress(goalSkills: SkillId[], completed: ReadonlySet<string>): GoalProgress {
  const all = [...new Set([...BASE_SKILLS, ...goalSkills])].sort(
    (a, b) => skillOrder(a) - skillOrder(b),
  );
  const skills = all.map((id) => ({
    id,
    reached: isSkillReached(id, completed),
    taught: isSkillTaught(id),
  }));
  const reached = skills.filter((s) => s.reached).length;
  // the next step: the earliest open lesson (in learning order) of any skill still needed
  const order = new Map(LESSONS.map((l, i) => [l.id, i]));
  let next: GoalProgress['next'] = null;
  for (const sk of skills) {
    if (sk.reached || !sk.taught) continue;
    const lessonId = lessonsForSkill(sk.id).find((id) => !completed.has(id));
    if (lessonId && (!next || order.get(lessonId)! < order.get(next.lessonId)!)) {
      next = { skill: sk.id, lessonId };
    }
  }
  return {
    skills,
    reached,
    total: skills.length,
    percent: Math.round((reached / skills.length) * 100),
    next,
  };
}

/** Goal skills newly reached by completing `lessonId` (for the milestone message). */
export function newlyReachedGoalSkills(
  goalSkills: SkillId[],
  completedBefore: ReadonlySet<string>,
  lessonId: string,
): SkillId[] {
  const after = new Set(completedBefore).add(lessonId);
  return [...new Set([...BASE_SKILLS, ...goalSkills])].filter(
    (s) => !isSkillReached(s, completedBefore) && isSkillReached(s, after),
  );
}
