import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Stack, Text, VisuallyHidden } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { beatsOf, isHeldNote, midiToPitchName, type SongExercise as Spec } from '@klavio/shared';
import { inputHub, useNoteEvents } from '../input/noteBus';
import { playMelody, type Playback } from '../audio/synth';
import { BuddySays } from '../components/BuddySays';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { Staff, type StaffNote } from '../notation/Staff';
import { FEEDBACK_MS, type ExerciseProps } from './exercises';
import { useNoteLang } from './useLocalized';

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
  const barsPerLine = wide ? 4 : 2;

  // flat list of notes, each knowing its bar
  const notes = useMemo(
    () => exercise.bars.flatMap((bar, b) => bar.map((n) => ({ ...n, bar: b }))),
    [exercise],
  );
  const [pos, setPos] = useState(0);
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
      inputHub.muteMicrophoneUntil(0);
    },
    [],
  );

  useNoteEvents((e) => {
    if (e.type !== 'note-on' || finished || playingIndex !== null) return;
    if (e.midi === notes[pos]!.midi) {
      onCorrect();
      setWrong(null);
      setMissedHere(false);
      // a tied note is only held: go on to the next one that is played
      let next = pos + 1;
      while (next < notes.length && isHeldNote(notes, next)) next++;
      setPos(next);
      if (next >= notes.length) timer.current = setTimeout(onDone, FEEDBACK_MS * 1.5);
    } else {
      onMistake();
      setMissedHere(true);
      setWrong(e.midi);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setWrong(null), FEEDBACK_MS);
    }
  });

  const listen = () => {
    if (playback.current) {
      playback.current.stop();
      return;
    }
    const melody = notes.map((n) => ({ midi: n.midi, beats: beatsOf(n.value) }));
    const ms = (melody.reduce((s, n) => s + n.beats, 0) * 60000) / exercise.tempo;
    // the microphone would hear the app's own playback as notes
    inputHub.muteMicrophoneUntil(performance.now() + ms + 800);
    const p = playMelody(melody, exercise.tempo, setPlayingIndex);
    playback.current = p;
    void p.done.then(() => {
      playback.current = null;
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
          duration: n.value,
          label: exercise.showNames ? midiToPitchName(n.midi, lang) : undefined,
          // a held note keeps its finger – no number again
          finger: isHeldNote(notes, i) ? undefined : n.finger,
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

      <div style={{ width: '100%' }} data-testid="song-staff">
        <Staff
          clef={exercise.clef}
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
