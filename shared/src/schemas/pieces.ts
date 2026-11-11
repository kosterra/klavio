import { z } from 'zod';
import type { PieceExercise, SongExercise } from '../curriculum/types.ts';

/**
 * «Eigene Stücke»: songs and pieces a family imported (MusicXML), stored with
 * the account. The notes are checked strictly – the app draws and plays them.
 */
const midi = z.number().int().min(21).max(108);
const noteValue = z.enum(['w', 'h', 'hd', 'q', 'qd', '8']);
const rhythmValue = z.enum(['w', 'h', 'hd', 'q', 'qd', '8', 'qr', 'hr', 'wr']);
const time = z.string().regex(/^(?:[1-9]|1[0-2])\/(?:2|4|8)$/);
const tempo = z.number().int().min(30).max(220);

export const songExerciseSchema = z.object({
  type: z.literal('song'),
  clef: z.enum(['treble', 'bass']),
  time,
  tempo,
  showNames: z.boolean(),
  pickup: z.number().positive().max(8).optional(),
  keySignature: z.enum(['C', 'G', 'F']).optional(),
  bars: z
    .array(
      z
        .array(
          z.object({
            midi,
            value: noteValue,
            finger: z.number().int().min(1).max(5).optional(),
            tie: z.boolean().optional(),
          }),
        )
        .min(1)
        .max(32),
    )
    .min(1)
    .max(64),
}) satisfies z.ZodType<SongExercise>;

const hand = z.array(z.object({ midi: midi.nullable(), value: rhythmValue })).max(32);

export const pieceExerciseSchema = z.object({
  type: z.literal('piece'),
  time,
  tempo,
  showNames: z.boolean(),
  bars: z.array(z.object({ rh: hand, lh: hand })).min(1).max(64),
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
