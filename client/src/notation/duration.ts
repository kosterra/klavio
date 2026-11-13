/**
 * Klavio's note values on the staff: VexFlow durations ('w', 'h', 'q', '8',
 * '16', '32', 'd' dotted, 'r' rest) plus 't' for a triplet ('8t' = a third of
 * a beat). VexFlow gets the value without the 't'; the triplets are bracketed
 * in groups of three.
 */
export function vexDuration(duration: string): {
  duration: string;
  rest: boolean;
  dotted: boolean;
  triplet: boolean;
} {
  const rest = duration.endsWith('r');
  const base = rest ? duration.slice(0, -1) : duration;
  const triplet = base.endsWith('t');
  const value = triplet ? base.slice(0, -1) : base;
  return {
    duration: `${value}${rest ? 'r' : ''}`,
    rest,
    dotted: value.endsWith('d'),
    triplet,
  };
}

/** Length of an undotted value in quarter notes ('8' → 0.5). */
const PLAIN: Record<string, number> = {
  w: 4,
  h: 2,
  q: 1,
  '8': 0.5,
  '16': 0.25,
  '32': 0.125,
  '64': 0.0625,
};

/**
 * The triplets of a bar in groups (indexes into it): consecutive triplet
 * notes, closed when they fill the room of two of the first note's value –
 * three eighth triplets, or a quarter and an eighth triplet, take one beat.
 */
export function tripletGroups(durations: string[]): number[][] {
  const groups: number[][] = [];
  let current: number[] = [];
  let room = 0;
  let filled = 0;
  durations.forEach((d, i) => {
    const v = vexDuration(d);
    if (!v.triplet) {
      if (current.length) groups.push(current);
      current = [];
      return;
    }
    const plain = PLAIN[v.duration.replace(/[dr]/g, '')] ?? 0.5;
    const actual = (plain * 2) / 3;
    if (!current.length) {
      room = plain * 2;
      filled = 0;
    }
    current.push(i);
    filled += actual;
    if (filled >= room - 1e-6) {
      groups.push(current);
      current = [];
    }
  });
  if (current.length) groups.push(current);
  return groups;
}
