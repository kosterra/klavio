/**
 * Where the learner plays on this device: on the real piano (microphone or
 * digital piano) or on the screen keys. The lesson start offers this one
 * first; the start-up questions set it.
 */
export const PLAY_ON_KEY = 'klavio-play-on';
export type PlayOn = 'piano' | 'screen';

export function readPlayOn(): PlayOn {
  try {
    return localStorage.getItem(PLAY_ON_KEY) === 'screen' ? 'screen' : 'piano';
  } catch {
    return 'piano';
  }
}

export function writePlayOn(value: PlayOn): void {
  try {
    localStorage.setItem(PLAY_ON_KEY, value);
  } catch {
    // not remembered – fine
  }
}
