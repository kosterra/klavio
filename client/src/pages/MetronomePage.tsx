import { useEffect, useRef, useState } from 'react';
import {
  ActionIcon,
  Button,
  Card,
  Group,
  SegmentedControl,
  Slider,
  Stack,
  Text,
  VisuallyHidden,
} from '@mantine/core';
import {
  IconHandFinger,
  IconMinus,
  IconPlayerPlayFilled,
  IconPlayerStopFilled,
  IconPlus,
} from '@tabler/icons-react';
import { PlayTabs, PlayTitle } from '../components/PlayTabs';
import { useTranslation } from 'react-i18next';
import { runMetronome, type MetronomeRun } from '../audio/metronome';
import { usePageTitle } from '../components/usePageTitle';
import { useSession } from '../auth/session';
import classes from './MetronomePage.module.css';

/** About five minutes of clicks per start; long enough to practise a passage. */
const MAX_BEATS = 600;

/**
 * A metronome for practising (also one's own pieces): tempo, beats per bar
 * with an accent on one, tap tempo, and a big blinking beat to see from the
 * piano bench.
 */
export function MetronomePage() {
  const { t } = useTranslation();
  usePageTitle(t('metronome.title'));
  // tempo and beats per bar are remembered per profile on this device
  const { activeProfile } = useSession();
  const key = `klavio-metronome:${activeProfile?.id ?? 'none'}`;
  const [saved] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(key) ?? 'null') as {
        tempo?: number;
        beats?: number;
      } | null;
      return {
        tempo: Math.min(200, Math.max(40, Math.round(Number(v?.tempo) || 80))),
        beats: [2, 3, 4, 6].includes(Number(v?.beats)) ? Number(v?.beats) : 4,
      };
    } catch {
      return { tempo: 80, beats: 4 };
    }
  });
  const [tempo, setTempo] = useState(saved.tempo);
  const [beats, setBeats] = useState(saved.beats);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);
  const run = useRef<MetronomeRun | null>(null);
  const frame = useRef(0);
  const taps = useRef<number[]>([]);

  const stop = () => {
    run.current?.stop();
    run.current = null;
    cancelAnimationFrame(frame.current);
    setRunning(false);
    setBeat(-1);
  };

  const start = (bpm = tempo, perBar = beats) => {
    run.current?.stop();
    cancelAnimationFrame(frame.current);
    const accents = Array.from({ length: Math.ceil(MAX_BEATS / perBar) }, (_, i) => i * perBar);
    const r = runMetronome(MAX_BEATS, bpm, accents);
    run.current = r;
    setRunning(true);
    const tick = () => {
      const now = performance.now();
      let i = r.beatTimes.findIndex((b) => b > now) - 1;
      if (i === -2) {
        stop(); // ran through
        return;
      }
      if (i < 0) i = -1;
      setBeat(i < 0 ? -1 : i % perBar);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  useEffect(
    () => () => {
      run.current?.stop();
      cancelAnimationFrame(frame.current);
    },
    [],
  );

  const change = (bpm: number, perBar: number) => {
    setTempo(bpm);
    setBeats(perBar);
    try {
      localStorage.setItem(key, JSON.stringify({ tempo: bpm, beats: perBar }));
    } catch {
      // private mode: just not remembered
    }
    if (running) start(bpm, perBar);
  };

  const tap = () => {
    const now = performance.now();
    taps.current = [...taps.current.filter((x) => now - x < 3000), now].slice(-5);
    if (taps.current.length < 2) return;
    const gaps = taps.current.slice(1).map((x, i) => x - taps.current[i]!);
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    change(Math.min(200, Math.max(40, Math.round(60000 / avg))), beats);
  };

  return (
    <Stack gap="lg" maw={720} mx="auto">
      <PlayTitle>{t('metronome.title')}</PlayTitle>
      <PlayTabs />
      <Text c="dimmed" fz={{ base: 'md', sm: 'lg' }} mt={-8}>
        {t('metronome.intro')}
      </Text>
      <Card withBorder radius="lg" padding="lg">
        <Stack gap="lg">
          <div className={classes.dots} aria-hidden>
            {Array.from({ length: beats }, (_, i) => (
              <span
                key={i}
                className={classes.dot}
                data-on={beat === i || undefined}
                data-accent={i === 0 || undefined}
              />
            ))}
          </div>
          <Group justify="center" gap="md" wrap="nowrap">
            <ActionIcon
              variant="light"
              radius="xl"
              aria-label={t('metronome.slower')}
              onClick={() => change(Math.max(40, tempo - 5), beats)}
            >
              <IconMinus />
            </ActionIcon>
            <div style={{ textAlign: 'center', minWidth: 0 }}>
              <Text fz={48} fw={900} lh={1.1} aria-live="off" data-testid="tempo">
                {tempo}
                <VisuallyHidden> {t('metronome.bpm')}</VisuallyHidden>
              </Text>
              <Text fz="sm" fw={700} c="dimmed" aria-hidden>
                {t('metronome.bpm')}
              </Text>
            </div>
            <ActionIcon
              variant="light"
              radius="xl"
              aria-label={t('metronome.faster')}
              onClick={() => change(Math.min(200, tempo + 5), beats)}
            >
              <IconPlus />
            </ActionIcon>
          </Group>
          {/* start right under the tempo – in reach without scrolling on a phone */}
          <Group grow preventGrowOverflow={false}>
            <Button
              size="xl"
              color={running ? 'red.8' : undefined}
              leftSection={running ? <IconPlayerStopFilled /> : <IconPlayerPlayFilled />}
              onClick={() => (running ? stop() : start())}
              data-testid="metronome-toggle"
            >
              {running ? t('metronome.stop') : t('metronome.start')}
            </Button>
            <Button size="xl" variant="light" leftSection={<IconHandFinger />} onClick={tap}>
              {t('metronome.tap')}
            </Button>
          </Group>
          <Slider
            min={40}
            max={200}
            step={1}
            value={tempo}
            onChange={(v) => setTempo(v)}
            onChangeEnd={(v) => change(v, beats)}
            label={null}
            size="lg"
            thumbLabel={t('metronome.tempo')}
            marks={[60, 100, 140, 180].map((v) => ({ value: v, label: String(v) }))}
            mb="lg"
          />
          <Stack gap={6}>
            <Text fw={500} id="beats-label">
              {t('metronome.beats')}
            </Text>
            <SegmentedControl
              aria-labelledby="beats-label"
              value={String(beats)}
              onChange={(v) => change(tempo, Number(v))}
              data={['2', '3', '4', '6']}
              size="lg"
            />
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
}
