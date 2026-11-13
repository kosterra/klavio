/**
 * A Standard MIDI File → MusicXML text, so the MusicXML importer can take it
 * from there. Notes are quantised to sixteenths; with two tracks of notes the
 * first is the right hand, the second the left (as notation programs and
 * LilyPond write them). Bars come from the time signature; a note across a
 * bar line is split and tied. Optional: an upbeat (in eighths) at the start.
 */

interface MidiNote {
  start: number;
  end: number;
  pitch: number;
}

interface ParsedMidi {
  division: number;
  tracks: { name: string; notes: MidiNote[] }[];
  time: [number, number];
  fifths: number;
  tempo: number | null;
}

export class MidiImportError extends Error {
  constructor() {
    super('NOT_MIDI');
  }
}

function parseMidi(data: Uint8Array): ParsedMidi {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const tag = (p: number) => String.fromCharCode(...data.subarray(p, p + 4));
  if (data.length < 14 || tag(0) !== 'MThd') throw new MidiImportError();
  const ntrks = view.getUint16(10);
  const division = view.getUint16(12);
  if (division & 0x8000) throw new MidiImportError(); // SMPTE time – not for notation
  let p = 8 + view.getUint32(4);
  const result: ParsedMidi = { division, tracks: [], time: [4, 4], fifths: 0, tempo: null };
  for (let t = 0; t < ntrks && p + 8 <= data.length; t++) {
    if (tag(p) !== 'MTrk') throw new MidiImportError();
    const end = p + 8 + view.getUint32(p + 4);
    p += 8;
    let tick = 0;
    let status = 0;
    let name = '';
    const open = new Map<number, number[]>();
    const notes: MidiNote[] = [];
    const varlen = () => {
      let v = 0;
      for (let i = 0; i < 4; i++) {
        const b = data[p++]!;
        v = (v << 7) | (b & 0x7f);
        if (!(b & 0x80)) break;
      }
      return v;
    };
    while (p < end) {
      tick += varlen();
      let b = data[p]!;
      if (b & 0x80) {
        p++;
        if (b < 0xf0) status = b;
      } else b = status; // running status
      if (b === 0xff) {
        const type = data[p++]!;
        const len = varlen();
        const body = data.subarray(p, p + len);
        if (type === 0x03) name = String.fromCharCode(...body);
        if (type === 0x51 && len === 3 && result.tempo === null)
          result.tempo = Math.round(60_000_000 / ((body[0]! << 16) | (body[1]! << 8) | body[2]!));
        if (type === 0x58 && tick === 0) result.time = [body[0]!, 2 ** body[1]!];
        if (type === 0x59 && tick === 0) result.fifths = (body[0]! << 24) >> 24;
        p += len;
      } else if (b === 0xf0 || b === 0xf7) {
        p += varlen();
      } else {
        const kind = b & 0xf0;
        const a = data[p++]!;
        const second = kind === 0xc0 || kind === 0xd0 ? 0 : data[p++]!;
        if (kind === 0x90 && second > 0) {
          open.set(a, [...(open.get(a) ?? []), tick]);
        } else if (kind === 0x80 || (kind === 0x90 && second === 0)) {
          const starts = open.get(a);
          const start = starts?.shift();
          if (start !== undefined) notes.push({ start, end: tick, pitch: a });
        }
      }
    }
    p = end;
    if (notes.length) result.tracks.push({ name, notes: notes.sort((x, y) => x.start - y.start) });
  }
  return result;
}

const TYPES: Record<number, string> = {
  1: '16th',
  2: 'eighth',
  4: 'quarter',
  8: 'half',
  16: 'whole',
};
const STEPS = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
const ALTERS = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** MIDI bytes → MusicXML text (divisions: 4 per quarter, i.e. counted in sixteenths). */
export function midiToMusicXml(
  data: Uint8Array,
  meta: { title: string; composer?: string | null; pickupEighths?: number },
): string {
  const midi = parseMidi(data);
  if (!midi.tracks.length) throw new MidiImportError();
  const sixteenth = midi.division / 4;
  const q = (tick: number) => Math.round(tick / sixteenth);
  const [num, den] = midi.time;
  const barLen = Math.round((num * 16) / den);
  const pickup = (meta.pickupEighths ?? 0) * 2;
  const hands = midi.tracks.slice(0, 2);

  // per hand: onsets (top or bottom note) with their length up to the next onset
  type Ev = { start: number; len: number; pitch: number | null };
  const events = hands.map((track, h) => {
    const groups = new Map<number, MidiNote[]>();
    for (const n of track.notes) {
      const s = q(n.start);
      groups.set(s, [...(groups.get(s) ?? []), n]);
    }
    const starts = [...groups.keys()].sort((a, b) => a - b);
    const out: Ev[] = [];
    let at = 0;
    starts.forEach((s, i) => {
      const chord = groups.get(s)!;
      const pick = chord.reduce((a, b) =>
        h === 0 ? (b.pitch > a.pitch ? b : a) : b.pitch < a.pitch ? b : a,
      );
      const next = starts[i + 1] ?? Infinity;
      const end = Math.min(next, Math.max(s + 1, q(pick.end)));
      if (s > at) out.push({ start: at, len: s - at, pitch: null }); // a rest
      out.push({ start: s, len: end - s, pitch: pick.pitch });
      at = end;
    });
    return out;
  });
  const total = Math.max(...events.map((e) => e.at(-1)!.start + e.at(-1)!.len));
  // bar boundaries (with an upbeat the first bar is short)
  const barStart = (b: number) => (b === 0 ? 0 : pickup ? pickup + (b - 1) * barLen : b * barLen);
  const bars: number[] = [];
  for (let b = 0; barStart(b) < total; b++) bars.push(b);

  const measure = (b: number) => {
    const from = barStart(b);
    const to = barStart(b + 1);
    const parts = events.map((evs, h) => {
      const xml: string[] = [];
      let filled = from;
      for (const e of evs) {
        const s = Math.max(e.start, from);
        const end = Math.min(e.start + e.len, to);
        if (end <= s) continue;
        const tieIn = e.start < from;
        const tieOut = e.start + e.len > to;
        filled = end;
        const dur = end - s;
        const type = TYPES[dur];
        const dotted = !type && TYPES[(dur * 2) / 3] ? TYPES[(dur * 2) / 3] : null;
        const voice = h === 0 ? 1 : 5;
        const body =
          e.pitch === null
            ? '<rest/>'
            : `<pitch><step>${STEPS[e.pitch % 12]}</step>${ALTERS[e.pitch % 12] ? '<alter>1</alter>' : ''}<octave>${Math.floor(e.pitch / 12) - 1}</octave></pitch>`;
        const ties =
          e.pitch === null
            ? ''
            : `${tieIn ? '<tie type="stop"/>' : ''}${tieOut ? '<tie type="start"/>' : ''}`;
        xml.push(
          `<note>${body}<duration>${dur}</duration>${ties}<voice>${voice}</voice>${type ? `<type>${type}</type>` : dotted ? `<type>${dotted}</type><dot/>` : ''}<staff>${h + 1}</staff></note>`,
        );
      }
      if (filled < to && b < bars.length - 1)
        xml.push(
          `<note><rest/><duration>${to - filled}</duration><voice>${h === 0 ? 1 : 5}</voice><staff>${h + 1}</staff></note>`,
        );
      return { xml: xml.join(''), len: Math.max(filled, from) - from };
    });
    const attrs =
      b === 0
        ? `<attributes><divisions>4</divisions><key><fifths>${midi.fifths}</fifths></key><time><beats>${num}</beats><beat-type>${den}</beat-type></time>${hands.length > 1 ? '<staves>2</staves>' : ''}<clef number="1"><sign>G</sign><line>2</line></clef>${hands.length > 1 ? '<clef number="2"><sign>F</sign><line>4</line></clef>' : ''}</attributes>${midi.tempo ? `<sound tempo="${midi.tempo}"/>` : ''}`
        : '';
    const second = parts[1]
      ? `<backup><duration>${parts[0]!.len}</duration></backup>${parts[1].xml}`
      : '';
    return `<measure number="${b + 1}"${b === 0 && pickup ? ' implicit="yes"' : ''}>${attrs}${parts[0]!.xml}${second}</measure>`;
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
<work><work-title>${escape(meta.title)}</work-title></work>
${meta.composer ? `<identification><creator type="composer">${escape(meta.composer)}</creator></identification>` : ''}
<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
<part id="P1">${bars.map(measure).join('\n')}</part>
</score-partwise>`;
}
