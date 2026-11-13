import { barBeats, beatsOf } from './song.ts';
import type { SongNote } from './types.ts';

/**
 * «Klavi spielt mit»: a simple accompaniment for a melody – bass and chords
 * like a teacher would play beside a beginner. The harmony is worked out from
 * the melody itself (key, then one chord per bar or half bar from the main
 * chords of the key), so every song gets one without writing it twice.
 */

/** One sound of the accompaniment: when (beats from the first note), what and how long. */
export interface AccompEvent {
  at: number;
  midis: number[];
  beats: number;
  velocity: number;
}

interface Melody {
  bars: SongNote[][];
  time: string;
  pickup?: number;
  clef?: 'treble' | 'bass';
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
// the chords a beginner's song needs: I, IV, V, vi, ii (as steps above the tonic)
const DEGREES = [
  { root: 0, third: 4, fifth: 7, prior: 0.3 }, // I
  { root: 5, third: 4, fifth: 7, prior: 0.2 }, // IV
  { root: 7, third: 4, fifth: 7, prior: 0.2 }, // V
  { root: 9, third: 3, fifth: 7, prior: 0 }, // vi
  { root: 2, third: 3, fifth: 7, prior: -0.1 }, // ii
] as const;
type Degree = (typeof DEGREES)[number];
// keys with few sharps or flats first: on a tie the simpler one wins
const KEY_ORDER = [0, 7, 5, 2, 10, 9, 3, 4, 8, 11, 1, 6];

const pc = (midi: number) => ((midi % 12) + 12) % 12;

/** The major key (tonic pitch class) the melody fits best. */
export function melodyKey(bars: SongNote[][]): number {
  const notes = bars.flat().filter((n) => !n.rest);
  const last = notes.at(-1);
  let best = 0;
  let bestScore = -Infinity;
  for (const tonic of KEY_ORDER) {
    let score = 0;
    for (const n of notes) {
      score += (MAJOR.includes(pc(n.midi - tonic)) ? 1 : -2) * beatsOf(n.value);
    }
    if (last && pc(last.midi) === tonic) score += 2;
    if (score > bestScore) {
      bestScore = score;
      best = tonic;
    }
  }
  return best;
}

interface Timed {
  midi: number;
  at: number; // beats from the start of its bar
  beats: number;
}

/** How well a chord fits these notes: chord tones count, strong beats more. */
function fit(notes: Timed[], tonic: number, d: Degree): number {
  const root = tonic + d.root;
  const tones = [pc(root), pc(root + d.third), pc(root + d.fifth)];
  // the dominant also takes its seventh (G7 under an F)
  if (d.root === 7) tones.push(pc(root + 10));
  let score = d.prior;
  for (const n of notes) {
    const weight = n.beats * (n.at === 0 ? 1.5 : 1);
    score += tones.includes(pc(n.midi)) ? weight : -0.3 * weight;
  }
  return score;
}

function best(notes: Timed[], tonic: number, bonus: (d: Degree) => number = () => 0) {
  let pick: Degree = DEGREES[0];
  let score = -Infinity;
  for (const d of DEGREES) {
    const s = fit(notes, tonic, d) + bonus(d);
    if (s > score) {
      score = s;
      pick = d;
    }
  }
  return { pick, score };
}

/** The chords: per bar one, or two when the melody clearly changes in the middle. */
export function harmonize(
  melody: Melody,
): { bar: number; at: number; beats: number; root: number; third: number }[] {
  const per = barBeats(melody.time);
  const tonic = melodyKey(melody.bars);
  const pickup = melody.pickup ?? 0;
  const out: { bar: number; at: number; beats: number; root: number; third: number }[] = [];
  const lastBar = melody.bars.length - 1;
  melody.bars.forEach((bar, b) => {
    // the upbeat is played alone, as it is in real life
    if (pickup && b === 0) return;
    const length = pickup && b === lastBar ? per - pickup : per;
    const timed: Timed[] = [];
    let t = 0;
    for (const n of bar) {
      if (!n.rest) timed.push({ midi: n.midi, at: t, beats: beatsOf(n.value) });
      t += beatsOf(n.value);
    }
    const end = b === lastBar;
    const beforeEnd = b === lastBar - 1;
    const bonus = (d: Degree) => (end && d.root === 0 ? 3 : beforeEnd && d.root === 7 ? 0.3 : 0);
    const whole = best(timed, tonic, bonus);
    // a bar of four can change chord in its middle
    if (per === 4 && length === 4 && !end) {
      const half = (from: number) =>
        timed
          .filter((n) => n.at >= from && n.at < from + 2)
          .map((n) => ({ ...n, at: n.at - from, beats: Math.min(n.beats, from + 2 - n.at) }));
      const a = best(half(0), tonic);
      const c = best(half(2), tonic, bonus);
      if (a.pick !== c.pick && a.score + c.score > whole.score + 1) {
        out.push({ bar: b, at: 0, beats: 2, root: pc(tonic + a.pick.root), third: a.pick.third });
        out.push({ bar: b, at: 2, beats: 2, root: pc(tonic + c.pick.root), third: c.pick.third });
        return;
      }
    }
    out.push({
      bar: b,
      at: 0,
      beats: length,
      root: pc(tonic + whole.pick.root),
      third: whole.pick.third,
    });
  });
  return out;
}

/** The pitch of this pitch class nearest to (at or above) `low`. */
const from = (low: number, p: number) => low + ((p - pc(low) + 12) % 12);

function lowMelody(melody: Melody): boolean {
  const notes = melody.bars.flat().filter((n) => !n.rest);
  const mean = notes.reduce((n, x) => n + x.midi, 0) / Math.max(1, notes.length);
  return melody.clef === 'bass' || mean < 57;
}

/** The keys of a chord: bass and fifth in the left hand, the triad above (or above a low melody). */
function voicing(c: { root: number; third: number }, low: boolean) {
  const triadLow = low ? 64 : 48;
  const chord = [
    from(triadLow, c.root),
    from(triadLow, c.root + c.third),
    from(triadLow, c.root + 7),
  ]
    .map((m) => (m >= triadLow + 9 ? m - 12 : m))
    .sort((x, y) => x - y);
  return { bass: from(36, c.root), fifth: from(36, c.root + 7), chord };
}

/**
 * For «wait for me»: one chord per change, struck when the learner reaches
 * it – `bar` and `at` (beats into the bar) say at which note.
 */
export function blockChords(melody: Melody): { bar: number; at: number; midis: number[] }[] {
  const low = lowMelody(melody);
  return harmonize(melody).map((c) => {
    const { bass, chord } = voicing(c, low);
    return { bar: c.bar, at: c.at, midis: low ? chord : [bass, ...chord] };
  });
}

/**
 * The accompaniment as sounds to play: for a melody in the right hand a bass
 * note and a chord in the left (oom-pah, a waltz in 3/4, a swing in 6/8);
 * for a melody in the bass clef soft chords above it.
 */
export function accompaniment(melody: Melody): AccompEvent[] {
  const per = barBeats(melody.time);
  const low = lowMelody(melody);
  // where each bar starts, in beats from the first note
  const starts: number[] = [];
  let t = 0;
  for (const bar of melody.bars) {
    starts.push(t);
    t += bar.reduce((s, n) => s + beatsOf(n.value), 0);
  }
  const events: AccompEvent[] = [];
  const lastBar = melody.bars.length - 1;
  for (const c of harmonize(melody)) {
    const { bass, fifth, chord } = voicing(c, low);
    const at = starts[c.bar]! + c.at;
    if (low) {
      // the melody is low: only gentle chords above it
      events.push({ at, midis: chord, beats: c.beats, velocity: 0.22 });
      continue;
    }
    if (c.bar === lastBar || c.beats < 2) {
      events.push({ at, midis: [bass, ...chord], beats: c.beats, velocity: 0.3 });
      continue;
    }
    if (per === 3 && melody.time === '6/8') {
      events.push({ at, midis: [bass], beats: 1.5, velocity: 0.34 });
      events.push({ at: at + 1.5, midis: chord, beats: 1.5, velocity: 0.24 });
    } else if (per === 3) {
      events.push({ at, midis: [bass], beats: 1, velocity: 0.34 });
      events.push({ at: at + 1, midis: chord, beats: 1, velocity: 0.22 });
      events.push({ at: at + 2, midis: chord, beats: 1, velocity: 0.22 });
    } else if (c.beats === 4) {
      events.push({ at, midis: [bass], beats: 1, velocity: 0.34 });
      events.push({ at: at + 1, midis: chord, beats: 1, velocity: 0.22 });
      events.push({ at: at + 2, midis: [fifth], beats: 1, velocity: 0.3 });
      events.push({ at: at + 3, midis: chord, beats: 1, velocity: 0.22 });
    } else {
      // half a bar (or a bar of two): bass, then the chord
      events.push({ at, midis: [bass], beats: 1, velocity: 0.34 });
      events.push({ at: at + 1, midis: chord, beats: c.beats - 1, velocity: 0.22 });
    }
  }
  return events;
}
