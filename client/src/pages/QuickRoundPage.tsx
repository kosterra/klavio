import { useState } from 'react';
import { Box, Button, Card, CloseButton, Group, Stack, Text, Title } from '@mantine/core';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../components/usePageTitle';
import { LESSONS, theoryFor, type TheoryStep } from '@klavio/shared';
import { useSession } from '../auth/session';
import { Buddy } from '../components/Buddy';
import { TheorySteps } from '../lesson/theory/TheorySteps';
import { useProgress } from '../lesson/useProgress';
import { ProgressPending } from '../components/ProgressPending';
import { useWorldMode } from '../lesson/useWorldMode';

/** Questions per quick round. */
const ROUND_SIZE = 5;

/** Games and quizzes of all lessons played so far, shuffled. */
function pickSteps(played: Set<string>, world: 'kids' | 'journey'): TheoryStep[] {
  const pool = LESSONS.filter((l) => played.has(l.id)).flatMap((l) =>
    theoryFor(l.id, world).filter(
      (s) => s.type === 'quiz' || s.type === 'tap-keys' || s.type === 'listen',
    ),
  );
  // Fisher–Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, ROUND_SIZE);
}

/**
 * "Schnelle Runde": a short mixed review – questions and little games from
 * every lesson played so far. Practice only, nothing is scored.
 */
export function QuickRoundPage() {
  const { t } = useTranslation();
  usePageTitle(t('review.quick'));
  const navigate = useNavigate();
  const { activeProfile } = useSession();
  const { progress, completed, error, reload } = useProgress();
  const kids = activeProfile?.uiMode !== 'classic';
  const world = useWorldMode();
  const [steps, setSteps] = useState<TheoryStep[] | null>(null);
  const [done, setDone] = useState(false);

  if (progress && steps === null) {
    // pick once, as soon as the progress is known
    setSteps(pickSteps(completed, world));
  }

  return (
    <Box mih="100dvh" p="md" maw={1100} mx="auto">
      <Stack gap="md">
        <Group>
          <CloseButton size="xl" aria-label={t('review.close')} onClick={() => navigate('/')} />
        </Group>
        {!progress && <ProgressPending error={error} onRetry={() => void reload()} />}
        {steps && steps.length === 0 && (
          <Card withBorder radius="xl" padding="xl" maw={640} mx="auto" w="100%">
            <Stack align="center">
              <Buddy mood="think" size={96} />
              <Text ta="center">{t('review.quickEmpty')}</Text>
              <Button component={Link} to="/">
                {t('review.back')}
              </Button>
            </Stack>
          </Card>
        )}
        {steps && steps.length > 0 && !done && (
          <TheorySteps
            steps={steps}
            kids={kids}
            onDone={() => setDone(true)}
            title={t('review.quick')}
            doneLabel={t('review.finish')}
            skipLabel={t('review.stop')}
          />
        )}
        {done && (
          <Card withBorder radius="xl" padding="xl" maw={640} mx="auto" w="100%">
            <Stack align="center" gap="md">
              <Buddy mood="cheer" size={kids ? 120 : 80} />
              <Title order={1} ta="center">
                {t('review.quickDone')}
              </Title>
              <Group>
                <Button
                  variant="default"
                  onClick={() => {
                    setSteps(pickSteps(completed, world));
                    setDone(false);
                  }}
                >
                  {t('review.quickAgain')}
                </Button>
                <Button component={Link} to="/">
                  {t('review.back')}
                </Button>
              </Group>
            </Stack>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
