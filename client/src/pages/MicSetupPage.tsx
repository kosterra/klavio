import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Progress,
  Stack,
  Stepper,
  Text,
  Title,
} from '@mantine/core';
import { notify } from '../components/notify';
import { IconMicrophone } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { midiToName } from '@klavio/shared';
import { useSession } from '../auth/session';
import { endpoints } from '../api/endpoints';
import { useErrorText } from '../auth/useErrorText';
import { usePitchDetection } from '../audio/usePitchDetection';
import { microphoneSupported } from '../audio/microphone';
import { useMicErrorText } from '../audio/micErrorText';
import { A4Calibrator, CALIBRATION_MIDI, estimateNoiseFloor } from '../audio/calibration';
import { gateFromNoiseFloor } from '../audio/pitch/tracker';
import { useRawNoteEvents } from '../input/noteBus';
import { LevelMeter } from '../components/Meters';
import { Mascot } from '../components/Mascot';
import { PianoKeyboard } from '../components/PianoKeyboard';
import { PrivacyNote } from '../components/PrivacyNote';

const NOISE_SECONDS = 3;
const TEST_NOTES_NEEDED = 3;

/**
 * Microphone setup per profile: permission → room noise → A4 reference → test.
 * Results are stored in the profile's calibration (no audio is ever stored).
 */
export function MicSetupPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('de') ? 'de' : 'en';
  const { activeProfile, refresh } = useSession();
  const navigate = useNavigate();
  const errorText = useErrorText();
  const micErrorText = useMicErrorText();
  const [step, setStep] = useState(0);
  const [noiseFloorDb, setNoiseFloorDb] = useState<number | null>(null);
  const [a4, setA4] = useState<{ a4Hz: number; deviationCents: number } | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [noiseProgress, setNoiseProgress] = useState(0);
  const [a4Progress, setA4Progress] = useState(0);
  const [heard, setHeard] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const calibrator = useRef<A4Calibrator | null>(null);

  const pitch = usePitchDetection({ a4Hz: a4?.a4Hz ?? 440, noiseFloorDb });
  const { onFrame } = pitch;

  // Step 2: measure room noise for a few seconds.
  useEffect(() => {
    if (!measuring || step !== 1) return;
    const levels: number[] = [];
    const startedAt = performance.now();
    const off = onFrame((f) => {
      levels.push(f.levelDb);
      const p = (performance.now() - startedAt) / (NOISE_SECONDS * 1000);
      setNoiseProgress(Math.min(1, p));
      if (p >= 1) {
        off();
        setNoiseFloorDb(estimateNoiseFloor(levels));
        setMeasuring(false);
      }
    });
    return off;
  }, [measuring, step, onFrame]);

  // Step 3: listen for a sustained A4.
  useEffect(() => {
    if (step !== 2 || a4) return;
    const cal = new A4Calibrator(gateFromNoiseFloor(noiseFloorDb));
    calibrator.current = cal;
    const off = onFrame((f) => {
      cal.push(f);
      setA4Progress(cal.progress);
      const r = cal.result();
      if (r) {
        off();
        setA4(r);
      }
    });
    return off;
  }, [step, a4, noiseFloorDb, onFrame]);

  // Step 4: play a few notes.
  useRawNoteEvents((e) => {
    if (step === 3 && e.type === 'note-on' && e.source === 'microphone') {
      setHeard((h) => (h.includes(e.midi) ? h : [...h, e.midi]));
    }
  });

  const save = async () => {
    if (!activeProfile) return;
    setSaving(true);
    setSaveError(null);
    try {
      await endpoints.updateProfile(activeProfile.id, {
        calibration: { a4Hz: a4?.a4Hz ?? 440, noiseFloorDb },
      });
      await pitch.stop();
      await refresh();
      notify(t('micSetup.saved'));
      navigate('/mic-test');
    } catch (err) {
      setSaveError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const running = pitch.status === 'running';
  const tooLoud = noiseFloorDb !== null && noiseFloorDb > -40;

  return (
    <Stack gap="lg" maw={860} mx="auto">
      <Group wrap="nowrap">
        <Mascot mood="listen" size={80} />
        <div>
          <Title order={1}>{t('micSetup.title')}</Title>
          <Text c="dimmed">{t('micSetup.intro')}</Text>
        </div>
      </Group>

      <Card withBorder radius="xl" padding="lg">
        <Stepper active={step} size="sm" allowNextStepsSelect={false}>
          {/* ------------------------------------------------ 1: permission */}
          <Stepper.Step label={t('micSetup.stepMic')} aria-label={t('micSetup.stepMic')}>
            <Stack mt="md">
              <Text>{t('micSetup.micText')}</Text>
              <PrivacyNote />
              {!microphoneSupported() && (
                <Alert color="orange">{t('mic.errors.MIC_UNSUPPORTED')}</Alert>
              )}
              {pitch.error && (
                <Alert color="red" role="alert">
                  {micErrorText(pitch.error)}
                </Alert>
              )}
              <Group>
                <Button
                  size="lg"
                  leftSection={<IconMicrophone />}
                  loading={pitch.status === 'starting'}
                  disabled={!microphoneSupported()}
                  onClick={async () => {
                    if (!running) await pitch.start();
                    setStep(1);
                  }}
                >
                  {t('micSetup.allow')}
                </Button>
              </Group>
            </Stack>
          </Stepper.Step>

          {/* ------------------------------------------------ 2: room noise */}
          <Stepper.Step label={t('micSetup.stepNoise')} aria-label={t('micSetup.stepNoise')}>
            <Stack mt="md">
              <Text>{t('micSetup.noiseText', { seconds: NOISE_SECONDS })}</Text>
              <LevelMeter levelDb={pitch.live.levelDb} gateDb={pitch.live.gateDb} />
              {measuring && <Progress value={noiseProgress * 100} animated aria-hidden />}
              {noiseFloorDb !== null && !measuring && (
                <Alert color={tooLoud ? 'orange' : 'teal'}>
                  {tooLoud
                    ? t('micSetup.noiseLoud', { db: Math.round(noiseFloorDb) })
                    : t('micSetup.noiseOk', { db: Math.round(noiseFloorDb) })}
                </Alert>
              )}
              <Group>
                <Button
                  variant={noiseFloorDb === null ? 'filled' : 'default'}
                  loading={measuring}
                  disabled={!running}
                  onClick={() => {
                    setNoiseFloorDb(null);
                    setNoiseProgress(0);
                    setMeasuring(true);
                  }}
                >
                  {noiseFloorDb === null ? t('micSetup.measure') : t('micSetup.again')}
                </Button>
                {noiseFloorDb !== null && !measuring && (
                  <Button onClick={() => setStep(2)}>{t('common.continue')}</Button>
                )}
              </Group>
            </Stack>
          </Stepper.Step>

          {/* ------------------------------------------------ 3: tuning */}
          <Stepper.Step label={t('micSetup.stepTuning')} aria-label={t('micSetup.stepTuning')}>
            <Stack mt="md">
              <Text>{t('micSetup.tuningText')}</Text>
              <PianoKeyboard from={60} to={72} hints={[CALIBRATION_MIDI]} labels="all" />
              {!a4 ? (
                <>
                  <Progress value={a4Progress * 100} aria-label={t('micSetup.listening')} />
                  <Text size="sm" c="dimmed">
                    {a4Progress > 0 ? t('micSetup.keepHolding') : t('micSetup.listening')}
                  </Text>
                </>
              ) : (
                <Alert color={Math.abs(a4.deviationCents) > 50 ? 'orange' : 'teal'}>
                  {t('micSetup.tuningResult', {
                    hz: a4.a4Hz.toFixed(1),
                    cents: a4.deviationCents > 0 ? `+${a4.deviationCents}` : a4.deviationCents,
                  })}
                  {Math.abs(a4.deviationCents) > 50 && <> {t('micSetup.tuningFar')}</>}
                </Alert>
              )}
              <Group>
                {a4 && (
                  <Button variant="default" onClick={() => setA4(null)}>
                    {t('micSetup.again')}
                  </Button>
                )}
                {!a4 && (
                  <Button variant="subtle" onClick={() => setStep(3)}>
                    {t('micSetup.skipTuning')}
                  </Button>
                )}
                {a4 && <Button onClick={() => setStep(3)}>{t('common.continue')}</Button>}
              </Group>
            </Stack>
          </Stepper.Step>

          {/* ------------------------------------------------ 4: try it */}
          <Stepper.Step label={t('micSetup.stepTest')} aria-label={t('micSetup.stepTest')}>
            <Stack mt="md">
              <Text>{t('micSetup.testText', { count: TEST_NOTES_NEEDED })}</Text>
              <Group gap="xs" mih={36}>
                {heard.map((m) => (
                  <Badge key={m} size="xl" variant="light">
                    {midiToName(m, lang)}
                  </Badge>
                ))}
              </Group>
              {heard.length >= TEST_NOTES_NEEDED && (
                <Alert color="teal">{t('micSetup.testOk')}</Alert>
              )}
              {saveError && (
                <Alert color="red" role="alert">
                  {saveError}
                </Alert>
              )}
              <Group>
                <Button variant="default" onClick={() => setStep(2)}>
                  {t('common.back')}
                </Button>
                <Button
                  onClick={() => void save()}
                  loading={saving}
                  variant={heard.length >= TEST_NOTES_NEEDED ? 'filled' : 'light'}
                >
                  {t('micSetup.finish')}
                </Button>
              </Group>
            </Stack>
          </Stepper.Step>
        </Stepper>
      </Card>
    </Stack>
  );
}
