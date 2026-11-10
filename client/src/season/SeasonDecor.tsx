import { Snowfall } from '../lesson/WorldScenery';
import { hasPiece, type Season } from './season';
import classes from './Season.module.css';

const INK = 'var(--klavio-comic-line)';
const line = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: 'round' as const };

/** The Advent wreath: fir, red bows, four candles – lit one more every Advent Sunday. */
function Wreath({ candles }: { candles: number }) {
  return (
    <svg className={classes.wreath} viewBox="0 0 120 80" aria-hidden>
      <ellipse cx="60" cy="62" rx="52" ry="14" fill="var(--mantine-color-green-8)" {...line} />
      {[-40, -20, 0, 20, 40].map((x) => (
        <ellipse
          key={x}
          cx={60 + x}
          cy={60 + Math.abs(x) / 10}
          rx="14"
          ry="7"
          fill="var(--mantine-color-green-6)"
        />
      ))}
      {[-34, 34].map((x) => (
        <circle key={x} cx={60 + x} cy="66" r="5" fill="var(--mantine-color-red-6)" {...line} />
      ))}
      {[-33, -11, 11, 33].map((x, i) => (
        <g key={x} transform={`translate(${60 + x} 0)`}>
          <rect
            x="-6"
            y="28"
            width="12"
            height="30"
            rx="2"
            fill="var(--mantine-color-grape-6)"
            {...line}
          />
          <path d="M0 28 v-4" stroke={INK} strokeWidth="2" />
          {i < candles && (
            <path
              className={classes.flame}
              d="M0 24 Q-6 16 0 6 Q6 16 0 24 Z"
              fill="var(--mantine-color-yellow-4)"
              stroke="var(--mantine-color-orange-6)"
              strokeWidth="1.5"
            />
          )}
        </g>
      ))}
    </svg>
  );
}

/** Fairy lights hanging along the top edge. */
function Lights() {
  const bulbs = 14;
  const colors = ['red', 'yellow', 'teal', 'grape', 'orange'];
  return (
    <svg className={classes.lights} viewBox="0 0 700 40" preserveAspectRatio="none" aria-hidden>
      <path
        d={`M0 6 ${Array.from({ length: bulbs }, (_, i) => `Q${(i + 0.5) * 50} 28 ${(i + 1) * 50} 6`).join(' ')}`}
        fill="none"
        stroke={INK}
        strokeWidth="2"
      />
      {Array.from({ length: bulbs }, (_, i) => (
        <ellipse
          key={i}
          className={classes.bulb}
          style={{ animationDelay: `${(i % 3) * 0.5}s` }}
          cx={(i + 0.5) * 50}
          cy="22"
          rx="5"
          ry="7"
          fill={`var(--mantine-color-${colors[i % colors.length]}-5)`}
          stroke={INK}
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

/** The Christmas tree – with presents underneath and the star on top as they arrive. */
function Tree({ gifts, star }: { gifts: boolean; star: boolean }) {
  return (
    <svg className={classes.tree} viewBox="0 0 120 130" aria-hidden>
      <rect x="54" y="104" width="12" height="16" fill="var(--mantine-color-orange-9)" {...line} />
      <path
        d="M60 18 L94 62 H78 L104 96 H84 L110 110 H10 L36 96 H16 L42 62 H26 Z"
        fill="var(--mantine-color-green-7)"
        {...line}
      />
      {[
        [48, 56, 'red'],
        [70, 78, 'yellow'],
        [44, 92, 'teal'],
        [80, 100, 'red'],
        [60, 70, 'grape'],
      ].map(([x, y, c]) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r="4.5"
          fill={`var(--mantine-color-${c}-5)`}
          stroke={INK}
          strokeWidth="1.5"
        />
      ))}
      {star && (
        <path
          className={classes.star}
          d="M60 2 L64 13 L76 13 L66 20 L70 32 L60 25 L50 32 L54 20 L44 13 L56 13 Z"
          fill="var(--mantine-color-yellow-4)"
          {...line}
        />
      )}
      {gifts && (
        <>
          <rect
            x="2"
            y="106"
            width="26"
            height="20"
            rx="2"
            fill="var(--mantine-color-red-6)"
            {...line}
          />
          <path d="M15 106 v20 M2 116 h26" stroke="var(--mantine-color-yellow-4)" strokeWidth="4" />
          <rect
            x="88"
            y="100"
            width="28"
            height="26"
            rx="2"
            fill="var(--mantine-color-blue-6)"
            {...line}
          />
          <path d="M102 100 v26 M88 113 h28" stroke="#fff" strokeWidth="4" />
        </>
      )}
    </svg>
  );
}

/** Paper streamers for the days before New Year's Eve. */
function Streamers() {
  const colors = ['grape', 'yellow', 'teal', 'orange', 'pink', 'blue'];
  return (
    <div className={classes.streamers} aria-hidden>
      {colors.map((c, i) => (
        <svg key={c} viewBox="0 0 20 90" style={{ left: `${6 + i * 16}%` }}>
          <path
            d="M10 0 q8 10 0 20 q-8 10 0 20 q8 10 0 20 q-8 10 0 20"
            fill="none"
            stroke={`var(--mantine-color-${c}-5)`}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      ))}
    </div>
  );
}

/** Fireworks over the start page on New Year's Eve and New Year's Day. */
function Fireworks() {
  const bursts = [
    { x: 18, y: 30, c: 'yellow', d: 0 },
    { x: 52, y: 18, c: 'pink', d: 0.8 },
    { x: 80, y: 34, c: 'teal', d: 1.5 },
    { x: 36, y: 46, c: 'orange', d: 2.1 },
    { x: 68, y: 52, c: 'grape', d: 2.8 },
  ];
  return (
    <div className={classes.fireworks} aria-hidden>
      {bursts.map((b) => (
        <svg
          key={`${b.x}-${b.y}`}
          viewBox="-50 -50 100 100"
          className={classes.burst}
          style={{ left: `${b.x}%`, top: `${b.y}%`, animationDelay: `${b.d}s` }}
        >
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6;
            return (
              <line
                key={i}
                x1={Math.cos(a) * 12}
                y1={Math.sin(a) * 12}
                x2={Math.cos(a) * 44}
                y2={Math.sin(a) * 44}
                stroke={`var(--mantine-color-${b.c}-4)`}
                strokeWidth="5"
                strokeLinecap="round"
              />
            );
          })}
          <circle r="6" fill={`var(--mantine-color-${b.c}-2)`} />
        </svg>
      ))}
    </div>
  );
}

/**
 * The festive pieces on the start page's stage – whatever the day brings:
 * Advent wreath, lights, snow, the tree with presents and star; streamers and
 * fireworks at New Year. Decoration only.
 */
export function SeasonDecor({ season }: { season: Season }) {
  if (season.phase === 'none') return null;
  if (season.phase === 'newyear') {
    return (
      <div className={classes.decor} data-testid="season-decor" data-season="newyear">
        {season.fireworks ? (
          <>
            <div className={classes.night} />
            <Fireworks />
          </>
        ) : (
          <Streamers />
        )}
      </div>
    );
  }
  const has = (p: Parameters<typeof hasPiece>[1]) => hasPiece(season, p);
  return (
    <div className={classes.decor} data-testid="season-decor" data-season={season.phase}>
      {has('snowfall') && <Snowfall height={320} />}
      {has('lights') && <Lights />}
      {has('wreath') && <Wreath candles={season.candles} />}
      {has('tree') && <Tree gifts={has('gifts')} star={has('star')} />}
    </div>
  );
}
