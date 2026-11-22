import { CURRICULUM } from './curriculum.ts';
import type { Localized, QuizStep, TheoryPicture, TheoryStep } from './types.ts';

const L = (de: string, en: string): Localized => ({ 'de-CH': de, en });

const C3_C5 = { from: 48, to: 72 };
const C4_C5 = { from: 60, to: 72 };

/**
 * The "Entdecken" part of each lesson: what to know before playing, as small
 * steps with pictures, games and quizzes. Keyed by lesson id.
 */
export const LESSON_THEORY: Record<string, TheoryStep[]> = {
  'expr-dynamics': [
    {
      type: 'explain',
      text: L(
        'Laut und leise kommt beim Klavier von der Geschwindigkeit, mit der die Taste hinuntergeht: schnell und kräftig für forte, langsam und sanft für piano. Die Hand bleibt dabei locker – nicht hämmern!',
        'On the piano, loud and soft come from how fast the key goes down: fast and firm for forte, slow and gentle for piano. Keep your hand relaxed – no hammering!',
      ),
    },
  ],
  'chords-four': [
    {
      type: 'explain',
      text: L(
        'Ein Akkord sind drei Töne zusammen. C-Dur ist C, E, G. Für G, Am und F rückst du nur einzelne Finger: So wird die Begleitung ruhig und klingt verbunden.',
        'A chord is three notes together. C major is C, E, G. For G, Am and F you only move single fingers: the accompaniment stays calm and sounds connected.',
      ),
      picture: { kind: 'keyboard', from: 47, to: 64, labels: 'all', marks: [48, 52, 55] },
    },
    {
      type: 'quiz',
      text: L(
        'Welcher Ton kommt beim Am-Akkord statt des G?',
        'Which note replaces G in the Am chord?',
      ),
      answers: [{ text: L('F', 'F') }, { text: L('A', 'A'), correct: true }, { text: L('H', 'B') }],
      hint: L('Am heisst a-Moll: Sein Grundton ist das A.', 'Am means A minor: its root is A.'),
    },
  ],

  'expr-pedal': [
    {
      type: 'explain',
      text: L(
        'Am Klavier gibt es unten Pedale für die Füsse. Das rechte heisst Fortepedal: Solange es gedrückt ist, klingen alle Töne weiter. Der rechte Fuss bleibt mit der Ferse auf dem Boden, nur der Fussballen bewegt sich.',
        'A piano has pedals at the bottom for your feet. The right one is the sustain pedal: while it is down, all notes keep sounding. Keep your right heel on the floor, only the ball of your foot moves.',
      ),
    },
    {
      type: 'quiz',
      text: L(
        'Wann hebst du das Pedal beim Wechsel zum nächsten Ton?',
        'When do you lift the pedal when moving to the next note?',
      ),
      answers: [
        { text: L('Gleich nach der neuen Taste', 'Right after the new key'), correct: true },
        { text: L('Gar nie', 'Never') },
        { text: L('Vor dem ersten Ton', 'Before the first note') },
      ],
      hint: L(
        'Erst die neue Taste, dann kurz heben – so verschwimmt nichts.',
        'First the new key, then lift briefly – so nothing blurs.',
      ),
    },
  ],
  'keysig-a-minor': [
    {
      type: 'explain',
      text: L(
        'Musik kann in Dur oder in Moll sein. Dur klingt hell und fröhlich, Moll dunkler, oft ein bisschen traurig. Den Unterschied macht ein einziger Ton: Bei Moll ist der mittlere Ton des Akkords einen Schritt tiefer.',
        'Music can be in major or in minor. Major sounds bright and cheerful, minor darker, often a little sad. A single note makes the difference: in minor the middle note of the chord is one step lower.',
      ),
    },
    {
      type: 'listen',
      text: L('Hör zu: Dur (hell) oder Moll (dunkel)?', 'Listen: major (bright) or minor (dark)?'),
      answers: [L('Dur', 'Major'), L('Moll', 'Minor')],
      rounds: [
        { notes: [60, 64, 67, 72], answer: 0 },
        { notes: [60, 63, 67, 72], answer: 1 },
        { notes: [57, 60, 64, 69], answer: 1 },
        { notes: [57, 61, 64, 69], answer: 0 },
      ],
    },
  ],
  'meter-six-eight': [
    {
      type: 'explain',
      text: L(
        'Im 6/8-Takt hat ein Takt sechs Achtel, in zwei Gruppen zu drei: «eins-zwei-drei, vier-fünf-sechs». Eine punktierte Viertel füllt eine ganze Gruppe. Viele Wiegenlieder und Seemannslieder schaukeln so.',
        'In 6/8 a bar has six eighths, in two groups of three: «one-two-three, four-five-six». A dotted quarter fills a whole group. Many lullabies and sea shanties rock like this.',
      ),
    },
    {
      type: 'quiz',
      text: L(
        'Wie viele Achtel hat ein Takt im 6/8-Takt?',
        'How many eighths does a bar of 6/8 have?',
      ),
      answers: [
        { text: L('Drei', 'Three') },
        { text: L('Sechs', 'Six'), correct: true },
        { text: L('Acht', 'Eight') },
      ],
      hint: L('Die obere Zahl sagt es.', 'The top number tells you.'),
    },
  ],
  'meter-upbeat': [
    {
      type: 'explain',
      text: L(
        'Manche Lieder beginnen nicht auf «eins»: Ein paar Töne kommen vorher, wie ein Anlauf. Das heisst Auftakt. Dafür ist der letzte Takt kürzer – zusammen ergeben sie einen ganzen Takt.',
        'Some songs do not start on «one»: a few notes come before, like a run-up. That is called an upbeat. The last bar is shorter to make up for it – together they make one whole bar.',
      ),
    },
    {
      type: 'quiz',
      text: L('Was ist ein Auftakt?', 'What is an upbeat?'),
      answers: [
        { text: L('Töne vor dem ersten «eins»', 'Notes before the first «one»'), correct: true },
        { text: L('Ein besonders lauter Ton', 'A particularly loud note') },
        { text: L('Eine Pause am Anfang', 'A rest at the start') },
      ],
      hint: L('Lies nochmals oben nach.', 'Read the text above once more.'),
    },
  ],
  'meter-ties': [
    {
      type: 'explain',
      text: L(
        'Ein Haltebogen verbindet zwei gleiche Noten. Du spielst nur die erste und hältst die Taste, so lange beide zusammen dauern – oft über den Taktstrich hinweg.',
        'A tie connects two equal notes. You play only the first one and hold the key as long as both last together – often across the bar line.',
      ),
    },
    {
      type: 'quiz',
      text: L(
        'Eine halbe Note mit Haltebogen zu einer Viertel – wie lange hältst du?',
        'A half note tied to a quarter – how long do you hold?',
      ),
      answers: [
        { text: L('Zwei Schläge', 'Two beats') },
        { text: L('Drei Schläge', 'Three beats'), correct: true },
        { text: L('Vier Schläge', 'Four beats') },
      ],
      hint: L('Halbe (2) plus Viertel (1).', 'Half (2) plus quarter (1).'),
    },
  ],
  'accomp-bass': [
    {
      type: 'explain',
      text: L(
        'Begleiten heisst: Die linke Hand legt einen Boden unter die Melodie. Am einfachsten mit Grundton und Quinte im Wechsel – zum C-Dur spielst du C und G, zum G-Dur G und D.',
        'Accompanying means: the left hand lays a floor under the melody. The easiest way is root and fifth in turn – with C major you play C and G, with G major G and D.',
      ),
      picture: { kind: 'keyboard', from: 48, to: 60, labels: 'all', marks: [48, 55] },
    },
    {
      type: 'quiz',
      text: L(
        'Welche zwei Töne spielt die linke Hand zum C-Dur?',
        'Which two notes does the left hand play with C major?',
      ),
      answers: [
        { text: L('C und G', 'C and G'), correct: true },
        { text: L('C und D', 'C and D') },
        { text: L('E und A', 'E and A') },
      ],
      hint: L('Grundton C, und fünf Töne weiter: G.', 'Root C, and five notes up: G.'),
    },
  ],
  'accomp-chords': [
    {
      type: 'explain',
      text: L(
        'Ein Dur-Akkord besteht aus drei Tönen: dem Grundton, dem Ton zwei weisse Tasten höher und noch einmal zwei höher. C-Dur ist C – E – G. Das sieht aus wie ein Schneemann auf den Notenlinien!',
        'A major chord has three notes: the root, the note two white keys higher, and two higher again. C major is C – E – G. On the staff it looks like a snowman!',
      ),
      picture: { kind: 'keyboard', from: 48, to: 60, labels: 'all', marks: [48, 52, 55] },
    },
    {
      type: 'quiz',
      text: L('Aus welchen Tönen besteht der F-Dur-Akkord?', 'Which notes make the F major chord?'),
      answers: [
        { text: L('F – A – C', 'F – A – C'), correct: true },
        { text: L('F – G – A', 'F – G – A') },
        { text: L('F – H – D', 'F – B – D') },
      ],
      hint: L(
        'Vom F aus immer eine weisse Taste überspringen.',
        'From F, always skip one white key.',
      ),
    },
    {
      type: 'explain',
      text: L(
        'Mit nur drei Akkorden – C, F und G – lassen sich sehr viele Lieder begleiten. Meist beginnt und endet ein Lied mit C; das G führt zurück nach Hause zum C.',
        'With just three chords – C, F and G – you can accompany a great many songs. Most songs begin and end with C; the G leads back home to C.',
      ),
    },
    {
      type: 'quiz',
      text: L(
        'Welcher Akkord führt am Schluss zurück nach Hause zum C?',
        'Which chord leads back home to C at the end?',
      ),
      answers: [{ text: L('F', 'F') }, { text: L('G', 'G'), correct: true }, { text: L('C', 'C') }],
      hint: L('Lies nochmals oben nach.', 'Read the text above once more.'),
    },
  ],
  'accomp-broken': [
    {
      type: 'explain',
      text: L(
        'Gebrochen heisst: Die Töne des Akkords kommen nacheinander – von unten nach oben und wieder zurück. So wird aus drei Tönen eine Begleitung, die fliesst.',
        'Broken means: the notes of the chord come one after the other – from the bottom up and back again. That way three notes become an accompaniment that flows.',
      ),
      picture: { kind: 'keyboard', from: 48, to: 60, labels: 'all', marks: [48, 52, 55] },
    },
  ],
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
  'tech-fingers': [
    {
      type: 'explain',
      text: L(
        'Leg die Hand locker auf C bis G, die Finger leicht gebogen – wie wenn du einen kleinen Ball hältst. Jetzt hebt nur ein Finger ab und spielt, die anderen bleiben liegen. Der vierte Finger braucht dafür am meisten Übung.',
        'Rest your hand loosely on C to G, fingers slightly curved – as if you were holding a small ball. Now only one finger lifts and plays, the others stay where they are. The fourth finger needs the most practice for that.',
      ),
      picture: {
        kind: 'keyboard',
        ...C4_C5,
        labels: 'all',
        marks: [65],
        fingering: [
          [60, 1],
          [62, 2],
          [64, 3],
          [65, 4],
          [67, 5],
        ],
      },
    },
    {
      type: 'quiz',
      text: L('Was macht die Hand beim Fingerturnen?', 'What does the hand do in finger gym?'),
      answers: [
        { text: L('Sie bleibt ruhig liegen', 'It stays still'), correct: true },
        { text: L('Sie hüpft mit jedem Ton', 'It jumps with every note') },
      ],
      hint: L('Nur die Finger bewegen sich.', 'Only the fingers move.'),
    },
  ],
  'tech-thumb': [
    {
      type: 'explain',
      text: L(
        'Hinauf: Nach dem E (Mittelfinger) schlüpft der Daumen unter der Hand durch und spielt das F. Hinunter ist es umgekehrt: Der Mittelfinger klettert über den Daumen. Die Hand gleitet dabei ruhig weiter, der Ellbogen hilft ein wenig mit.',
        'Going up: after E (middle finger) the thumb slips under the hand and plays F. Going down it is the other way round: the middle finger climbs over the thumb. The hand glides on calmly, the elbow helps a little.',
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
        ],
      },
    },
    {
      type: 'quiz',
      text: L(
        'Du spielst C, D, E mit 1, 2, 3. Welcher Finger spielt dann das F?',
        'You play C, D, E with 1, 2, 3. Which finger plays F next?',
      ),
      answers: [{ text: L('1', '1'), correct: true }, { text: L('4', '4') }, { text: L('5', '5') }],
      hint: L(
        'Der Daumen schlüpft unter – so bleiben noch Finger für die Töne danach.',
        'The thumb slips under – so there are fingers left for the notes after it.',
      ),
    },
  ],
  'read-steps': [
    {
      type: 'explain',
      text: L(
        'Ein Schritt geht von einer Linie in den Zwischenraum gleich daneben – auf dem Klavier zur Nachbartaste. Hier: C, D, E, F – lauter Schritte.',
        'A step goes from a line to the space right next to it – on the piano, to the next key. Here: C, D, E, F – all steps.',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [60, 62, 64, 65], names: true },
    },
    {
      type: 'explain',
      text: L(
        'Ein Sprung geht von Linie zu Linie oder von Zwischenraum zu Zwischenraum – eine Taste wird übersprungen. Hier: E, G, H – lauter Sprünge auf den Linien.',
        'A skip goes from line to line or from space to space – one key is skipped. Here: E, G, B – all skips on the lines.',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [64, 67, 71], names: true },
    },
    {
      type: 'quiz',
      text: L(
        'Die erste Note ist ein E auf der untersten Linie. Die zweite liegt auf der nächsten Linie. Welche ist es?',
        'The first note is E on the bottom line. The second one is on the next line. Which is it?',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [64, 67] },
      answers: [{ text: L('F', 'F') }, { text: L('G', 'G'), correct: true }, { text: L('A', 'A') }],
      hint: L(
        'Linie zu Linie ist ein Sprung: E – (F) – G.',
        'Line to line is a skip: E – (F) – G.',
      ),
    },
  ],
  'read-intervals': [
    {
      type: 'explain',
      text: L(
        'Zähl beide Noten mit: C bis E sind drei Töne (C, D, E) – eine Terz. C bis F sind vier – eine Quarte. C bis G sind fünf – eine Quinte, vom Daumen bis zum kleinen Finger.',
        'Count both notes: C to E is three notes (C, D, E) – a third. C to F is four – a fourth. C to G is five – a fifth, from the thumb to the little finger.',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [60, 64, 60, 65, 60, 67], names: true },
    },
    {
      type: 'quiz',
      text: L(
        'Von einer Linie springt die Note über die nächste Linie hinweg auf die übernächste. Was für ein Abstand ist das?',
        'From a line, the note jumps over the next line onto the one after. What distance is that?',
      ),
      answers: [
        { text: L('Terz', 'Third') },
        { text: L('Quarte', 'Fourth') },
        { text: L('Quinte', 'Fifth'), correct: true },
      ],
      hint: L(
        'Linie zu Linie ist eine Terz – noch eine Linie weiter ist die Quinte.',
        'Line to line is a third – one more line up is the fifth.',
      ),
    },
  ],
  'sight-first': [
    {
      type: 'explain',
      text: L(
        'Vom Blatt spielen heisst: Noten spielen, die du noch nie gesehen hast. Drei Blicke vor dem Start helfen: Wo fängt die Melodie an? Welcher Rhythmus kommt? Geht sie in Schritten oder Sprüngen?',
        'Sight-reading means playing music you have never seen. Three looks before you start help: where does the melody begin? What rhythm comes? Does it move in steps or skips?',
      ),
    },
    {
      type: 'quiz',
      text: L(
        'Mitten in der Melodie spielst du einen falschen Ton. Was tust du?',
        'In the middle of the melody you play a wrong note. What do you do?',
      ),
      answers: [
        { text: L('Weiterspielen, im Takt', 'Keep playing, in time'), correct: true },
        { text: L('Anhalten und neu anfangen', 'Stop and start again') },
      ],
      hint: L(
        'Beim Vom-Blatt-Spielen läuft die Zeit weiter – wie in einer Band.',
        'When sight-reading, time goes on – like in a band.',
      ),
    },
  ],
  'tech-positions': [
    {
      type: 'explain',
      text: L(
        'Dur klingt immer gleich hell, egal wo du anfängst – wenn die Abstände stimmen. Bei D braucht der Mittelfinger das Fis, damit es so klingt wie C, D, E in C-Dur.',
        'Major always sounds just as bright, wherever you start – if the distances are right. On D, the middle finger needs F sharp so it sounds like C, D, E in C major.',
      ),
      picture: {
        kind: 'keyboard',
        from: 60,
        to: 72,
        labels: 'all',
        marks: [62, 64, 66, 67, 69],
        fingering: [
          [62, 1],
          [64, 2],
          [66, 3],
          [67, 4],
          [69, 5],
        ],
      },
    },
  ],
  'rhythm-dotted': [
    {
      type: 'explain',
      text: L(
        'Ein Punkt hinter einer Note macht sie um die Hälfte länger. Eine Viertel dauert einen Schlag – mit Punkt anderthalb. Der halbe Schlag, der im Takt noch fehlt, ist meistens eine Achtel gleich danach.',
        'A dot after a note makes it half as long again. A quarter lasts one beat – with a dot, one and a half. The half beat still missing in the bar is usually an eighth right after it.',
      ),
    },
    {
      type: 'clap',
      text: L(
        'Klatsch mit: punktierte Viertel, Achtel, Viertel, Viertel.',
        'Tap along: dotted quarter, eighth, quarter, quarter.',
      ),
      tempo: 72,
      pattern: ['qd', '8', 'q', 'q'],
    },
    {
      type: 'quiz',
      text: L('Wie lange dauert eine punktierte Viertel?', 'How long does a dotted quarter last?'),
      answers: [
        { text: L('Einen Schlag', 'One beat') },
        { text: L('Anderthalb Schläge', 'One and a half beats'), correct: true },
        { text: L('Zwei Schläge', 'Two beats') },
      ],
      hint: L(
        'Der Punkt gibt die Hälfte dazu: ein Schlag und ein halber.',
        'The dot adds half: one beat and a half.',
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
    // finger numbers before the first melody: the play-along shows them on the keys
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
      type: 'explain',
      text: L(
        'Leg die rechte Hand hin: Daumen 1 auf das mittlere C, Finger 2 auf das D, Finger 3 auf das E. Die Hand ist rund, als würdest du einen kleinen Ball halten.',
        'Place your right hand: thumb 1 on middle C, finger 2 on D, finger 3 on E. Keep your hand round, as if holding a small ball.',
      ),
      picture: {
        kind: 'keyboard',
        ...C4_C5,
        labels: 'all',
        fingering: [
          [60, 1],
          [62, 2],
          [64, 3],
        ],
      },
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
      type: 'quiz',
      text: L(
        'Weisst du noch die Fingernummern? Welche Nummer hat dieser Finger?',
        'Remember the finger numbers? Which number is this finger?',
      ),
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
    {
      type: 'explain',
      text: L(
        'Beim Spielen siehst du die Noten des Lieds. Lesen musst du sie noch nicht – bei jeder Note steht ihr Name. Hohle Noten klingen länger als ausgemalte. Wie man Noten liest, lernst du bald im Kapitel «Noten lesen».',
        'While you play, you see the music of the song. You don’t have to read it yet – every note has its name next to it. Hollow notes sound longer than filled-in ones. You will learn how to read music soon, in the chapter «Reading notes».',
      ),
      picture: { kind: 'music', clef: 'treble', melody: 'C4/q D4/q E4/q F4/q | G4/h G4/h' },
    },
  ],
  // ------------------------------------------------------------ chapter 3
  'read-staff': [
    {
      type: 'explain',
      text: L(
        'Musik kann man aufschreiben – mit Noten. Oben und unten zeigt, wie hoch ein Ton klingt. Gelesen wird von links nach rechts, wie in einem Buch.',
        'Music can be written down – with notes. Up and down shows how high a note sounds. You read from left to right, like a book.',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [60, 62, 64, 65, 67, 69, 71, 72] },
    },
    {
      type: 'explain',
      text: L(
        'Die Noten stehen auf fünf Linien, dem Notensystem. Die Linien zählt man von unten nach oben: Unten ist die 1. Linie, ganz oben die 5.',
        'The notes sit on five lines, the staff. The lines are counted from the bottom up: the lowest is line 1, the top one line 5.',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [], numbers: 'lines' },
    },
    {
      type: 'quiz',
      text: L('Welche Linie ist markiert?', 'Which line is marked?'),
      picture: { kind: 'staff', clef: 'treble', notes: [], mark: 2 },
      answers: [
        { text: L('Die 1. Linie', 'Line 1') },
        { text: L('Die 2. Linie', 'Line 2'), correct: true },
        { text: L('Die 3. Linie', 'Line 3') },
      ],
      hint: L('Zähl von unten: 1, 2 …', 'Count from the bottom: 1, 2 …'),
    },
    {
      type: 'explain',
      text: L(
        'Zwischen den Linien liegen vier Zwischenräume. Auch sie zählt man von unten.',
        'Between the lines there are four spaces. They are counted from the bottom too.',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [], numbers: 'spaces' },
    },
    {
      type: 'explain',
      text: L(
        'Ganz vorne steht der Notenschlüssel. Er legt fest, welcher Ton auf welcher Linie liegt. Der G-Schlüssel rollt sich um die 2. Linie – dort liegt das G. Von ihm aus findest du alle anderen Noten.',
        'Right at the start is the clef. It decides which note sits on which line. The G clef curls around line 2 – that is where G sits. From there you find every other note.',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [67], names: true },
    },
    {
      type: 'quiz',
      text: L('Auf welcher Linie liegt das G?', 'On which line is G?'),
      picture: { kind: 'staff', clef: 'treble', notes: [67] },
      answers: [
        { text: L('Auf der 1. Linie', 'On line 1') },
        { text: L('Auf der 2. Linie', 'On line 2'), correct: true },
        { text: L('Auf der 3. Linie', 'On line 3') },
      ],
      hint: L('Um diese Linie rollt sich der G-Schlüssel.', 'The G clef curls around this line.'),
    },
  ],

  'song-buns': [
    {
      type: 'explain',
      text: L(
        'Beim Spielen siehst du die Noten des Lieds. Lesen musst du sie noch nicht – bei jeder Note steht ihr Name. Hohle Noten klingen länger als ausgemalte. Wie man Noten liest, lernst du bald im Kapitel «Noten lesen».',
        'While you play, you see the music of the song. You don’t have to read it yet – every note has its name next to it. Hollow notes sound longer than filled-in ones. You will learn how to read music soon, in the chapter «Reading notes».',
      ),
      picture: { kind: 'music', clef: 'treble', melody: 'E4/q D4/q C4/h | E4/q D4/q C4/h' },
    },
  ],

  'read-c-d-e': [
    {
      type: 'explain',
      text: L(
        'Jetzt liest du die ersten Noten. Je höher eine Note im Notensystem steht, desto höher klingt sie und desto weiter rechts liegt ihre Taste.',
        'Now you read your first notes. The higher a note sits on the staff, the higher it sounds and the further right its key is.',
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
        'Über dem E geht es weiter: das F im ersten Zwischenraum, das G auf der zweiten Linie. Erinnerst du dich? Um diese Linie rollt sich der G-Schlüssel – man nennt ihn auch Violinschlüssel.',
        'Above E it goes on: F in the first space, G on the second line. Remember? The G clef curls around this line – it is also called the treble clef.',
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
      text: L('Und wie heisst diese Note?', 'And what is this note called?'),
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
        'So übst du ein neues Lied: Hör es zuerst an. Spiel es langsam. Klappt eine Stelle nicht, übst du nur diese – ein paarmal, bis sie sitzt. Erst dann spielst du im Takt.',
        'How to practise a new song: listen to it first. Play it slowly. If one spot doesn’t work, practise just that spot a few times until it sits. Only then play in time.',
      ),
    },
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

  'song-haensel': [
    {
      type: 'explain',
      text: L(
        '«Hänsel und Gretel» erzählt das Märchen der Brüder Grimm: Die Kinder verlaufen sich im Wald und finden ein Haus aus Lebkuchen.',
        '“Hansel and Gretel” tells the fairy tale of the Brothers Grimm: the children get lost in the woods and find a house made of gingerbread.',
      ),
      picture: { kind: 'sticker', sticker: 'tree' },
    },
    {
      type: 'explain',
      text: L(
        'Am Ende jeder Zeile steht eine Pause. Du spielst nichts – aber du zählst leise weiter, damit die nächste Zeile pünktlich kommt.',
        'At the end of every line there is a rest. You play nothing – but you keep counting quietly, so the next line comes on time.',
      ),
      picture: { kind: 'music', clef: 'treble', melody: 'D4/q D4/q D4/q E4/q | C4/hd r/q' },
    },
  ],

  'song-fuchs': [
    {
      type: 'explain',
      text: L(
        'Der Fuchs hat die Gans gestohlen – das Lied droht ihm mit dem Jäger. Die Melodie springt in der dritten Zeile bis zum hohen C hinauf.',
        'The fox has stolen the goose – the song threatens him with the hunter. In the third line the melody jumps up to high C.',
      ),
      picture: { kind: 'sticker', sticker: 'bell' },
    },
    {
      type: 'explain',
      text: L(
        'Hier springt die Melodie: vom A hinunter zum F, dann hinauf zum hohen C. Lies die Sprünge zuerst in Ruhe.',
        'Here the melody jumps: from A down to F, then up to high C. Read the skips calmly first.',
      ),
      picture: { kind: 'music', clef: 'treble', melody: 'A4/q F4/q C5/q A4/q | G4/w' },
    },
  ],

  'song-summ': [
    {
      type: 'explain',
      text: L(
        'Am Anfang steht 2/4: Jeder Takt hat nur zwei Viertel – «eins, zwei». Zwei Achtel zusammen dauern so lange wie eine Viertel.',
        'At the start it says 2/4: every bar has only two quarter notes – “one, two”. Two eighths together last as long as one quarter note.',
      ),
      picture: {
        kind: 'music',
        clef: 'treble',
        time: '2/4',
        melody: 'G4/q F4/q | E4/q r/q | D4/8 E4/8 F4/8 D4/8 | C4/q r/q',
      },
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
        'Weisst du noch? Das Klavier heisst eigentlich «Pianoforte»: piano heisst leise, forte heisst laut. In den Noten steht p für leise und f für laut.',
        'Remember? The piano is really called «pianoforte»: piano means soft, forte means loud. In the music, p means soft and f means loud.',
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
    {
      type: 'explain',
      text: L(
        'In Notenheften siehst du oft zwei Punkte vor einem Doppelstrich: das Wiederholungszeichen. Es heisst: Spiel diesen Teil nochmals. Hier bei Klavi ist alles ausgeschrieben – so wie am Ende dieses Lieds, wo der Anfang wiederkommt.',
        'In printed music you often see two dots before a double bar line: the repeat sign. It means: play this part again. Here with Klavi everything is written out – like at the end of this song, where the beginning comes back.',
      ),
      picture: {
        kind: 'music',
        clef: 'treble',
        melody: 'C4/q C4/q G4/q G4/q | A4/q A4/q G4/h',
        repeat: true,
      },
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
        'Senkrechte Striche teilen die Musik in gleich lange Stücke, die Takte. Der Strich heisst Taktstrich. Das hier ist der Anfang von «Hot Cross Buns» – das spielst du bald.',
        'Vertical lines divide the music into pieces of equal length, the bars. The line is called a bar line. This is the start of «Hot Cross Buns» – you will play it soon.',
      ),
      picture: { kind: 'music', clef: 'treble', melody: 'E4/q D4/q C4/h | E4/q D4/q C4/h' },
    },
    {
      type: 'quiz',
      text: L('Wie viele Takte siehst du?', 'How many bars do you see?'),
      picture: {
        kind: 'music',
        clef: 'treble',
        melody: 'E4/q D4/q C4/h | G4/h E4/h | C4/w',
      },
      answers: [{ text: L('2', '2') }, { text: L('3', '3'), correct: true }, { text: L('4', '4') }],
      hint: L(
        'Die Taktstriche trennen die Takte. Zähl die Stücke dazwischen.',
        'The bar lines separate the bars. Count the pieces between them.',
      ),
    },
    {
      type: 'explain',
      text: L(
        'Am Anfang der Noten steht 4/4: Jeder Takt hat vier Viertel. Nach jedem Taktstrich zählst du wieder bei 1 los. Eine Halbe füllt zwei Schläge.',
        'At the start of the music it says 4/4: every bar has four quarter notes. After each bar line you start counting at 1 again. A half note fills two beats.',
      ),
      picture: {
        kind: 'music',
        clef: 'treble',
        time: '4/4',
        melody: 'C4/q D4/q E4/q F4/q | G4/h G4/h',
      },
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
      text: L(
        'Und wie heisst diese Note im Bassschlüssel?',
        'And what is this note called in the bass clef?',
      ),
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
        'Beide Hände zusammen kennst du schon vom Halten. Jetzt lernen sie, sich abzuwechseln: Links liegt der kleine Finger auf dem tiefen C, rechts der Daumen auf dem mittleren C.',
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

  'both-together': [
    {
      type: 'explain',
      text: L(
        'Jetzt drücken beide Hände zugleich: links das tiefe C mit dem kleinen Finger, rechts das mittlere C mit dem Daumen. Es klingt wie ein Ton – nur voller.',
        'Now both hands press at the same time: on the left the low C with the little finger, on the right middle C with the thumb. It sounds like one note – only fuller.',
      ),
      picture: {
        kind: 'keyboard',
        from: 48,
        to: 72,
        labels: 'c',
        fingering: [
          [48, 5],
          [60, 1],
        ],
      },
    },
    {
      type: 'tap-keys',
      text: L(
        'Finde die beiden C, die du gleich zusammen spielst!',
        'Find the two Cs you will soon play together!',
      ),
      keyboard: { from: 48, to: 72 },
      labels: 'none',
      targets: [[48], [60]],
      need: 'all',
      hint: L(
        'Das tiefe C links und das mittlere C in der Mitte – beide links von zwei schwarzen Tasten.',
        'The low C on the left and middle C in the middle – both left of two black keys.',
      ),
    },
  ],

  'both-mirror': [
    {
      type: 'explain',
      text: L(
        'Im Spiegelbild beginnen beide Daumen: links auf dem G, rechts auf dem C. Dann gehen die Hände auseinander – links hinunter, rechts hinauf – immer mit dem gleichen Finger.',
        'In the mirror image both thumbs start: on the left on G, on the right on C. Then the hands move apart – left down, right up – always with the same finger.',
      ),
      picture: {
        kind: 'keyboard',
        from: 48,
        to: 72,
        labels: 'c',
        fingering: [
          [55, 1],
          [53, 2],
          [52, 3],
          [60, 1],
          [62, 2],
          [64, 3],
        ],
      },
    },
    {
      type: 'quiz',
      text: L(
        'Die rechte Hand geht hinauf. Wohin geht die linke im Spiegelbild?',
        'The right hand goes up. Where does the left go in the mirror image?',
      ),
      answers: [
        { text: L('Hinunter', 'Down'), correct: true },
        { text: L('Auch hinauf', 'Up as well') },
      ],
      hint: L(
        'Im Spiegel bewegt sich alles in die Gegenrichtung.',
        'In a mirror everything moves the opposite way.',
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
      text: L('Und welche Hand spielt diese Note?', 'And which hand plays this note?'),
      picture: { kind: 'grand-staff', notes: [67] },
      answers: [
        { text: L('Die linke Hand', 'The left hand') },
        { text: L('Die rechte Hand', 'The right hand'), correct: true },
      ],
      hint: L('Sie steht im oberen System.', 'It is in the upper staff.'),
    },
  ],

  'read-below-c': [
    {
      type: 'explain',
      text: L(
        'Unter dem mittleren C geht es weiter hinunter – mit Hilfslinien. Das H hängt direkt unter der Hilfslinie des C.',
        'Below middle C the notes go on down – with ledger lines. B hangs right below the ledger line of C.',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [60, 59], names: true },
    },
    {
      type: 'explain',
      text: L(
        'Das A bekommt eine zweite Hilfslinie mitten durch den Kopf. Das G hängt unter dieser zweiten Linie.',
        'A gets a second ledger line right through its head. G hangs below that second line.',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [60, 59, 57, 55], names: true },
    },
    {
      type: 'quiz',
      text: L('Wie heisst diese Note?', 'What is this note called?'),
      picture: { kind: 'staff', clef: 'treble', notes: [57] },
      answers: [{ text: L('G', 'G') }, { text: L('A', 'A'), correct: true }, { text: L('H', 'B') }],
      hint: L(
        'Zwei Hilfslinien, die zweite geht mitten durch die Note: das A.',
        'Two ledger lines, the second goes right through the note: A.',
      ),
    },
  ],

  'expr-staccato': [
    {
      type: 'explain',
      text: L(
        'Ein Punkt über oder unter einer Note heisst staccato: kurz spielen. Die Taste springt gleich wieder hoch. Ohne Punkt spielst du gebunden – du lässt die Taste erst los, wenn die nächste klingt.',
        'A dot above or below a note means staccato: play it short. The key bounces straight back up. Without a dot you play smoothly – you only let go when the next key sounds.',
      ),
    },
    {
      type: 'listen',
      text: L('Hör zu: Gebunden oder kurz?', 'Listen: smooth or short?'),
      answers: [L('Gebunden', 'Smooth'), L('Kurz', 'Short')],
      rounds: [
        { notes: [60, 62, 64], answer: 1, touch: 'staccato' },
        { notes: [64, 62, 60], answer: 0, touch: 'legato' },
      ],
    },
  ],

  'both-hold': [
    {
      type: 'explain',
      text: L(
        'Jetzt spielt die linke Hand mit. Ihr kleiner Finger liegt auf dem tiefen C – eine Oktave unter dem mittleren C. Sie spielt einen langen Ton und hält ihn, die rechte spielt dazu weiter.',
        'Now the left hand joins in. Its little finger rests on low C – one octave below middle C. It plays a long note and holds it while the right hand plays on.',
      ),
      picture: { kind: 'keyboard', ...C3_C5, labels: 'c', marks: [48, 60] },
    },
    {
      type: 'explain',
      text: L(
        'In den Noten bekommt die linke Hand eine eigene Zeile unten. Den Schlüssel dort lernst du später – die Namen stehen bei den Noten.',
        'In the music the left hand gets its own line at the bottom. You will learn its clef later – the names are written by the notes.',
      ),
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

/**
 * Grown-ups play a piece where children play a children's song (see
 * `Lesson.adult`): the steps about the song are told about the piece. Each
 * entry replaces the step at that place.
 */
const ADULT_THEORY: Record<string, Record<number, TheoryStep>> = {
  // grown-ups: the same facts without children's pictures (pizza, the little house)
  'keys-d-e': {
    0: {
      type: 'explain',
      text: L(
        'Das D liegt zwischen den zwei schwarzen Tasten der Zweiergruppe. Das E kommt gleich rechts daneben.',
        'D sits between the two black keys of the group of two. E comes right next to it.',
      ),
      picture: { kind: 'keyboard', ...C4_C5, labels: 'all', marks: [62, 64] },
    },
    2: {
      type: 'quiz',
      text: L(
        'Welcher Ton liegt zwischen den zwei schwarzen Tasten?',
        'Which note sits between the two black keys?',
      ),
      answers: [{ text: L('C', 'C') }, { text: L('D', 'D'), correct: true }, { text: L('E', 'E') }],
      hint: L(
        'Links von der Zweiergruppe liegt das C – eine Taste weiter rechts?',
        'C is left of the group of two – and one key further right?',
      ),
    },
  },
  'keys-f-g': {
    2: {
      type: 'quiz',
      text: L('Wo liegt das F?', 'Where is F?'),
      answers: [
        { text: L('Links von zwei schwarzen Tasten', 'Left of two black keys') },
        { text: L('Links von drei schwarzen Tasten', 'Left of three black keys'), correct: true },
        { text: L('Zwischen zwei schwarzen Tasten', 'Between two black keys') },
      ],
      hint: L(
        'Links von der Zweiergruppe liegt das C, links von der Dreiergruppe das F.',
        'C is left of the group of two, F left of the group of three.',
      ),
    },
  },
  'rhythm-quarters': {
    0: {
      type: 'explain',
      text: L(
        'Notenwerte sagen, wie lange ein Ton klingt – gezählt in Schlägen. Die Viertel dauert einen Schlag, die Halbe zwei, die Ganze vier.',
        'Note values tell how long a note sounds – counted in beats. A quarter note lasts one beat, a half note two, a whole note four.',
      ),
      picture: { kind: 'note-values', values: ['w', 'h', 'q'] },
    },
    1: {
      type: 'quiz',
      text: L('Welche Note dauert länger?', 'Which note lasts longer?'),
      answers: [
        { text: L('Die Halbe', 'The half note'), correct: true },
        { text: L('Die Viertel', 'The quarter note') },
      ],
      hint: L(
        'Die Halbe dauert zwei Schläge, die Viertel einen.',
        'The half note lasts two beats, the quarter one.',
      ),
    },
  },
  'rhythm-rests': {
    0: {
      type: 'explain',
      text: L(
        'Die ganze Note klingt alle vier Schläge eines 4/4-Takts. Drück die Taste und halte sie, bis du bis vier gezählt hast.',
        'The whole note sounds for all four beats of a 4/4 bar. Press the key and hold it until you have counted to four.',
      ),
      picture: { kind: 'note-values', values: ['w'] },
    },
    1: {
      type: 'explain',
      text: L(
        'Pausen sind Notenwerte zum Schweigen: Sie zählen mit, aber du spielst nichts. Die Viertelpause dauert einen Schlag.',
        'Rests are note values for silence: they count, but you play nothing. A quarter rest lasts one beat.',
      ),
      picture: { kind: 'note-values', values: ['q', 'qr'] },
    },
    3: {
      type: 'quiz',
      text: L('Wie viele Schläge dauert eine Ganze?', 'How many beats does a whole note last?'),
      answers: [{ text: L('1', '1') }, { text: L('2', '2') }, { text: L('4', '4'), correct: true }],
      hint: L('Sie füllt einen ganzen 4/4-Takt.', 'It fills a whole 4/4 bar.'),
    },
  },
  'song-haensel': {
    0: {
      type: 'explain',
      text: L(
        '«Aura Lee» schrieb George R. Poulton 1861. Fast hundert Jahre später wurde die Melodie mit neuem Text als «Love Me Tender» berühmt.',
        '“Aura Lee” was written by George R. Poulton in 1861. Almost a hundred years later the melody became famous with new words as “Love Me Tender”.',
      ),
      picture: { kind: 'sticker', sticker: 'heart' },
    },
    1: {
      type: 'explain',
      text: L(
        'Die Melodie beginnt mit der punktierten Viertel und ihrer Achtel – «daaa-da». Am Ende jeder Zeile hältst du lang und zählst weiter.',
        'The melody starts with the dotted quarter and its eighth – “daaa-da”. At the end of each line you hold long and keep counting.',
      ),
      picture: { kind: 'music', clef: 'treble', melody: 'G3/qd C4/8 H3/q C4/q | D4/q A3/q D4/h' },
    },
  },
  'song-fuchs': {
    0: {
      type: 'explain',
      text: L(
        'Den Text von «Amazing Grace» schrieb John Newton 1772, ein früherer Sklavenhändler. Die Melodie, die heute alle kennen, kam etwas später dazu.',
        'John Newton, a former slave trader, wrote the words of “Amazing Grace” in 1772. The melody everyone knows today came a little later.',
      ),
      picture: { kind: 'sticker', sticker: 'candle' },
    },
    1: {
      type: 'explain',
      text: L(
        'Das Lied beginnt mit einem Auftakt: Das G kommt vor der ersten «Eins». Zähl «drei» – und spiel es dort. Der letzte Takt ist dafür kürzer.',
        'The song starts with an upbeat: G comes before the first “one”. Count “three” – and play it there. The last bar is shorter for it.',
      ),
      picture: { kind: 'music', clef: 'treble', time: '3/4', melody: 'C4/h E4/8 C4/8 | E4/h D4/q' },
    },
  },
  'hand-entchen': {
    2: {
      type: 'explain',
      text: L(
        '«Morgenstimmung» hat Edvard Grieg 1875 für das Theaterstück «Peer Gynt» geschrieben: Die Sonne geht über der Wüste auf. Die Flöte spielt diese Melodie – du jetzt auch.',
        'Edvard Grieg wrote “Morning Mood” in 1875 for the play “Peer Gynt”: the sun rises over the desert. The flute plays this melody – and now so do you.',
      ),
      picture: { kind: 'sticker', sticker: 'star' },
    },
    4: {
      type: 'listen',
      text: L(
        'Hör dir den Anfang an: Geht die Melodie hinauf oder hinunter?',
        'Listen to the beginning: does the melody go up or down?',
      ),
      answers: [L('Hinauf', 'Up'), L('Hinunter', 'Down')],
      rounds: [{ notes: [67, 64, 62, 60], answer: 1 }],
    },
    5: {
      type: 'explain',
      text: L(
        'Beim Spielen siehst du die Noten des Stücks. Lesen musst du sie noch nicht – bei jeder Note steht ihr Name. Hohle Noten klingen länger als ausgemalte. Wie man Noten liest, lernst du bald im Kapitel «Noten lesen».',
        'While you play, you see the music of the piece. You don’t have to read it yet – every note has its name next to it. Hollow notes sound longer than filled-in ones. You will learn how to read music soon, in the chapter «Reading notes».',
      ),
      picture: {
        kind: 'music',
        clef: 'treble',
        melody: 'G4/q E4/q D4/q C4/q | D4/q E4/q G4/q E4/q',
      },
    },
  },
  'song-haenschen': {
    1: {
      type: 'explain',
      text: L(
        'Antonín Dvořák schrieb diese Melodie 1893 in Amerika, für seine Sinfonie «Aus der Neuen Welt». Später bekam sie einen Text: «Going Home» – nach Hause gehen.',
        'Antonín Dvořák wrote this melody in America in 1893, for his “New World” Symphony. Later it got words: “Going Home”.',
      ),
      picture: { kind: 'sticker', sticker: 'moon' },
    },
    2: {
      type: 'explain',
      text: L(
        'Diesmal stehen keine Namen unter den Noten – du liest sie selbst. Tipp: Tippe zuerst auf «Anhören», dann weisst du, wie es klingen soll.',
        'This time there are no names below the notes – you read them yourself. Tip: tap “Listen” first, then you know how it should sound.',
      ),
      picture: { kind: 'staff', clef: 'treble', notes: [64, 67, 67, 64, 62, 60] },
    },
    3: {
      type: 'listen',
      text: L(
        'Hör dir den Anfang an: Geht die Melodie hinauf oder hinunter?',
        'Listen to the beginning: does the melody go up or down?',
      ),
      answers: [L('Hinauf', 'Up'), L('Hinunter', 'Down')],
      rounds: [
        { notes: [64, 67, 67], answer: 0 },
        { notes: [64, 62, 60], answer: 1 },
      ],
    },
  },
  'bass-lamb': {
    0: {
      type: 'explain',
      text: L(
        'Beethovens «Freude» kennst du aus der rechten Hand. Die gleiche Melodie, eine Oktave tiefer: So lernt die linke Hand am schnellsten – sie spielt etwas, das du schon im Ohr hast.',
        'You know Beethoven’s “Ode to Joy” from the right hand. The same melody an octave lower: that is how the left hand learns fastest – it plays something you already have in your ear.',
      ),
      picture: { kind: 'sticker', sticker: 'star' },
    },
    1: {
      type: 'explain',
      text: L(
        'Du brauchst C, D, E, F und G – die Finger 5, 4, 3, 2 und 1 der linken Hand.',
        'You need C, D, E, F and G – fingers 5, 4, 3, 2 and 1 of the left hand.',
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
    2: {
      type: 'listen',
      text: L(
        'Hör dir den Anfang an: Geht die Melodie hinauf oder hinunter?',
        'Listen to the beginning: does the melody go up or down?',
      ),
      answers: [L('Hinauf', 'Up'), L('Hinunter', 'Down')],
      rounds: [{ notes: [52, 52, 53, 55], answer: 0 }],
    },
  },
};

export function theoryFor(lessonId: string, world: 'kids' | 'journey' = 'kids'): TheoryStep[] {
  const steps = LESSON_THEORY[lessonId] ?? [];
  const adult = world === 'journey' ? ADULT_THEORY[lessonId] : undefined;
  return adult ? steps.map((s, i) => adult[i] ?? s) : steps;
}

/** For tests: which steps the grown-ups' version replaces. */
export const ADULT_THEORY_STEPS: Record<string, number[]> = Object.fromEntries(
  Object.entries(ADULT_THEORY).map(([id, p]) => [id, Object.keys(p).map(Number)]),
);

const ans = (right: string, ...wrong: string[]) => [
  { text: L(right, right), correct: true as const },
  ...wrong.map((w) => ({ text: L(w, w) })),
];
/** a quiz with answers that are the same in both languages (note names, numbers) */
const q = (
  de: string,
  en: string,
  picture: TheoryPicture | undefined,
  answers: QuizStep['answers'],
): QuizStep => ({
  type: 'quiz',
  text: L(de, en),
  ...(picture ? { picture } : {}),
  answers,
});
/** shuffle the answer order a little, so the right one is not always first */
const mix = (answers: QuizStep['answers'], shift: number): QuizStep['answers'] =>
  answers.map((_, i) => answers[(i + shift) % answers.length]!);

/**
 * «Kann ich schon»: the first lesson of a chapter offers a short check. Who
 * answers every question right at the first try skips the whole chapter – its
 * lessons count as passed, like the placement at the start (1 star, no XP).
 * Mostly for grown-ups who already know a bit; «Erste Lieder» has none.
 */
export const CHAPTER_CHECKS: Record<string, QuizStep[]> = {
  keys: [
    q(
      'Wie heisst diese Taste?',
      'What is this key called?',
      { kind: 'keyboard', ...C3_C5, labels: 'none', marks: [60] },
      mix(ans('C', 'D', 'F'), 1),
    ),
    q(
      'Und diese?',
      'And this one?',
      { kind: 'keyboard', ...C3_C5, labels: 'none', marks: [65] },
      mix(ans('F', 'G', 'E'), 2),
    ),
    q(
      'Welche Nummer hat dieser Finger?',
      'Which number is this finger?',
      { kind: 'hand', highlight: 3, numbers: false },
      mix(ans('3', '2', '4'), 1),
    ),
    {
      type: 'quiz',
      text: L('Welche Note dauert länger?', 'Which note lasts longer?'),
      picture: { kind: 'note-values', values: ['h', 'q'] },
      answers: [
        { text: L('Die Viertel', 'The quarter note') },
        { text: L('Die Halbe', 'The half note'), correct: true },
        { text: L('Beide gleich lang', 'Both the same') },
      ],
    },
  ],
  hand: [
    q(
      'Wie heisst diese Taste?',
      'What is this key called?',
      { kind: 'keyboard', ...C3_C5, labels: 'none', marks: [69] },
      mix(ans('A', 'G', 'H'), 2),
    ),
    q('Und diese?', 'And this one?', { kind: 'keyboard', ...C3_C5, labels: 'none', marks: [71] }, [
      { text: L('A', 'A') },
      { text: L('H', 'B'), correct: true },
      { text: L('C', 'C') },
    ]),
    {
      type: 'quiz',
      text: L('Was heisst forte (f)?', 'What does forte (f) mean?'),
      answers: [
        { text: L('Leise', 'Soft') },
        { text: L('Laut', 'Loud'), correct: true },
        { text: L('Schnell', 'Fast') },
      ],
    },
    {
      type: 'quiz',
      text: L('Was heisst staccato?', 'What does staccato mean?'),
      answers: [
        { text: L('Kurz', 'Short'), correct: true },
        { text: L('Gebunden', 'Smooth') },
        { text: L('Laut', 'Loud') },
      ],
    },
  ],
  read: [
    {
      type: 'quiz',
      text: L('Wie heisst dieser Notenschlüssel?', 'What is this clef called?'),
      picture: { kind: 'staff', clef: 'treble', notes: [] },
      answers: [
        { text: L('G-Schlüssel', 'G clef'), correct: true },
        { text: L('F-Schlüssel', 'F clef') },
        { text: L('C-Schlüssel', 'C clef') },
      ],
    },
    q(
      'Wie heisst diese Note?',
      'What is this note called?',
      { kind: 'staff', clef: 'treble', notes: [65] },
      mix(ans('F', 'E', 'G', 'A'), 3),
    ),
    q('Und diese?', 'And this one?', { kind: 'staff', clef: 'treble', notes: [71] }, [
      { text: L('G', 'G') },
      { text: L('A', 'A') },
      { text: L('H', 'B'), correct: true },
      { text: L('C', 'C') },
    ]),
    q(
      'Und diese?',
      'And this one?',
      { kind: 'staff', clef: 'treble', notes: [60] },
      mix(ans('C', 'D', 'E', 'A'), 1),
    ),
    q(
      'Und diese, unter dem C?',
      'And this one, below C?',
      { kind: 'staff', clef: 'treble', notes: [57] },
      mix(ans('A', 'G', 'F', 'C'), 2),
    ),
  ],
  rhythm: [
    q(
      'Wie viele Schläge dauert eine Ganze?',
      'How many beats does a whole note last?',
      undefined,
      mix(ans('4', '2', '3'), 2),
    ),
    q(
      'Wie viele Schläge hat ein Takt im 3/4-Takt?',
      'How many beats does a bar in 3/4 time have?',
      undefined,
      mix(ans('3', '4', '2'), 1),
    ),
    q(
      'Wie viele Achtel dauern so lange wie eine Viertel?',
      'How many eighths last as long as one quarter?',
      undefined,
      mix(ans('2', '1', '4'), 2),
    ),
    {
      type: 'quiz',
      text: L('Wie lange dauert eine punktierte Viertel?', 'How long does a dotted quarter last?'),
      answers: [
        { text: L('Einen Schlag', 'One beat') },
        { text: L('Anderthalb Schläge', 'One and a half beats'), correct: true },
        { text: L('Zwei Schläge', 'Two beats') },
      ],
    },
  ],
  bass: [
    q(
      'Wie heisst diese Note im Bassschlüssel?',
      'What is this note called in the bass clef?',
      { kind: 'staff', clef: 'bass', notes: [48] },
      mix(ans('C', 'A', 'E'), 1),
    ),
    q(
      'Und diese?',
      'And this one?',
      { kind: 'staff', clef: 'bass', notes: [43] },
      mix(ans('G', 'H', 'E'), 2),
    ),
    q(
      'Die linke Hand liegt auf C bis G. Mit welchem Finger spielt sie das C?',
      'The left hand rests on C to G. Which finger plays C?',
      undefined,
      mix(ans('5', '1', '3'), 1),
    ),
  ],
  both: [
    {
      type: 'quiz',
      text: L(
        'Welche Hand spielt die Noten im Bassschlüssel?',
        'Which hand plays the notes in the bass clef?',
      ),
      answers: [
        { text: L('Die rechte', 'The right') },
        { text: L('Die linke', 'The left'), correct: true },
        { text: L('Beide abwechselnd', 'Both in turn') },
      ],
    },
    {
      type: 'quiz',
      text: L('Wie heisst der Abstand von C bis G?', 'What is the distance from C to G called?'),
      answers: [
        { text: L('Terz', 'Third') },
        { text: L('Quinte', 'Fifth'), correct: true },
        { text: L('Quarte', 'Fourth') },
      ],
    },
    {
      type: 'quiz',
      text: L('Und von C bis E?', 'And from C to E?'),
      answers: [
        { text: L('Terz', 'Third'), correct: true },
        { text: L('Sekunde', 'Second') },
        { text: L('Quinte', 'Fifth') },
      ],
    },
  ],
  black: [
    {
      type: 'quiz',
      text: L('Wie heisst diese schwarze Taste?', 'What is this black key called?'),
      picture: { kind: 'keyboard', ...C3_C5, labels: 'none', marks: [61] },
      answers: [
        { text: L('Dis', 'D sharp') },
        { text: L('Cis', 'C sharp'), correct: true },
        { text: L('Fis', 'F sharp') },
      ],
    },
    {
      type: 'quiz',
      text: L('Und diese?', 'And this one?'),
      picture: { kind: 'keyboard', ...C3_C5, labels: 'none', marks: [66] },
      answers: [
        { text: L('Fis', 'F sharp'), correct: true },
        { text: L('Gis', 'G sharp') },
        { text: L('Cis', 'C sharp') },
      ],
    },
    {
      type: 'quiz',
      text: L('Was macht das Kreuz ♯?', 'What does the sharp ♯ do?'),
      answers: [
        { text: L('Einen Schritt tiefer', 'One step lower') },
        { text: L('Einen Schritt höher', 'One step higher'), correct: true },
        { text: L('Doppelt so lang', 'Twice as long') },
      ],
    },
  ],
  meter: [
    {
      type: 'quiz',
      text: L('Was ist ein Auftakt?', 'What is an upbeat?'),
      answers: [
        { text: L('Töne vor der ersten «Eins»', 'Notes before the first “one”'), correct: true },
        { text: L('Ein lauter Anfang', 'A loud beginning') },
        { text: L('Eine Pause am Anfang', 'A rest at the start') },
      ],
    },
    {
      type: 'quiz',
      text: L(
        'Ein Haltebogen verbindet zwei gleiche Noten. Was tust du?',
        'A tie connects two equal notes. What do you do?',
      ),
      answers: [
        { text: L('Beide anschlagen', 'Play both') },
        {
          text: L(
            'Die erste halten, die zweite nicht anschlagen',
            'Hold the first, don’t play the second',
          ),
          correct: true,
        },
        { text: L('Beide kurz spielen', 'Play both short') },
      ],
    },
    q(
      'Wie viele Achtel hat ein Takt im 6/8-Takt?',
      'How many eighths does a bar in 6/8 time have?',
      undefined,
      mix(ans('6', '8', '3'), 1),
    ),
  ],
  keysigs: [
    {
      type: 'quiz',
      text: L('Was macht das ♭?', 'What does the flat ♭ do?'),
      answers: [
        { text: L('Einen Schritt tiefer', 'One step lower'), correct: true },
        { text: L('Einen Schritt höher', 'One step higher') },
        { text: L('Leiser spielen', 'Play softer') },
      ],
    },
    {
      type: 'quiz',
      text: L('Welche schwarze Taste gehört zu G-Dur?', 'Which black key belongs to G major?'),
      answers: [
        { text: L('B', 'B flat') },
        { text: L('Fis', 'F sharp'), correct: true },
        { text: L('Cis', 'C sharp') },
      ],
    },
    {
      type: 'quiz',
      text: L('Und zu F-Dur?', 'And to F major?'),
      answers: [
        { text: L('B', 'B flat'), correct: true },
        { text: L('Fis', 'F sharp') },
        { text: L('Es', 'E flat') },
      ],
    },
    {
      type: 'quiz',
      text: L('Was macht das Auflösungszeichen ♮?', 'What does the natural sign ♮ do?'),
      answers: [
        { text: L('Es hebt ♯ oder ♭ auf', 'It cancels ♯ or ♭'), correct: true },
        { text: L('Es verlängert die Note', 'It makes the note longer') },
        { text: L('Es heisst: Pause', 'It means: rest') },
      ],
    },
  ],
  accomp: [
    q(
      'Aus welchen Tönen besteht der C-Dur-Akkord?',
      'Which notes make the C major chord?',
      undefined,
      mix(ans('C E G', 'C D E', 'C F A'), 1),
    ),
    q(
      'Und der F-Dur-Akkord?',
      'And the F major chord?',
      undefined,
      mix(ans('F A C', 'F G A', 'F H D'), 2),
    ),
    {
      type: 'quiz',
      text: L('Und der G-Dur-Akkord?', 'And the G major chord?'),
      answers: [
        { text: L('G A H', 'G A B') },
        { text: L('G H D', 'G B D'), correct: true },
        { text: L('G C E', 'G C E') },
      ],
    },
  ],
};

/** The chapter a lesson starts, with its check – null if it starts none or has no check. */
export function chapterCheckFor(lessonId: string): { chapterId: string; steps: QuizStep[] } | null {
  const chapter = CURRICULUM.find((c) => c.lessons[0]?.id === lessonId);
  const steps = chapter ? CHAPTER_CHECKS[chapter.id] : undefined;
  return chapter && steps ? { chapterId: chapter.id, steps } : null;
}

/** The questions that let a learner skip this lesson's chapter (none: it can't be skipped). */
export function skipCheckFor(lessonId: string): QuizStep[] {
  return chapterCheckFor(lessonId)?.steps ?? [];
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
