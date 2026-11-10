import { useEffect, useRef, useState } from 'react';
import { Button, Card, Group, SegmentedControl, Slider, Stack, Text, Title } from '@mantine/core';
import { IconHandFinger, IconPlayerPlayFilled, IconPlayerStopFilled } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { runMetronome, type MetronomeRun } from '../audio/metronome';
import { usePageTitle } from '../components/usePageTitle';
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
  const [tempo, setTempo] = useState(80);
  const [beats, setBeats] = useState(4);
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
      <div>
        <Title order={1}>{t('metronome.title')}</Title>
        <Text c="dimmed" fz="lg">
          {t('metronome.intro')}
        </Text>
      </div>
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
          <Text ta="center" fz={48} fw={900} aria-live="off" data-testid="tempo">
            {tempo}
            <Text span fz="lg" fw={700} c="dimmed">
              {' '}
              {t('metronome.bpm')}
            </Text>
          </Text>
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
            marks={[60, 80, 100, 120, 160].map((v) => ({ value: v, label: String(v) }))}
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
        </Stack>
      </Card>
    </Stack>
  );
}
