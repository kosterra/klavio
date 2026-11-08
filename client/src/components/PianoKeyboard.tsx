import { useEffect, useRef } from 'react';
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
  /** Keys to mark as wrong / correct (short feedback flashes). */
  wrong?: readonly number[];
  correct?: readonly number[];
  /** Show note names on the white keys (`'c'` = only on C). */
  labels?: 'all' | 'c' | 'none';
  height?: number;
  /** Finger numbers to show on keys (usually the marked one): {midi: finger}. */
  fingers?: Partial<Record<number, number>>;
  /** Small extra label per key, e.g. the computer key that plays it. */
  keyHint?: (midi: number) => string | undefined;
  /**
   * When set, keys become buttons (on-screen keyboard input). `time` is when
   * the key was touched (performance.now()), which can be a moment before the
   * call for touch input.
   */
  onPress?: (midi: number, time: number) => void;
  onRelease?: (midi: number) => void;
}

/**
 * A playable key is at least this wide: on phones the keyboard gets wider than
 * the screen and scrolls sideways (swipe; a tap plays), following the hints.
 */
const MIN_WHITE_PX = 36;

/** A touch only becomes a note when the finger stays put … */
const TAP_SLOP_PX = 10;
/** … until it lifts, or for this long (then it is held, e.g. a long note). */
const TOUCH_HOLD_MS = 90;

interface PendingTouch {
  pointerId: number;
  midi: number;
  x: number;
  y: number;
  time: number;
  timer: ReturnType<typeof setTimeout>;
  sounding: boolean;
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
  correct = [],
  labels = 'c',
  height = 140,
  keyHint,
  fingers,
  onPress,
  onRelease,
}: PianoKeyboardProps) {
  const { i18n, t } = useTranslation();
  const lang = i18n.language.startsWith('de') ? 'de' : 'en';
  const whites: number[] = [];
  for (let m = from; m <= to; m++) if (!isBlackKey(m)) whites.push(m);
  const keyWidth = 100 / whites.length;
  const interactive = !!onPress;
  const scroller = useRef<HTMLDivElement>(null);

  // Keep what matters in view when the keyboard is wider than the screen: the
  // hinted keys, else middle C, else the middle of the range.
  const focusKey = hints.length
    ? [...hints].sort((a, b) => a - b)[Math.floor((hints.length - 1) / 2)]!
    : from <= 60 && 60 <= to
      ? 60
      : Math.round((from + to) / 2);
  const firstFocus = useRef(true);
  useEffect(() => {
    const el = scroller.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const index = whites.findIndex((w) => w >= focusKey);
    const keyPx = el.scrollWidth / whites.length;
    const left = (Math.max(0, index) + 0.5) * keyPx - el.clientWidth / 2;
    // only move when the key is not comfortably visible (no jumping around)
    const x = (Math.max(0, index) + 0.5) * keyPx - el.scrollLeft;
    if (!firstFocus.current && x > keyPx && x < el.clientWidth - keyPx) return;
    el.scrollTo({ left, behavior: firstFocus.current ? 'auto' : 'smooth' });
    firstFocus.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, from, to]);

  // Touch: the page must stay scrollable over the keys (phones!). A touch that
  // starts moving is a scroll, not a key press – so a touch plays only once
  // the finger lifts or rests for a moment, with the time it touched down.
  // Mouse and pen play right away.
  const touches = useRef(new Map<number, PendingTouch>());
  const handlers = useRef({ onPress, onRelease });
  useEffect(() => {
    handlers.current = { onPress, onRelease };
  });
  useEffect(() => {
    const map = touches.current;
    return () => {
      for (const t of map.values()) clearTimeout(t.timer);
      map.clear();
    };
  }, []);
  const sound = (t: PendingTouch) => {
    if (t.sounding) return;
    t.sounding = true;
    clearTimeout(t.timer);
    handlers.current.onPress?.(t.midi, t.time);
  };
  const endTouch = (pointerId: number, played: boolean) => {
    const t = touches.current.get(pointerId);
    if (!t) return;
    touches.current.delete(pointerId);
    clearTimeout(t.timer);
    if (played) sound(t);
    if (t.sounding) handlers.current.onRelease?.(t.midi);
  };

  const stateClass = (m: number) =>
    [
      active.includes(m) && classes.active,
      correct.includes(m) && classes.correct,
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
            if (e.pointerType === 'touch') {
              const t: PendingTouch = {
                pointerId: e.pointerId,
                midi: m,
                x: e.clientX,
                y: e.clientY,
                time: performance.now(),
                sounding: false,
                timer: setTimeout(() => sound(t), TOUCH_HOLD_MS),
              };
              touches.current.set(e.pointerId, t);
              return; // no preventDefault: the browser may still start a scroll
            }
            e.preventDefault();
            onPress?.(m, performance.now());
          },
          onPointerMove: (e: React.PointerEvent) => {
            const t = touches.current.get(e.pointerId);
            if (!t || t.sounding) return;
            if (Math.hypot(e.clientX - t.x, e.clientY - t.y) > TAP_SLOP_PX) {
              endTouch(e.pointerId, false); // it's a scroll
            }
          },
          onPointerUp: (e: React.PointerEvent) => {
            if (e.pointerType === 'touch') endTouch(e.pointerId, true);
            else onRelease?.(m);
          },
          // the browser took the touch over for scrolling
          onPointerCancel: (e: React.PointerEvent) => endTouch(e.pointerId, false),
          onPointerLeave: (e: React.PointerEvent) => {
            if (e.pointerType !== 'touch' && e.buttons) onRelease?.(m);
          },
          onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
          onKeyDown: (e: React.KeyboardEvent) => {
            if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
              e.preventDefault();
              onPress?.(m, performance.now());
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

  const board = (
    <div
      className={classes.keyboard}
      data-interactive={interactive || undefined}
      style={{
        // never taller than about a third of the screen (phones held sideways)
        height: `max(96px, min(${height}px, 36svh))`,
        minWidth: interactive ? whites.length * MIN_WHITE_PX : undefined,
      }}
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
            {fingers?.[m] && (
              <span className={classes.finger} aria-hidden>
                {fingers[m]}
              </span>
            )}
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
            {fingers?.[black] && (
              <span className={`${classes.finger} ${classes.fingerOnBlack}`} aria-hidden>
                {fingers[black]}
              </span>
            )}
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

  if (!interactive) return board;
  return (
    <div ref={scroller} className={classes.scroller}>
      {board}
    </div>
  );
}
