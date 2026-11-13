import { ActionIcon } from '@mantine/core';
import { IconEar, IconPlayerStop } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { PieceExercise, SongExercise } from '@klavio/shared';
import { previewParts, startPreview, stopPreview, usePreview } from '../audio/preview';

/**
 * «Hörprobe»: the first bars of a song or piece, played by the synth – to
 * know what it sounds like before opening it. A second tap stops it.
 */
export function PreviewButton({
  exercise,
  title,
  testId,
}: {
  exercise: SongExercise | PieceExercise;
  title: string;
  testId?: string;
}) {
  const { t } = useTranslation();
  const { playing, me } = usePreview();
  return (
    <ActionIcon
      variant={playing ? 'filled' : 'default'}
      radius="lg"
      size="auto"
      w={52}
      aria-label={t(playing ? 'preview.stop' : 'preview.listen', { title })}
      aria-pressed={playing}
      onClick={() =>
        playing ? stopPreview() : startPreview(me, previewParts(exercise), exercise.tempo)
      }
      data-testid={testId}
    >
      {playing ? <IconPlayerStop size={22} /> : <IconEar size={22} />}
    </ActionIcon>
  );
}
