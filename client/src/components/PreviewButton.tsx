import { ActionIcon } from '@mantine/core';
import { IconHeadphones, IconPlayerStopFilled } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { PieceExercise, SongExercise } from '@klavio/shared';
import { previewParts, startPreview, stopPreview, usePreview } from '../audio/preview';

/** The look of every «Hörprobe» button: headphones, a stop sign while it plays. */
export function ListenIcon({
  playing,
  loading,
  title,
  onClick,
  testId,
}: {
  playing: boolean;
  loading?: boolean;
  title: string;
  onClick: () => void;
  testId?: string;
}) {
  const { t } = useTranslation();
  return (
    <ActionIcon
      variant={playing ? 'filled' : 'subtle'}
      radius="xl"
      size={48}
      loading={loading}
      aria-label={t(playing ? 'preview.stop' : 'preview.listen', { title })}
      aria-pressed={playing}
      onClick={onClick}
      data-testid={testId}
    >
      {playing ? <IconPlayerStopFilled size={20} /> : <IconHeadphones size={24} />}
    </ActionIcon>
  );
}

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
  const { playing, me } = usePreview();
  return (
    <ListenIcon
      playing={playing}
      title={title}
      testId={testId}
      onClick={() =>
        playing ? stopPreview() : startPreview(me, previewParts(exercise), exercise.tempo)
      }
    />
  );
}
