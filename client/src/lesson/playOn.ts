/**
 * Where the learner plays on this device: on the real piano (microphone or
 * digital piano) or on the screen keys. The lesson start offers this one
 * first; the start-up questions and «Mein Profil» set it, and so does the
 * choice at a lesson start. Kept per profile (a family shares one tablet:
 * one child at the piano, the other on the screen).
 */
export const PLAY_ON_KEY = 'klavio-play-on';
export type PlayOn = 'piano' | 'screen';

const keyFor = (profileId?: string | null) =>
  profileId ? `${PLAY_ON_KEY}:${profileId}` : PLAY_ON_KEY;

export function readPlayOn(profileId?: string | null): PlayOn {
  try {
    // the profile's own choice; before it had one, the device's
    const v = localStorage.getItem(keyFor(profileId)) ?? localStorage.getItem(PLAY_ON_KEY);
    return v === 'screen' ? 'screen' : 'piano';
  } catch {
    return 'piano';
  }
}

export function writePlayOn(value: PlayOn, profileId?: string | null): void {
  try {
    localStorage.setItem(keyFor(profileId), value);
  } catch {
    // not remembered – fine
  }
}
