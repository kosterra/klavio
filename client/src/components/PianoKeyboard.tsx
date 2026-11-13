import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActionIcon } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
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
 * A playable key is at least this wide: on phones only the keys that fit are
 * shown – with buttons to move by an octave, following the hints – instead of
 * a keyboard to swipe sideways.
 */
const MIN_WHITE_PX = 36;

/** A touch only becomes a note when the finger stays put … */
const TAP_SLOP_PX = 14;
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

const whiteKeys = (from: number, to: number) => {
  const whites: number[] = [];
  for (let m = from; m <= to; m++) if (!isBlackKey(m)) whites.push(m);
  return whites;
};

/** What matters most to keep in view: the hinted keys, else middle C, else the middle. */
const focusOf = (from: number, to: number, hints: readonly number[]) =>
  hints.length
    ? [...hints].sort((a, b) => a - b)[Math.floor((hints.length - 1) / 2)]!
    : from <= 60 && 60 <= to
      ? 60
      : Math.round((from + to) / 2);

/**
 * Piano keyboard drawn with plain elements. Display-only by default; with
 * `onPress` it doubles as the on-screen keyboard input (same NoteEvent path).
 * A playable keyboard too wide for the screen shows the keys that fit, with
 * ‹ › to move it by an octave; it follows the hinted keys by itself.
 */
export function PianoKeyboard(props: PianoKeyboardProps) {
  const { from, to, hints = [], onPress } = props;
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('de') ? 'de' : 'en';
  const interactive = !!onPress;
  const wrap = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!interactive || !el) return;
    setRoom(el.clientWidth);
    const ro = new ResizeObserver(() => setRoom(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [interactive]);

  const whites = whiteKeys(from, to);
  const fits = room === null ? whites.length : Math.max(7, Math.floor(room / MIN_WHITE_PX));
  const windowed = interactive && fits < whites.length;
  const last = Math.max(0, whites.length - fits);
  const clamp = (i: number) => Math.min(last, Math.max(0, i));
  const focus = focusOf(from, to, hints);
  const focusIndex = Math.max(
    0,
    whites.findIndex((w) => w >= focus),
  );
  const centred = clamp(focusIndex - Math.floor((fits - 1) / 2));
  const [start, setStart] = useState<number | null>(null);
  // a new hint outside the keys shown: the keys follow it
  const [seen, setSeen] = useState(focus);
  if (seen !== focus) {
    setSeen(focus);
    const s = start ?? centred;
    if (focusIndex < s || focusIndex >= s + fits) setStart(centred);
  }
  const s = clamp(start ?? centred);
  const shown = windowed ? { from: whites[s]!, to: whites[s + fits - 1]! } : { from, to };
  const name = (m: number) => midiToName(m, lang);

  return (
    <div ref={wrap} className={classes.wrap}>
      {windowed && (
        <div className={classes.shift} data-testid="keyboard-shift">
          <ActionIcon
            variant="default"
            size={44}
            radius="xl"
            aria-label={t('keyboard.lower')}
            disabled={s <= 0}
            onClick={() => setStart(clamp(s - 7))}
          >
            <IconChevronLeft size={22} aria-hidden />
          </ActionIcon>
          <span className={classes.shiftRange}>
            {name(shown.from)} – {name(shown.to)}
          </span>
          <ActionIcon
            variant="default"
            size={44}
            radius="xl"
            aria-label={t('keyboard.higher')}
            disabled={s >= last}
            onClick={() => setStart(clamp(s + 7))}
          >
            <IconChevronRight size={22} aria-hidden />
          </ActionIcon>
        </div>
      )}
      <Keys {...props} from={shown.from} to={shown.to} />
    </div>
  );
}

function Keys({
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

  return (
    <div
      className={classes.keyboard}
      data-interactive={interactive || undefined}
      style={{
        // never taller than about a third of the screen (phones held sideways)
        height: `max(96px, min(${height}px, 36svh))`,
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
}
