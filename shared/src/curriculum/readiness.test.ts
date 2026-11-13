import { describe, expect, it } from 'vitest';
import { LESSONS } from './curriculum.ts';
import { READINESS_NEEDS, pieceReadiness } from './readiness.ts';
import { piece, song } from './song.ts';

const at = (id: string) => LESSONS.findIndex((l) => l.id === id);

describe('from which lesson a piece can be played', () => {
  it('every need points to a lesson of the path', () => {
    for (const id of Object.values(READINESS_NEEDS)) expect(at(id), id).toBeGreaterThanOrEqual(0);
  });

  it('the songs of the path need nothing taught after them', () => {
    // bonus songs may reach a little further (Bruder Jakob goes below middle C)
    for (const l of LESSONS.filter((x) => !x.bonus)) {
      for (const e of l.exercises) {
        if (e.type !== 'song' && e.type !== 'piece') continue;
        const r = pieceReadiness(e);
        expect(at(r.lesson.id), `${l.id} → ${r.lesson.id}`).toBeLessThanOrEqual(at(l.id));
        expect(r.beyond, l.id).toEqual([]);
      }
    }
  });

  it('a five-key melody comes early, reading and rhythm move it later', () => {
    expect(pieceReadiness(song('C4/q D4/q E4/h | D4/q C4/q C4/h')).lesson.id).toBe('read-c-d-e');
    const eighths = pieceReadiness(song('C4/8 D4/8 E4/q G4/h | C4/w'));
    expect(eighths.lesson.id).toBe('meter-eighths');
    expect(eighths.needs.map((n) => n.need)).toEqual(['keys', 'read-fg', 'eighths']);
    // the whole octave: the thumb has to pass under
    const wide = pieceReadiness(song('C4/q D4/q E4/q F4/q | G4/q A4/q H4/q C5/q'));
    expect(wide.needs.map((n) => n.need)).toContain('wide');
  });

  it('two hands, waltz time and black keys', () => {
    const p = pieceReadiness(piece('C4/h F#4/q | G4/hd', 'C3/hd | G2/hd', { time: '3/4' }));
    expect(p.needs.map((n) => n.need)).toEqual(
      expect.arrayContaining(['both', 'bass', 'bass-low', 'sharps', 'three-four']),
    );
    expect(p.lesson.id).toBe('meter-waltz');
  });

  it('names what the path does not teach', () => {
    const r = pieceReadiness(song('C6/h C6/h | C6/w', { time: '4/4' }));
    expect(r.beyond).toContain('very-high');
    expect(pieceReadiness(song('C4/q C4/q C4/q C4/q C4/q', { time: '5/4' })).beyond).toEqual([
      'other-time',
    ]);
  });
});
