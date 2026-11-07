import { useEffect, useRef, useState } from 'react';
import { useNoteEvents } from '../input/noteBus';
import { FEEDBACK_MS, shuffleRounds } from './exercises';

interface Options {
  notes: number[];
  rounds: number;
  /** Does the played note count for the current target? */
  matches: (played: number, target: number) => boolean;
  onCorrect: () => void;
  onMistake: () => void;
  onDone: () => void;
}

/**
 * Round-based task ("find this key", "play this note"): random targets, short
 * feedback after each attempt, next round after a correct note.
 */
export function useRoundTask({ notes, rounds, matches, onCorrect, onMistake, onDone }: Options) {
  const [targets] = useState(() => shuffleRounds(notes, rounds));
  const [round, setRound] = useState(0);
  const [wrongInRound, setWrongInRound] = useState(0);
  const [feedback, setFeedback] = useState<{ midi: number; ok: boolean } | null>(null);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const target = targets[round]!;

  useNoteEvents((e) => {
    if (e.type !== 'note-on' || busy.current) return;
    if (matches(e.midi, target)) {
      busy.current = true;
      setFeedback({ midi: e.midi, ok: true });
      onCorrect();
      timer.current = setTimeout(() => {
        busy.current = false;
        setFeedback(null);
        setWrongInRound(0);
        if (round + 1 >= targets.length) onDone();
        else setRound(round + 1);
      }, FEEDBACK_MS);
    } else {
      onMistake();
      setWrongInRound((w) => w + 1);
      setFeedback({ midi: e.midi, ok: false });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setFeedback(null), FEEDBACK_MS);
    }
  });

  return { target, round, total: targets.length, wrongInRound, feedback };
}
