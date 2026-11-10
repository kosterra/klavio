import { Switch } from '@mantine/core';
import { useTranslation } from 'react-i18next';

/** «Klavi spielt mit»: bass and chords to the learner's melody, on or off. */
export function DuetSwitch({
  on,
  onChange,
  mic,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  /** with the microphone: a word about headphones */
  mic: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Switch
      checked={on}
      onChange={(e) => onChange(e.currentTarget.checked)}
      label={t('duet.label')}
      description={mic ? t('duet.micHint') : undefined}
      size="md"
      color="teal.7"
      data-testid="duet"
    />
  );
}
