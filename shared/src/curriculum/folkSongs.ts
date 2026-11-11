import type { ClassicPiece } from './classics.ts';
import { parseSong } from './song.ts';

/**
 * Swiss folk songs to practise – transcribed by hand from a public-domain
 * print: Johann Rudolf Wyss (ed.), «Sammlung von Schweizer-Kühreihen und
 * Volksliedern», 4th edition, Bern: J. J. Burgdorfer 1826 (copy of the
 * Bibliothek der Musik-Akademie Basel, digitised on e-rara).
 *
 * Only the sung melody is taken (the vocal staff, not the accompaniment).
 * Where the print has sixteenths, every note value is doubled so they become
 * eighths; a few ornaments (thirty-seconds, dotted sixteenths) are smoothed
 * to plain eighths, and rests inside the song are held as the note before.
 * Each song names its number and page in the print.
 */
const WYSS_1826 = {
  by: 'J. R. Wyss, Sammlung von Schweizer-Kühreihen und Volksliedern, Bern 1826',
  url: 'https://doi.org/10.3931/e-rara-150173',
  license: 'Public Domain',
  licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
};

export const FOLK_SONGS: ClassicPiece[] = [
  {
    // No. 31 «Das Lied der Guggisberger», page 53 – A minor, the print in C
    id: 'volk-guggisberg',
    title: {
      'de-CH': 'S’Vreneli ab em Guggisberg',
      en: 'Vreneli from Guggisberg',
    },
    composer: { 'de-CH': 'Volkslied aus dem Bernbiet', en: 'Folk song from Bern' },
    keyboard: { from: 60, to: 79 },
    exercise: {
      type: 'song',
      clef: 'treble',
      time: '4/4',
      tempo: 92,
      showNames: false,
      pickup: 1,
      bars: parseSong(
        [
          'E4/q',
          // 'S isch äben e Mönsch uf Ärde, Simmeliberg
          'A4/q A4/8 G#4/8 A4/q H4/q | C5/q A4/q H4/h',
          'C5/q C5/8 A4/8 H4/h~ | H4/hd E4/q',
          // 's isch äben e Mönsch uf Ärde, Simmeliberg! Und
          'A4/q A4/8 G#4/8 A4/q H4/q | C5/q A4/q H4/h',
          'C5/q C5/8 A4/8 H4/h~ | H4/hd E5/q',
          // d's Vreneli ab em Guggisberg und d's Simes Hans-Joggeli änet dem Berg,
          'H4/q H4/8 A4/8 G#4/q A4/q | H4/q H4/8 C5/8 H4/q E5/q',
          'D5/8 C5/8 H4/8 A4/8 G#4/q A4/8 A4/8 | H4/8 A4/8 H4/8 C5/8 H4/q A4/8 H4/8',
          // 's isch äben e Mönsch uf Ärde, dass i möcht bin em sy.
          'C5/q C5/8 C5/8 D5/q D5/q | E5/h D5/q D5/q',
          'C5/q A4/q H4/q H4/8 C5/8 | A4/hd',
        ].join(' | '),
        '4/4',
        1,
      ),
    },
    source: { ...WYSS_1826, by: `${WYSS_1826.by}, Nr. 31` },
  },
  {
    // No. 30 «Schweizerisches Wiegenlied», page 52 – G major, «nicht geschwind»,
    // note values as printed
    id: 'volk-wiegenlied',
    title: {
      'de-CH': 'Es kam ein Herr zum Schlössli',
      en: 'A Lord Came to the Little Castle',
    },
    composer: { 'de-CH': 'Schweizer Wiegenlied', en: 'Swiss lullaby' },
    keyboard: { from: 60, to: 79 },
    exercise: {
      type: 'song',
      clef: 'treble',
      time: '4/4',
      tempo: 84,
      showNames: false,
      pickup: 1,
      keySignature: 'G',
      bars: parseSong(
        [
          'G4/q',
          // Es kam ein Herr zum Schlössli, uf einem schönen Rössli,
          'D5/8 E5/8 D5/8 C5/8 H4/8 C5/8 H4/8 A4/8 | G4/q H4/q D4/q G4/q',
          'D5/8 E5/8 D5/8 C5/8 H4/8 C5/8 H4/8 A4/8 | G4/q H4/q D4/q D4/q',
          // da luegt die Frau zum Fenster uus und seit, der Mann isch nit by Hus.
          'G4/q G4/q A4/q A4/q | H4/8 D5/8 C5/8 H4/8 A4/q D5/q',
          'H4/q G4/q A4/q F#4/q | G4/8 H4/8 A4/8 F#4/8 G4/q',
        ].join(' | '),
        '4/4',
        1,
      ),
    },
    source: { ...WYSS_1826, by: `${WYSS_1826.by}, Nr. 30` },
  },
];
