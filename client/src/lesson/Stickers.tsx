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
      {kind === 'tuningfork' && (
        <>
          <path
            d="M16 5 V20 a8 8 0 0 0 16 0 V5"
            stroke={fill}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="21.5" y="27" width="5" height="17" rx="2.5" fill={dark} />
          <path d="M16 8 V18" stroke={gloss} strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {kind === 'hand' && (
        <>
          {[11, 17.5, 24, 30.5].map((x, i) => (
            <rect key={x} x={x} y={[11, 6, 5, 9][i]} width="6" height="22" rx="3" fill={fill} />
          ))}
          <rect
            x="4"
            y="22"
            width="6"
            height="16"
            rx="3"
            fill={fill}
            transform="rotate(-40 7 30)"
          />
          <rect x="10" y="22" width="27" height="21" rx="10" fill={fill} />
          <path
            d="M14 26 Q22 23 31 26"
            stroke={gloss}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === 'mushroom' && (
        <>
          <rect
            x="18"
            y="22"
            width="12"
            height="20"
            rx="5"
            fill="#f4ead8"
            stroke={dark}
            strokeOpacity="0.3"
            strokeWidth="1.5"
          />
          <path d="M5 26 Q6 6 24 6 Q42 6 43 26 Z" fill={fill} />
          <circle cx="16" cy="16" r="3.5" fill="#fff" />
          <circle cx="29" cy="12" r="2.5" fill="#fff" />
          <circle cx="34" cy="20" r="3" fill="#fff" />
          <circle cx="22" cy="22" r="2" fill="#fff" />
        </>
      )}
      {kind === 'fish' && (
        <>
          <path d="M33 24 L45 14 L43 24 L45 34 Z" fill={dark} />
          <ellipse cx="21" cy="24" rx="16" ry="11" fill={fill} />
          <path d="M18 14 Q22 8 27 14" fill={dark} />
          <circle cx="12" cy="21" r="3.5" fill="#fff" />
          <circle cx="11.5" cy="21" r="1.7" fill={dark} />
          <path
            d="M16 17 Q22 14 28 17"
            stroke={gloss}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === 'boat' && (
        <>
          <rect x="22.5" y="4" width="3" height="27" rx="1.5" fill={dark} />
          <path
            d="M26 6 L41 28 L26 28 Z"
            fill="#fff"
            stroke={dark}
            strokeOpacity="0.3"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M22 10 L10 28 L22 28 Z" fill={fill} />
          <path d="M4 31 H44 L38 42 H10 Z" fill={dark} />
          <path d="M9 34 H39" stroke={gloss} strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {kind === 'duck' && (
        <>
          <path d="M40 15 L47 17.5 L40 21 Z" fill="var(--mantine-color-orange-5)" />
          <path
            d="M5 26 Q14 22 20 27 Q24 20 32 24 Q40 26 38 34 Q34 44 18 43 Q4 42 5 26 Z"
            fill="var(--mantine-color-yellow-4)"
          />
          <circle cx="33" cy="17" r="8" fill="var(--mantine-color-yellow-4)" />
          <circle cx="35" cy="15" r="1.8" fill="#333" />
          <path
            d="M12 31 Q19 36 26 31"
            stroke="var(--mantine-color-yellow-6)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === 'bell' && (
        <>
          <circle cx="24" cy="6" r="3.5" fill="none" stroke={dark} strokeWidth="2.5" />
          <path
            d="M24 9 C13 9 13 18 12 26 L8 36 H40 L36 26 C35 18 35 9 24 9 Z"
            fill="var(--mantine-color-yellow-5)"
            stroke="var(--mantine-color-yellow-7)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="39" r="4" fill={dark} />
          <path
            d="M17 15 Q16 21 16 26"
            stroke={gloss}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === 'drum' && (
        <>
          <path d="M8 18 V36 Q24 44 40 36 V18 Z" fill={fill} />
          <path
            d="M8 22 L16 37 L24 22 L32 38 L40 22"
            stroke="#fff"
            strokeOpacity="0.7"
            strokeWidth="2"
            fill="none"
            strokeLinejoin="round"
          />
          <ellipse cx="24" cy="18" rx="16" ry="6" fill="#fff" stroke={dark} strokeWidth="2" />
          <path d="M14 4 L26 15" stroke={dark} strokeWidth="3" strokeLinecap="round" />
          <path d="M36 3 L28 14" stroke={dark} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {kind === 'heart' && (
        <>
          <path
            d="M24 41 C9 31 4 22 9 14 C14 7 21 9 24 15 C27 9 34 7 39 14 C44 22 39 31 24 41 Z"
            fill="var(--mantine-color-red-5)"
            stroke="var(--mantine-color-red-7)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M13 16 Q15 12 19 13"
            stroke={gloss}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === 'tree' && (
        <>
          <rect x="21" y="36" width="6" height="8" rx="1.5" fill="#8b5a2b" />
          <path
            d="M24 4 L38 22 H31 L42 36 H6 L17 22 H10 Z"
            fill="var(--mantine-color-green-6)"
            stroke="var(--mantine-color-green-8)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="5" r="3" fill="var(--mantine-color-yellow-5)" />
          <circle cx="19" cy="19" r="2.2" fill="var(--mantine-color-red-5)" />
          <circle cx="28" cy="27" r="2.2" fill="var(--mantine-color-yellow-5)" />
          <circle cx="16" cy="32" r="2.2" fill="var(--mantine-color-blue-4)" />
          <circle cx="33" cy="33" r="2.2" fill="var(--mantine-color-red-5)" />
        </>
      )}
      {kind === 'gift' && (
        <>
          <rect x="7" y="18" width="34" height="25" rx="4" fill={fill} />
          <rect x="5" y="13" width="38" height="9" rx="3" fill={dark} />
          <rect x="21" y="13" width="6" height="30" fill="var(--mantine-color-yellow-5)" />
          <path
            d="M24 13 Q14 2 12 10 Q12 14 24 13 Q36 14 36 10 Q34 2 24 13 Z"
            fill="var(--mantine-color-yellow-5)"
            stroke="var(--mantine-color-yellow-7)"
            strokeWidth="1.5"
          />
          <rect x="10" y="24" width="8" height="3" rx="1.5" fill={gloss} />
        </>
      )}
      {kind === 'snowflake' && (
        <g stroke="var(--klavio-snowflake)" strokeWidth="3" strokeLinecap="round" fill="none">
          {[0, 60, 120].map((a) => (
            <g key={a} transform={`rotate(${a} 24 24)`}>
              <path d="M24 5 V43" />
              <path d="M18 9 L24 14 L30 9 M18 39 L24 34 L30 39" />
            </g>
          ))}
        </g>
      )}
      {kind === 'candle' && (
        <>
          <path
            d="M24 3 Q30 11 24 16 Q18 11 24 3 Z"
            fill="var(--mantine-color-yellow-5)"
            stroke="var(--mantine-color-orange-6)"
            strokeWidth="1.5"
          />
          <rect x="16" y="17" width="16" height="25" rx="3" fill="var(--mantine-color-red-6)" />
          <rect x="19" y="20" width="3" height="18" rx="1.5" fill={gloss} />
          <path
            d="M8 44 Q12 38 18 41 M40 44 Q36 38 30 41"
            stroke="var(--mantine-color-green-7)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
