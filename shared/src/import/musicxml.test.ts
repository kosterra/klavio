import { describe, expect, it } from 'vitest';
import { MusicXmlImportError, importMusicXml } from './musicxml.ts';

const note = (step: string, octave: number, duration: number, extra = '') =>
  `<note><pitch><step>${step}</step><octave>${octave}</octave></pitch><duration>${duration}</duration>${extra}</note>`;
const rest = (duration: number, extra = '') =>
  `<note><rest/><duration>${duration}</duration>${extra}</note>`;

const score = (measures: string[], attrs = '', head = '') => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work><work-title>Alle meine Entchen</work-title></work>
  <identification><creator type="composer">Volkslied</creator></identification>
  ${head}
  <part-list><score-part id="P1"><part-name>Klavier</part-name></score-part></part-list>
  <part id="P1">
    ${measures
      .map(
        (m, i) =>
          `<measure number="${i + 1}">${
            i === 0
              ? `<attributes><divisions>2</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time>${attrs}<clef><sign>G</sign><line>2</line></clef></attributes><direction><sound tempo="96"/></direction>`
              : ''
          }${m}</measure>`,
      )
      .join('\n')}
  </part>
</score-partwise>`;

describe('MusicXML import', () => {
  it('a melody becomes a song: names, values, tempo, title, composer', () => {
    const r = importMusicXml(
      score([
        note('C', 4, 2) + note('D', 4, 2) + note('E', 4, 2) + note('F', 4, 2),
        note('G', 4, 4) + note('G', 4, 4),
        note('A', 4, 1) + note('A', 4, 1) + note('A', 4, 3) + note('G', 4, 3),
      ]),
    );
    expect(r.kind).toBe('song');
    expect(r.title).toBe('Alle meine Entchen');
    expect(r.composer).toBe('Volkslied');
    if (r.kind !== 'song') return;
    expect(r.exercise).toMatchObject({ type: 'song', clef: 'treble', time: '4/4', tempo: 96 });
    expect(r.exercise.bars[0]!.map((n) => [n.midi, n.value])).toEqual([
      [60, 'q'],
      [62, 'q'],
      [64, 'q'],
      [65, 'q'],
    ]);
    expect(r.exercise.bars[1]!.map((n) => n.value)).toEqual(['h', 'h']);
    expect(r.exercise.bars[2]!.map((n) => n.value)).toEqual(['8', '8', 'qd', 'qd']);
    expect(r.keyboard.from).toBe(60);
  });

  it('a melody with rests stays a song and keeps its rests (a dotted rest becomes two)', () => {
    const r = importMusicXml(
      score([
        note('C', 4, 2) + rest(2) + note('E', 4, 4),
        rest(3) + note('G', 4, 1) + note('G', 4, 4),
      ]),
    );
    expect(r.kind).toBe('song');
    if (r.kind !== 'song') return;
    expect(r.exercise.bars[0]!.map((n) => [n.midi, n.value, !!n.rest])).toEqual([
      [60, 'q', false],
      [-1, 'q', true],
      [64, 'h', false],
    ]);
    expect(r.exercise.bars[1]!.map((n) => (n.rest ? `r/${n.value}` : n.value))).toEqual([
      'r/q',
      'r/8',
      '8',
      'h',
    ]);
  });

  it('two staves become a piece: top note of a chord right, bottom left, rests kept', () => {
    const r = importMusicXml(
      score(
        [
          note('E', 4, 4, '<voice>1</voice><staff>1</staff>') +
            note('G', 4, 4, '<chord/><voice>1</voice><staff>1</staff>') +
            rest(4, '<voice>1</voice><staff>1</staff>') +
            '<backup><duration>8</duration></backup>' +
            note('C', 3, 8, '<voice>5</voice><staff>2</staff>'),
        ],
        '<staves>2</staves>',
      ),
    );
    expect(r.kind).toBe('piece');
    if (r.kind !== 'piece') return;
    expect(r.exercise.bars[0]).toEqual({
      rh: [
        { midi: 67, value: 'h' },
        { midi: null, value: 'hr' },
      ],
      lh: [{ midi: 48, value: 'w' }],
    });
  });

  it('a long note that has no value of its own is tied', () => {
    const r = importMusicXml(score([note('C', 4, 5) + note('D', 4, 3)], '', ''));
    if (r.kind !== 'song') throw new Error('song expected');
    expect(r.exercise.bars[0]!.map((n) => [n.value, !!n.tie])).toEqual([
      ['h', true],
      ['8', false],
      ['qd', false],
    ]);
  });

  it('says what it cannot do, and where', () => {
    const triplet = score([
      note('C', 4, 2) + note('D', 4, 2) + note('E', 4, 2) + note('F', 4, 2),
      note(
        'C',
        4,
        1,
        '<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>',
      ),
    ]);
    expect(() => importMusicXml(triplet)).toThrow(MusicXmlImportError);
    try {
      importMusicXml(triplet);
    } catch (e) {
      expect(e).toMatchObject({ code: 'TUPLET', bar: 2 });
    }
    const sixteenth = score([note('C', 4, 1) + note('D', 4, 0.5) + note('E', 4, 2)]);
    expect(() => importMusicXml(sixteenth)).toThrow(/DURATION/);
    expect(() => importMusicXml('<html></html>')).toThrow(/NOT_MUSICXML/);
  });
});
