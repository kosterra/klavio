import { useEffect, useRef } from 'react';

/** ↑ ↑ ↓ ↓ ← → ← → B A */
const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

/** Calls `onCode` when the Konami code is typed anywhere on the page. */
export function useKonami(onCode: () => void) {
  const pos = useRef(0);
  const cb = useRef(onCode);
  useEffect(() => {
    cb.current = onCode;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos.current = key === KONAMI[pos.current] ? pos.current + 1 : key === KONAMI[0] ? 1 : 0;
      if (pos.current === KONAMI.length) {
        pos.current = 0;
        cb.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

/**
 * Remembers the last notes played and reports when they end with `tune`
 * (pitch classes, so any octave counts).
 */
export function tuneMatcher(tune: number[]) {
  let recent: number[] = [];
  return (midi: number): boolean => {
    recent = [...recent, midi % 12].slice(-tune.length);
    const hit = recent.length === tune.length && recent.every((n, i) => n === tune[i]! % 12);
    if (hit) recent = [];
    return hit;
  };
}

/** Counts quick taps (resets after a pause) and reports the n-th one. */
export function tapCounter(n: number, pauseMs = 1500) {
  let count = 0;
  let last = 0;
  return (): boolean => {
    const now = Date.now();
    count = now - last > pauseMs ? 1 : count + 1;
    last = now;
    if (count >= n) {
      count = 0;
      return true;
    }
    return false;
  };
}
