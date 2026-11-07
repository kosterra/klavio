import type { Localized, TheoryStep } from './types.ts';

const L = (de: string, en: string): Localized => ({ 'de-CH': de, en });

const C3_C5 = { from: 48, to: 72 };
const C4_C5 = { from: 60, to: 72 };

/**
 * The "Entdecken" part of each lesson: what to know before playing, as small
 * steps with pictures, games and quizzes. Keyed by lesson id.
 */
export const LESSON_THEORY: Record<string, TheoryStep[]> = {
  // ------------------------------------------------------------ chapter 1
  'keys-c': [
    {
      type: 'explain',
      text: L(
        'Schau dir die Tasten an: Es gibt weisse und schwarze. Die schwarzen sind immer in Gruppen – zwei, dann drei, dann wieder zwei und drei.',
        'Look at the keys: there are white ones and black ones. The black keys always come in groups – two, then three, then two and three again.',
      ),
      picture: { kind: 'keyboard', ...C3_C5, labels: 'none', groups: true },
    },
    {
      type: 'tap-keys',
      text: L('Tippe alle Zweiergruppen an!', 'Tap every group of two!'),
      keyboard: C3_C5,
      labels: 'none',
      targets: [
        [49, 51],
        [61, 63],
      ],
      need: 'all',
      hint: L(
        'Such zwei schwarze Tasten, die nebeneinander stehen.',
        'Look for two black keys standing side by side.',
      ),
    },
    {
      type: 'tap-keys',
      text: L('Und jetzt alle Dreiergruppen!', 'And now every group of three!'),
      keyboard: C3_C5,
      labels: 'none',
      targets: [
        [54, 56, 58],
        [66, 68, 70],
      ],
      need: 'all',
      hint: L(
        'Hier stehen drei schwarze Tasten zusammen.',
        'Here three black keys stand together.',
      ),
    },
    {
      type: 'explain',
      text: L(
        'Die weissen Tasten heissen C, D, E, F, G, A, H – danach geht es wieder mit C los. Das C findest du immer direkt links von zwei schwarzen Tasten.',
        'The white keys are called C, D, E, F, G, A, B – then it starts again with C. You always find C right to the left of two black keys.',
      ),
      picture: { kind: 'keyboard', ...C3_C5, labels: 'all', marks: [48, 60, 72] },
    },
    {
      type: 'explain',
      text: L(
        'Nach links klingen die Tasten tiefer, nach rechts höher – wie eine Treppe, die hinaufgeht.',
        'To the left the keys sound lower, to the right higher – like stairs going up.',
      ),
      picture: { kind: 'keyboard', ...C3_C5, labels: 'none', direction: true },
    },
    {
      type: 'listen',
      text: L(
        'Hör gut zu: Ist der zweite Ton höher oder tiefer als der erste?',
        'Listen carefully: is the second note higher or lower than the first?',
      ),
      answers: [L('Höher', 'Higher'), L('Tiefer', 'Lower')],
      rounds: [
        { notes: [60, 67], answer: 0 },
        { notes: [72, 55], answer: 1 },
        { notes: [52, 64], answer: 0 },
        { notes: [67, 62], answer: 1 },
      ],
    },
    {
      type: 'tap-keys',
      text: L('Findest du ein C? Tippe darauf!', 'Can you find a C? Tap it!'),
      keyboard: C3_C5,
      labels: 'none',
      targets: [[48], [60], [72]],
      need: 'one',
      hint: L(
        'Das C liegt direkt links von zwei schwarzen Tasten.',
        'C is right to the left of two black keys.',
      ),
    },
  ],

  'keys-middle-c': [
    {
      type: 'explain',
      text: L(
        'Auf dem Klavier gibt es viele C. Das mittlere C liegt ungefähr in der Mitte, meistens unter dem Namen des Klaviers. Es ist dein Zuhause – von hier aus geht es los.',
        'There are many Cs on the piano. Middle C is roughly in the middle, usually below the brand name. It is your home – this is where we start.',
      ),
      picture: { kind: 'keyboard', from: 36, to: 84, labels: 'c', marks: [60] },
    },
    {
      type: 'tap-keys',
      text: L('Welches ist das mittlere C? Tippe darauf.', 'Which one is middle C? Tap it.'),
      keyboard: { from: 36, to: 84 },
      labels: 'none',
      targets: [[60]],
      need: 'one',
      hint: L(
        'Zähl die C von links: Das mittlere ist das dritte.',
        'Count the Cs from the left: middle C is the third one.',
      ),
    },
  ],

  'keys-d-e': [
    {
      type: 'explain',
      text: L(
        'Das D wohnt zwischen den zwei schwarzen Tasten – wie in einem kleinen Haus. Das E kommt gleich rechts daneben.',
        'D lives between the two black keys – like in a little house. E comes right next to it.',
      ),
      picture: { kind: 'keyboard', ...C4_C5, labels: 'all', marks: [62, 64] },
    },
    {
      type: 'tap-keys',
      text: L('Tippe alle D an!', 'Tap every D!'),
      keyboard: C3_C5,
      labels: 'none',
      targets: [[50], [62]],
      need: 'all',
      hint: L('Das D liegt zwischen zwei schwarzen Tasten.', 'D sits between two black keys.'),
    },
    {
      type: 'quiz',
      text: L(
        'Welcher Ton liegt zwischen den zwei schwarzen Tasten?',
        'Which note sits between the two black keys?',
      ),
      answers: [{ text: L('C', 'C') }, { text: L('D', 'D'), correct: true }, { text: L('E', 'E') }],
      hint: L('Denk an das kleine Haus.', 'Think of the little house.'),
    },
  ],

  'keys-cde': [
    {
      type: 'explain',
      text: L(
        'Jetzt spielst du kleine Melodien. Ich zeige dir jeden Ton. Verspielst du dich, macht das nichts – ich warte auf den richtigen.',
        'Now you play little melodies. I show you every note. If you play a wrong one, no problem – I wait for the right one.',
      ),
      picture: { kind: 'keyboard', ...C4_C5, labels: 'all', marks: [60, 62, 64] },
    },
    {
      type: 'quiz',
      text: L('Welcher Ton kommt nach dem D?', 'Which note comes after D?'),
      picture: { kind: 'keyboard', ...C4_C5, labels: 'all', marks: [62] },
      answers: [{ text: L('C', 'C') }, { text: L('E', 'E'), correct: true }, { text: L('F', 'F') }],
      hint: L('Nach rechts geht es weiter im Alphabet.', 'To the right the alphabet goes on.'),
    },
  ],

  'keys-f-g': [
    {
      type: 'explain',
      text: L(
        'Das F liegt direkt links von drei schwarzen Tasten, das G gleich daneben. Merke: Das C sitzt bei den zwei, das F bei den drei.',
        'F is right to the left of three black keys, G right next to it. Remember: C sits by the two, F by the three.',
      ),
      picture: { kind: 'keyboard', ...C3_C5, labels: 'all', marks: [53, 55, 65, 67], groups: true },
    },
    {
      type: 'tap-keys',
      text: L('Tippe alle F an!', 'Tap every F!'),
      keyboard: C3_C5,
      labels: 'none',
      targets: [[53], [65]],
      need: 'all',
      hint: L(
        'Das F liegt direkt links von drei schwarzen Tasten.',
        'F is right to the left of three black keys.',
      ),
    },
    {
      type: 'quiz',
      text: L('Wo liegt das F?', 'Where is F?'),
      answers: [
        { text: L('Links von zwei schwarzen Tasten', 'Left of two black keys') },
        { text: L('Links von drei schwarzen Tasten', 'Left of three black keys'), correct: true },
        { text: L('Zwischen zwei schwarzen Tasten', 'Between two black keys') },
      ],
      hint: L('Bei den zwei wohnt das C.', 'C lives by the two.'),
    },
  ],

  'keys-five': [
    {
      type: 'explain',
      text: L(
        'Deine Finger haben Nummern: Daumen 1, Zeigefinger 2, Mittelfinger 3, Ringfinger 4, kleiner Finger 5. Bei beiden Händen gleich.',
        'Your fingers have numbers: thumb 1, index finger 2, middle finger 3, ring finger 4, little finger 5. The same on both hands.',
      ),
      picture: { kind: 'hand', numbers: true },
    },
    {
      type: 'quiz',
      text: L('Welche Nummer hat dieser Finger?', 'Which number is this finger?'),
      picture: { kind: 'hand', highlight: 3, numbers: false },
      answers: [{ text: L('2', '2') }, { text: L('3', '3'), correct: true }, { text: L('4', '4') }],
      hint: L('Zähl vom Daumen aus: Der Daumen ist 1.', 'Count from the thumb: the thumb is 1.'),
    },
    {
      type: 'quiz',
      text: L('Und dieser?', 'And this one?'),
      picture: { kind: 'hand', highlight: 5, numbers: false },
      answers: [{ text: L('1', '1') }, { text: L('4', '4') }, { text: L('5', '5'), correct: true }],
      hint: L(
        'Der kleinste Finger hat die grösste Nummer.',
        'The smallest finger has the biggest number.',
      ),
    },
    {
      type: 'explain',
      text: L(
        'Leg die rechte Hand so hin: Daumen auf das C, dann ein Finger pro Taste bis zum G. Halte die Hand rund, als würdest du einen kleinen Ball halten.',
        'Place your right hand like this: thumb on C, then one finger per key up to G. Keep your hand round, as if holding a small ball.',
      ),
      picture: {
        kind: 'keyboard',
        ...C4_C5,
        labels: 'all',
        fingering: [
          [60, 1],
          [62, 2],
          [64, 3],
          [65, 4],
          [67, 5],
        ],
      },
    },
  ],

  // ------------------------------------------------------------ chapter 2
  'hand-a-h': [
    {
      type: 'explain',
      text: L(
        'Nach dem G kommen A und H. Das A steckt zwischen der zweiten und dritten schwarzen Taste der Dreiergruppe, das H gleich danach. Und dann? Beginnt alles wieder mit C.',
        'After G come A and B. A sits between the second and third black key of the group of three, B right after it. And then? Everything starts again with C.',
      ),
      picture: { kind: 'keyboard', ...C4_C5, labels: 'all', marks: [69, 71] },
    },
    {
      type: 'explain',
      text: L(
        'Übrigens: Auf Englisch heisst das H «B». Bei uns sagt man H.',
        'By the way: in German, B is called “H”. Same key, different name.',
      ),
      picture: { kind: 'keyboard', ...C4_C5, labels: 'all', marks: [71] },
    },
    {
      type: 'tap-keys',
      text: L('Tippe alle A an!', 'Tap every A!'),
      keyboard: C3_C5,
      labels: 'none',
      targets: [[57], [69]],
      need: 'all',
      hint: L(
        'Das A liegt zwischen der zweiten und dritten schwarzen Taste der Dreiergruppe.',
        'A sits between the second and third black key of the group of three.',
      ),
    },
    {
      type: 'quiz',
      text: L('Welcher Ton kommt nach dem H?', 'Which note comes after B?'),
      answers: [{ text: L('A', 'A') }, { text: L('C', 'C'), correct: true }, { text: L('G', 'G') }],
      hint: L(
        'Nach dem letzten Ton beginnt alles wieder von vorne.',
        'After the last note everything starts again.',
      ),
    },
  ],

  'hand-white-keys': [
    {
      type: 'explain',
      text: L(
        'Du kennst jetzt alle weissen Tasten: C, D, E, F, G, A, H. Das sind die sieben Grundtöne – mit ihnen allein kannst du schon viele Lieder spielen.',
        'You now know all the white keys: C, D, E, F, G, A, B. These are the seven basic notes – with them alone you can already play lots of songs.',
      ),
      picture: { kind: 'keyboard', ...C4_C5, labels: 'all' },
    },
    {
      type: 'explain',
      text: L(
        'Und die schwarzen Tasten? Das sind Zwischentöne: Jede liegt zwischen zwei weissen und hat darum zwei Namen, zum Beispiel Cis oder Des. Die lernst du später – bis dahin sind sie deine Wegweiser.',
        'And the black keys? They are in-between notes: each sits between two white keys and so has two names, for example C sharp or D flat. You will learn them later – until then they are your signposts.',
      ),
      picture: { kind: 'keyboard', ...C4_C5, labels: 'none', marks: [61, 63, 66, 68, 70] },
    },
    {
      type: 'quiz',
      text: L(
        'Warum lernst du zuerst die weissen Tasten?',
        'Why do you learn the white keys first?',
      ),
      answers: [
        { text: L('Weil die schwarzen nicht klingen', 'Because the black keys make no sound') },
        {
          text: L(
            'Weil die weissen die sieben Grundtöne sind',
            'Because the white keys are the seven basic notes',
          ),
          correct: true,
        },
        { text: L('Weil die schwarzen zu klein sind', 'Because the black keys are too small') },
      ],
      hint: L('Die schwarzen klingen auch – probier es aus!', 'The black keys do sound – try it!'),
    },
    {
      type: 'quiz',
      text: L(
        'Stimmt das? Die schwarzen Tasten helfen dir, die weissen zu finden.',
        'True or false? The black keys help you find the white ones.',
      ),
      answers: [{ text: L('Stimmt', 'True'), correct: true }, { text: L('Stimmt nicht', 'False') }],
      hint: L(
        'Denk an das C bei den zwei und das F bei den drei.',
        'Think of C by the two and F by the three.',
      ),
    },
  ],

  'hand-scale': [
    {
      type: 'explain',
      text: L(
        'Eine Tonleiter sind alle Töne von C bis zum nächsten C – acht Töne. Deine Hand hat aber nur fünf Finger! Der Trick: Nach dem E schlüpft der Daumen unter der Hand durch aufs F.',
        'A scale is all the notes from C to the next C – eight notes. But your hand only has five fingers! The trick: after E, your thumb slips under your hand onto F.',
      ),
      picture: {
        kind: 'keyboard',
        ...C4_C5,
        labels: 'all',
        fingering: [
          [60, 1],
          [62, 2],
          [64, 3],
          [65, 1],
          [67, 2],
          [69, 3],
          [71, 4],
          [72, 5],
        ],
      },
    },
    {
      type: 'quiz',
      text: L('Welcher Finger spielt nach dem E das F?', 'Which finger plays F after E?'),
      answers: [
        { text: L('Der Daumen (1)', 'The thumb (1)'), correct: true },
        { text: L('Der Ringfinger (4)', 'The ring finger (4)') },
        { text: L('Der kleine Finger (5)', 'The little finger (5)') },
      ],
      hint: L('Der Daumen schlüpft unten durch.', 'The thumb slips underneath.'),
    },
    {
      type: 'listen',
      text: L(
        'Hör zu: Geht die Tonleiter hinauf oder hinunter?',
        'Listen: does the scale go up or down?',
      ),
      answers: [L('Hinauf', 'Up'), L('Hinunter', 'Down')],
      rounds: [
        { notes: [60, 62, 64, 65, 67, 69, 71, 72], answer: 0 },
        { notes: [72, 71, 69, 67, 65, 64, 62, 60], answer: 1 },
        { notes: [60, 62, 64, 65, 67], answer: 0 },
      ],
    },
  ],

  'hand-entchen': [
    {
      type: 'explain',
      text: L(
        '«Alle meine Entchen» ist ein sehr altes Kinderlied – niemand weiss genau, wer es erfunden hat. Kennst du es? Dann sing beim Spielen mit!',
        '“Alle meine Entchen” is a very old German children’s song – nobody knows exactly who made it up. Do you know it? Then sing along while you play!',
      ),
      picture: { kind: 'sticker', sticker: 'duck' },
    },
    {
      type: 'explain',
      text: L(
        'Unter jeder Note steht ihr Name. Lange Noten hältst du länger – zähl einfach leise mit.',
        'The name of every note is written below it. Hold long notes longer – just count quietly.',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [60, 62, 64, 65, 67], names: true },
    },
    {
      type: 'listen',
      text: L(
        'Hör dir den Anfang an: Geht die Melodie hinauf oder hinunter?',
        'Listen to the beginning: does the melody go up or down?',
      ),
      answers: [L('Hinauf', 'Up'), L('Hinunter', 'Down')],
      rounds: [{ notes: [60, 62, 64, 65, 67, 67], answer: 0 }],
    },
  ],
};

export function theoryFor(lessonId: string): TheoryStep[] {
  return LESSON_THEORY[lessonId] ?? [];
}
