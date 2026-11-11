import { Snowfall } from '../lesson/WorldScenery';
import { hasPiece, type Season } from './season';
import classes from './Season.module.css';

const INK = 'var(--klavio-comic-line)';
const line = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: 'round' as const };

/** The Advent wreath: fir, red bows, four candles – lit one more every Advent Sunday. */
function Wreath({ candles, aside }: { candles: number; aside: boolean }) {
  return (
    <svg
      className={`${classes.wreath} ${aside ? classes.wreathAside : ''}`}
      viewBox="0 0 120 80"
      aria-hidden
    >
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

/** Samichlaus on the 6th: red coat and hood, white beard, his staff. */
function Samichlaus() {
  return (
    <svg className={classes.samichlaus} viewBox="0 0 100 140" aria-hidden data-piece="samichlaus">
      <path
        d="M86 20 V136"
        stroke="var(--mantine-color-orange-9)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M86 20 Q96 8 86 2 Q76 6 82 14"
        stroke="var(--mantine-color-yellow-5)"
        strokeWidth="4"
        fill="none"
      />
      <path d="M20 136 Q18 70 50 54 Q82 70 80 136 Z" fill="var(--mantine-color-red-7)" {...line} />
      <path d="M44 56 V136 M56 56 V136" stroke="#fff" strokeWidth="5" />
      <path d="M22 60 Q50 4 78 60 Q50 46 22 60 Z" fill="var(--mantine-color-red-7)" {...line} />
      <circle cx="50" cy="56" r="16" fill="var(--mantine-color-orange-2)" {...line} />
      <path
        d="M32 58 Q30 92 50 100 Q70 92 68 58 Q60 70 50 68 Q40 70 32 58 Z"
        fill="#fff"
        {...line}
      />
      <circle cx="44" cy="52" r="2.2" fill={INK} />
      <circle cx="56" cy="52" r="2.2" fill={INK} />
      <circle cx="50" cy="59" r="3.2" fill="var(--mantine-color-red-4)" />
      <path
        d="M78 96 Q90 92 88 82"
        stroke={INK}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** What Samichlaus left: a jute sack with mandarins, nuts and gingerbread. */
function Sack() {
  return (
    <svg className={classes.sack} viewBox="0 0 90 80" aria-hidden data-piece="sack">
      <path
        d="M14 76 Q4 40 26 28 H64 Q86 40 76 76 Z"
        fill="var(--mantine-color-orange-3)"
        {...line}
      />
      <path
        d="M24 30 Q45 20 66 30"
        stroke="var(--mantine-color-red-6)"
        strokeWidth="4"
        fill="none"
      />
      <circle cx="34" cy="22" r="9" fill="var(--mantine-color-orange-5)" {...line} />
      <circle cx="54" cy="20" r="9" fill="var(--mantine-color-orange-5)" {...line} />
      <path d="M54 11 l3 -4" stroke="var(--mantine-color-green-7)" strokeWidth="3" />
      <ellipse
        cx="44"
        cy="28"
        rx="6"
        ry="5"
        fill="var(--mantine-color-orange-9)"
        {...line}
        strokeWidth={2}
      />
      <ellipse
        cx="84"
        cy="72"
        rx="6"
        ry="5"
        fill="var(--mantine-color-orange-9)"
        {...line}
        strokeWidth={2}
      />
      <circle cx="6" cy="72" r="6" fill="var(--mantine-color-orange-5)" {...line} strokeWidth={2} />
    </svg>
  );
}

/** A snowman with a carrot nose and a scarf. */
function Snowman() {
  return (
    <svg className={classes.snowman} viewBox="0 0 80 120" aria-hidden data-piece="snowman">
      <circle cx="40" cy="88" r="28" fill="#fff" {...line} />
      <circle cx="40" cy="42" r="20" fill="#fff" {...line} />
      <rect x="24" y="14" width="32" height="8" rx="2" fill={INK} />
      <rect x="29" y="0" width="22" height="18" rx="2" fill={INK} />
      <circle cx="33" cy="38" r="2.4" fill={INK} />
      <circle cx="47" cy="38" r="2.4" fill={INK} />
      <path
        d="M40 44 L56 48 L40 49 Z"
        fill="var(--mantine-color-orange-6)"
        {...line}
        strokeWidth={1.5}
      />
      <path
        d="M22 58 Q40 66 58 58 L60 64 Q40 72 20 64 Z"
        fill="var(--mantine-color-red-6)"
        {...line}
        strokeWidth={2}
      />
      <path
        d="M50 64 L54 82 L46 82 Z"
        fill="var(--mantine-color-red-6)"
        {...line}
        strokeWidth={2}
      />
      {[78, 92, 106].map((y) => (
        <circle key={y} cx="40" cy={y} r="2.6" fill={INK} />
      ))}
      <path
        d="M14 80 L-2 66 M66 80 L80 68"
        stroke="var(--mantine-color-orange-9)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A plate of Christmas biscuits: stars and hearts. */
function Cookies() {
  return (
    <svg className={classes.cookies} viewBox="0 0 90 50" aria-hidden data-piece="cookies">
      <ellipse cx="45" cy="40" rx="42" ry="9" fill="#fff" {...line} />
      <path
        d="M24 30 L27 22 L35 22 L29 17 L31 9 L24 14 L17 9 L19 17 L13 22 L21 22 Z"
        fill="var(--mantine-color-orange-4)"
        {...line}
        strokeWidth={2}
      />
      <path
        d="M52 34 Q40 24 46 18 Q52 14 56 20 Q60 14 66 18 Q72 24 60 34 Z"
        fill="var(--mantine-color-orange-7)"
        {...line}
        strokeWidth={2}
      />
      <circle
        cx="76"
        cy="32"
        r="7"
        fill="var(--mantine-color-yellow-3)"
        {...line}
        strokeWidth={2}
      />
      <circle cx="76" cy="32" r="2.5" fill="var(--mantine-color-red-6)" />
    </svg>
  );
}

/** A little angel floating in the sky. */
function Angel() {
  return (
    <svg className={classes.angel} viewBox="0 0 90 80" aria-hidden data-piece="angel">
      <path d="M38 40 Q10 20 6 44 Q20 52 38 48 Z" fill="#fff" {...line} />
      <path d="M52 40 Q80 20 84 44 Q70 52 52 48 Z" fill="#fff" {...line} />
      <path d="M45 34 L30 78 H60 Z" fill="var(--mantine-color-yellow-2)" {...line} />
      <circle cx="45" cy="26" r="11" fill="var(--mantine-color-orange-2)" {...line} />
      <path
        d="M34 22 Q45 10 56 22"
        fill="var(--mantine-color-yellow-5)"
        {...line}
        strokeWidth={2}
      />
      <ellipse
        cx="45"
        cy="8"
        rx="12"
        ry="4"
        fill="none"
        stroke="var(--mantine-color-yellow-5)"
        strokeWidth="3"
      />
      <circle cx="41" cy="27" r="1.6" fill={INK} />
      <circle cx="49" cy="27" r="1.6" fill={INK} />
    </svg>
  );
}

/** The sleigh waiting in the snow. */
function Sled() {
  return (
    <svg className={classes.sled} viewBox="0 0 120 70" aria-hidden data-piece="sled">
      <path
        d="M8 60 H100 Q116 60 114 46"
        stroke={INK}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M30 60 V50 M84 60 V50" stroke={INK} strokeWidth="4" />
      <path
        d="M14 50 Q8 20 26 18 H72 Q90 18 100 50 Z"
        fill="var(--mantine-color-red-7)"
        {...line}
      />
      <path
        d="M20 26 Q50 32 92 30"
        stroke="var(--mantine-color-yellow-5)"
        strokeWidth="4"
        fill="none"
      />
      <rect
        x="40"
        y="6"
        width="22"
        height="16"
        rx="2"
        fill="var(--mantine-color-teal-6)"
        {...line}
        strokeWidth={2}
      />
      <path d="M51 6 V22" stroke="var(--mantine-color-yellow-3)" strokeWidth="3" />
    </svg>
  );
}

/** Christmas Eve: the sleigh with its reindeer flies over the sky. */
function SantaFlight() {
  return (
    <svg className={classes.flight} viewBox="0 0 220 60" aria-hidden data-piece="santa">
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${118 + i * 46} ${i * 4})`}>
          <path
            d="M0 30 Q10 18 28 22 Q36 24 38 30 L32 34 Q16 36 0 30 Z"
            fill="var(--mantine-color-orange-8)"
            {...line}
            strokeWidth={2}
          />
          <path d="M6 32 L2 44 M28 32 L32 44" stroke={INK} strokeWidth="2.5" />
          <path
            d="M34 22 Q38 10 46 12 L44 20"
            fill="var(--mantine-color-orange-8)"
            {...line}
            strokeWidth={2}
          />
          <path
            d="M40 12 L38 2 M44 12 L48 4"
            stroke="var(--mantine-color-orange-9)"
            strokeWidth="2.5"
          />
          {i === 1 && <circle cx="47" cy="15" r="3" fill="var(--mantine-color-red-6)" />}
        </g>
      ))}
      <path d="M100 34 Q140 30 150 30" stroke={INK} strokeWidth="1.5" fill="none" />
      <path d="M10 46 H86 Q98 46 96 36" stroke={INK} strokeWidth="3" fill="none" />
      <path
        d="M16 40 Q12 18 28 16 H70 Q84 16 92 40 Z"
        fill="var(--mantine-color-red-7)"
        {...line}
        strokeWidth={2}
      />
      <circle
        cx="48"
        cy="10"
        r="8"
        fill="var(--mantine-color-orange-2)"
        {...line}
        strokeWidth={2}
      />
      <path d="M40 8 Q48 -4 58 6" fill="var(--mantine-color-red-6)" {...line} strokeWidth={2} />
      <path d="M42 14 Q48 24 54 14" fill="#fff" {...line} strokeWidth={1.5} />
      <rect
        x="62"
        y="6"
        width="14"
        height="12"
        rx="2"
        fill="var(--mantine-color-teal-6)"
        {...line}
        strokeWidth={1.5}
      />
    </svg>
  );
}

/** The star of Bethlehem with its long tail. */
function Bethlehem() {
  return (
    <svg className={classes.bethlehem} viewBox="0 0 160 60" aria-hidden data-piece="bethlehem">
      <path
        d="M118 22 Q60 30 2 56 Q64 36 120 30 Z"
        fill="var(--mantine-color-yellow-2)"
        opacity="0.85"
      />
      <path
        d="M128 4 L132 18 L146 22 L132 26 L128 40 L124 26 L110 22 L124 18 Z"
        fill="var(--mantine-color-yellow-4)"
        {...line}
        strokeWidth={2}
      />
    </svg>
  );
}

/**
 * The festive pieces on the start page's stage – whatever the day brings:
 * Advent wreath, lights, snow, the tree with presents and star, the visitors
 * of the day (Samichlaus, snowman, angel, the sleigh …); streamers and
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
      {has('bethlehem') && <Bethlehem />}
      {has('angel') && <Angel />}
      {has('santa') && <SantaFlight />}
      {/* the reindeer peeks in at the top right: the wreath makes room */}
      {has('wreath') && <Wreath candles={season.candles} aside={has('reindeer')} />}
      {has('tree') && <Tree gifts={has('gifts')} star={has('star')} />}
      {has('samichlaus') && <Samichlaus />}
      {has('snowman') && <Snowman />}
      {has('sack') && <Sack />}
      {has('sled') && <Sled />}
      {has('cookies') && <Cookies />}
    </div>
  );
}
