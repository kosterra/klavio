import { CURRICULUM } from './curriculum.ts';
import type { Localized, QuizStep, TheoryStep } from './types.ts';

const L = (de: string, en: string): Localized => ({ 'de-CH': de, en });

const C3_C5 = { from: 48, to: 72 };
const C4_C5 = { from: 60, to: 72 };

/**
 * The "Entdecken" part of each lesson: what to know before playing, as small
 * steps with pictures, games and quizzes. Keyed by lesson id.
 */
export const LESSON_THEORY: Record<string, TheoryStep[]> = {
  'meter-eighths': [
    {
      type: 'explain',
      text: L(
        'Eine Achtelnote hat ein Fähnchen – zwei Achtel hintereinander bekommen einen Balken. Sie sind halb so lang wie eine Viertel. Zähl «eins-und, zwei-und»: Die Achtel kommen auf die Zahl und auf das «und».',
        'An eighth note has a little flag – two eighths in a row get a beam. They are half as long as a quarter. Count «one-and, two-and»: the eighths come on the number and on the «and».',
      ),
    },
    {
      type: 'clap',
      text: L(
        'Klatsch mit: Viertel, zwei schnelle Achtel, Viertel, Viertel.',
        'Tap along: quarter, two quick eighths, quarter, quarter.',
      ),
      tempo: 72,
      pattern: ['q', '8', '8', 'q', 'q'],
    },
    {
      type: 'quiz',
      text: L(
        'Wie viele Achtel dauern so lang wie eine Viertel?',
        'How many eighths last as long as a quarter?',
      ),
      answers: [
        { text: L('Eine', 'One') },
        { text: L('Zwei', 'Two'), correct: true },
        { text: L('Vier', 'Four') },
      ],
      hint: L(
        'Zähl «eins-und»: zwei Achtel auf einen Schlag.',
        'Count «one-and»: two eighths on one beat.',
      ),
    },
  ],
  'meter-waltz': [
    {
      type: 'explain',
      text: L(
        'Der Walzer hat nur drei Schläge pro Takt: «eins, zwei, drei». Der erste ist der schwere – so wiegt sich die Musik hin und her. Eine halbe Note mit Punkt dauert drei Schläge und füllt einen ganzen Takt.',
        'A waltz has only three beats per bar: «one, two, three». The first one is heavy – that is how the music sways. A dotted half note lasts three beats and fills a whole bar.',
      ),
    },
    {
      type: 'clap',
      text: L(
        'Klatsch mit: eine Halbe und eine Viertel – «eins-zwei, drei».',
        'Tap along: a half and a quarter – «one-two, three».',
      ),
      tempo: 92,
      pattern: ['h', 'q'],
    },
    {
      type: 'quiz',
      text: L(
        'Wie viele Schläge hat ein Takt im Walzer?',
        'How many beats does a bar of a waltz have?',
      ),
      answers: [
        { text: L('Zwei', 'Two') },
        { text: L('Drei', 'Three'), correct: true },
        { text: L('Vier', 'Four') },
      ],
      hint: L('«Eins, zwei, drei – eins, zwei, drei.»', '«One, two, three – one, two, three.»'),
    },
  ],
  'keysig-flats': [
    {
      type: 'explain',
      text: L(
        'Ein ♭ macht eine Note einen Schritt tiefer: Aus E wird Es. Im Deutschen hängt man «-es» an – nur das H wird zum B, und aus A wird As.',
        'A flat ♭ makes a note one step lower: E becomes E flat. In German you add «-es» – only B becomes «B» (and German «H» is your B).',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [64, 63], names: true, spelling: 'flat' },
    },
    {
      type: 'explain',
      text: L(
        'Lustig: Cis und Des sind dieselbe schwarze Taste – sie heisst nur verschieden, je nachdem, ob man von unten (♯) oder von oben (♭) kommt.',
        'Fun fact: C sharp and D flat are the same black key – it just has two names, depending on whether you come from below (♯) or from above (♭).',
      ),
      picture: { kind: 'keyboard', from: 60, to: 72, labels: 'all', marks: [61] },
    },
    {
      type: 'quiz',
      text: L('Welche Taste spielst du für diese Note?', 'Which key do you play for this note?'),
      picture: { kind: 'staff', clef: 'treble', notes: [70], spelling: 'flat' },
      answers: [
        { text: L('A', 'A') },
        { text: L('B', 'B flat'), correct: true },
        { text: L('H', 'B') },
      ],
      hint: L(
        'Das ♭ heisst: einen Schritt tiefer als das H.',
        'The ♭ means: one step lower than B.',
      ),
    },
  ],
  'keysig-g-scale': [
    {
      type: 'explain',
      text: L(
        'Jede Dur-Tonleiter klingt gleich – egal, wo sie beginnt. Damit G-Dur so klingt wie C-Dur, braucht sie eine schwarze Taste: das Fis. Darum steht in G-Dur ein ♯ gleich am Anfang jeder Zeile.',
        'Every major scale sounds the same – wherever it starts. For G major to sound like C major, it needs one black key: F sharp. That is why G major has a ♯ right at the start of every line.',
      ),
      picture: {
        kind: 'staff',
        clef: 'treble',
        notes: [67, 69, 71, 72, 74, 76, 78, 79],
        keySignature: 'G',
      },
    },
    {
      type: 'quiz',
      text: L('Welche schwarze Taste gehört zu G-Dur?', 'Which black key belongs to G major?'),
      answers: [
        { text: L('Fis', 'F sharp'), correct: true },
        { text: L('B', 'B flat') },
        { text: L('Cis', 'C sharp') },
      ],
      hint: L(
        'Schau, wo das ♯ am Zeilenanfang steht: auf der F-Linie.',
        'Look where the ♯ at the start of the line sits: on the F line.',
      ),
    },
  ],
  'keysig-f-read': [
    {
      type: 'explain',
      text: L(
        'Das ♮ heisst Auflösungszeichen: Es hebt ♯ oder ♭ auf, bis zum Ende des Takts. Hier steht ein ♭ am Anfang – das zweite H bekommt ein ♮ und wird wieder zum weissen H.',
        'The ♮ is a natural sign: it cancels a ♯ or ♭ until the end of the bar. Here a ♭ stands at the start – the second B gets a ♮ and becomes the white B again.',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [70, 71], names: true, keySignature: 'F' },
    },
    {
      type: 'quiz',
      text: L('Was macht das ♮?', 'What does the ♮ do?'),
      answers: [
        { text: L('Es macht die Note höher', 'It makes the note higher') },
        { text: L('Es hebt ♯ oder ♭ auf', 'It cancels a ♯ or ♭'), correct: true },
        { text: L('Es macht die Note länger', 'It makes the note longer') },
      ],
      hint: L('Lies nochmals oben nach.', 'Read the text above once more.'),
    },
  ],
  // ------------------------------------------------------------ chapter 1
  'keys-c': [
    {
      type: 'explain',
      text: L(
        'Bevor es losgeht: So sitzt du gut am Klavier. Setz dich vor die Mitte der Tasten, nur auf die vordere Hälfte des Stuhls. Deine Unterarme sind ungefähr waagrecht, die Schultern locker, die Füsse stehen auf dem Boden – oder auf einem Hocker.',
        'Before we start: this is how you sit well at the piano. Sit in front of the middle of the keys, only on the front half of the chair. Your forearms are about level, your shoulders relaxed, your feet on the floor – or on a stool.',
      ),
      picture: { kind: 'sticker', sticker: 'piano' },
    },
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
        'Töne kann man verschieden spielen: gebunden (legato) – ein Ton geht weich in den nächsten über, du lässt die Taste erst los, wenn die nächste klingt. Oder kurz (staccato) – die Taste springt sofort wieder hoch. In den Noten steht dafür ein Bogen oder ein Punkt über der Note.',
        'Notes can be played in different ways: connected (legato) – one note flows softly into the next, you let go of a key only when the next one sounds. Or short (staccato) – the key springs straight back up. In the music this is a curved line or a dot above the note.',
      ),
    },
    {
      type: 'listen',
      text: L(
        'Hör zu: Klingt das gebunden oder kurz?',
        'Listen: does it sound connected or short?',
      ),
      answers: [L('Gebunden', 'Connected'), L('Kurz', 'Short')],
      rounds: [
        { notes: [60, 62, 64, 65, 67], answer: 0, touch: 'legato' },
        { notes: [67, 65, 64, 62, 60], answer: 1, touch: 'staccato' },
        { notes: [64, 64, 65, 67], answer: 1, touch: 'staccato' },
        { notes: [67, 65, 64, 62], answer: 0, touch: 'legato' },
      ],
    },
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
  // ------------------------------------------------------------ chapter 3
  'read-c-d-e': [
    {
      type: 'explain',
      text: L(
        'Musik kann man aufschreiben – mit Noten. Sie stehen auf fünf Linien, dem Notensystem. Je höher eine Note steht, desto höher klingt sie und desto weiter rechts liegt ihre Taste.',
        'Music can be written down – with notes. They sit on five lines, the staff. The higher a note sits, the higher it sounds and the further right its key is.',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [60, 62, 64, 65, 67], names: true },
    },
    {
      type: 'explain',
      text: L(
        'Eine Note sitzt entweder auf einer Linie – die Linie geht mitten durch sie hindurch …',
        'A note either sits on a line – the line goes right through its middle …',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [64, 67, 71], highlight: 'lines' },
    },
    {
      type: 'explain',
      text: L(
        '… oder in einem Zwischenraum, genau zwischen zwei Linien.',
        '… or in a space, right between two lines.',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [65, 69, 72], highlight: 'spaces' },
    },
    {
      type: 'quiz',
      text: L(
        'Sitzt diese Note auf einer Linie oder in einem Zwischenraum?',
        'Is this note on a line or in a space?',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [67] },
      answers: [
        { text: L('Auf einer Linie', 'On a line'), correct: true },
        { text: L('In einem Zwischenraum', 'In a space') },
      ],
      hint: L(
        'Schau genau: Geht eine Linie mitten durch die Note?',
        'Look closely: does a line go through the middle of the note?',
      ),
    },
    {
      type: 'explain',
      text: L(
        'Das mittlere C steht unter den fünf Linien, auf einer kleinen Extra-Linie – der Hilfslinie. Das D hängt direkt unter der untersten Linie, das E sitzt auf ihr.',
        'Middle C sits below the five lines, on a little extra line – a ledger line. D hangs right below the bottom line, E sits on it.',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [60, 62, 64], names: true },
    },
    {
      type: 'quiz',
      text: L('Welche Note klingt höher?', 'Which note sounds higher?'),
      picture: { kind: 'staff', clef: 'treble', notes: [64, 60] },
      answers: [
        { text: L('Die erste', 'The first one'), correct: true },
        { text: L('Die zweite', 'The second one') },
      ],
      hint: L(
        'Höher auf den Linien heisst höher im Klang.',
        'Higher on the staff means higher in sound.',
      ),
    },
  ],

  'read-f-g': [
    {
      type: 'explain',
      text: L(
        'Über dem E geht es weiter: das F im ersten Zwischenraum, das G auf der zweiten Linie. Um diese Linie rollt sich der Notenschlüssel ein – darum heisst er G-Schlüssel oder Violinschlüssel.',
        'Above E it goes on: F in the first space, G on the second line. The clef curls around this line – that is why it is called the G clef or treble clef.',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [64, 65, 67], names: true },
    },
    {
      type: 'quiz',
      text: L('Wie heisst diese Note?', 'What is this note called?'),
      picture: { kind: 'staff', clef: 'treble', notes: [65] },
      answers: [{ text: L('E', 'E') }, { text: L('F', 'F'), correct: true }, { text: L('G', 'G') }],
      hint: L('Sie sitzt im ersten Zwischenraum.', 'It sits in the first space.'),
    },
    {
      type: 'quiz',
      text: L('Und diese?', 'And this one?'),
      picture: { kind: 'staff', clef: 'treble', notes: [67] },
      answers: [{ text: L('F', 'F') }, { text: L('G', 'G'), correct: true }, { text: L('A', 'A') }],
      hint: L('Um diese Linie rollt sich der G-Schlüssel.', 'The G clef curls around this line.'),
    },
  ],

  'read-a-h-c': [
    {
      type: 'explain',
      text: L(
        'Noch höher: das A im zweiten Zwischenraum, das H auf der mittleren Linie, das C im dritten Zwischenraum. Linie, Zwischenraum, Linie – immer abwechselnd.',
        'Even higher: A in the second space, B on the middle line, C in the third space. Line, space, line – always taking turns.',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [69, 71, 72], names: true },
    },
    {
      type: 'explain',
      text: L(
        'Von C bis C bilden die Noten eine Treppe – genau wie die weissen Tasten von links nach rechts.',
        'From C to C the notes make a staircase – just like the white keys from left to right.',
      ),
      picture: {
        kind: 'staff',
        clef: 'treble',
        notes: [60, 62, 64, 65, 67, 69, 71, 72],
        names: true,
      },
    },
    {
      type: 'quiz',
      text: L('Wie heisst diese Note?', 'What is this note called?'),
      picture: { kind: 'staff', clef: 'treble', notes: [71] },
      answers: [{ text: L('A', 'A') }, { text: L('H', 'B'), correct: true }, { text: L('C', 'C') }],
      hint: L('Sie sitzt genau auf der mittleren Linie.', 'It sits right on the middle line.'),
    },
    {
      type: 'quiz',
      text: L('Linie oder Zwischenraum?', 'Line or space?'),
      picture: { kind: 'staff', clef: 'treble', notes: [72] },
      answers: [
        { text: L('Auf einer Linie', 'On a line') },
        { text: L('In einem Zwischenraum', 'In a space'), correct: true },
      ],
      hint: L(
        'Schau, ob eine Linie durch die Note geht.',
        'Check whether a line goes through the note.',
      ),
    },
  ],

  // ------------------------------------------------------------ chapter 4
  'song-haenschen': [
    {
      type: 'explain',
      text: L(
        '«Hänschen klein» erzählt von einem Jungen, der allein in die weite Welt hinauszieht – und Jahre später zur Mutter zurückkommt. Das Lied ist fast 200 Jahre alt.',
        '“Hänschen klein” tells of a boy who sets out alone into the wide world – and comes back to his mother years later. The song is almost 200 years old.',
      ),
      picture: { kind: 'sticker', sticker: 'boat' },
    },
    {
      type: 'explain',
      text: L(
        'Diesmal stehen keine Namen unter den Noten – du liest sie selbst. Tipp: Tippe zuerst auf «Anhören», dann weisst du, wie es klingen soll.',
        'This time there are no names below the notes – you read them yourself. Tip: tap “Listen” first, then you know how it should sound.',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [67, 64, 64, 65, 62, 62] },
    },
    {
      type: 'listen',
      text: L(
        'Hör dir den Anfang an: Geht die Melodie hinauf oder hinunter?',
        'Listen to the beginning: does the melody go up or down?',
      ),
      answers: [L('Hinauf', 'Up'), L('Hinunter', 'Down')],
      rounds: [
        { notes: [67, 64, 64], answer: 1 },
        { notes: [60, 62, 64, 65, 67], answer: 0 },
      ],
    },
  ],

  'song-freude': [
    {
      type: 'explain',
      text: L(
        'Diese Melodie hat Ludwig van Beethoven geschrieben, für seine 9. Sinfonie – vor über 200 Jahren. Heute ist sie die Hymne Europas.',
        'Ludwig van Beethoven wrote this melody for his 9th Symphony – more than 200 years ago. Today it is the anthem of Europe.',
      ),
      picture: { kind: 'sticker', sticker: 'star' },
    },
    {
      type: 'quiz',
      text: L('Wer hat diese Melodie geschrieben?', 'Who wrote this melody?'),
      answers: [
        { text: L('Wolfgang Amadeus Mozart', 'Wolfgang Amadeus Mozart') },
        { text: L('Ludwig van Beethoven', 'Ludwig van Beethoven'), correct: true },
        { text: L('Johann Sebastian Bach', 'Johann Sebastian Bach') },
      ],
      hint: L('Lies nochmals oben nach.', 'Read the text above once more.'),
    },
    {
      type: 'explain',
      text: L(
        'Neu ist der Punkt hinter einer Note: Er macht sie um die Hälfte länger. Die Note danach ist dafür ganz kurz – es klingt wie «daaa-da».',
        'New is the dot after a note: it makes the note half as long again. The note after it is very short instead – it sounds like “daaa-da”.',
      ),
    },
    {
      type: 'clap',
      text: L(
        'Klatsch mit: zwei Viertel, dann «daaa-da» – die punktierte Viertel und die kurze Achtel.',
        'Tap along: two quarters, then «daaa-da» – the dotted quarter and the short eighth.',
      ),
      tempo: 72,
      pattern: ['q', 'q', 'qd', '8'],
    },
    {
      type: 'listen',
      text: L(
        'Hör zu: Geht die Melodie hinauf oder hinunter?',
        'Listen: does the melody go up or down?',
      ),
      answers: [L('Hinauf', 'Up'), L('Hinunter', 'Down')],
      rounds: [
        { notes: [64, 64, 65, 67], answer: 0 },
        { notes: [67, 65, 64, 62], answer: 1 },
      ],
    },
  ],

  'song-weihnachtsmann': [
    {
      type: 'explain',
      text: L(
        'Das Klavier heisst eigentlich «Pianoforte»: piano heisst leise, forte heisst laut. Je kräftiger du die Taste drückst, desto lauter klingt sie. In den Noten steht p für leise und f für laut.',
        'The piano is really called «pianoforte»: piano means soft, forte means loud. The harder you press a key, the louder it sounds. In the music, p means soft and f means loud.',
      ),
    },
    {
      type: 'listen',
      text: L('Hör zu: Klingt das laut (f) oder leise (p)?', 'Listen: is it loud (f) or soft (p)?'),
      answers: [L('Laut (f)', 'Loud (f)'), L('Leise (p)', 'Soft (p)')],
      rounds: [
        { notes: [60, 60, 67, 67], answer: 0, velocity: 1 },
        { notes: [69, 69, 67], answer: 1, velocity: 0.15 },
        { notes: [65, 65, 64, 64], answer: 1, velocity: 0.15 },
        { notes: [62, 62, 60], answer: 0, velocity: 1 },
      ],
    },
    {
      type: 'explain',
      text: L(
        'Diese Melodie ist sehr alt und kommt aus Frankreich. Mozart hat Variationen darüber komponiert, und auf Englisch singt man dazu «Twinkle, Twinkle, Little Star».',
        'This melody is very old and comes from France. Mozart composed variations on it, and in German it is sung as “Morgen kommt der Weihnachtsmann”.',
      ),
      picture: { kind: 'sticker', sticker: 'bell' },
    },
    {
      type: 'explain',
      text: L(
        'Am Anfang springt die Melodie vom C zum G. Deine Hand bleibt ruhig liegen: Der Daumen spielt das C, der kleine Finger das G.',
        'At the start the melody jumps from C to G. Your hand stays still: your thumb plays C, your little finger plays G.',
      ),
      picture: {
        kind: 'keyboard',
        ...C4_C5,
        labels: 'all',
        fingering: [
          [60, 1],
          [67, 5],
        ],
      },
    },
    {
      type: 'listen',
      text: L(
        'Hör zu: Springt die Melodie oder geht sie Schritt für Schritt?',
        'Listen: does the melody jump or go step by step?',
      ),
      answers: [L('Sie springt', 'It jumps'), L('Schritt für Schritt', 'Step by step')],
      rounds: [
        { notes: [60, 60, 67, 67], answer: 0 },
        { notes: [60, 62, 64, 65], answer: 1 },
        { notes: [64, 69], answer: 0 },
      ],
    },
  ],

  // ------------------------------------------------------------ chapter 5
  'rhythm-quarters': [
    {
      type: 'explain',
      text: L(
        'Noten sagen dir nicht nur welcher Ton, sondern auch wie lange. Stell dir eine Pizza vor: Die Ganze ist die ganze Pizza, die Halbe eine halbe, die Viertel ein Viertel.',
        'Notes tell you not only which note, but also how long. Think of a pizza: the whole note is the whole pizza, the half note half of it, the quarter note a quarter.',
      ),
      picture: { kind: 'note-values', values: ['w', 'h', 'q'], pizza: true },
    },
    {
      type: 'quiz',
      text: L('Welche Note dauert länger?', 'Which note lasts longer?'),
      answers: [
        { text: L('Die Halbe', 'The half note'), correct: true },
        { text: L('Die Viertel', 'The quarter note') },
      ],
      hint: L(
        'Ein halbes Stück Pizza ist grösser als ein Viertel.',
        'Half a pizza is bigger than a quarter.',
      ),
    },
    {
      type: 'explain',
      text: L(
        'Der Takt ist wie dein Herzschlag: immer gleichmässig. Zähl leise mit: 1, 2, 3, 4. Zuerst zähle ich vor, dann bist du dran.',
        'The beat is like your heartbeat: always steady. Count quietly: 1, 2, 3, 4. First I count in, then it is your turn.',
      ),
    },
    {
      type: 'clap',
      text: L(
        'Klatsch mit: vier Viertel – auf jeden Schlag einmal.',
        'Clap along: four quarters – once on every beat.',
      ),
      tempo: 72,
      pattern: ['q', 'q', 'q', 'q'],
    },
    {
      type: 'clap',
      text: L(
        'Und jetzt zwei Halbe: nur auf 1 und auf 3.',
        'And now two halves: only on 1 and on 3.',
      ),
      tempo: 72,
      pattern: ['h', 'h'],
    },
  ],

  'rhythm-rests': [
    {
      type: 'explain',
      text: L(
        'Eine Ganze ist die ganze Pizza: Sie klingt alle vier Schläge lang. Drück die Taste und halte sie, bis du bis vier gezählt hast.',
        'A whole note is the whole pizza: it sounds for all four beats. Press the key and hold it until you have counted to four.',
      ),
      picture: { kind: 'note-values', values: ['w'], pizza: true },
    },
    {
      type: 'explain',
      text: L(
        'Eine Pause heisst: still sein! Sie zählt mit, aber du spielst nichts – ein leerer Teller. Die Viertelpause dauert einen Schlag.',
        'A rest means: be quiet! It counts, but you play nothing – an empty plate. A quarter rest lasts one beat.',
      ),
      picture: { kind: 'note-values', values: ['q', 'qr'], pizza: true },
    },
    {
      type: 'clap',
      text: L('Klatsch mit – aber bei der Pause nicht!', 'Clap along – but not on the rest!'),
      tempo: 72,
      pattern: ['q', 'q', 'qr', 'q'],
    },
    {
      type: 'quiz',
      text: L('Wie viele Schläge dauert eine Ganze?', 'How many beats does a whole note last?'),
      answers: [{ text: L('1', '1') }, { text: L('2', '2') }, { text: L('4', '4'), correct: true }],
      hint: L('Denk an die ganze Pizza.', 'Think of the whole pizza.'),
    },
  ],

  // ------------------------------------------------- level 2, chapter 6
  'bass-hand': [
    {
      type: 'explain',
      text: L(
        'Die linke Hand hat dieselben Fingernummern: Daumen 1 bis kleiner Finger 5. Aber Achtung – bei der linken Hand ist der Daumen rechts!',
        'The left hand has the same finger numbers: thumb 1 to little finger 5. But careful – on the left hand the thumb is on the right!',
      ),
      picture: { kind: 'hand', side: 'left', numbers: true },
    },
    {
      type: 'quiz',
      text: L(
        'Welche Nummer hat dieser Finger der linken Hand?',
        'Which number is this finger of the left hand?',
      ),
      picture: { kind: 'hand', side: 'left', highlight: 5, numbers: false },
      answers: [{ text: L('1', '1') }, { text: L('3', '3') }, { text: L('5', '5'), correct: true }],
      hint: L(
        'Der kleinste Finger hat die grösste Nummer.',
        'The smallest finger has the biggest number.',
      ),
    },
    {
      type: 'explain',
      text: L(
        'Leg die linke Hand aufs C unter dem mittleren C: kleiner Finger auf das C, dann ein Finger pro Taste – der Daumen landet auf dem G.',
        'Place your left hand on the C below middle C: little finger on C, then one finger per key – the thumb lands on G.',
      ),
      picture: {
        kind: 'keyboard',
        from: 48,
        to: 60,
        labels: 'all',
        fingering: [
          [48, 5],
          [50, 4],
          [52, 3],
          [53, 2],
          [55, 1],
        ],
      },
    },
    {
      type: 'quiz',
      text: L(
        'Mit welchem Finger spielt die linke Hand das C?',
        'Which finger of the left hand plays C?',
      ),
      answers: [
        { text: L('Mit dem Daumen (1)', 'The thumb (1)') },
        { text: L('Mit dem kleinen Finger (5)', 'The little finger (5)'), correct: true },
        { text: L('Mit dem Mittelfinger (3)', 'The middle finger (3)') },
      ],
      hint: L(
        'Links ist der kleine Finger ganz aussen – beim C.',
        'On the left the little finger is on the outside – on C.',
      ),
    },
  ],

  'bass-clef': [
    {
      type: 'explain',
      text: L(
        'Für tiefe Töne gibt es einen eigenen Schlüssel: den Bassschlüssel. Seine zwei Punkte umarmen eine Linie – die F-Linie. Darum heisst er auch F-Schlüssel.',
        'Low notes have their own clef: the bass clef. Its two dots hug one line – the F line. That is why it is also called the F clef.',
      ),
      picture: { kind: 'staff', clef: 'bass', notes: [53], names: true },
    },
    {
      type: 'explain',
      text: L(
        'Von C bis G: C im zweiten Zwischenraum, D auf der Mittellinie, E im dritten Zwischenraum, F auf der vierten Linie, G ganz oben im Zwischenraum.',
        'From C to G: C in the second space, D on the middle line, E in the third space, F on the fourth line, G in the top space.',
      ),
      picture: { kind: 'staff', clef: 'bass', notes: [48, 50, 52, 53, 55], names: true },
    },
    {
      type: 'quiz',
      text: L(
        'Wie heisst diese Note im Bassschlüssel?',
        'What is this note called in the bass clef?',
      ),
      picture: { kind: 'staff', clef: 'bass', notes: [50] },
      answers: [{ text: L('C', 'C') }, { text: L('D', 'D'), correct: true }, { text: L('E', 'E') }],
      hint: L('Sie sitzt genau auf der mittleren Linie.', 'It sits right on the middle line.'),
    },
    {
      type: 'quiz',
      text: L('Und diese?', 'And this one?'),
      picture: { kind: 'staff', clef: 'bass', notes: [53] },
      answers: [{ text: L('E', 'E') }, { text: L('F', 'F'), correct: true }, { text: L('G', 'G') }],
      hint: L(
        'Die zwei Punkte des Schlüssels zeigen auf diese Linie.',
        'The two dots of the clef point to this line.',
      ),
    },
  ],

  'bass-low': [
    {
      type: 'explain',
      text: L(
        'Unter dem C geht es weiter hinunter: Das H sitzt auf der zweiten Linie, das A im untersten Zwischenraum und das G auf der untersten Linie.',
        'Below C it goes further down: B sits on the second line, A in the lowest space and G on the bottom line.',
      ),
      picture: { kind: 'staff', clef: 'bass', notes: [43, 45, 47, 48], names: true },
    },
    {
      type: 'quiz',
      text: L('Wie heisst diese Note?', 'What is this note called?'),
      picture: { kind: 'staff', clef: 'bass', notes: [43] },
      answers: [{ text: L('G', 'G'), correct: true }, { text: L('A', 'A') }, { text: L('H', 'B') }],
      hint: L('Sie liegt auf der untersten Linie.', 'It is on the bottom line.'),
    },
    {
      type: 'listen',
      text: L(
        'Hör gut zu: Ist der zweite Ton höher oder tiefer?',
        'Listen carefully: is the second note higher or lower?',
      ),
      answers: [L('Höher', 'Higher'), L('Tiefer', 'Lower')],
      rounds: [
        { notes: [43, 48], answer: 0 },
        { notes: [55, 45], answer: 1 },
        { notes: [47, 52], answer: 0 },
      ],
    },
  ],

  'bass-lamb': [
    {
      type: 'explain',
      text: L(
        '«Mary Had a Little Lamb» ist ein Kinderlied aus Amerika, fast 200 Jahre alt. Es erzählt von einem Lamm, das Mary sogar in die Schule folgt.',
        '“Mary Had a Little Lamb” is a children’s song from America, almost 200 years old. It tells of a lamb that even follows Mary to school.',
      ),
      picture: { kind: 'sticker', sticker: 'heart' },
    },
    {
      type: 'explain',
      text: L(
        'Du brauchst nur C, D, E und G – die Finger 5, 4, 3 und 1 der linken Hand.',
        'You only need C, D, E and G – fingers 5, 4, 3 and 1 of the left hand.',
      ),
      picture: {
        kind: 'keyboard',
        from: 48,
        to: 60,
        labels: 'all',
        fingering: [
          [48, 5],
          [50, 4],
          [52, 3],
          [55, 1],
        ],
      },
    },
    {
      type: 'listen',
      text: L(
        'Hör dir den Anfang an: Geht die Melodie hinauf oder hinunter?',
        'Listen to the beginning: does the melody go up or down?',
      ),
      answers: [L('Hinauf', 'Up'), L('Hinunter', 'Down')],
      rounds: [{ notes: [52, 50, 48], answer: 1 }],
    },
  ],

  // ------------------------------------------------- level 2, chapter 7
  'both-turns': [
    {
      type: 'explain',
      text: L(
        'Jetzt spielen beide Hände! Links liegt der kleine Finger auf dem tiefen C, rechts der Daumen auf dem mittleren C. Zuerst spielen sie abwechselnd.',
        'Now both hands play! On the left the little finger is on the low C, on the right the thumb is on middle C. First they take turns.',
      ),
      picture: {
        kind: 'keyboard',
        from: 48,
        to: 72,
        labels: 'c',
        fingering: [
          [48, 5],
          [55, 1],
          [60, 1],
          [67, 5],
        ],
      },
    },
    {
      type: 'quiz',
      text: L('Welche Hand spielt die tiefen Töne?', 'Which hand plays the low notes?'),
      answers: [
        { text: L('Die linke Hand', 'The left hand'), correct: true },
        { text: L('Die rechte Hand', 'The right hand') },
      ],
      hint: L('Tief ist auf dem Klavier links.', 'On the piano, low is on the left.'),
    },
    {
      type: 'tap-keys',
      text: L('Tippe das tiefe C und das mittlere C an!', 'Tap the low C and middle C!'),
      keyboard: { from: 48, to: 72 },
      labels: 'none',
      targets: [[48], [60]],
      need: 'all',
      hint: L(
        'Das C liegt links von den zwei schwarzen Tasten – such ein tiefes und das in der Mitte.',
        'C is left of the two black keys – find a low one and the one in the middle.',
      ),
    },
  ],

  'both-grand': [
    {
      type: 'explain',
      text: L(
        'Das grosse Notensystem: oben die Linien mit Violinschlüssel für die rechte Hand, unten die mit Bassschlüssel für die linke. Eine Klammer hält beide zusammen.',
        'The grand staff: on top the lines with the treble clef for the right hand, below the ones with the bass clef for the left. A brace holds them together.',
      ),
      picture: { kind: 'grand-staff', notes: [48, 67], names: true },
    },
    {
      type: 'explain',
      text: L(
        'Das mittlere C sitzt genau dazwischen – auf einer kleinen Hilfslinie, die zu beiden Systemen gehört.',
        'Middle C sits right in between – on a little ledger line that belongs to both staves.',
      ),
      picture: { kind: 'grand-staff', notes: [60], names: true },
    },
    {
      type: 'quiz',
      text: L('Welche Hand spielt diese Note?', 'Which hand plays this note?'),
      picture: { kind: 'grand-staff', notes: [53] },
      answers: [
        { text: L('Die linke Hand', 'The left hand'), correct: true },
        { text: L('Die rechte Hand', 'The right hand') },
      ],
      hint: L('Sie steht im unteren System.', 'It is in the lower staff.'),
    },
    {
      type: 'quiz',
      text: L('Und diese?', 'And this one?'),
      picture: { kind: 'grand-staff', notes: [67] },
      answers: [
        { text: L('Die linke Hand', 'The left hand') },
        { text: L('Die rechte Hand', 'The right hand'), correct: true },
      ],
      hint: L('Sie steht im oberen System.', 'It is in the upper staff.'),
    },
  ],

  'both-entchen': [
    {
      type: 'explain',
      text: L(
        'Die rechte Hand spielt die Melodie, die linke begleitet mit einem langen tiefen Ton pro Takt. Drück beide Tasten gleichzeitig – und halte den tiefen Ton, während die rechte weiterspielt.',
        'The right hand plays the melody, the left accompanies with one long low note per bar. Press both keys at the same time – and hold the low note while the right hand plays on.',
      ),
      picture: { kind: 'grand-staff', notes: [48, 60], names: true },
    },
    {
      type: 'explain',
      text: L(
        'Spielst du mit dem Mikrofon, höre ich nur einen Ton aufs Mal – dann zählt die Melodie. Mit einem Digitalpiano höre ich beide Hände.',
        'If you play with the microphone, I can only hear one note at a time – then the melody counts. With a digital piano I hear both hands.',
      ),
      picture: { kind: 'sticker', sticker: 'duck' },
    },
    {
      type: 'quiz',
      text: L(
        'Was macht die linke Hand bei diesem Lied?',
        'What does the left hand do in this song?',
      ),
      answers: [
        { text: L('Sie spielt die Melodie', 'It plays the melody') },
        { text: L('Sie hält lange tiefe Töne', 'It holds long low notes'), correct: true },
        { text: L('Sie macht Pause', 'It rests') },
      ],
      hint: L('Die Melodie spielt die rechte Hand.', 'The right hand plays the melody.'),
    },
  ],

  'both-freude': [
    {
      type: 'explain',
      text: L(
        'Bei «Freude» wechselt die linke Hand zwischen C und G: Das G macht neugierig, das C bringt dich wieder nach Hause.',
        'In “Ode to Joy” the left hand switches between C and G: G makes you curious, C brings you back home.',
      ),
      picture: { kind: 'keyboard', from: 48, to: 72, labels: 'c', marks: [48, 55] },
    },
    {
      type: 'listen',
      text: L(
        'Hör zu: Geht die linke Hand hinauf oder hinunter?',
        'Listen: does the left hand go up or down?',
      ),
      answers: [L('Hinauf', 'Up'), L('Hinunter', 'Down')],
      rounds: [
        { notes: [48, 55], answer: 0 },
        { notes: [55, 48], answer: 1 },
      ],
    },
  ],

  // ------------------------------------------------- level 2, chapter 8
  'black-keys': [
    {
      type: 'explain',
      text: L(
        'Die schwarzen Tasten haben Namen! Rechts neben dem C liegt das Cis – «is» heisst: einen Schritt höher. So gibt es Cis, Dis, Fis, Gis und Ais.',
        'The black keys have names! Right of C is C sharp – “sharp” means one step higher. So there are C sharp, D sharp, F sharp, G sharp and A sharp.',
      ),
      picture: { kind: 'keyboard', from: 60, to: 72, labels: 'all', marks: [61, 63, 66, 68, 70] },
    },
    {
      type: 'tap-keys',
      text: L('Tippe alle Fis an!', 'Tap every F sharp!'),
      keyboard: { from: 48, to: 72 },
      labels: 'none',
      targets: [[54], [66]],
      need: 'all',
      hint: L(
        'Das Fis liegt rechts neben dem F – die erste Taste der Dreiergruppe.',
        'F sharp is right of F – the first key of the group of three.',
      ),
    },
    {
      type: 'quiz',
      text: L('Welche schwarze Taste liegt rechts neben dem G?', 'Which black key is right of G?'),
      answers: [
        { text: L('Fis', 'F sharp') },
        { text: L('Gis', 'G sharp'), correct: true },
        { text: L('Ais', 'A sharp') },
      ],
      hint: L('Rechts neben dem G heisst: G mit «is».', 'Right of G means: G sharp.'),
    },
    {
      type: 'explain',
      text: L(
        'Übrigens: Jede schwarze Taste hat zwei Namen. Das Cis heisst auch Des – «es» heisst einen Schritt tiefer. Zuerst lernst du die Namen mit «is».',
        'By the way: every black key has two names. C sharp is also D flat – “flat” means one step lower. You learn the sharp names first.',
      ),
      picture: { kind: 'keyboard', from: 60, to: 72, labels: 'all', marks: [61] },
    },
  ],

  'black-sharps': [
    {
      type: 'explain',
      text: L(
        'In den Noten zeigt ein Kreuz ♯: Spiel die Taste einen Schritt höher. Aus F wird Fis.',
        'In the music a sharp ♯ shows: play the key one step higher. F becomes F sharp.',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [65, 66], names: true },
    },
    {
      type: 'explain',
      text: L(
        'Und ein ♭ macht eine Note einen Schritt tiefer. Lustig: Aus H wird so das B – darum heisst bei uns die weisse Taste H und nicht B.',
        'And a flat ♭ makes a note one step lower. Fun fact: in German, B flat is called “B” – that is why Germans call the white key B an “H”.',
      ),
      picture: { kind: 'keyboard', from: 60, to: 72, labels: 'all', marks: [70, 71] },
    },
    {
      type: 'quiz',
      text: L('Welche Taste spielst du für diese Note?', 'Which key do you play for this note?'),
      picture: { kind: 'staff', clef: 'treble', notes: [66] },
      answers: [
        { text: L('F', 'F') },
        { text: L('Fis', 'F sharp'), correct: true },
        { text: L('G', 'G') },
      ],
      hint: L('Schau auf das Kreuz vor der Note.', 'Look at the sharp in front of the note.'),
    },
    {
      type: 'quiz',
      text: L('Was macht das Kreuz ♯?', 'What does the sharp ♯ do?'),
      answers: [
        { text: L('Einen Schritt höher', 'One step higher'), correct: true },
        { text: L('Einen Schritt tiefer', 'One step lower') },
        { text: L('Die Note wird lauter', 'The note gets louder') },
      ],
      hint: L(
        'Aus F wird Fis – die Taste rechts daneben.',
        'F becomes F sharp – the key to its right.',
      ),
    },
  ],

  'black-lamb': [
    {
      type: 'explain',
      text: L(
        'Ein Trick der Pianisten: Das Lied vom Lamm klingt auch nur auf schwarzen Tasten! Es beginnt auf dem Ais.',
        'A pianist’s trick: the song about the lamb also works on black keys only! It starts on A sharp.',
      ),
      picture: { kind: 'keyboard', from: 60, to: 74, labels: 'none', marks: [66, 68, 70, 73] },
    },
    {
      type: 'quiz',
      text: L('Auf welcher Taste beginnt das Lied?', 'Which key does the song start on?'),
      answers: [
        { text: L('Fis', 'F sharp') },
        { text: L('Gis', 'G sharp') },
        { text: L('Ais', 'A sharp'), correct: true },
      ],
      hint: L('Lies nochmals oben nach.', 'Read the text above once more.'),
    },
  ],

  'black-improvise': [
    {
      type: 'explain',
      text: L(
        'Improvisieren heisst: Du erfindest Musik, während du spielst. Auf den schwarzen Tasten passt alles zusammen – du kannst nichts falsch machen.',
        'Improvising means: you make up music while you play. On the black keys everything fits together – you cannot go wrong.',
      ),
      picture: {
        kind: 'keyboard',
        from: 48,
        to: 72,
        labels: 'none',
        marks: [49, 51, 54, 56, 58, 61, 63, 66, 68, 70],
      },
    },
    {
      type: 'explain',
      text: L(
        'Tipps: Spiel mal schnell, mal langsam, mal hoch, mal tief. Und mach auch mal eine Pause – Stille gehört zur Musik.',
        'Tips: play sometimes fast, sometimes slow, sometimes high, sometimes low. And take a break now and then – silence is part of music.',
      ),
      picture: { kind: 'sticker', sticker: 'star' },
    },
    {
      type: 'quiz',
      text: L(
        'Was klingt auf den schwarzen Tasten falsch?',
        'What sounds wrong on the black keys?',
      ),
      answers: [
        { text: L('Fast alles', 'Almost everything') },
        { text: L('Nichts – alles passt zusammen', 'Nothing – everything fits'), correct: true },
      ],
      hint: L('Probier es aus – du wirst staunen.', 'Try it – you will be amazed.'),
    },
  ],
};

export function theoryFor(lessonId: string): TheoryStep[] {
  return LESSON_THEORY[lessonId] ?? [];
}

/** How many questions the recap at the start of a chapter asks. */
const RECAP_QUESTIONS = 3;

/**
 * "Weisst du's noch?": at the first lesson of every chapter after the first,
 * a few quiz questions from the previous chapter's theory come first.
 * Questions are spread over the chapter (deterministic, no randomness).
 */
export function recapFor(lessonId: string): TheoryStep[] {
  const ci = CURRICULUM.findIndex((c) => c.lessons[0]?.id === lessonId);
  if (ci < 1) return [];
  const quizzes = CURRICULUM[ci - 1]!.lessons.flatMap((l) =>
    (LESSON_THEORY[l.id] ?? []).filter((s): s is QuizStep => s.type === 'quiz'),
  );
  if (!quizzes.length) return [];
  const n = Math.min(RECAP_QUESTIONS, quizzes.length);
  const picked = Array.from(
    { length: n },
    (_, i) => quizzes[Math.round((i * (quizzes.length - 1)) / Math.max(1, n - 1))]!,
  );
  return [
    {
      type: 'explain',
      text: L(
        'Weisst du’s noch? Bevor es in die neue Welt geht, ein paar Fragen zum letzten Kapitel.',
        'Do you remember? Before we enter the new world, a few questions about the last chapter.',
      ),
    },
    ...picked,
  ];
}
