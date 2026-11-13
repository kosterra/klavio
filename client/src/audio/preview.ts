import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  beatsOf,
  isHeldNote,
  type PieceExercise,
  type SongExercise,
  type SongNote,
} from '@klavio/shared';
import { playMelody, type Playback } from './synth';

export interface PreviewNote {
  midi: number;
  beats: number;
}

/** A melody line as the synth plays it: tied notes become one long note. */
export function melodyNotes(bars: SongNote[][]): PreviewNote[] {
  const out: PreviewNote[] = [];
  const notes = bars.flat();
  notes.forEach((n, i) => {
    if (isHeldNote(notes, i)) out[out.length - 1]!.beats += beatsOf(n.value);
    else out.push({ midi: n.midi, beats: beatsOf(n.value) });
  });
  return out;
}

/** How long a «Hörprobe» plays, about: whole bars until this many seconds are reached. */
export const PREVIEW_SECONDS = 15;

/**
 * The bars of a «Hörprobe»: from the first bar with a note, whole bars for
 * about `seconds` at the piece's tempo – a slow waltz and a fast march sound
 * about as long (not eight bars of either).
 */
export function previewBars(exercise: SongExercise | PieceExercise, seconds = PREVIEW_SECONDS) {
  const [n, d] = exercise.time.split('/').map(Number) as [number, number];
  const barSeconds = (((n * 4) / d) * 60) / Math.max(20, exercise.tempo);
  const count = Math.max(2, Math.round(seconds / barSeconds));
  const sounds = (i: number) => {
    const bar = exercise.bars[i]!;
    return Array.isArray(bar)
      ? bar.some((x) => !x.rest && x.midi >= 0)
      : [...bar.rh, ...bar.lh].some((x) => x.midi !== null);
  };
  let from = 0;
  while (from < exercise.bars.length - 1 && !sounds(from)) from++;
  return { from, to: Math.min(exercise.bars.length, from + count) };
}

/** The first bars of a song or piece (both hands), as lines to play together. */
export function previewParts(exercise: SongExercise | PieceExercise): PreviewNote[][] {
  const { from, to } = previewBars(exercise);
  if (exercise.type === 'song') return [melodyNotes(exercise.bars.slice(from, to))];
  const bars = exercise.bars.slice(from, to);
  return (['rh', 'lh'] as const).map((hand) =>
    bars.flatMap((b) => b[hand].map((n) => ({ midi: n.midi ?? -1, beats: beatsOf(n.value) }))),
  );
}

/*
 * One «Hörprobe» at a time, wherever it was started (a shelf, the dream-song
 * picks, a sheet): starting another one stops the first, and every button
 * knows whether it is the one playing.
 */
let current: { owner: symbol; playbacks: Playback[] } | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

export function stopPreview() {
  if (!current) return;
  const { playbacks } = current;
  current = null;
  playbacks.forEach((p) => p.stop());
  emit();
}

export function startPreview(
  owner: symbol,
  parts: PreviewNote[][],
  tempo: number,
  onNote?: (index: number) => void,
) {
  stopPreview();
  const playbacks = parts.map((notes, i) => playMelody(notes, tempo, i === 0 ? onNote : undefined));
  const mine = { owner, playbacks };
  current = mine;
  emit();
  void Promise.all(playbacks.map((p) => p.done)).then(() => {
    if (current === mine) {
      current = null;
      emit();
    }
  });
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
const owner = () => current?.owner ?? null;

/**
 * For a button that starts a preview: whether its own preview is playing,
 * and its identity for `startPreview`. Leaving the page stops it.
 */
export function usePreview(): { playing: boolean; me: symbol } {
  const [me] = useState(() => Symbol('preview'));
  const playing = useSyncExternalStore(subscribe, owner) === me;
  useEffect(
    () => () => {
      if (owner() === me) stopPreview();
    },
    [me],
  );
  return { playing, me };
}
