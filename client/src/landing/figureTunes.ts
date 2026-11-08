import type { Avatar } from '@klavio/shared';

/** Every figure's little signature tune (MIDI, eighth notes) – for the profile easter egg. */
export const FIGURE_TUNES: Record<Avatar, number[]> = {
  klavi: [60, 64, 67, 72, 67, 72], // a bright C major arpeggio
  owl: [67, 64, 67, 64, 60], // "hoo-hoo"
  fox: [69, 72, 76, 74, 72, 69], // quick and sly
  cat: [76, 74, 72, 74, 76, 76], // "miau"
  bear: [48, 55, 48, 55, 60], // low and cosy
  frog: [60, 60, 67, 67, 72], // hop, hop, jump
  whale: [48, 52, 55, 52, 48], // a deep, slow wave
};
