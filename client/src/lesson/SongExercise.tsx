import { useEffect, useMemo, useRef, useState } from 'react';
import { fitBarsPerLine } from '../notation/lineLength';
import { Button, Stack, Text, VisuallyHidden } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import {
  accompaniment,
  beatsOf,
  blockChords,
  isHeldNote,
  isStruck,
  staffDuration,
  midiToPitchName,
  type SongExercise as Spec,
  songFingers,
} from '@klavio/shared';
import { inputHub, useNoteEvents } from '../input/noteBus';
import { playMelody, type Playback } from '../audio/synth';
import { playAccompaniment, strikeChord, type Accompaniment } from '../audio/accompany';
import { BuddySays } from '../components/BuddySays';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { Staff, type StaffNote } from '../notation/Staff';
import { FEEDBACK_MS, type ExerciseProps } from './exercises';
import { useNoteLang } from './useLocalized';
import { useDuet } from './duet';
import { DuetSwitch } from './DuetSwitch';

/**
 * "Lied spielen" in "wait for me" mode: the song is shown bar by bar and only
 * moves on when the right note is played. "Listen" plays it first.
 */
export function SongExercise({
  exercise,
  lesson,
  inputMode,
  kids,
  onCorrect,
  onMistake,
  onDone,
}: ExerciseProps<Spec>) {
  const { t } = useTranslation();
  const lang = useNoteLang();
  const wide = useMediaQuery('(min-width: 900px)', true);
  const barsPerLine = fitBarsPerLine(
    wide ? 4 : 2,
    exercise.bars.map((b) => b.length),
  );

  // flat list of notes, each knowing its bar
  const notes = useMemo(
    () => exercise.bars.flatMap((bar, b) => bar.map((n) => ({ ...n, bar: b }))),
    [exercise],
  );
  // finger numbers: written into the song, or planned where the hand has to move
  const fingers = useMemo(() => songFingers(exercise), [exercise]);
  // «Klavi spielt mit»: a chord when the learner reaches it
  const [duet, setDuet] = useDuet(inputMode);
  const chordAt = useMemo(() => {
    const offsets: number[] = [];
    exercise.bars.forEach((bar) => {
      let t = 0;
      for (const n of bar) {
        offsets.push(t);
        t += beatsOf(n.value);
      }
    });
    const map = new Map<number, number[]>();
    for (const c of blockChords(exercise)) {
      // the first note struck at or after the chord's place (not a rest)
      const i = notes.findIndex(
        (n, k) => n.bar === c.bar && offsets[k]! >= c.at - 1e-9 && isStruck(notes, k),
      );
      if (i >= 0) map.set(i, c.midis);
    }
    return map;
  }, [exercise, notes]);
  const chord = useRef<Accompaniment | null>(null);
  const backing = useRef<Accompaniment | null>(null);
  // a song may begin with a rest: start at the first note that is struck
  const [pos, setPos] = useState(() => {
    let i = 0;
    while (i < notes.length && !isStruck(notes, i)) i++;
    return i;
  });
  const [wrong, setWrong] = useState<number | null>(null);
  const [missedHere, setMissedHere] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const playback = useRef<Playback | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const finished = pos >= notes.length;

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      playback.current?.stop();
      backing.current?.stop();
      chord.current?.stop();
      inputHub.muteMicrophoneUntil(0);
    },
    [],
  );

  useNoteEvents((e) => {
    if (e.type !== 'note-on' || finished || playingIndex !== null) return;
    if (e.midi === notes[pos]!.midi) {
      const harmony = duet ? chordAt.get(pos) : undefined;
      if (harmony) {
        chord.current?.stop();
        chord.current = strikeChord(harmony);
      }
      onCorrect();
      setWrong(null);
      setMissedHere(false);
      // a tied note is only held, a rest not played: go on to the next one that is struck
      let next = pos + 1;
      while (next < notes.length && !isStruck(notes, next)) next++;
      setPos(next);
      if (next >= notes.length) timer.current = setTimeout(onDone, FEEDBACK_MS * 1.5);
    } else {
      onMistake(notes[pos]!.midi);
      setMissedHere(true);
      setWrong(e.midi);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setWrong(null), FEEDBACK_MS);
    }
  });

  const listen = () => {
    if (playback.current) {
      playback.current.stop();
      backing.current?.stop();
      return;
    }
    chord.current?.stop();
    const melody = notes.map((n) => ({ midi: n.midi, beats: beatsOf(n.value) }));
    const ms = (melody.reduce((s, n) => s + n.beats, 0) * 60000) / exercise.tempo;
    // the microphone would hear the app's own playback as notes
    inputHub.muteMicrophoneUntil(performance.now() + ms + 800);
    const p = playMelody(melody, exercise.tempo, setPlayingIndex);
    playback.current = p;
    backing.current = duet
      ? playAccompaniment(accompaniment(exercise), 60000 / exercise.tempo, performance.now())
      : null;
    void p.done.then(() => {
      playback.current = null;
      backing.current?.stop();
      backing.current = null;
      setPlayingIndex(null);
      inputHub.muteMicrophoneUntil(performance.now() + 500);
    });
  };

  // the line (group of bars) that contains the note to play (or the one being played)
  const focus = playingIndex ?? Math.min(pos, notes.length - 1);
  const line = Math.floor(notes[focus]!.bar / barsPerLine);
  const lines = Math.ceil(exercise.bars.length / barsPerLine);
  const firstBar = line * barsPerLine;
  let index = notes.findIndex((n) => n.bar === firstBar);
  const staffBars: StaffNote[][] = exercise.bars
    .slice(firstBar, firstBar + barsPerLine)
    .map((bar) =>
      bar.map((n) => {
        const i = index++;
        return {
          midi: n.midi,
          duration: staffDuration(n),
          label: exercise.showNames && !n.rest ? midiToPitchName(n.midi, lang) : undefined,
          // a held note keeps its finger – no number again
          finger: isHeldNote(notes, i) ? undefined : fingers[i],
          tie: n.tie,
          state:
            playingIndex !== null
              ? i === playingIndex
                ? 'current'
                : undefined
              : i < pos
                ? 'done'
                : i === pos
                  ? wrong !== null
                    ? 'wrong'
                    : 'current'
                  : undefined,
        };
      }),
    );

  const expected = finished ? undefined : notes[pos]!.midi;
  const hint =
    expected !== undefined && playingIndex === null && (kids || missedHere) ? [expected] : [];

  return (
    <Stack align="center" gap="md" w="100%">
      <BuddySays
        mood={
          finished ? 'cheer' : playingIndex !== null ? 'happy' : wrong !== null ? 'think' : 'listen'
        }
        size={kids ? 80 : 56}
        kids={kids}
        say={t('lesson.playSong')}
        classicRow
      >
        <Text fz={kids ? 26 : 22} fw={800} aria-live="polite">
          {finished
            ? t('lesson.wellDone')
            : playingIndex !== null
              ? t('lesson.listening')
              : t('lesson.playSong')}
        </Text>
        <Button
          variant="light"
          leftSection={playingIndex !== null ? <IconPlayerStop /> : <IconPlayerPlay />}
          onClick={listen}
          disabled={finished}
        >
          {playingIndex !== null ? t('lesson.stopListening') : t('lesson.listen')}
        </Button>
      </BuddySays>

      <DuetSwitch
        on={duet}
        onChange={(on) => {
          setDuet(on);
          if (!on) chord.current?.stop();
        }}
        mic={inputMode === 'microphone'}
      />
      <div style={{ width: '100%' }} data-testid="song-staff">
        <Staff
          clef={exercise.clef}
          keySignature={exercise.keySignature}
          time={line === 0 ? exercise.time : undefined}
          bars={staffBars}
          height={kids ? 200 : 170}
          label={t('lesson.songStaffLabel', { line: line + 1, lines })}
        />
      </div>
      <Text size="sm" c="dimmed" mih={22} data-testid="song-status">
        {wrong !== null
          ? t('lesson.wrongPlay', { note: midiToPitchName(wrong, lang) })
          : !finished
            ? t('lesson.songProgress', { n: pos + 1, total: notes.length })
            : ' '}
      </Text>
      {/* for screen readers and tests: the note to play next */}
      <VisuallyHidden aria-live="polite" data-testid="next-note">
        {expected !== undefined
          ? t('lesson.nextNote', { note: midiToPitchName(expected, lang) })
          : ''}
      </VisuallyHidden>
      <VirtualKeyboard
        dock
        from={lesson.keyboard.from}
        to={lesson.keyboard.to}
        labels={lesson.keyLabels}
        height={kids ? 180 : 160}
        interactive={inputMode === 'screen'}
        hints={hint}
        fingers={
          hint.length && notes[pos]?.finger ? { [hint[0]!]: notes[pos]!.finger! } : undefined
        }
        wrong={wrong !== null ? [wrong] : []}
      />
    </Stack>
  );
}
