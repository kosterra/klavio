import { lessonFor, type Lesson } from '@klavio/shared';
import { useWorldMode } from './useWorldMode';

/** The lesson as this profile sees it: grown-ups get the piece instead of the children's song. */
export function useLessonFor(): (lesson: Lesson) => Lesson {
  const world = useWorldMode();
  return (lesson) => lessonFor(lesson, world);
}
