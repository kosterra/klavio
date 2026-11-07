import type { Avatar } from '@klavio/shared';
import { Mascot, type MascotMood } from './Mascot';
import classes from './Figure.module.css';

type Animal = Exclude<Avatar, 'klavi'>;

interface Spec {
  face: string;
  ear: string;
  /** Eye centres (the frog's sit on top of its head). */
  eyes: [[number, number], [number, number]];
  /** Mouth centre; the owl has a beak instead. */
  mouth: [number, number];
}

const SPECS: Record<Animal, Spec> = {
  fox: {
    face: '#f08c00',
    ear: '#d9480f',
    eyes: [
      [38, 52],
      [62, 52],
    ],
    mouth: [50, 68],
  },
  owl: {
    face: '#a47148',
    ear: '#7f5539',
    eyes: [
      [38, 52],
      [62, 52],
    ],
    mouth: [50, 66],
  },
  cat: {
    face: '#868e96',
    ear: '#495057',
    eyes: [
      [38, 52],
      [62, 52],
    ],
    mouth: [50, 68],
  },
  bear: {
    face: '#9c6644',
    ear: '#7f4f24',
    eyes: [
      [38, 52],
      [62, 52],
    ],
    mouth: [50, 68],
  },
  frog: {
    face: '#40c057',
    ear: '#2f9e44',
    eyes: [
      [32, 30],
      [68, 30],
    ],
    mouth: [50, 64],
  },
  whale: {
    face: '#339af0',
    ear: '#1971c2',
    eyes: [
      [38, 52],
      [62, 52],
    ],
    mouth: [50, 68],
  },
};

// so that several figures on one page don't blink in sync
const BLINK_DELAY: Record<Animal, string> = {
  fox: '0s',
  owl: '1.3s',
  cat: '2.1s',
  bear: '0.7s',
  frog: '3.2s',
  whale: '1.8s',
};

const INK = '#1c2559';

function Ears({ animal, color }: { animal: Animal; color: string }) {
  switch (animal) {
    case 'fox':
    case 'cat':
      return (
        <>
          <path d="M18 40 L26 10 L44 30z" fill={color} />
          <path d="M82 40 L74 10 L56 30z" fill={color} />
        </>
      );
    case 'bear':
      return (
        <>
          <circle cx="24" cy="26" r="12" fill={color} />
          <circle cx="76" cy="26" r="12" fill={color} />
        </>
      );
    case 'owl':
      return (
        <>
          <path d="M20 30 L30 14 L40 30z" fill={color} />
          <path d="M80 30 L70 14 L60 30z" fill={color} />
        </>
      );
    default:
      return null;
  }
}

function Eyes({ spec, animal, mood }: { spec: Spec; animal: Animal; mood: MascotMood }) {
  const [[lx, ly], [rx, ry]] = spec.eyes;
  if (mood === 'cheer') {
    // happy squint: ^ ^
    return (
      <g stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round">
        <path d={`M${lx - 6} ${ly + 2} q6 -8 12 0`} />
        <path d={`M${rx - 6} ${ry + 2} q6 -8 12 0`} />
      </g>
    );
  }
  // thinking: looking up to the side
  const dx = mood === 'think' ? 2 : 0;
  const dy = mood === 'think' ? -3 : 0;
  const r = mood === 'listen' ? 5.8 : 5;
  return (
    <g className={`${classes.part} ${mood === 'think' ? '' : classes.glance}`}>
      <g
        className={`${classes.part} ${classes.blink}`}
        style={{ animationDelay: BLINK_DELAY[animal] }}
      >
        <circle cx={lx + dx} cy={ly + dy} r={r} fill={INK} />
        <circle cx={rx + dx} cy={ry + dy} r={r} fill={INK} />
        <circle cx={lx + dx + 1.6} cy={ly + dy - 1.8} r="1.4" fill="#fff" />
        <circle cx={rx + dx + 1.6} cy={ry + dy - 1.8} r="1.4" fill="#fff" />
      </g>
    </g>
  );
}

function Mouth({ animal, spec, mood }: { animal: Animal; spec: Spec; mood: MascotMood }) {
  const [x, y] = spec.mouth;
  if (animal === 'owl') {
    return mood === 'listen' || mood === 'cheer' ? (
      <>
        <path d={`M${x - 4} ${y - 4} L${x + 4} ${y - 4} L${x} ${y + 1}z`} fill="#f59f00" />
        <path d={`M${x - 3} ${y + 3} L${x + 3} ${y + 3} L${x} ${y + 7}z`} fill="#e67700" />
      </>
    ) : (
      <path d={`M${x - 4} ${y - 4} L${x + 4} ${y - 4} L${x} ${y + 4}z`} fill="#f59f00" />
    );
  }
  if (mood === 'think') {
    return (
      <path d={`M${x - 5} ${y + 1} h10`} stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
    );
  }
  if (mood === 'listen') return <ellipse cx={x} cy={y + 1} rx="3.5" ry="4.5" fill={INK} />;
  if (mood === 'cheer') {
    return <path d={`M${x - 9} ${y - 2} q9 12 18 0z`} fill={INK} />;
  }
  return (
    <path
      d={`M${x - 8} ${y} q8 8 16 0`}
      stroke={INK}
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
  );
}

const MOOD_CLASS: Record<MascotMood, string> = {
  happy: classes.idle!,
  cheer: classes.cheer!,
  think: classes.think!,
  listen: classes.listen!,
};

/**
 * A profile's figure as companion: the chosen animal (or Klavi) with a mood
 * (happy, cheer, think, listen), breathing, blinking and glancing around.
 * Own artwork; all motion respects prefers-reduced-motion.
 */
export function Figure({
  avatar,
  mood = 'happy',
  size = 120,
  label,
}: {
  avatar: Avatar;
  mood?: MascotMood;
  size?: number;
  label?: string;
}) {
  if (avatar === 'klavi') return <Mascot mood={mood} size={size} label={label} />;
  const spec = SPECS[avatar];
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} overflow="visible" {...a11y}>
      <g className={`${classes.part} ${MOOD_CLASS[mood]}`}>
        <g className={`${classes.part} ${mood === 'listen' ? classes.earsListen : ''}`}>
          <Ears animal={avatar} color={spec.ear} />
        </g>
        {avatar === 'whale' && (
          <path
            className={`${classes.part} ${mood === 'cheer' ? classes.spout : ''}`}
            d="M44 16 q6-10 12 0 M50 14 v-8"
            stroke={spec.ear}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {avatar === 'frog' && (
          <>
            <circle cx="32" cy="30" r="13" fill={spec.face} />
            <circle cx="68" cy="30" r="13" fill={spec.face} />
            <circle cx="32" cy="30" r="8.5" fill="#fff" />
            <circle cx="68" cy="30" r="8.5" fill="#fff" />
          </>
        )}
        <circle cx="50" cy="56" r="32" fill={spec.face} />
        {avatar === 'fox' && <path d="M24 60 q26 30 52 0 q-26 10-52 0z" fill="#fff" />}
        {avatar === 'owl' && (
          <>
            <circle cx="38" cy="52" r="11" fill="#fff" />
            <circle cx="62" cy="52" r="11" fill="#fff" />
          </>
        )}
        {avatar === 'bear' && <ellipse cx="50" cy="68" rx="13" ry="10" fill="#d4a373" />}
        {/* cheeks */}
        <circle cx="28" cy="66" r="5" fill="#ff8fab" opacity="0.55" />
        <circle cx="72" cy="66" r="5" fill="#ff8fab" opacity="0.55" />
        <Eyes spec={spec} animal={avatar} mood={mood} />
        <Mouth animal={avatar} spec={spec} mood={mood} />
      </g>
    </svg>
  );
}
