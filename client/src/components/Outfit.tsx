import type { Outfit as OutfitId } from '@klavio/shared';

/** Where a figure's head is, in its own SVG coordinates. */
export interface Head {
  cx: number;
  top: number;
  r: number;
  eyesY: number;
  eyeGap: number;
  chin: number;
}

const INK = 'var(--klavio-comic-line)';
const line = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: 'round' as const };

/**
 * The wardrobe's pieces, drawn onto any figure (own artwork, comic style).
 * Sized by the head's radius, so they fit Klavi and every animal.
 */
export function Outfit({ id, head }: { id: OutfitId; head: Head }) {
  const s = head.r / 32;
  const at = (x: number, y: number) => `translate(${x} ${y}) scale(${s})`;
  switch (id) {
    case 'cap':
      return (
        <g transform={at(head.cx, head.top + 6 * s)}>
          <path d="M-27 4 Q0 -10 27 4 L6 -36 Z" fill="var(--mantine-color-red-6)" {...line} />
          <path d="M-29 4 Q0 -6 29 4 Q0 12 -29 4 Z" fill="#fff" {...line} />
          <circle cx="6" cy="-38" r="6" fill="#fff" {...line} />
        </g>
      );
    case 'crown':
      return (
        <g transform={at(head.cx, head.top + 4 * s)}>
          <path
            d="M-20 4 L-24 -18 L-11 -7 L0 -24 L11 -7 L24 -18 L20 4 Z"
            fill="var(--mantine-color-yellow-5)"
            {...line}
          />
          <circle cx="0" cy="-4" r="3.5" fill="var(--mantine-color-red-6)" />
          <circle cx="-12" cy="-1" r="2.5" fill="var(--mantine-color-cyan-5)" />
          <circle cx="12" cy="-1" r="2.5" fill="var(--mantine-color-cyan-5)" />
        </g>
      );
    case 'bow':
      return (
        <g transform={at(head.cx + 16 * s, head.top + 6 * s)}>
          <path d="M0 0 L-16 -10 L-16 10 Z" fill="var(--mantine-color-pink-5)" {...line} />
          <path d="M0 0 L16 -10 L16 10 Z" fill="var(--mantine-color-pink-5)" {...line} />
          <circle r="5" fill="var(--mantine-color-pink-7)" {...line} />
        </g>
      );
    case 'glasses':
      return (
        <g transform={at(head.cx, head.eyesY)} fill="rgb(255 255 255 / 25%)">
          <circle cx={-head.eyeGap / s} cy="0" r="10" {...line} strokeWidth={3} />
          <circle cx={head.eyeGap / s} cy="0" r="10" {...line} strokeWidth={3} />
          <path
            d={`M${-head.eyeGap / s + 10} -2 Q0 -6 ${head.eyeGap / s - 10} -2`}
            {...line}
            fill="none"
          />
        </g>
      );
    case 'headphones':
      return (
        <g transform={at(head.cx, head.eyesY)}>
          <path d="M-32 0 Q-32 -38 0 -38 Q32 -38 32 0" fill="none" stroke={INK} strokeWidth={5} />
          <rect
            x="-38"
            y="-8"
            width="12"
            height="20"
            rx="5"
            fill="var(--mantine-color-violet-6)"
            {...line}
          />
          <rect
            x="26"
            y="-8"
            width="12"
            height="20"
            rx="5"
            fill="var(--mantine-color-violet-6)"
            {...line}
          />
        </g>
      );
    case 'scarf':
      return (
        <g transform={at(head.cx, head.chin)}>
          <path
            d="M-24 -6 Q0 6 24 -6 L24 2 Q0 14 -24 2 Z"
            fill="var(--mantine-color-teal-6)"
            {...line}
          />
          <path d="M10 4 L16 22 L6 22 L4 6 Z" fill="var(--mantine-color-teal-6)" {...line} />
        </g>
      );
  }
}
