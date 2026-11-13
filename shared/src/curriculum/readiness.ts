import { KEY_SIGNATURE_ALTERS, isBlackKey } from '../music/notes.ts';
import { LESSONS } from './curriculum.ts';
import { staffSteps } from './intervals.ts';
import type { Lesson, PieceExercise, SongExercise } from './types.ts';

/**
 * «Ab wann kann ich das spielen?» – what a piece asks of the learner (reading
 * range, rhythms, metre, hands, black keys), each need with the lesson of the
 * path that teaches it. The piece is playable after the latest of them.
 */
export const READINESS_NEEDS = {
  keys: 'keys-five',
  'read-cde': 'read-c-d-e',
  'read-fg': 'read-f-g',
  'read-octave': 'read-a-h-c',
  wide: 'hand-scale',
  'read-high': 'read-intervals',
  rests: 'rhythm-rests',
  eighths: 'meter-eighths',
  dotted: 'rhythm-dotted',
  'two-four': 'song-london',
  bass: 'bass-clef',
  'bass-low': 'bass-low',
  both: 'both-together',
  sharps: 'black-sharps',
  'three-four': 'meter-waltz',
  upbeat: 'meter-upbeat',
  ties: 'meter-ties',
  'six-eight': 'meter-six-eight',
  flats: 'keysig-flats',
  'key-g': 'keysig-g-read',
  'key-f': 'keysig-f-read',
} as const satisfies Record<string, string>;
export type ReadinessNeed = keyof typeof READINESS_NEEDS;

/** What a piece asks for that the path doesn't teach (yet). */
export type BeyondNeed =
  'very-high' | 'very-low' | 'other-time' | 'key-d' | 'sixteenths' | 'dotted-eighths' | 'triplets';

export interface Readiness {
  /** the lesson after which the piece can be played (all its needs are taught by then) */
  lesson: Lesson;
  /** the needs, in path order; the last one decides */
  needs: { need: ReadinessNeed; lessonId: string }[];
  /** what goes beyond the path: playable after it, with some extra effort */
  beyond: BeyondNeed[];
}

const C4 = 60;
const G4 = 67;
const E4 = 64;
const C5 = 72;
const G5 = 79;
const C3 = 48;
const C2 = 36;

/** Whether the notes of one hand fit in a five-finger position (five neighbouring white keys). */
function fitsFiveKeys(notes: number[]): boolean {
  if (notes.length === 0) return true;
  const lo = Math.min(...notes);
  const hi = Math.max(...notes);
  if (isBlackKey(lo) || isBlackKey(hi)) return hi - lo <= 7;
  return staffSteps(lo, hi) <= 4;
}

/** The needs and the lesson from which a song or a two-hand piece can be played. */
export function pieceReadiness(exercise: SongExercise | PieceExercise): Readiness {
  const needs = new Set<ReadinessNeed>(['keys']);
  const beyond = new Set<BeyondNeed>();
  const piece = exercise.type === 'piece';
  const rh: number[] = [];
  const lh: number[] = [];
  const values = new Set<string>();
  let ties = false;
  if (piece) {
    for (const bar of exercise.bars) {
      for (const n of bar.rh) {
        values.add(String(n.value).replace(/r$/, ''));
        if (n.midi !== null) rh.push(n.midi);
        else needs.add('rests');
      }
      for (const n of bar.lh) {
        values.add(String(n.value).replace(/r$/, ''));
        if (n.midi !== null) lh.push(n.midi);
        else needs.add('rests');
      }
    }
  } else {
    const bass = exercise.clef === 'bass';
    for (const n of exercise.bars.flat()) {
      values.add(n.value);
      if (n.rest) needs.add('rests');
      else (bass ? lh : rh).push(n.midi);
      if (n.tie) ties = true;
    }
  }

  // reading: the right hand from middle C up, the left hand in the bass clef
  // (with the names under the notes, reading is not needed yet)
  const reading = !exercise.showNames;
  if (rh.length) {
    const hi = Math.max(...rh);
    const lo = Math.min(...rh);
    if (reading) needs.add(hi <= E4 ? 'read-cde' : hi <= G4 ? 'read-fg' : 'read-octave');
    if (reading && (hi > C5 || lo < C4)) needs.add('read-high');
    if (hi > G5) beyond.add('very-high');
    if (!fitsFiveKeys(rh)) needs.add('wide');
  }
  if (lh.length) {
    if (reading) needs.add('bass');
    const lo = Math.min(...lh);
    if (reading && lo < C3) needs.add('bass-low');
    if (lo < C2) beyond.add('very-low');
    if (!fitsFiveKeys(lh)) needs.add('wide');
  }
  if (rh.length && lh.length) needs.add('both');

  // rhythm (quarters, halves and wholes come with the first songs)
  if (values.has('8')) needs.add('eighths');
  if (values.has('qd')) needs.add('dotted');
  if (values.has('hd')) needs.add('three-four');
  if (ties) needs.add('ties');
  if (['16', '16d', '32', '64'].some((v) => values.has(v))) beyond.add('sixteenths');
  if (values.has('8d') || values.has('16d')) beyond.add('dotted-eighths');
  if ([...values].some((v) => v.endsWith('t'))) beyond.add('triplets');
  const time = exercise.time;
  if (time === '2/4') needs.add('two-four');
  else if (time === '3/4') needs.add('three-four');
  else if (time === '6/8') needs.add('six-eight');
  else if (time !== '4/4') beyond.add('other-time');
  if (!piece && exercise.pickup) needs.add('upbeat');

  // black keys: from the key signature, or as sharps and flats on their own
  const key = piece ? undefined : exercise.keySignature;
  if (key === 'G') needs.add('key-g');
  if (key === 'F') needs.add('key-f');
  if (key === 'D') beyond.add('key-d');
  const inKey = new Set(KEY_SIGNATURE_ALTERS[key ?? 'C']);
  const black = [...rh, ...lh].filter((m) => isBlackKey(m) && !inKey.has(m % 12));
  if (black.length) needs.add(key === 'F' ? 'flats' : 'sharps');

  const order = (id: string) => LESSONS.findIndex((l) => l.id === id);
  const list = [...needs]
    .map((need) => ({ need, lessonId: READINESS_NEEDS[need] as string }))
    .sort((a, b) => order(a.lessonId) - order(b.lessonId));
  const last = list.at(-1)!;
  return {
    lesson: LESSONS[order(last.lessonId)]!,
    needs: list,
    beyond: [...beyond],
  };
}
