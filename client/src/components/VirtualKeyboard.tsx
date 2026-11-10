import { useEffect, useRef, useState } from 'react';
import { publishNote, useNoteEvents } from '../input/noteBus';
import { SEMITONE_TO_CODE, midiForKeyCode } from '../input/computerKeys';
import { playNote, type Timbre, type Voice } from '../audio/synth';
import { PianoKeyboard, type PianoKeyboardProps } from './PianoKeyboard';
import classes from './PianoKeyboard.module.css';

/** What a key code looks like on a Swiss / German keyboard (where it differs from the code name). */
const CODE_LABEL: Record<string, string> = { KeyY: 'Z', Semicolon: 'Ö' };

function codeLabel(code: string, layout: Map<string, string> | null): string {
  const fromLayout = layout?.get(code);
  if (fromLayout) return fromLayout.toUpperCase();
  return CODE_LABEL[code] ?? code.replace(/^Key/, '');
}

interface Props extends Omit<PianoKeyboardProps, 'onPress' | 'onRelease' | 'active' | 'keyHint'> {
  /** Play a sound on screen key presses (default on). */
  sound?: boolean;
  /** Also play with the computer keyboard (A S D F …). */
  computerKeys?: boolean;
  /** Show which computer key plays which piano key. */
  showComputerKeys?: boolean;
  /** The C that the computer key "A" plays (default: first C of the range). */
  computerKeysFrom?: number;
  /**
   * false: display only — it still lights up notes from MIDI / microphone, but
   * can't be played (when the learner is meant to use the real piano).
   */
  interactive?: boolean;
  /**
   * Lessons: the keyboard stays docked at the bottom of the screen while the
   * task above scrolls – it is always in reach, also on a phone held sideways.
   */
  dock?: boolean;
  /** the sound of the screen keys (free play) */
  timbre?: Timbre;
}

/**
 * The on-screen keyboard: touch/mouse/keyboard input that publishes
 * NoteEvents like MIDI and the microphone do. It also lights up notes coming
 * from the other inputs, so learners see what was recognised.
 */
export function VirtualKeyboard({
  sound = true,
  computerKeys = true,
  showComputerKeys = false,
  computerKeysFrom,
  interactive = true,
  dock = false,
  timbre = 'piano',
  ...keyboard
}: Props) {
  const [held, setHeld] = useState<number[]>([]);
  const voices = useRef(new Map<number, Voice | null>());
  const [layout, setLayout] = useState<Map<string, string> | null>(null);
  // computer keys start at the first C of the visible range
  const baseC = computerKeysFrom ?? keyboard.from + ((12 - (keyboard.from % 12)) % 12);

  useNoteEvents((e) => {
    setHeld((h) =>
      e.type === 'note-on'
        ? h.includes(e.midi)
          ? h
          : [...h, e.midi]
        : h.filter((m) => m !== e.midi),
    );
  });

  const press = (midi: number, time = performance.now()) => {
    if (voices.current.has(midi)) return;
    voices.current.set(midi, sound ? playNote(midi, 0.8, timbre) : null);
    publishNote({
      type: 'note-on',
      midi,
      velocity: 0.8,
      time,
      source: 'keyboard',
    });
  };
  const release = (midi: number) => {
    if (!voices.current.has(midi)) return;
    voices.current.get(midi)?.release();
    voices.current.delete(midi);
    publishNote({
      type: 'note-off',
      midi,
      velocity: 0,
      time: performance.now(),
      source: 'keyboard',
    });
  };
  const pressRef = useRef({ press, release });
  useEffect(() => {
    pressRef.current = { press, release };
  });

  useEffect(() => {
    if (!computerKeys || !interactive) return;
    const typing = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      return (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        !!t?.closest('input, textarea, select, [contenteditable="true"]')
      );
    };
    const down = (e: KeyboardEvent) => {
      if (e.repeat || typing(e)) return;
      const midi = midiForKeyCode(e.code, baseC);
      if (midi === null || midi > keyboard.to) return;
      e.preventDefault();
      pressRef.current.press(midi);
    };
    const up = (e: KeyboardEvent) => {
      const midi = midiForKeyCode(e.code, baseC);
      if (midi !== null) pressRef.current.release(midi);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [computerKeys, interactive, baseC, keyboard.to]);

  // Show the real labels of the user's layout where the browser tells us (Chrome).
  useEffect(() => {
    if (!showComputerKeys) return;
    const kb = (
      navigator as Navigator & { keyboard?: { getLayoutMap(): Promise<Map<string, string>> } }
    ).keyboard;
    kb?.getLayoutMap().then(setLayout, () => undefined);
  }, [showComputerKeys]);

  // Release everything when the keyboard goes away.
  useEffect(() => {
    const map = voices.current;
    return () => {
      for (const midi of [...map.keys()]) pressRef.current.release(midi);
    };
  }, []);

  const keys = (
    <PianoKeyboard
      {...keyboard}
      active={held}
      onPress={interactive ? press : undefined}
      onRelease={interactive ? release : undefined}
      keyHint={
        interactive && showComputerKeys && computerKeys
          ? (m) => {
              const code = SEMITONE_TO_CODE[m - baseC];
              return code ? codeLabel(code, layout) : undefined;
            }
          : undefined
      }
    />
  );
  return dock ? (
    <div className={classes.dock} data-keyboard-dock>
      {keys}
    </div>
  ) : (
    keys
  );
}
