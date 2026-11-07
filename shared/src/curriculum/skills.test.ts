import { describe, expect, it } from 'vitest';
import { LESSONS } from './curriculum.ts';
import {
  BASE_SKILLS,
  GOAL_STYLE_SKILLS,
  LESSON_SKILLS,
  SKILL_IDS,
  SKILL_NAMES,
  goalProgress,
  isSkillReached,
  newlyReachedGoalSkills,
} from './skills.ts';

const done = (ids: string[]) => new Set(ids);

describe('skills', () => {
  it('every lesson teaches at least one skill, all skills are named', () => {
    for (const l of LESSONS) expect(LESSON_SKILLS[l.id]?.length, l.id).toBeGreaterThan(0);
    for (const id of Object.keys(LESSON_SKILLS))
      expect(
        LESSONS.some((l) => l.id === id),
        id,
      ).toBe(true);
    for (const s of SKILL_IDS) {
      expect(SKILL_NAMES[s]['de-CH']).not.toContain('ß');
      expect(SKILL_NAMES[s].en).toBeTruthy();
    }
  });

  it('a skill is reached when every lesson teaching it is done', () => {
    expect(isSkillReached('note-values', done(['rhythm-quarters']))).toBe(false);
    expect(isSkillReached('note-values', done(['rhythm-quarters', 'rhythm-rests']))).toBe(true);
    expect(isSkillReached('pedal', done(LESSONS.map((l) => l.id)))).toBe(false); // not taught yet
  });

  it('goal progress counts the base skills, orders by curriculum, names the next lesson', () => {
    const p = goalProgress(GOAL_STYLE_SKILLS.ballad, done([]));
    expect(p.skills.slice(0, BASE_SKILLS.length).every((s) => s.taught)).toBe(true);
    expect(p.skills.at(-1)!.taught).toBe(false); // planned skills last
    expect(p.reached).toBe(0);
    expect(p.next).toEqual({ skill: 'white-keys', lessonId: 'keys-c' });

    const half = goalProgress(['pedal'], done(LESSONS.map((l) => l.id)));
    expect(half.reached).toBe(BASE_SKILLS.length);
    expect(half.total).toBe(BASE_SKILLS.length + 1);
    expect(half.next).toBeNull(); // only the planned "pedal" is left
  });

  it('the next step is the earliest open lesson, never one further ahead', () => {
    const firstTen = done(LESSONS.slice(0, 10).map((l) => l.id));
    // songs (chapter 4) are still needed, but reading notes (chapter 3) comes first
    expect(goalProgress([], firstTen).next).toEqual({
      skill: 'treble-clef',
      lessonId: LESSONS[10]!.id,
    });
  });

  it('reports milestones only when a goal skill is completed', () => {
    const before = done(['rhythm-quarters']);
    expect(newlyReachedGoalSkills([], before, 'rhythm-rests')).toEqual(['note-values']);
    expect(newlyReachedGoalSkills([], done([]), 'rhythm-quarters')).toEqual([]);
  });
});
