import { useState } from 'react';

/**
 * «Klavi spielt mit»: on or off, remembered on this device. Without a choice
 * it is on for the screen keys and a digital piano – with the microphone off,
 * because the microphone would hear Klavi too (headphones help).
 */
const KEY = 'klavio-duet';

function read(): boolean | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'on' ? true : v === 'off' ? false : null;
  } catch {
    return null;
  }
}

export function useDuet(inputMode: string): [boolean, (on: boolean) => void] {
  const [stored, setStored] = useState(read);
  const set = (on: boolean) => {
    setStored(on);
    try {
      localStorage.setItem(KEY, on ? 'on' : 'off');
    } catch {
      // not remembered – fine
    }
  };
  return [stored ?? inputMode !== 'microphone', set];
}
