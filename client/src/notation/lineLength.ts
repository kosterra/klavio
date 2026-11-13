/**
 * How many bars fit on one line: `base` for ordinary bars, fewer when a bar is
 * crowded (sixteenths, runs) – about six notes per bar's room, at least one bar.
 */
export function fitBarsPerLine(base: number, notesPerBar: number[]): number {
  const densest = Math.max(1, ...notesPerBar);
  return Math.max(1, Math.min(base, Math.floor((base * 6) / densest)));
}
