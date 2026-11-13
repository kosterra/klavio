import { z } from 'zod';
import type { PieceExercise, SongExercise } from '../curriculum/types.ts';

/**
 * «Eigene Stücke»: songs and pieces a family imported (MusicXML), stored with
 * the account. The notes are checked strictly – the app draws and plays them.
 */
/** The longest own piece, in bars (a sonata movement fits). */
export const MAX_PIECE_BARS = 300;

const midi = z.number().int().min(21).max(108);
const NOTE_VALUES = [
  'w',
  'h',
  'hd',
  'q',
  'qd',
  '8',
  '8d',
  '16',
  '16d',
  '32',
  '64',
  'qt',
  '8t',
  '16t',
  '32t',
] as const;
const SONG_REST_VALUES = ['w', 'h', 'q', '8', '16', '32', '64', 'qt', '8t', '16t', '32t'] as const;
const REST_VALUES = [
  'wr',
  'hr',
  'qr',
  '8r',
  '16r',
  '32r',
  '64r',
  'qtr',
  '8tr',
  '16tr',
  '32tr',
] as const;
const noteValue = z.enum(NOTE_VALUES);
const rhythmValue = z.enum([...NOTE_VALUES, ...REST_VALUES]);
const time = z.string().regex(/^(?:[1-9]|1[0-2])\/(?:2|4|8)$/);
const tempo = z.number().int().min(30).max(220);

export const songExerciseSchema = z.object({
  type: z.literal('song'),
  clef: z.enum(['treble', 'bass']),
  time,
  tempo,
  showNames: z.boolean(),
  pickup: z.number().positive().max(8).optional(),
  keySignature: z.enum(['C', 'G', 'D', 'F']).optional(),
  bars: z
    .array(
      z
        .array(
          z.union([
            z.object({
              midi,
              value: noteValue,
              finger: z.number().int().min(1).max(5).optional(),
              tie: z.boolean().optional(),
            }),
            // a rest: no key, no finger, no tie
            z.object({
              midi: z.literal(-1),
              value: z.enum(SONG_REST_VALUES),
              rest: z.literal(true),
            }),
          ]),
        )
        .min(1)
        .max(64),
    )
    .min(1)
    .max(MAX_PIECE_BARS),
}) satisfies z.ZodType<SongExercise>;

const hand = z
  .array(
    z.object({
      midi: midi.nullable(),
      value: rhythmValue,
      finger: z.number().int().min(1).max(5).optional(),
    }),
  )
  .max(64);

export const pieceExerciseSchema = z.object({
  type: z.literal('piece'),
  time,
  tempo,
  showNames: z.boolean(),
  bars: z
    .array(z.object({ rh: hand, lh: hand }))
    .min(1)
    .max(MAX_PIECE_BARS),
}) satisfies z.ZodType<PieceExercise>;

export const MAX_OWN_PIECES = 30;

export const ownPieceInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  composer: z.string().trim().max(120).nullable(),
  exercise: z.discriminatedUnion('type', [songExerciseSchema, pieceExerciseSchema]),
  keyboard: z
    .object({ from: midi, to: midi })
    .refine((k) => k.to - k.from >= 12, 'At least an octave'),
});
export type OwnPieceInput = z.infer<typeof ownPieceInputSchema>;

export interface OwnPieceDto extends OwnPieceInput {
  id: string;
  createdAt: string;
}
