import type { CSSProperties } from 'react';
import classes from './LearningPath.module.css';
import type { StickerKind } from './stickerKinds';

/**
 * Small decorative "stickers" for the learning path (own artwork): filled
 * shapes in the chapter colour with a glossy highlight, like the stones.
 * Uses --chapter-color / --chapter-light / --chapter-dark from the section.
 */
export function Sticker({
  kind,
  size,
  style,
  delay = 0,
}: {
  kind: StickerKind;
  size: number;
  style: CSSProperties;
  delay?: number;
}) {
  const fill = 'var(--chapter-light)';
  const dark = 'var(--chapter-dark)';
  const gloss = 'rgb(255 255 255 / 45%)';
  return (
    <svg
      className={classes.sticker}
      style={{ ...style, animationDelay: `${delay}s` }}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden
    >
      {kind === 'notes' && (
        <>
          <path d="M17 12 L39 7 L39 13 L17 18 Z" fill={dark} />
          <rect x="15" y="13" width="4" height="22" rx="2" fill={dark} />
          <rect x="37" y="8" width="4" height="22" rx="2" fill={dark} />
          <ellipse cx="13" cy="35" rx="7" ry="5.5" transform="rotate(-20 13 35)" fill={fill} />
          <ellipse cx="35" cy="30" rx="7" ry="5.5" transform="rotate(-20 35 30)" fill={fill} />
          <ellipse cx="11" cy="33" rx="3" ry="1.6" transform="rotate(-20 11 33)" fill={gloss} />
          <ellipse cx="33" cy="28" rx="3" ry="1.6" transform="rotate(-20 33 28)" fill={gloss} />
        </>
      )}
      {kind === 'note' && (
        <>
          <rect x="25" y="6" width="4" height="28" rx="2" fill={dark} />
          <path d="M28 6 q12 4 10 16 q-3-8-10-8z" fill={dark} />
          <ellipse cx="21" cy="35" rx="9" ry="7" transform="rotate(-20 21 35)" fill={fill} />
          <ellipse cx="18" cy="32" rx="4" ry="2" transform="rotate(-20 18 32)" fill={gloss} />
        </>
      )}
      {kind === 'piano' && (
        <>
          <rect x="4" y="10" width="40" height="30" rx="7" fill={fill} />
          <rect x="4" y="34" width="40" height="6" rx="3" fill={dark} opacity="0.5" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={8 + i * 8.5} y="17" width="7" height="17" rx="2" fill="#fff" />
          ))}
          {[0, 1, 2].map((i) => (
            <rect key={i} x={13 + i * 8.5} y="17" width="4" height="10" rx="1.5" fill={dark} />
          ))}
          <rect x="9" y="12" width="30" height="3" rx="1.5" fill={gloss} />
        </>
      )}
      {kind === 'star' && (
        <>
          <path
            d="M24 4 L29.5 17 L43 18 L32.5 27 L36 41 L24 33.5 L12 41 L15.5 27 L5 18 L18.5 17 Z"
            fill="var(--mantine-color-yellow-5)"
            stroke="var(--mantine-color-yellow-7)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M19 19 L24 11 L27 18"
            stroke={gloss}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === 'metronome' && (
        <>
          <path d="M17 6 L31 6 L40 42 L8 42 Z" fill={fill} strokeLinejoin="round" />
          <rect x="8" y="36" width="32" height="6" rx="2" fill={dark} opacity="0.5" />
          <rect
            x="23"
            y="12"
            width="3"
            height="24"
            rx="1.5"
            fill={dark}
            transform="rotate(18 24 34)"
          />
          <circle cx="29" cy="18" r="3.5" fill="#fff" />
          <path d="M19 9 L27 9" stroke={gloss} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {kind === 'sparkle' && (
        <>
          <path d="M24 4 Q27 21 44 24 Q27 27 24 44 Q21 27 4 24 Q21 21 24 4 Z" fill={fill} />
          <path
            d="M38 6 Q39 11 44 12 Q39 13 38 18 Q37 13 32 12 Q37 11 38 6 Z"
            fill="var(--mantine-color-yellow-5)"
          />
        </>
      )}
    </svg>
  );
}
