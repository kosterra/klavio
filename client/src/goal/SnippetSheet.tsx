import { useState } from 'react';
import { Button, Modal, Stack, Text } from '@mantine/core';
import { IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { isHeldNote, staffDuration, type CatalogSong, type DreamSnippet } from '@klavio/shared';
import { melodyNotes, startPreview, stopPreview, usePreview } from '../audio/preview';
import { Staff, type StaffNote } from '../notation/Staff';

/** at most this many bars on a line; the bars are spread evenly over the lines */
const MAX_BARS_PER_LINE = 5;

/**
 * The opening of a dream song on the staff, line by line, with a button to
 * hear it – the note being played lights up.
 */
export function SnippetSheet({
  song,
  snippet,
  onClose,
}: {
  song: CatalogSong;
  snippet: DreamSnippet;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { playing, me } = usePreview();
  const [current, setCurrent] = useState<number | null>(null);

  const listen = () => {
    if (playing) return stopPreview();
    // the played notes are merged over ties; map them back to the written ones
    const notes = snippet.bars.flat();
    const written: number[] = [];
    notes.forEach((_, i) => {
      if (!isHeldNote(notes, i)) written.push(i);
    });
    startPreview(me, [melodyNotes(snippet.bars)], snippet.tempo, (i) => setCurrent(written[i]!));
  };

  const lines: StaffNote[][][] = [];
  let index = 0;
  const count = Math.ceil(snippet.bars.length / MAX_BARS_PER_LINE);
  const perLine = Math.ceil(snippet.bars.length / count);
  for (let b = 0; b < snippet.bars.length; b += perLine) {
    lines.push(
      snippet.bars.slice(b, b + perLine).map((bar) =>
        bar.map((n) => {
          const i = index++;
          return {
            midi: n.midi,
            duration: staffDuration(n),
            tie: n.tie,
            state: playing && i === current ? 'current' : undefined,
          };
        }),
      ),
    );
  }

  return (
    <Modal
      opened
      onClose={onClose}
      title={song.artist ? `${song.title} – ${song.artist}` : song.title}
      size="lg"
      radius="lg"
      closeButtonProps={{ 'aria-label': t('common.close') }}
    >
      <Stack gap="xs">
        <Text size="sm" c="dimmed">
          {t('goal.picks.sheetHint')}
        </Text>
        <Button
          variant="filled"
          color="pink.8"
          w="fit-content"
          leftSection={playing ? <IconPlayerStop /> : <IconPlayerPlay />}
          onClick={listen}
        >
          {playing ? t('goal.picks.stopShort') : t('goal.picks.play')}
        </Button>
        {lines.map((bars, line) => (
          <div key={line} data-testid="snippet-staff">
            <Staff
              clef="treble"
              keySignature={snippet.keySignature}
              time={line === 0 ? snippet.time : undefined}
              bars={bars}
              height={130}
              label={t('goal.picks.sheetLabel', { line: line + 1, lines: lines.length })}
            />
          </div>
        ))}
      </Stack>
    </Modal>
  );
}
