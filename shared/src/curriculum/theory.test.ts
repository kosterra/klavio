import { describe, expect, it } from 'vitest';
import { LESSONS } from './curriculum.ts';
import { CURRICULUM } from './curriculum.ts';
import { LESSON_THEORY, recapFor } from './theory.ts';
import type { Localized, TheoryStep } from './types.ts';

const texts = (s: TheoryStep): Localized[] => {
  const t: Localized[] = [s.text];
  if (s.type === 'tap-keys') t.push(s.hint);
  if (s.type === 'quiz') t.push(...s.answers.map((a) => a.text), ...(s.hint ? [s.hint] : []));
  if (s.type === 'listen') t.push(...s.answers);
  return t;
};

describe('lesson theory', () => {
  it('belongs to existing lessons', () => {
    const ids = new Set(LESSONS.map((l) => l.id));
    for (const id of Object.keys(LESSON_THEORY)) expect(ids.has(id), id).toBe(true);
  });

  it('is translated, in Swiss spelling', () => {
    for (const steps of Object.values(LESSON_THEORY)) {
      for (const s of steps) {
        for (const t of texts(s)) {
          expect(t['de-CH'].trim()).not.toBe('');
          expect(t.en.trim()).not.toBe('');
          expect(t['de-CH']).not.toContain('ß');
        }
      }
    }
  });

  it('has solvable games and quizzes', () => {
    for (const [id, steps] of Object.entries(LESSON_THEORY)) {
      for (const s of steps) {
        if (s.type === 'quiz') {
          expect(s.answers.filter((a) => a.correct).length, id).toBe(1);
          expect(s.answers.length, id).toBeGreaterThanOrEqual(2);
        }
        if (s.type === 'tap-keys') {
          expect(s.targets.length, id).toBeGreaterThan(0);
          for (const k of s.targets.flat()) {
            expect(k, id).toBeGreaterThanOrEqual(s.keyboard.from);
            expect(k, id).toBeLessThanOrEqual(s.keyboard.to);
          }
          // a key can only belong to one group
          expect(new Set(s.targets.flat()).size, id).toBe(s.targets.flat().length);
        }
        if (s.type === 'listen') {
          expect(s.rounds.length, id).toBeGreaterThan(0);
          for (const r of s.rounds) expect(r.notes.length, id).toBeGreaterThan(1);
        }
        if (s.type === 'clap') expect(s.pattern.length, id).toBeGreaterThan(0);
      }
    }
  });
});

describe('recap ("Weisst du’s noch?")', () => {
  it('starts every chapter after the first with questions from the one before', () => {
    expect(recapFor(CURRICULUM[0]!.lessons[0]!.id)).toEqual([]);
    for (const [ci, chapter] of CURRICULUM.entries()) {
      if (ci === 0) continue;
      const steps = recapFor(chapter.lessons[0]!.id);
      expect(steps[0]!.type, chapter.id).toBe('explain');
      const quizzes = steps.slice(1);
      expect(quizzes.length, chapter.id).toBeGreaterThan(0);
      expect(quizzes.length, chapter.id).toBeLessThanOrEqual(3);
      const previous = CURRICULUM[ci - 1]!.lessons.flatMap((l) => LESSON_THEORY[l.id] ?? []);
      for (const q of quizzes) expect(previous).toContain(q);
      expect(new Set(quizzes).size, chapter.id).toBe(quizzes.length);
    }
  });

  it('is only shown at the first lesson of a chapter', () => {
    expect(recapFor(CURRICULUM[1]!.lessons[1]!.id)).toEqual([]);
  });
});
