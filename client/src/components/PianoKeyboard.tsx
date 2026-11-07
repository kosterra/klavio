import { useTranslation } from 'react-i18next';
import { isBlackKey, midiToName, midiToPitchName } from '@klavio/shared';
import classes from './PianoKeyboard.module.css';

export interface PianoKeyboardProps {
  /** Lowest and highest MIDI note shown (should start and end on white keys). */
  from: number;
  to: number;
  /** Keys currently sounding / pressed. */
  active?: readonly number[];
  /** Keys to point at (e.g. "play this one"). */
  hints?: readonly number[];
  /** Keys to mark as wrong. */
  wrong?: readonly number[];
  /** Show note names on the white keys (`'c'` = only on C). */
  labels?: 'all' | 'c' | 'none';
  height?: number;
  /** Small extra label per key, e.g. the computer key that plays it. */
  keyHint?: (midi: number) => string | undefined;
  /** When set, keys become buttons (on-screen keyboard input). */
  onPress?: (midi: number) => void;
  onRelease?: (midi: number) => void;
}

/**
 * Piano keyboard drawn with plain elements. Display-only by default; with
 * `onPress` it doubles as the on-screen keyboard input (same NoteEvent path).
 */
export function PianoKeyboard({
  from,
  to,
  active = [],
  hints = [],
  wrong = [],
  labels = 'c',
  height = 140,
  keyHint,
  onPress,
  onRelease,
}: PianoKeyboardProps) {
  const { i18n, t } = useTranslation();
  const lang = i18n.language.startsWith('de') ? 'de' : 'en';
  const whites: number[] = [];
  for (let m = from; m <= to; m++) if (!isBlackKey(m)) whites.push(m);
  const keyWidth = 100 / whites.length;
  const interactive = !!onPress;

  const stateClass = (m: number) =>
    [
      active.includes(m) && classes.active,
      wrong.includes(m) && classes.wrong,
      hints.includes(m) && classes.hint,
      interactive && classes.interactive,
    ]
      .filter(Boolean)
      .join(' ');

  const keyProps = (m: number) =>
    interactive
      ? {
          type: 'button' as const,
          'aria-label': midiToName(m, lang),
          onPointerDown: (e: React.PointerEvent) => {
            e.preventDefault();
            onPress?.(m);
          },
          onPointerUp: () => onRelease?.(m),
          onPointerLeave: (e: React.PointerEvent) => {
            if (e.buttons) onRelease?.(m);
          },
          onKeyDown: (e: React.KeyboardEvent) => {
            if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
              e.preventDefault();
              onPress?.(m);
            }
          },
          onKeyUp: (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') onRelease?.(m);
          },
        }
      : { 'aria-hidden': true as const, tabIndex: -1 };

  const Tag = interactive ? 'button' : 'div';
  const label = (m: number) =>
    labels === 'all' || (labels === 'c' && m % 12 === 0)
      ? labels === 'c'
        ? midiToName(m, lang)
        : midiToPitchName(m, lang)
      : null;

  const activeNames = active.map((m) => midiToName(m, lang)).join(', ');

  return (
    <div
      className={classes.keyboard}
      style={{ height }}
      role={interactive ? 'group' : 'img'}
      aria-label={
        interactive
          ? t('keyboard.label')
          : activeNames
            ? t('keyboard.showing', { notes: activeNames })
            : t('keyboard.label')
      }
    >
      {whites.map((m) => (
        <Tag key={m} className={`${classes.white} ${stateClass(m)}`} {...keyProps(m)}>
          <span className={classes.labels}>
            {keyHint?.(m) && (
              <kbd className={classes.hintKey} aria-hidden>
                {keyHint(m)}
              </kbd>
            )}
            {label(m)}
          </span>
        </Tag>
      ))}
      {whites.map((m, i) => {
        const black = m + 1;
        if (black > to || !isBlackKey(black)) return null;
        return (
          <Tag
            key={black}
            className={`${classes.black} ${stateClass(black)}`}
            style={{ left: `${(i + 1) * keyWidth - keyWidth * 0.3}%`, width: `${keyWidth * 0.6}%` }}
            {...keyProps(black)}
          >
            {keyHint?.(black) && (
              <kbd className={classes.hintKey} aria-hidden>
                {keyHint(black)}
              </kbd>
            )}
          </Tag>
        );
      })}
    </div>
  );
}
