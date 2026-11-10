/**
 * The year's festive time, as Klavio shows it: from the first Sunday of
 * Advent something changes every day – a piece arrives, a visitor comes and
 * goes again (Samichlaus on the 6th, a reindeer peeking in, a snowman that
 * melts …) until the Christmas sleigh flies over on Christmas Eve; from 27
 * December the New Year, with fireworks on New Year's Eve and New Year's
 * Day; from 2 January everything is as usual again.
 */

/**
 * Every piece and the days of December it is there (inclusive; 0 = 30
 * November, negative = earlier in November – only once Advent has begun).
 * Read top to bottom it is the calendar: each day at least one change.
 */
export const SCHEDULE = {
  wreath: [[-4, 24]], // the Advent wreath – a candle more every Advent Sunday
  snowfall: [[-3, 26]], // light snow over the start page
  stickers: [[-2, 26]], // Christmas stickers along the path
  lights: [[-1, 26]], // fairy lights on the start page
  cap: [[0, 26]], // a Santa cap for the figure
  garland: [[1, 26]], // a fir garland under the header
  navSnow: [[2, 26]], // snow on the navigation
  snow: [[3, 26]], // snow on the landscapes
  snowman: [
    [4, 10], // … melts on the 11th
    [16, 26], // and a new one is built
  ],
  samichlaus: [[5, 6]], // Samichlaus comes on the 6th
  sack: [[6, 8]], // … and leaves his sack with mandarins and nuts
  cookies: [
    [7, 12], // a plate of Christmas biscuits
    [17, 19], // the second batch
  ],
  reindeer: [
    [8, 11], // a reindeer peeks in at the top right
    [16, 21], // and comes back
  ],
  tree: [[10, 26]], // the Christmas tree
  pathSnow: [[11, 26]], // snowfall over the whole path
  logoCap: [[12, 26]], // a cap on the logo
  bells: [[13, 26]], // bells in the navigation
  angel: [[14, 17]], // a little angel
  sled: [[15, 22]], // the sleigh waits in the snow – until it's needed
  gifts: [[19, 26]], // presents under the tree
  bethlehem: [[21, 25]], // the star of Bethlehem with its tail
  star: [[24, 26]], // the star on the tree lights up
  santa: [[24, 24]], // Christmas Eve: the sleigh flies over the sky
} as const satisfies Record<string, readonly (readonly [number, number])[]>;

export type AdventPiece = keyof typeof SCHEDULE;
export const ADVENT_PIECES = Object.keys(SCHEDULE) as AdventPiece[];

export type Season =
  | { phase: 'none' }
  | { phase: 'advent' | 'christmas'; pieces: Set<AdventPiece>; candles: number }
  | { phase: 'newyear'; fireworks: boolean; greeting: 'soon' | 'eve' | 'new'; year: number };

const DAY = 86_400_000;
const at = (y: number, m: number, d: number) => new Date(y, m, d);

/** The first Sunday of Advent: four Sundays before Christmas. */
export function firstAdvent(year: number): Date {
  const christmas = at(year, 11, 25);
  // the 4th Advent is the last Sunday before Christmas (a week before when Christmas is a Sunday)
  const fourth = 25 - (christmas.getDay() || 7);
  return at(year, 11, fourth - 21);
}

const days = (from: Date, to: Date) =>
  Math.round((at(to.getFullYear(), to.getMonth(), to.getDate()).getTime() - from.getTime()) / DAY);

/** The pieces of a day of December (0 = 30 November). */
export function piecesOn(day: number): Set<AdventPiece> {
  return new Set(
    ADVENT_PIECES.filter((p) =>
      (SCHEDULE[p] as readonly (readonly [number, number])[]).some(
        ([from, to]) => day >= from && day <= to,
      ),
    ),
  );
}

export function seasonAt(now = new Date()): Season {
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  // the New Year: 27 December to 1 January
  if (month === 11 && date >= 27) {
    return {
      phase: 'newyear',
      fireworks: date === 31,
      greeting: date === 31 ? 'eve' : 'soon',
      year: year + 1,
    };
  }
  if (month === 0 && date === 1)
    return { phase: 'newyear', fireworks: true, greeting: 'new', year };

  const start = firstAdvent(year);
  const sinceAdvent = days(start, now);
  if (month < 10 || sinceAdvent < 0) return { phase: 'none' };
  // the day of December (0 = 30 November, −1 = 29 November …)
  const day = days(at(year, 10, 30), now);
  return {
    phase: day >= 24 ? 'christmas' : 'advent',
    pieces: piecesOn(day),
    candles: Math.min(4, Math.floor(sinceAdvent / 7) + 1),
  };
}

/** Whether a Christmas piece is shown in this season. */
export function hasPiece(season: Season, piece: AdventPiece): boolean {
  return (season.phase === 'advent' || season.phase === 'christmas') && season.pieces.has(piece);
}
