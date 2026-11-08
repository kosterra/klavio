import { noteNameToMidi } from '../music/notes.ts';
import type { Chapter, Lesson } from './types.ts';
import {
  fingerInPosition,
  piece,
  pieceSteps,
  rhythm,
  rhythmOnsets,
  song,
  type HandPosition,
} from './song.ts';

/** "C4 D4 E4" → [60, 62, 64]; German "H" is accepted. */
const seq = (s: string) => s.trim().split(/\s+/).map(noteNameToMidi);
/** Pitch classes for "any octave" exercises, given in the 4th octave. */
const pcs = (s: string) => seq(s.replace(/\S+/g, (n) => `${n}4`));

/** Five-finger positions: right thumb on middle C, left little finger on the C below. */
const RH_C4: HandPosition = { hand: 'right', thumb: 'C4' };
const LH_C3: HandPosition = { hand: 'left', thumb: 'G3' };

/** «Spiel nach» in a five-finger position: the finger for every note comes with it. */
const playIn = (position: HandPosition, sequences: number[][]) => ({
  type: 'play-along' as const,
  sequences,
  fingers: sequences.map((s) => s.map((m) => fingerInPosition(m, position)!)),
});

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
    stage: 1,
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
          playIn(RH_C4, [
            seq('C4 D4 E4'),
            seq('E4 D4 C4'),
            seq('C4 E4 D4'),
            seq('D4 C4 E4'),
            seq('C4 D4 E4 D4 C4'),
          ]),
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
          playIn(RH_C4, [
            seq('C4 D4 E4 F4 G4'),
            seq('G4 F4 E4 D4 C4'),
            seq('C4 E4 G4'),
            seq('E4 F4 G4 F4 E4'),
            seq('C4 D4 E4 F4 G4 F4 E4 D4 C4'),
          ]),
        ],
      },
    ],
  },
  {
    id: 'hand',
    title: { 'de-CH': 'Die rechte Hand', en: 'The right hand' },
    stage: 1,
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
            // the thumb passes under after E (up) – and the middle finger crosses over on the way down
            fingers: [
              [1, 2, 3, 1, 2, 3, 4, 5],
              [5, 4, 3, 2, 1, 3, 2, 1],
            ],
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
  stage: 1,
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
  stage: 1,
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
          { tempo: 100, position: RH_C4 },
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
          { tempo: 104, position: RH_C4 },
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
    // bonus songs: open together with the chapter, never in the way
    {
      id: 'song-jakob',
      kind: 'song',
      bonus: true,
      title: { 'de-CH': 'Bruder Jakob', en: 'Brother John' },
      intro: {
        'de-CH':
          'Ein Kanon, den man auf der ganzen Welt singt. Neu: zwei schnelle Achtelnoten hintereinander – und am Schluss geht es hinunter zum tiefen G.',
        en: 'A round sung all over the world. New: two quick eighth notes in a row – and at the end it goes down to the low G.',
      },
      xp: 25,
      keyboard: { from: 55, to: 72 },
      keyLabels: 'c',
      exercises: [
        song(
          'C4/q D4/q E4/q C4/q | C4/q D4/q E4/q C4/q | E4/q F4/q G4/h | E4/q F4/q G4/h | G4/8 A4/8 G4/8 F4/8 E4/q C4/q | G4/8 A4/8 G4/8 F4/8 E4/q C4/q | C4/q G3/q C4/h | C4/q G3/q C4/h',
          { tempo: 96 },
        ),
      ],
    },
    {
      id: 'song-jingle',
      kind: 'song',
      bonus: true,
      title: { 'de-CH': 'Jingle Bells', en: 'Jingle Bells' },
      intro: {
        'de-CH':
          'Der Refrain des bekannten Winterlieds – mit vielen gleichen Tönen hintereinander. Zähl mit, damit du keinen vergisst!',
        en: 'The chorus of the well-known winter song – with many equal notes in a row. Count along so you don’t miss one!',
      },
      xp: 25,
      keyboard: C4_C5,
      keyLabels: 'c',
      exercises: [
        song(
          'E4/q E4/q E4/h | E4/q E4/q E4/h | E4/q G4/q C4/qd D4/8 | E4/w | F4/q F4/q F4/qd F4/8 | F4/q E4/q E4/q E4/8 E4/8 | E4/q D4/q D4/q E4/q | D4/h G4/h',
          { tempo: 112, position: RH_C4 },
        ),
      ],
    },
    {
      id: 'song-macdonald',
      kind: 'song',
      bonus: true,
      title: { 'de-CH': 'Old MacDonald', en: 'Old MacDonald' },
      intro: {
        'de-CH':
          'Ein Lied vom Bauernhof. Die Melodie geht unter das C hinunter: zum A und zum G gleich links davon.',
        en: 'A song from the farm. The melody goes below C: to the A and the G just left of it.',
      },
      xp: 25,
      keyboard: { from: 55, to: 72 },
      keyLabels: 'c',
      exercises: [
        song(
          'C4/q C4/q C4/q G3/q | A3/q A3/q G3/h | E4/q E4/q D4/q D4/q | C4/w | C4/q C4/q C4/q G3/q | A3/q A3/q G3/h | E4/q E4/q D4/q D4/q | C4/w',
          { tempo: 104 },
        ),
      ],
    },
  ],
});

CURRICULUM.push({
  id: 'rhythm',
  title: { 'de-CH': 'Im Takt', en: 'In time' },
  stage: 1,
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

// ---------------------------------------------------------------- level 2
const C3_C4 = { from: 48, to: 60 };
const G2_C4 = { from: 43, to: 60 };

CURRICULUM.push({
  id: 'bass',
  title: { 'de-CH': 'Die linke Hand', en: 'The left hand' },
  stage: 2,
  lessons: [
    {
      id: 'bass-hand',
      kind: 'play',
      title: { 'de-CH': 'Fünf Töne links', en: 'Five notes on the left' },
      intro: {
        'de-CH':
          'Jetzt ist die linke Hand dran! Der kleine Finger liegt auf dem C unter dem mittleren C, der Daumen auf dem G. Spiel nach, was ich zeige.',
        en: 'Now it is the left hand’s turn! The little finger is on the C below middle C, the thumb on G. Play what I show you.',
      },
      xp: 15,
      keyboard: C3_C4,
      keyLabels: 'all',
      exercises: [
        playIn(LH_C3, [
          seq('C3 D3 E3 F3 G3'),
          seq('G3 F3 E3 D3 C3'),
          seq('C3 E3 G3'),
          seq('G3 E3 C3'),
          seq('C3 D3 E3 D3 C3'),
        ]),
      ],
    },
    {
      id: 'bass-clef',
      kind: 'read',
      title: { 'de-CH': 'Der Bassschlüssel', en: 'The bass clef' },
      intro: {
        'de-CH':
          'Die linke Hand liest ihre Noten im Bassschlüssel. Seine zwei Punkte umarmen die F-Linie. Das C sitzt im zweiten Zwischenraum.',
        en: 'The left hand reads its notes in the bass clef. Its two dots hug the F line. C sits in the second space.',
      },
      xp: 15,
      keyboard: C3_C4,
      keyLabels: 'c',
      exercises: [{ type: 'read-note', clef: 'bass', notes: seq('C3 D3 E3 F3 G3'), rounds: 8 }],
    },
    {
      id: 'bass-low',
      kind: 'read',
      title: { 'de-CH': 'Tief unten: G, A, H', en: 'Deep down: G, A, B' },
      intro: {
        'de-CH':
          'Noch tiefer in die Höhle: unter dem C liegen H, A und G. Im Bassschlüssel steht das G auf der untersten Linie.',
        en: 'Deeper into the cave: below C are B, A and G. In the bass clef, G sits on the bottom line.',
      },
      xp: 20,
      keyboard: G2_C4,
      keyLabels: 'c',
      exercises: [
        { type: 'read-note', clef: 'bass', notes: seq('G2 A2 H2 C3 D3 E3 F3 G3'), rounds: 10 },
      ],
    },
    {
      id: 'bass-lamb',
      kind: 'song',
      title: { 'de-CH': 'Mary Had a Little Lamb', en: 'Mary Had a Little Lamb' },
      intro: {
        'de-CH':
          'Ein englisches Kinderlied – ganz für die linke Hand, im Bassschlüssel. Drei Finger reichen fast für alles!',
        en: 'An English children’s song – all for the left hand, in the bass clef. Three fingers almost do it all!',
      },
      xp: 25,
      keyboard: C3_C4,
      keyLabels: 'c',
      exercises: [
        song(
          'E3/q D3/q C3/q D3/q | E3/q E3/q E3/h | D3/q D3/q D3/h | E3/q G3/q G3/h | E3/q D3/q C3/q D3/q | E3/q E3/q E3/q E3/q | D3/q D3/q E3/q D3/q | C3/w',
          { clef: 'bass', tempo: 96, position: LH_C3 },
        ),
      ],
    },
  ],
});

CURRICULUM.push({
  id: 'both',
  title: { 'de-CH': 'Beide Hände', en: 'Both hands' },
  stage: 2,
  lessons: [
    {
      id: 'both-turns',
      kind: 'play',
      title: { 'de-CH': 'Hände abwechselnd', en: 'Taking turns' },
      intro: {
        'de-CH':
          'Beide Hände liegen bereit: links ab dem tiefen C, rechts ab dem mittleren C. Sie spielen abwechselnd – wie ein Gespräch.',
        en: 'Both hands are ready: left from the low C, right from middle C. They take turns – like a conversation.',
      },
      xp: 15,
      keyboard: C3_C5,
      keyLabels: 'c',
      exercises: [
        {
          type: 'play-along',
          sequences: [
            seq('C3 C4 D3 D4 E3 E4'),
            seq('G3 G4 F3 F4 E3 E4'),
            seq('C3 E4 G3 G4'),
            seq('E3 C4 D3 D4 C3 C4'),
          ],
        },
      ],
    },
    {
      id: 'both-grand',
      kind: 'read',
      title: { 'de-CH': 'Das grosse Notensystem', en: 'The grand staff' },
      intro: {
        'de-CH':
          'Oben der Violinschlüssel für die rechte Hand, unten der Bassschlüssel für die linke – zusammen das grosse Notensystem. Spiel jede Note mit der richtigen Hand.',
        en: 'Treble clef on top for the right hand, bass clef below for the left – together the grand staff. Play every note with the right hand.',
      },
      xp: 20,
      keyboard: C3_C5,
      keyLabels: 'c',
      exercises: [
        {
          type: 'read-note',
          clef: 'grand',
          notes: seq('C3 D3 E3 F3 G3 C4 D4 E4 F4 G4'),
          rounds: 10,
        },
      ],
    },
    {
      id: 'both-entchen',
      kind: 'song',
      title: { 'de-CH': 'Entchen mit Begleitung', en: 'Ducklings with accompaniment' },
      intro: {
        'de-CH':
          'Die rechte Hand spielt die Melodie, die linke hält dazu einen langen tiefen Ton. Mit dem Digitalpiano zählen beide Töne, mit dem Mikrofon die Melodie.',
        en: 'The right hand plays the melody, the left holds a long low note. With a digital piano both notes count, with the microphone the melody.',
      },
      xp: 30,
      keyboard: C3_C5,
      keyLabels: 'c',
      exercises: [
        piece(
          'C4/q D4/q E4/q F4/q | G4/h G4/h | A4/q A4/q A4/q A4/q | G4/w | A4/q A4/q A4/q A4/q | G4/w | F4/q F4/q F4/q F4/q | E4/h E4/h | D4/q D4/q D4/q D4/q | C4/w',
          'C3/w | C3/w | F3/w | C3/w | F3/w | C3/w | F3/w | C3/w | G3/w | C3/w',
          { tempo: 90, showNames: true },
        ),
      ],
    },
    {
      id: 'both-freude',
      kind: 'song',
      title: { 'de-CH': 'Freude mit beiden Händen', en: 'Ode to Joy with both hands' },
      intro: {
        'de-CH':
          'Beethovens Melodie kennst du schon. Jetzt kommt die linke Hand dazu: ein tiefes C oder G am Anfang jedes Takts.',
        en: 'You already know Beethoven’s melody. Now the left hand joins: a low C or G at the start of every bar.',
      },
      xp: 35,
      keyboard: C3_C5,
      keyLabels: 'c',
      exercises: [
        piece(
          'E4/q E4/q F4/q G4/q | G4/q F4/q E4/q D4/q | C4/q C4/q D4/q E4/q | E4/qd D4/8 D4/h | E4/q E4/q F4/q G4/q | G4/q F4/q E4/q D4/q | C4/q C4/q D4/q E4/q | D4/qd C4/8 C4/h',
          'C3/w | G3/w | C3/w | G3/w | C3/w | G3/w | C3/w | G3/h C3/h',
          { tempo: 96 },
        ),
      ],
    },
  ],
});

CURRICULUM.push({
  id: 'black',
  title: { 'de-CH': 'Die schwarzen Tasten', en: 'The black keys' },
  stage: 2,
  lessons: [
    {
      id: 'black-keys',
      kind: 'keys',
      title: { 'de-CH': 'Cis, Dis, Fis, Gis, Ais', en: 'C♯, D♯, F♯, G♯, A♯' },
      intro: {
        'de-CH':
          'Die schwarzen Tasten bekommen Namen: Rechts neben dem C liegt das Cis, neben dem D das Dis. Finde sie alle!',
        en: 'The black keys get names: right of C is C sharp, right of D is D sharp. Find them all!',
      },
      xp: 15,
      keyboard: C3_C5,
      keyLabels: 'none',
      exercises: [{ type: 'find-key', notes: pcs('C# D# F# G# A#'), rounds: 8, anyOctave: true }],
    },
    {
      id: 'black-sharps',
      kind: 'read',
      title: { 'de-CH': 'Kreuz in den Noten', en: 'Sharps in the music' },
      intro: {
        'de-CH':
          'Ein Kreuz ♯ vor einer Note heisst: eine Taste weiter nach rechts – meistens die schwarze. Aus F wird Fis.',
        en: 'A sharp ♯ in front of a note means: one key further to the right – usually the black one. F becomes F sharp.',
      },
      xp: 20,
      keyboard: C4_C5,
      keyLabels: 'c',
      exercises: [
        {
          type: 'read-note',
          clef: 'treble',
          notes: seq('C#4 D#4 F#4 G#4 A#4 D4 F4 G4'),
          rounds: 10,
        },
      ],
    },
    {
      id: 'black-lamb',
      kind: 'song',
      title: { 'de-CH': 'Mary auf den schwarzen Tasten', en: 'Mary on the black keys' },
      intro: {
        'de-CH':
          'Das Lied vom Lamm, diesmal nur auf schwarzen Tasten – es beginnt auf dem Ais, der obersten Taste der Dreiergruppe.',
        en: 'The song about the lamb, this time on black keys only – it starts on A sharp, the top key of the group of three.',
      },
      xp: 30,
      keyboard: { from: 60, to: 74 }, // up to D5: the song reaches C sharp 5
      keyLabels: 'c',
      exercises: [
        song(
          'A#4/q:4 G#4/q:3 F#4/q:2 G#4/q:3 | A#4/q:4 A#4/q:4 A#4/h:4 | G#4/q:3 G#4/q:3 G#4/h:3 | A#4/q:4 C#5/q:5 C#5/h:5 | A#4/q:4 G#4/q:3 F#4/q:2 G#4/q:3 | A#4/q:4 A#4/q:4 A#4/q:4 A#4/q:4 | G#4/q:3 G#4/q:3 A#4/q:4 G#4/q:3 | F#4/w:2',
          { tempo: 96, showNames: true },
        ),
      ],
    },
    {
      id: 'black-improvise',
      kind: 'improvise',
      title: { 'de-CH': 'Sternen-Improvisation', en: 'Starlight improvisation' },
      intro: {
        'de-CH':
          'Jetzt bist du der Komponist! Ich spiele eine Begleitung, du spielst dazu frei auf den schwarzen Tasten. Hier klingt nichts falsch.',
        en: 'Now you are the composer! I play an accompaniment, you play freely on the black keys. Nothing sounds wrong here.',
      },
      xp: 25,
      keyboard: C3_C5,
      keyLabels: 'none',
      exercises: [{ type: 'improvise', keys: 'black', tempo: 88, bars: 8, minNotes: 12 }],
    },
  ],
});

// ---------------------------------------------------------------- level 3
// Block B: new rhythms. Appended at the end, so nobody's path changes.
CURRICULUM.push({
  id: 'meter',
  title: { 'de-CH': 'Neue Rhythmen', en: 'New rhythms' },
  stage: 3,
  lessons: [
    {
      id: 'meter-eighths',
      kind: 'rhythm',
      title: { 'de-CH': 'Achtelnoten', en: 'Eighth notes' },
      intro: {
        'de-CH':
          'Eine Achtelnote ist halb so lang wie eine Viertel: Auf einen Schlag passen zwei. Zähl «eins-und, zwei-und» – die Achtel kommen auf die Zahl und auf das «und».',
        en: 'An eighth note is half as long as a quarter: two fit into one beat. Count «one-and, two-and» – the eighths come on the number and on the «and».',
      },
      xp: 25,
      keyboard: C4_C5,
      keyLabels: 'c',
      exercises: [
        rhythm('q q 8 8 q | 8 8 8 8 h | q 8 8 q q | 8 8 q 8 8 q | h 8 8 q', { tempo: 72 }),
      ],
    },
    {
      id: 'meter-waltz',
      kind: 'rhythm',
      title: { 'de-CH': 'Der Dreivierteltakt', en: 'Three-four time' },
      intro: {
        'de-CH':
          'Im Walzer hat jeder Takt nur drei Schläge: «eins, zwei, drei – eins, zwei, drei». Der erste Schlag ist der starke. Eine halbe Note mit Punkt füllt einen ganzen Takt.',
        en: 'In a waltz every bar has only three beats: «one, two, three – one, two, three». The first beat is the strong one. A dotted half note fills a whole bar.',
      },
      xp: 25,
      keyboard: C4_C5,
      keyLabels: 'c',
      exercises: [
        rhythm('q q q | h q | q q q | hd | q h | 8 8 q q | hd', { time: '3/4', tempo: 92 }),
      ],
    },
  ],
});

// Block «Tonarten»: flats, the natural sign, key signatures (G and F major).
CURRICULUM.push({
  id: 'keysigs',
  title: { 'de-CH': 'Tonarten', en: 'Keys' },
  stage: 3,
  lessons: [
    {
      id: 'keysig-flats',
      kind: 'read',
      title: { 'de-CH': 'Das ♭ in den Noten', en: 'Flats in the music' },
      intro: {
        'de-CH':
          'Ein ♭ vor einer Note heisst: eine Taste nach links – meistens die schwarze. Aus E wird Es, aus H wird B.',
        en: 'A flat ♭ in front of a note means: one key to the left – usually the black one. E becomes E flat, B becomes B flat.',
      },
      xp: 25,
      keyboard: C4_C5,
      keyLabels: 'c',
      exercises: [
        {
          type: 'read-note',
          clef: 'treble',
          notes: seq('Bb4 Eb4 Ab4 Db4 Gb4 E4 A4 D4'),
          rounds: 10,
          spelling: 'flat',
        },
      ],
    },
    {
      id: 'keysig-g-scale',
      kind: 'play',
      title: { 'de-CH': 'Die G-Dur-Tonleiter', en: 'The G major scale' },
      intro: {
        'de-CH':
          'Die Tonleiter von G bis G – mit einer schwarzen Taste: dem Fis. Der Daumen schlüpft wieder nach dem dritten Ton unter.',
        en: 'The scale from G to G – with one black key: F sharp. The thumb slips under again after the third note.',
      },
      xp: 25,
      keyboard: { from: 67, to: 79 },
      keyLabels: 'all',
      exercises: [
        {
          type: 'play-along',
          sequences: [seq('G4 A4 H4 C5 D5 E5 F#5 G5'), seq('G5 F#5 E5 D5 C5 H4 A4 G4')],
          fingers: [
            [1, 2, 3, 1, 2, 3, 4, 5],
            [5, 4, 3, 2, 1, 3, 2, 1],
          ],
        },
      ],
    },
    {
      id: 'keysig-g-read',
      kind: 'read',
      title: { 'de-CH': 'Noten in G-Dur', en: 'Reading in G major' },
      intro: {
        'de-CH':
          'Steht ein ♯ gleich am Anfang der Zeile, gilt es für alle F: Jedes F wird zum Fis – auch ohne Kreuz vor der Note.',
        en: 'A ♯ right at the start of the line counts for every F: each F becomes F sharp – even without a sharp in front of the note.',
      },
      xp: 25,
      keyboard: { from: 60, to: 79 },
      keyLabels: 'c',
      exercises: [
        {
          type: 'read-note',
          clef: 'treble',
          notes: seq('G4 A4 H4 D5 E5 F#4 F#5 F#5'),
          rounds: 10,
          keySignature: 'G',
        },
      ],
    },
    {
      id: 'keysig-f-scale',
      kind: 'play',
      title: { 'de-CH': 'Die F-Dur-Tonleiter', en: 'The F major scale' },
      intro: {
        'de-CH':
          'Von F bis F, mit einer schwarzen Taste: dem B. Hier schlüpft der Daumen erst nach dem vierten Ton unter – nach dem B.',
        en: 'From F to F, with one black key: B flat. Here the thumb slips under only after the fourth note – after B flat.',
      },
      xp: 25,
      keyboard: { from: 65, to: 77 },
      keyLabels: 'all',
      exercises: [
        {
          type: 'play-along',
          spelling: 'flat',
          sequences: [seq('F4 G4 A4 Bb4 C5 D5 E5 F5'), seq('F5 E5 D5 C5 Bb4 A4 G4 F4')],
          fingers: [
            [1, 2, 3, 4, 1, 2, 3, 4],
            [4, 3, 2, 1, 4, 3, 2, 1],
          ],
        },
      ],
    },
    {
      id: 'keysig-f-read',
      kind: 'read',
      title: { 'de-CH': 'Noten in F-Dur', en: 'Reading in F major' },
      intro: {
        'de-CH':
          'Ein ♭ am Anfang der Zeile gilt für alle H: Jedes H wird zum B. Und ein ♮ (Auflösungszeichen) vor einer Note hebt es wieder auf.',
        en: 'A ♭ at the start of the line counts for every B: each B becomes B flat. And a natural sign ♮ in front of a note cancels it again.',
      },
      xp: 25,
      keyboard: { from: 60, to: 77 },
      keyLabels: 'c',
      exercises: [
        {
          type: 'read-note',
          clef: 'treble',
          notes: seq('F4 G4 A4 Bb4 C5 D5 Bb4 H4'),
          rounds: 10,
          keySignature: 'F',
        },
      ],
    },
  ],
});

// Every song is played twice: first to get to know it (Klavio waits for each
// note), then «Im Takt» – the same notes with count-in and metronome.
for (const chapter of CURRICULUM) {
  for (const lesson of chapter.lessons) {
    const known = lesson.exercises.filter((e) => e.type === 'song');
    for (const e of known) lesson.exercises.push({ ...e, type: 'song-timed' });
  }
}

/** All lessons in learning order. */
export const LESSONS: Lesson[] = CURRICULUM.flatMap((c) => c.lessons);

/** The lessons of the path without the bonus lessons – what «done» means. */
export const CORE_LESSONS: Lesson[] = LESSONS.filter((l) => !l.bonus);

/** A chapter's lessons that count for finishing it (no bonus lessons). */
export function coreLessons(chapter: Chapter): Lesson[] {
  return chapter.lessons.filter((l) => !l.bonus);
}

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
        : e.type === 'song' || e.type === 'song-timed'
          ? e.bars.reduce((m, b) => m + b.length, 0)
          : e.type === 'rhythm'
            ? e.patterns.reduce((m, p) => m + rhythmOnsets(p).length, 0)
            : e.type === 'piece'
              ? pieceSteps(e).length
              : e.type === 'improvise'
                ? 1
                : e.rounds),
    0,
  );
}

/** A lesson is open once the previous one (in learning order) has been completed. */
export function isLessonUnlocked(lessonId: string, completed: ReadonlySet<string>): boolean {
  const i = LESSONS.findIndex((l) => l.id === lessonId);
  if (i < 0) return false;
  // the closest lesson before it that is not a bonus lesson has to be done
  for (let j = i - 1; j >= 0; j--) {
    if (!LESSONS[j]!.bonus) return completed.has(LESSONS[j]!.id);
  }
  return true;
}

/** The lesson to continue with: the first one not yet completed (or the last one). */
export function nextLesson(completed: ReadonlySet<string>): Lesson {
  return CORE_LESSONS.find((l) => !completed.has(l.id)) ?? CORE_LESSONS[CORE_LESSONS.length - 1]!;
}
