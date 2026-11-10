/**
 * The year's festive time, as Klavio shows it: from the first Sunday of
 * Advent one more Christmas piece every day until everything is there on
 * Christmas Eve; from 27 December the New Year, with fireworks on New Year's
 * Eve and New Year's Day; from 2 January everything is as usual again.
 */

/** The Christmas pieces in the order they arrive. */
export const ADVENT_PIECES = [
  'wreath', // the Advent wreath – a candle more every Advent Sunday
  'snowfall', // light snow over the start page
  'stickers', // Christmas stickers along the path
  'cap', // a Santa cap for the figure
  'lights', // fairy lights
  'snow', // snow on the landscapes
  'tree', // a Christmas tree
  'pathSnow', // snowfall over the whole path
  'gifts', // presents under the tree
  'star', // the star on the tree lights up
] as const;
export type AdventPiece = (typeof ADVENT_PIECES)[number];

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
  const d = days(start, now);
  if (month < 10 || d < 0) return { phase: 'none' };
  // one more piece every day, all of them on Christmas Eve
  const span = days(start, at(year, 11, 24));
  const shown = Math.min(ADVENT_PIECES.length, Math.floor((d * ADVENT_PIECES.length) / span) + 1);
  const candles = Math.min(4, Math.floor(d / 7) + 1);
  return {
    phase: d >= span ? 'christmas' : 'advent',
    pieces: new Set(ADVENT_PIECES.slice(0, shown)),
    candles,
  };
}

/** Whether a Christmas piece is shown in this season. */
export function hasPiece(season: Season, piece: AdventPiece): boolean {
  return (season.phase === 'advent' || season.phase === 'christmas') && season.pieces.has(piece);
}
