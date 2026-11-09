import type { Localized } from './types.ts';

const L = (de: string, en: string): Localized => ({ 'de-CH': de, en });

/**
 * One sentence from Klavi in the first exercise of a lesson that brings
 * something new – right where it is needed, above the notes and keys, for
 * the whole first exercise.
 */
export const LESSON_COACH: Record<string, Localized> = {
  'keys-c': L(
    'Das C liegt immer direkt links neben den zwei schwarzen Tasten. Such zuerst die zwei schwarzen Tasten.',
    'C is always just left of the two black keys. Look for the two black keys first.',
  ),
  'keys-middle-c': L(
    'Das mittlere C liegt ungefähr in der Mitte des Klaviers – meist genau vor dem Namen auf dem Klavier.',
    'Middle C is roughly in the middle of the piano – usually right in front of the name on the piano.',
  ),
  'keys-cde': L(
    'Rechter Daumen aufs mittlere C, Zeigefinger aufs D, Mittelfinger aufs E. Die Zahl über der Taste sagt dir den Finger.',
    'Right thumb on middle C, index finger on D, middle finger on E. The number above the key tells you the finger.',
  ),
  'read-c-d-e': L(
    'Das C hat eine kleine Hilfslinie mitten durch den Notenkopf. Spiel es mit dem Daumen.',
    'C has a little extra line right through the note head. Play it with your thumb.',
  ),
  'hand-entchen': L(
    'Deine rechte Hand bleibt liegen: Daumen auf C, jeder Finger auf seiner Taste. So musst du nie suchen.',
    'Your right hand stays put: thumb on C, every finger on its own key. That way you never have to search.',
  ),
  'rhythm-quarters': L(
    'Eine Viertel dauert genau einen Schlag. Spiel immer zusammen mit dem Klick.',
    'A quarter note lasts exactly one beat. Always play together with the click.',
  ),
  'bass-hand': L(
    'Jetzt die linke Hand: kleiner Finger auf das tiefe C, Daumen auf das G. Auch links ist der Daumen Finger 1.',
    'Now the left hand: little finger on the low C, thumb on G. On the left too, the thumb is finger 1.',
  ),
  'bass-clef': L(
    'Der Bassschlüssel hat zwei Punkte. Die Linie zwischen den Punkten ist das F.',
    'The bass clef has two dots. The line between the dots is F.',
  ),
  'both-turns': L(
    'Immer abwechselnd: zuerst die eine Hand, dann die andere. Lass beide Hände auf ihren Tasten liegen.',
    'Always taking turns: first one hand, then the other. Keep both hands on their keys.',
  ),
  'black-keys': L(
    'Die schwarzen Tasten kommen in Gruppen von zwei und drei. Such zuerst die richtige Gruppe.',
    'The black keys come in groups of two and three. Find the right group first.',
  ),
  'black-sharps': L(
    'Das ♯ vor der Note heisst: eine Taste höher – meist die schwarze Taste rechts daneben.',
    'The ♯ before the note means: one key higher – usually the black key just to the right.',
  ),
  'meter-eighths': L(
    'Zwei Achtel passen in einen Schlag. Zähl leise mit: «eins und zwei und».',
    'Two eighth notes fit into one beat. Count quietly: «one and two and».',
  ),
  'meter-ties': L(
    'Ein Haltebogen verbindet zwei gleiche Noten: Spiel nur die erste und halte sie weiter.',
    'A tie joins two equal notes: play only the first one and keep holding it.',
  ),
  'keysig-g-scale': L(
    'In G-Dur ist jedes F ein Fis. Nach dem H geht der Daumen unter der Hand durch zum C.',
    'In G major every F is an F sharp. After B, your thumb passes under your hand to C.',
  ),
  'accomp-chords': L(
    'Ein Akkord sind drei Töne zusammen. Finger 1, 3 und 5 drücken gleichzeitig – wie ein Stempel.',
    'A chord is three notes together. Fingers 1, 3 and 5 press at the same time – like a stamp.',
  ),
  'expr-pedal': L(
    'Das Fortepedal ist das rechte Pedal. Drück es mit dem rechten Fuss, die Ferse bleibt am Boden.',
    'The sustain pedal is the right-hand pedal. Press it with your right foot; your heel stays on the floor.',
  ),
};
