import { firstAdvent } from './season';

/**
 * Admins can try the festive time out on their own device: a day stored here
 * replaces today for the season decoration only (nothing else, no one else).
 */
export const SEASON_PREVIEW_KEY = 'klavio-season-preview';

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function readSeasonPreview(): string | null {
  try {
    const v = localStorage.getItem(SEASON_PREVIEW_KEY);
    return v && ISO.test(v) ? v : null;
  } catch {
    return null;
  }
}

export function writeSeasonPreview(iso: string | null): void {
  try {
    if (iso && ISO.test(iso)) localStorage.setItem(SEASON_PREVIEW_KEY, iso);
    else localStorage.removeItem(SEASON_PREVIEW_KEY);
  } catch {
    // not kept – fine
  }
}

/** A local date from yyyy-mm-dd (midday, so no time zone moves it to another day). */
export function previewDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, m! - 1, d!, 12);
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export type PreviewPreset =
  | 'advent1'
  | 'advent2'
  | 'advent3'
  | 'advent4'
  | 'christmasEve'
  | 'between'
  | 'newYearsEve'
  | 'newYear';

/** The days worth looking at in this year's festive time. */
export function previewPresets(today = new Date()): { id: PreviewPreset; iso: string }[] {
  // on New Year's Day the season just past; else this year's
  const year = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
  const first = firstAdvent(year);
  const plus = (n: number) =>
    iso(new Date(first.getFullYear(), first.getMonth(), first.getDate() + n));
  return [
    { id: 'advent1', iso: plus(0) },
    { id: 'advent2', iso: plus(7) },
    { id: 'advent3', iso: plus(14) },
    { id: 'advent4', iso: plus(21) },
    { id: 'christmasEve', iso: `${year}-12-24` },
    { id: 'between', iso: `${year}-12-28` },
    { id: 'newYearsEve', iso: `${year}-12-31` },
    { id: 'newYear', iso: `${year + 1}-01-01` },
  ];
}
