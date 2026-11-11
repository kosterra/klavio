import type { KeySignature } from '../music/notes.ts';
import type {
  NoteValue,
  PieceExercise,
  PieceNote,
  RhythmValue,
  SongExercise,
  SongNote,
} from '../curriculum/types.ts';
import { child, children, parseXml, textOf, type XmlNode } from './xml.ts';

/**
 * MusicXML → a Klavio song (one line of melody) or piece (right hand over left
 * hand). Klavio's notes are deliberately simple – whole to eighth notes,
 * dotted half and quarter, rests in pieces – so the importer takes the main
 * voice of each staff, the top note of a chord in the right hand and the
 * lowest in the left, and refuses (naming the bar) what it cannot show.
 */

export type ImportErrorCode =
  'NOT_MUSICXML' | 'NO_NOTES' | 'TOO_LONG' | 'DURATION' | 'TUPLET' | 'RANGE';

export class MusicXmlImportError extends Error {
  constructor(
    readonly code: ImportErrorCode,
    /** the bar (1-based) where it happened, where there is one */
    readonly bar?: number,
  ) {
    super(code);
  }
}

export type ImportedPiece =
  | {
      kind: 'song';
      title: string;
      composer: string | null;
      exercise: SongExercise;
      keyboard: { from: number; to: number };
    }
  | {
      kind: 'piece';
      title: string;
      composer: string | null;
      exercise: PieceExercise;
      keyboard: { from: number; to: number };
    };

export const MAX_IMPORT_BARS = 64;

const STEP: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NOTE_VALUES: [number, NoteValue][] = [
  [4, 'w'],
  [3, 'hd'],
  [2, 'h'],
  [1.5, 'qd'],
  [1, 'q'],
  [0.5, '8'],
];
const REST_VALUES: [number, RhythmValue][] = [
  [4, 'wr'],
  [2, 'hr'],
  [1, 'qr'],
];

interface RawNote {
  bar: number;
  staff: number;
  voice: string;
  chord: boolean;
  midi: number | null;
  /** length in quarter notes */
  beats: number;
  tieStart: boolean;
  tieStop: boolean;
}

/** a length in beats as Klavio's note values (tied where it needs two) */
function splitNotes(beats: number, bar: number): NoteValue[] {
  const out: NoteValue[] = [];
  let left = Math.round(beats * 1000) / 1000;
  while (left > 0.001) {
    const fit = NOTE_VALUES.find(([b]) => b <= left + 0.001);
    if (!fit) throw new MusicXmlImportError('DURATION', bar);
    out.push(fit[1]);
    left = Math.round((left - fit[0]) * 1000) / 1000;
  }
  return out;
}

function splitRests(beats: number, bar: number): RhythmValue[] {
  const out: RhythmValue[] = [];
  let left = Math.round(beats * 1000) / 1000;
  while (left > 0.001) {
    const fit = REST_VALUES.find(([b]) => b <= left + 0.001);
    if (!fit) throw new MusicXmlImportError('DURATION', bar);
    out.push(fit[1]);
    left = Math.round((left - fit[0]) * 1000) / 1000;
  }
  return out;
}

export function importMusicXml(source: string): ImportedPiece {
  const root = parseXml(source);
  const score = child(root, 'score-partwise');
  if (!score) throw new MusicXmlImportError('NOT_MUSICXML');
  const title =
    textOf(score, 'work', 'work-title') || textOf(score, 'movement-title') || 'Mein Stück';
  const composer =
    children(child(score, 'identification'), 'creator')
      .find((c) => c.attrs.type === 'composer')
      ?.text.trim() || null;
  const part = child(score, 'part');
  if (!part) throw new MusicXmlImportError('NO_NOTES');
  const measures = children(part, 'measure');
  if (measures.length > MAX_IMPORT_BARS) throw new MusicXmlImportError('TOO_LONG');

  let divisions = 1;
  let fifths = 0;
  let beats = 4;
  let beatType = 4;
  let staves = 1;
  let clef1 = 'G';
  let tempo: number | null = null;
  let timeSet = false;
  const notes: RawNote[] = [];
  const barLengths: number[] = [];

  measures.forEach((m: XmlNode, bi) => {
    const bar = bi + 1;
    const attrs = child(m, 'attributes');
    if (attrs) {
      divisions = Number(textOf(attrs, 'divisions')) || divisions;
      const f = textOf(attrs, 'key', 'fifths');
      if (f !== undefined && bi === 0) fifths = Number(f) || 0;
      const time = child(attrs, 'time');
      if (time && !timeSet) {
        beats = Number(textOf(time, 'beats')) || 4;
        beatType = Number(textOf(time, 'beat-type')) || 4;
        timeSet = true;
      }
      staves = Number(textOf(attrs, 'staves')) || staves;
      const c1 = children(attrs, 'clef').find((c) => (c.attrs.number ?? '1') === '1');
      if (c1 && bi === 0) clef1 = textOf(c1, 'sign') ?? 'G';
    }
    for (const el of m.children) {
      if (el.name === 'sound' && el.attrs.tempo && tempo === null) tempo = Number(el.attrs.tempo);
      if (el.name === 'direction') {
        const s = child(el, 'sound');
        if (s?.attrs.tempo && tempo === null) tempo = Number(s.attrs.tempo);
      }
      if (el.name !== 'note') continue;
      if (child(el, 'grace') || child(el, 'cue')) continue;
      if (child(el, 'time-modification')) throw new MusicXmlImportError('TUPLET', bar);
      const rest = child(el, 'rest');
      const pitch = child(el, 'pitch');
      const duration = Number(textOf(el, 'duration'));
      let len = duration / divisions;
      if (rest && rest.attrs.measure === 'yes') len = (beats * 4) / beatType;
      if (!Number.isFinite(len) || len <= 0) continue;
      let midi: number | null = null;
      if (pitch) {
        const step = STEP[textOf(pitch, 'step') ?? 'C'] ?? 0;
        const alter = Math.round(Number(textOf(pitch, 'alter') ?? 0));
        const octave = Number(textOf(pitch, 'octave') ?? 4);
        midi = (octave + 1) * 12 + step + alter;
      }
      const ties = children(el, 'tie');
      notes.push({
        bar: bi,
        staff: Number(textOf(el, 'staff') ?? 1),
        voice: textOf(el, 'voice') ?? '1',
        chord: !!child(el, 'chord'),
        midi,
        beats: len,
        tieStart: ties.some((t) => t.attrs.type === 'start'),
        tieStop: ties.some((t) => t.attrs.type === 'stop'),
      });
    }
    barLengths[bi] = 0;
  });

  // the main voice of each staff: the one with the most notes
  const mainVoice = (staff: number) => {
    const count = new Map<string, number>();
    for (const n of notes)
      if (n.staff === staff && n.midi !== null) count.set(n.voice, (count.get(n.voice) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  };

  // one line per staff: chords become one note (top for the right hand, bottom for the left)
  const line = (staff: number, top: boolean) => {
    const voice = mainVoice(staff);
    const out: RawNote[] = [];
    for (const n of notes) {
      if (n.staff !== staff || (voice !== null && n.voice !== voice)) continue;
      if (n.chord && out.length) {
        const prev = out.at(-1)!;
        if (n.midi !== null && prev.midi !== null)
          prev.midi = top ? Math.max(prev.midi, n.midi) : Math.min(prev.midi, n.midi);
        continue;
      }
      out.push({ ...n });
    }
    return out;
  };

  const rh = line(1, true);
  const lh = staves >= 2 ? line(2, false) : [];
  const all = [...rh, ...lh].filter((n) => n.midi !== null);
  if (all.length === 0) throw new MusicXmlImportError('NO_NOTES');
  const lowest = Math.min(...all.map((n) => n.midi!));
  const highest = Math.max(...all.map((n) => n.midi!));
  if (lowest < 21 || highest > 108) throw new MusicXmlImportError('RANGE');

  const time = `${beats}/${beatType}`;
  const keySignature: KeySignature | undefined =
    fifths === 1 ? 'G' : fifths === -1 ? 'F' : fifths === 0 ? undefined : undefined;
  const bars = measures.length;
  const keyboard = {
    from: Math.max(21, lowest - (((lowest % 12) + 12) % 12)),
    to: Math.min(
      108,
      Math.max(highest + (highest % 12 === 0 ? 0 : 12 - (highest % 12)), lowest + 16),
    ),
  };
  const finalTempo = tempo && tempo >= 30 && tempo <= 220 ? Math.round(tempo) : 90;
  const melodyHasRests = rh.some((n) => n.midi === null);

  if (lh.some((n) => n.midi !== null) || melodyHasRests) {
    // a piece: right hand over left hand, rests allowed
    const toHand = (src: RawNote[]) =>
      Array.from({ length: bars }, (_, b) =>
        src
          .filter((n) => n.bar === b)
          .flatMap((n): PieceNote[] =>
            n.midi === null
              ? splitRests(n.beats, b + 1).map((value) => ({ midi: null, value }))
              : splitNotes(n.beats, b + 1).map((value) => ({
                  // a long note in two parts: in a piece the second is played again
                  midi: n.midi,
                  value,
                })),
          ),
      );
    const r = toHand(rh);
    const l = toHand(lh);
    return {
      kind: 'piece',
      title,
      composer,
      keyboard,
      exercise: {
        type: 'piece',
        time,
        tempo: finalTempo,
        showNames: false,
        bars: r.map((notes, i) => ({ rh: notes, lh: l[i] ?? [] })),
      },
    };
  }

  // a melody: one staff, no rests
  const songBars: SongNote[][] = Array.from({ length: bars }, (_, b) =>
    rh
      .filter((n) => n.bar === b)
      .flatMap((n) => {
        const parts = splitNotes(n.beats, b + 1);
        return parts.map((value, i): SongNote => ({
          midi: n.midi!,
          value,
          ...(i < parts.length - 1 || n.tieStart ? { tie: true } : {}),
        }));
      }),
  ).filter((bar) => bar.length > 0);
  const barBeats = (beats * 4) / beatType;
  const firstBeats = rh.filter((n) => n.bar === 0).reduce((s, n) => s + n.beats, 0);
  const pickup = firstBeats > 0 && firstBeats < barBeats - 0.01 ? firstBeats : undefined;
  return {
    kind: 'song',
    title,
    composer,
    keyboard,
    exercise: {
      type: 'song',
      clef: clef1 === 'F' ? 'bass' : 'treble',
      time,
      tempo: finalTempo,
      showNames: false,
      ...(pickup ? { pickup } : {}),
      ...(keySignature ? { keySignature } : {}),
      bars: songBars,
    },
  };
}
