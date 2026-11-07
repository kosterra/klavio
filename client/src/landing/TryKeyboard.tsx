import { useRef, useState } from 'react';
import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { PianoKeyboard } from '../components/PianoKeyboard';
import { playNote } from '../audio/synth';
import { tuneMatcher } from './easterEggs';

/** «Alle meine Entchen», the first six notes. */
const ENTCHEN = [60, 62, 64, 65, 67, 67];

/**
 * A small keyboard to try out on the landing page. Secret: playing the start
 * of «Alle meine Entchen» sends a parade of ducks across the screen.
 */
export function TryKeyboard({ onDucks }: { onDucks: () => void }) {
  const { t } = useTranslation();
  const [held, setHeld] = useState<number[]>([]);
  const match = useRef(tuneMatcher(ENTCHEN));
  return (
    <div>
      <PianoKeyboard
        from={60}
        to={72}
        labels="all"
        height={130}
        active={held}
        onPress={(m) => {
          const v = playNote(m, 0.7);
          setTimeout(() => v?.release(), 500);
          setHeld((h) => [...h, m]);
          setTimeout(() => setHeld((h) => h.filter((x) => x !== m)), 220);
          if (match.current(m)) onDucks();
        }}
      />
      <Text size="sm" c="dimmed" ta="center" mt={6}>
        {t('landing.tryHint')}
      </Text>
    </div>
  );
}
