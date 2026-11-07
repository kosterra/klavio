import { noteNameToMidi } from '../music/notes.ts';
import type { Chapter, Lesson } from './types.ts';
import { rhythm, rhythmOnsets, song } from './song.ts';

/** "C4 D4 E4" → [60, 62, 64]; German "H" is accepted. */
const seq = (s: string) => s.trim().split(/\s+/).map(noteNameToMidi);
/** Pitch classes for "any octave" exercises, given in the 4th octave. */
const pcs = (s: string) => seq(s.replace(/\S+/g, (n) => `${n}4`));

const C3_C5 = { from: 48, to: 72 };
const C4_C5 = { from: 60, to: 72 };

/**
 * The curriculum: chapters → lessons → exercises, as plain data.
 * Songs are public domain (traditional). Lesson ids are stable: progress is
 * stored per id, so never rename or reuse one.
 */
export const CURRICULUM: Chapter[] = [
  {
    id: 'keys',
    title: { 'de-CH': 'Die Tastatur entdecken', en: 'Discover the keyboard' },
    lessons: [
      {
        id: 'keys-c',
        kind: 'keys',
        title: { 'de-CH': 'Wo ist das C?', en: 'Where is C?' },
        intro: {
          'de-CH':
            'Die Tasten wiederholen sich immer wieder. Das C findest du direkt links von zwei schwarzen Tasten. Spiel jedes C, das du findest!',
          en: 'The keys repeat again and again. You find C right to the left of two black keys. Play every C you can find!',
        },
        xp: 10,
        keyboard: C3_C5,
        keyLabels: 'none',
        exercises: [{ type: 'find-key', notes: pcs('C'), rounds: 5, anyOctave: true }],
      },
      {
        id: 'keys-middle-c',
        kind: 'keys',
        title: { 'de-CH': 'Das mittlere C', en: 'Middle C' },
        intro: {
          'de-CH':
            'Das mittlere C liegt ungefähr in der Mitte des Klaviers, meistens unter dem Namen des Klaviers. Von hier aus geht es los.',
          en: 'Middle C is roughly in the middle of the piano, usually below the brand name. This is where we start.',
        },
        xp: 10,
        keyboard: C3_C5,
        keyLabels: 'none',
        exercises: [{ type: 'find-key', notes: seq('C4'), rounds: 3, anyOctave: false }],
      },
      {
        id: 'keys-d-e',
        kind: 'keys',
        title: { 'de-CH': 'D und E', en: 'D and E' },
        intro: {
          'de-CH':
            'Das D liegt zwischen den zwei schwarzen Tasten. Das E kommt gleich rechts daneben.',
          en: 'D sits between the two black keys. E comes right next to it.',
        },
        xp: 10,
        keyboard: C3_C5,
        keyLabels: 'none',
        exercises: [{ type: 'find-key', notes: pcs('C D E'), rounds: 6, anyOctave: true }],
      },
      {
        id: 'keys-cde',
        kind: 'play',
        title: { 'de-CH': 'C, D, E nachspielen', en: 'Play C, D, E' },
        intro: {
          'de-CH':
            'Jetzt spielst du kleine Melodien nach. Ich warte bei jedem Ton auf dich – du kannst dir Zeit lassen.',
          en: 'Now you play little melodies. I wait for every note – take your time.',
        },
        xp: 15,
        keyboard: C4_C5,
        keyLabels: 'all',
        exercises: [
          {
            type: 'play-along',
            sequences: [
              seq('C4 D4 E4'),
              seq('E4 D4 C4'),
              seq('C4 E4 D4'),
              seq('D4 C4 E4'),
              seq('C4 D4 E4 D4 C4'),
            ],
          },
        ],
      },
      {
        id: 'keys-f-g',
        kind: 'keys',
        title: { 'de-CH': 'F und G', en: 'F and G' },
        intro: {
          'de-CH': 'Das F liegt direkt links von drei schwarzen Tasten. Das G kommt gleich danach.',
          en: 'F is right to the left of three black keys. G comes right after it.',
        },
        xp: 10,
        keyboard: C3_C5,
        keyLabels: 'none',
        exercises: [{ type: 'find-key', notes: pcs('C D E F G'), rounds: 8, anyOctave: true }],
      },
      {
        id: 'keys-five',
        kind: 'play',
        title: { 'de-CH': 'Fünf Töne', en: 'Five notes' },
        intro: {
          'de-CH':
            'Leg deine rechte Hand aufs C: Daumen auf C, dann ein Finger pro Taste bis zum G. So spielst du alle fünf Töne ohne zu suchen.',
          en: 'Put your right hand on C: thumb on C, then one finger per key up to G. That way you play all five notes without searching.',
        },
        xp: 15,
        keyboard: C4_C5,
        keyLabels: 'all',
        exercises: [
          {
            type: 'play-along',
            sequences: [
              seq('C4 D4 E4 F4 G4'),
              seq('G4 F4 E4 D4 C4'),
              seq('C4 E4 G4'),
              seq('E4 F4 G4 F4 E4'),
              seq('C4 D4 E4 F4 G4 F4 E4 D4 C4'),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'hand',
    title: { 'de-CH': 'Die rechte Hand', en: 'The right hand' },
    lessons: [
      {
        id: 'hand-a-h',
        kind: 'keys',
        title: { 'de-CH': 'A und H', en: 'A and B' },
        intro: {
          'de-CH':
            'Nach dem G kommen A und H – dann beginnt alles wieder mit C. Auf Englisch heisst das H übrigens B.',
          en: 'After G come A and B – then everything starts again with C. In German, B is called H.',
        },
        xp: 10,
        keyboard: C3_C5,
        keyLabels: 'none',
        exercises: [{ type: 'find-key', notes: pcs('G A H'), rounds: 6, anyOctave: true }],
      },
      {
        id: 'hand-white-keys',
        kind: 'keys',
        title: { 'de-CH': 'Alle weissen Tasten', en: 'All white keys' },
        intro: {
          'de-CH':
            'C, D, E, F, G, A, H – findest du sie alle? Denk an die schwarzen Tasten als Wegweiser.',
          en: 'C, D, E, F, G, A, B – can you find them all? Use the black keys as signposts.',
        },
        xp: 15,
        keyboard: C3_C5,
        keyLabels: 'none',
        exercises: [{ type: 'find-key', notes: pcs('C D E F G A H'), rounds: 10, anyOctave: true }],
      },
      {
        id: 'hand-scale',
        kind: 'play',
        title: { 'de-CH': 'Die C-Dur-Tonleiter', en: 'The C major scale' },
        intro: {
          'de-CH':
            'Eine Tonleiter sind alle Töne von C bis zum nächsten C. Hinauf und wieder hinunter!',
          en: 'A scale is all the notes from C up to the next C. Up and down again!',
        },
        xp: 15,
        keyboard: C4_C5,
        keyLabels: 'all',
        exercises: [
          {
            type: 'play-along',
            sequences: [seq('C4 D4 E4 F4 G4 A4 H4 C5'), seq('C5 H4 A4 G4 F4 E4 D4 C4')],
          },
        ],
      },
      {
        id: 'hand-entchen',
        kind: 'song',
        title: { 'de-CH': 'Alle meine Entchen', en: 'All my little ducklings' },
        intro: {
          'de-CH':
            'Dein erstes Lied! Ein altes Kinderlied, das du vielleicht schon kennst. Unter jeder Note steht ihr Name. Ich warte bei jedem Ton auf dich – tippe auf «Anhören», wenn du es zuerst hören möchtest.',
          en: 'Your first song! A traditional German children’s song. The name of each note is written below it. I wait for every note – tap “Listen” to hear it first.',
        },
        xp: 20,
        keyboard: C4_C5,
        keyLabels: 'all',
        exercises: [
          song(
            'C4/q D4/q E4/q F4/q | G4/h G4/h | A4/q A4/q A4/q A4/q | G4/w | A4/q A4/q A4/q A4/q | G4/w | F4/q F4/q F4/q F4/q | E4/h E4/h | D4/q D4/q D4/q D4/q | C4/w',
            { showNames: true, tempo: 100 },
          ),
        ],
      },
    ],
  },
];

CURRICULUM.push({
  id: 'read',
  title: { 'de-CH': 'Noten lesen', en: 'Reading notes' },
  lessons: [
    {
      id: 'read-c-d-e',
      kind: 'read',
      title: { 'de-CH': 'Noten: C, D, E', en: 'Notes: C, D, E' },
      intro: {
        'de-CH':
          'Noten stehen auf fünf Linien. Das mittlere C hat seine eigene kleine Hilfslinie darunter. Das D hängt unter der untersten Linie, das E sitzt genau auf ihr.',
        en: 'Notes sit on five lines. Middle C has its own small extra line below them. D hangs below the lowest line, E sits right on it.',
      },
      xp: 15,
      keyboard: C4_C5,
      keyLabels: 'all',
      exercises: [{ type: 'read-note', clef: 'treble', notes: seq('C4 D4 E4'), rounds: 6 }],
    },
    {
      id: 'read-f-g',
      kind: 'read',
      title: { 'de-CH': 'Noten: F und G', en: 'Notes: F and G' },
      intro: {
        'de-CH':
          'Das F steht im ersten Zwischenraum, das G auf der zweiten Linie – dort, wo sich der Violinschlüssel einrollt.',
        en: 'F sits in the first space, G on the second line – where the treble clef curls in.',
      },
      xp: 15,
      keyboard: C4_C5,
      keyLabels: 'c',
      exercises: [{ type: 'read-note', clef: 'treble', notes: seq('C4 D4 E4 F4 G4'), rounds: 8 }],
    },
    {
      id: 'read-a-h-c',
      kind: 'read',
      title: { 'de-CH': 'Noten: A, H, C', en: 'Notes: A, B, C' },
      intro: {
        'de-CH':
          'Immer abwechselnd Linie und Zwischenraum: A im zweiten Zwischenraum, H auf der Mittellinie, C im dritten Zwischenraum.',
        en: 'Always line, space, line: A in the second space, B on the middle line, C in the third space.',
      },
      xp: 20,
      keyboard: C4_C5,
      keyLabels: 'c',
      exercises: [
        { type: 'read-note', clef: 'treble', notes: seq('C4 D4 E4 F4 G4 A4 H4 C5'), rounds: 10 },
      ],
    },
  ],
});

CURRICULUM.push({
  id: 'songs',
  title: { 'de-CH': 'Erste Lieder', en: 'First songs' },
  lessons: [
    {
      id: 'song-haenschen',
      kind: 'song',
      title: { 'de-CH': 'Hänschen klein', en: 'Little Hans' },
      intro: {
        'de-CH':
          'Ein altes Kinderlied mit fünf Tönen von C bis G. Diesmal stehen keine Namen unter den Noten – lies sie auf den Notenlinien.',
        en: 'A traditional children’s song with five notes from C to G. This time there are no names below the notes – read them on the staff.',
      },
      xp: 25,
      keyboard: C4_C5,
      keyLabels: 'c',
      exercises: [
        song(
          'G4/q E4/q E4/h | F4/q D4/q D4/h | C4/q D4/q E4/q F4/q | G4/q G4/q G4/h | G4/q E4/q E4/h | F4/q D4/q D4/h | C4/q E4/q G4/q G4/q | C4/w',
          { tempo: 100 },
        ),
      ],
    },
    {
      id: 'song-freude',
      kind: 'song',
      title: { 'de-CH': 'Freude, schöner Götterfunken', en: 'Ode to Joy' },
      intro: {
        'de-CH':
          'Die berühmte Melodie von Ludwig van Beethoven. Achtung: Der Punkt hinter einer Note macht sie ein wenig länger.',
        en: 'The famous melody by Ludwig van Beethoven. Watch out: a dot after a note makes it a little longer.',
      },
      xp: 30,
      keyboard: C4_C5,
      keyLabels: 'c',
      exercises: [
        song(
          'E4/q E4/q F4/q G4/q | G4/q F4/q E4/q D4/q | C4/q C4/q D4/q E4/q | E4/qd D4/8 D4/h | E4/q E4/q F4/q G4/q | G4/q F4/q E4/q D4/q | C4/q C4/q D4/q E4/q | D4/qd C4/8 C4/h',
          { tempo: 104 },
        ),
      ],
    },
    {
      id: 'song-weihnachtsmann',
      kind: 'song',
      title: { 'de-CH': 'Morgen kommt der Weihnachtsmann', en: 'Twinkle, Twinkle, Little Star' },
      intro: {
        'de-CH':
          'Diese Melodie kennt man auf der ganzen Welt – auf Englisch heisst sie «Twinkle, Twinkle, Little Star». Jetzt kommt auch das A dazu.',
        en: 'This melody is known all over the world – in German it is a Christmas song. Now A joins in too.',
      },
      xp: 30,
      keyboard: C4_C5,
      keyLabels: 'c',
      exercises: [
        song(
          'C4/q C4/q G4/q G4/q | A4/q A4/q G4/h | F4/q F4/q E4/q E4/q | D4/q D4/q C4/h | G4/q G4/q F4/q F4/q | E4/q E4/q D4/h | G4/q G4/q F4/q F4/q | E4/q E4/q D4/h | C4/q C4/q G4/q G4/q | A4/q A4/q G4/h | F4/q F4/q E4/q E4/q | D4/q D4/q C4/h',
          { tempo: 100 },
        ),
      ],
    },
  ],
});

CURRICULUM.push({
  id: 'rhythm',
  title: { 'de-CH': 'Im Takt', en: 'In time' },
  lessons: [
    {
      id: 'rhythm-quarters',
      kind: 'rhythm',
      title: { 'de-CH': 'Viertel und Halbe', en: 'Quarters and halves' },
      intro: {
        'de-CH':
          'Jetzt geht es um den Rhythmus: Welche Taste du drückst, ist egal. Ich zähle vor – «1, 2, 3, 4» – dann spielst du mit. Eine Viertelnote dauert einen Schlag, eine halbe Note zwei.',
        en: 'Now it’s all about rhythm: it doesn’t matter which key you press. I count in – “1, 2, 3, 4” – then you play along. A quarter note lasts one beat, a half note two.',
      },
      xp: 20,
      keyboard: C4_C5,
      keyLabels: 'c',
      exercises: [rhythm('q q q q | h h | q q h | h q q | q q q q', { tempo: 76 })],
    },
    {
      id: 'rhythm-rests',
      kind: 'rhythm',
      title: { 'de-CH': 'Ganze Noten und Pausen', en: 'Whole notes and rests' },
      intro: {
        'de-CH':
          'Eine ganze Note dauert vier Schläge. Bei einer Pause spielst du nichts – aber du zählst leise weiter.',
        en: 'A whole note lasts four beats. At a rest you play nothing – but keep counting quietly.',
      },
      xp: 20,
      keyboard: C4_C5,
      keyLabels: 'c',
      exercises: [rhythm('w | q q qr q | h hr | q qr q qr | qr q q q', { tempo: 76 })],
    },
  ],
});

/** All lessons in learning order. */
export const LESSONS: Lesson[] = CURRICULUM.flatMap((c) => c.lessons);

export function findLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function chapterOf(lessonId: string) {
  return CURRICULUM.find((c) => c.lessons.some((l) => l.id === lessonId));
}

/** Number of correct notes needed to finish a lesson. */
export function lessonTargetCount(lesson: Lesson): number {
  return lesson.exercises.reduce(
    (n, e) =>
      n +
      (e.type === 'play-along'
        ? e.sequences.reduce((m, s) => m + s.length, 0)
        : e.type === 'song'
          ? e.bars.reduce((m, b) => m + b.length, 0)
          : e.type === 'rhythm'
            ? e.patterns.reduce((m, p) => m + rhythmOnsets(p).length, 0)
            : e.rounds),
    0,
  );
}

/** A lesson is open once the previous one (in learning order) has been completed. */
export function isLessonUnlocked(lessonId: string, completed: ReadonlySet<string>): boolean {
  const i = LESSONS.findIndex((l) => l.id === lessonId);
  if (i < 0) return false;
  return i === 0 || completed.has(LESSONS[i - 1]!.id);
}

/** The lesson to continue with: the first one not yet completed (or the last one). */
export function nextLesson(completed: ReadonlySet<string>): Lesson {
  return LESSONS.find((l) => !completed.has(l.id)) ?? LESSONS[LESSONS.length - 1]!;
}
