import type { KeySignature } from '../music/notes.ts';
import { parseSong } from './song.ts';
import type { SongNote } from './types.ts';

/**
 * The opening of a dream song, to listen to and to see on the staff before
 * choosing it: the melody only, a handful of bars. Only pieces whose music is
 * in the public domain have one – a song under copyright stays a title.
 */
export interface DreamSnippet {
  time: string;
  /** quarter notes per minute */
  tempo: number;
  keySignature?: KeySignature;
  /** beats of the upbeat (the first bar is short, the last one makes up the rest) */
  pickup?: number;
  bars: SongNote[][];
}

const snippet = (
  time: string,
  tempo: number,
  melody: string,
  extra: { keySignature?: KeySignature; pickup?: number } = {},
): DreamSnippet => ({
  time,
  tempo,
  ...extra,
  bars: parseSong(melody, time, extra.pickup),
});

/** By the title in the song catalogue. */
export const DREAM_SNIPPETS: Record<string, DreamSnippet> = {
  // Beethoven, WoO 59: written in 3/8 – here in 3/4 with the values doubled
  'Für Elise': snippet(
    '3/4',
    100,
    'E5/8 D#5/8 | E5/8 D#5/8 E5/8 H4/8 D5/8 C5/8 | A4/qd C4/8 E4/8 A4/8 | H4/qd E4/8 G#4/8 H4/8 | C5/qd E4/8 E5/8 D#5/8 | E5/8 D#5/8 E5/8 H4/8 D5/8 C5/8 | A4/qd C4/8 E4/8 A4/8 | H4/qd E4/8 C5/8 H4/8 | A4/h',
    { pickup: 1 },
  ),
  // Beethoven, 9th symphony: the theme, in C major as most beginners' books have it
  'Ode to Joy': snippet(
    '4/4',
    100,
    'E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4/qd D4/8 D4/h | E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4/qd C4/8 C4/h',
  ),
  // Pachelbel: the first violin's entry over the ground bass
  'Canon in D': snippet(
    '4/4',
    64,
    'F#5/h E5/h | D5/h C#5/h | H4/h A4/h | H4/h C#5/h | D5 C#5 H4 A4 | G4 F#4 G4 E4 | D4 F#4 A4 G4 | F#4 D4 F#4 E4',
    { keySignature: 'D' },
  ),
  // Petzold, from the Notebook for Anna Magdalena Bach: the first phrase
  'Minuet in G': snippet(
    '3/4',
    112,
    'D5 G4/8 A4/8 H4/8 C5/8 | D5 G4 G4 | E5 C5/8 D5/8 E5/8 F#5/8 | G5 G4 G4 | C5 D5/8 C5/8 H4/8 A4/8 | H4 C5/8 H4/8 A4/8 G4/8 | F#4 G4/8 A4/8 H4/8 G4/8 | H4/h A4',
    { keySignature: 'G' },
  ),
};

export function dreamSnippet(title: string): DreamSnippet | undefined {
  return DREAM_SNIPPETS[title];
}
