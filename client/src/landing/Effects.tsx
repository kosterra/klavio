import { Sticker } from '../lesson/Stickers';
import type { StickerKind } from '../lesson/stickerKinds';
import classes from './Landing.module.css';

const RAIN: StickerKind[] = ['note', 'star', 'notes', 'sparkle', 'heart', 'star'];

/** Notes and stars raining down for a few seconds (decorative). */
export function NoteRain({ run }: { run: number }) {
  if (!run) return null;
  return (
    <div className={classes.rain} key={run} aria-hidden>
      {Array.from({ length: 36 }, (_, i) => {
        const size = 26 + ((i * 7) % 22);
        return (
          <span
            key={i}
            className={classes.drop}
            style={{
              left: `${(i * 61.8) % 100}%`,
              animationDelay: `${((i * 0.37) % 1.6).toFixed(2)}s`,
              animationDuration: `${2.4 + ((i * 0.53) % 1.4)}s`,
              // colours like the worlds
              ...({
                '--chapter-light': `var(--mantine-color-${['indigo', 'teal', 'grape', 'orange', 'cyan'][i % 5]}-5)`,
                '--chapter-dark': `var(--mantine-color-${['indigo', 'teal', 'grape', 'orange', 'cyan'][i % 5]}-8)`,
              } as React.CSSProperties),
            }}
          >
            <Sticker kind={RAIN[i % RAIN.length]!} size={size} style={{ position: 'static' }} />
          </span>
        );
      })}
    </div>
  );
}

/** A little row of ducks waddling across the bottom of the screen. */
export function DuckParade({ run }: { run: number }) {
  if (!run) return null;
  return (
    <div className={classes.parade} key={run} aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={classes.duck} style={{ animationDelay: `${i * 0.35}s` }}>
          <Sticker kind="duck" size={i === 0 ? 64 : 44} style={{ position: 'static' }} />
        </span>
      ))}
    </div>
  );
}
