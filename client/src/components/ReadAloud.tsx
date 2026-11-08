import { useEffect, useId, useSyncExternalStore } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconPlayerStopFilled, IconVolume } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { currentSpeakingId, speak, stopSpeaking, subscribeSpeaking } from '../audio/speech';
import { useCanSpeak } from './useReadAloud';

/**
 * Speaker button next to a text: tap to hear it, tap again to stop. With
 * `auto`, the text is also read as soon as it appears or changes. Renders
 * nothing when the device has no voice for the language.
 */
export function ReadAloudButton({
  text,
  auto = false,
  size = 'lg',
}: {
  /** the text, or a function reading it (e.g. from the DOM) when tapped */
  text: string | (() => string);
  auto?: boolean;
  size?: 'md' | 'lg' | 'xl';
}) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const can = useCanSpeak();
  const speaking = useSyncExternalStore(subscribeSpeaking, currentSpeakingId) === id;
  const read = () => (typeof text === 'function' ? text() : text);
  const autoText = auto && typeof text === 'string' ? text : null;

  // read automatically when the text appears or changes
  useEffect(() => {
    if (can && autoText) speak(autoText, i18n.language, id);
  }, [can, autoText, i18n.language, id]);

  // leaving the screen ends the text
  useEffect(
    () => () => {
      if (currentSpeakingId() === id) stopSpeaking();
    },
    [id],
  );

  if (!can) return null;
  const label = speaking ? t('speech.stop') : t('speech.read');
  return (
    <Tooltip label={label} withArrow>
      <ActionIcon
        size={size}
        radius="xl"
        variant={speaking ? 'filled' : 'light'}
        color="indigo"
        aria-label={label}
        aria-pressed={speaking}
        data-testid="read-aloud"
        onClick={() => (speaking ? stopSpeaking() : speak(read(), i18n.language, id))}
      >
        {speaking ? <IconPlayerStopFilled size={18} /> : <IconVolume size={20} />}
      </ActionIcon>
    </Tooltip>
  );
}
