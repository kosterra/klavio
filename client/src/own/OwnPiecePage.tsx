import { useEffect, useState } from 'react';
import {
  Alert,
  Anchor,
  Box,
  Button,
  Card,
  CloseButton,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconPrinter } from '@tabler/icons-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { findClassic, type ClassicPiece, type Lesson, type OwnPieceDto } from '@klavio/shared';
import { useLocalized } from '../lesson/useLocalized';
import { endpoints } from '../api/endpoints';
import { useErrorText } from '../auth/useErrorText';
import { useSession } from '../auth/session';
import { Buddy } from '../components/Buddy';
import { usePageTitle } from '../components/usePageTitle';
import { ProgressPending } from '../components/ProgressPending';
import { SongExercise } from '../lesson/SongExercise';
import { PieceExercise } from '../lesson/PieceExercise';
import { useLessonInput } from '../lesson/useLessonInput';
import { HeardNote, InputSwitch } from '../pages/LessonPage';
import { SheetView } from '../print/SongSheetPage';

/** An own piece fetched by its id (shared by playing and printing). */
function useOwnPiece() {
  const { pieceId = '' } = useParams();
  const errorText = useErrorText();
  const [piece, setPiece] = useState<OwnPieceDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    endpoints.piece(pieceId).then(
      (p) => !cancelled && setPiece(p),
      (e: unknown) => !cancelled && setError(errorText(e)),
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieceId, attempt]);
  return { piece, error, retry: () => setAttempt((a) => a + 1) };
}

/**
 * Playing an own piece: like a song of the course – waiting for every note,
 * listening, practising one hand – but just for practice: no stars, no XP.
 */
export function OwnPiecePage() {
  const { t } = useTranslation();
  const { piece, error, retry } = useOwnPiece();
  usePageTitle(piece?.title ?? t('own.title'));
  if (!piece) return <ProgressPending fullPage error={error} onRetry={retry} />;
  return <PracticePiece piece={piece} printTo={`/own/${piece.id}/print`} />;
}

/** A classical piece of the library, to practise. */
export function ClassicPage() {
  const { classicId = '' } = useParams();
  const loc = useLocalized();
  const c = findClassic(classicId);
  usePageTitle(c ? loc(c.title) : null);
  if (!c) return <Navigate to="/songs" replace />;
  return (
    <PracticePiece
      piece={{
        title: loc(c.title),
        composer: loc(c.composer),
        exercise: c.exercise,
        keyboard: c.keyboard,
      }}
      printTo={`/classics/${c.id}/print`}
      source={c.source}
    />
  );
}

/** A classical piece on paper – with its source and licence. */
export function ClassicSheetPage() {
  const { t } = useTranslation();
  const { classicId = '' } = useParams();
  const loc = useLocalized();
  const c = findClassic(classicId);
  usePageTitle(c ? t('sheet.pageTitle', { title: loc(c.title) }) : t('sheet.title'));
  if (!c) return <Navigate to="/songs" replace />;
  return (
    <SheetView
      title={loc(c.title)}
      exercise={c.exercise}
      chip={{ text: loc(c.composer), color: c.exercise.type === 'song' ? 'teal' : 'indigo' }}
      note={t('classics.credit', { by: c.source.by, license: c.source.license })}
    />
  );
}

type Playable = Pick<OwnPieceDto, 'title' | 'composer' | 'exercise' | 'keyboard'>;

/**
 * Playing a piece outside the learning path: like a song of the course –
 * waiting for every note, listening, practising one hand – but just for
 * practice: no stars, no XP.
 */
function PracticePiece({
  piece,
  printTo,
  source,
}: {
  piece: Playable;
  printTo: string;
  source?: ClassicPiece['source'];
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeProfile } = useSession();
  const kids = activeProfile?.uiMode !== 'classic';
  const input = useLessonInput();
  const { stopMicrophone } = input;
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [run, setRun] = useState(0);
  useEffect(() => () => stopMicrophone(), [stopMicrophone]);

  // what the exercises need of a lesson: the keys shown
  const lesson = { keyboard: piece.keyboard, keyLabels: 'c' } as unknown as Lesson;
  const props = {
    lesson,
    inputMode: input.mode,
    kids,
    onCorrect: () => undefined,
    onMistake: () => undefined,
    onDone: () => {
      stopMicrophone();
      setPhase('done');
    },
  };

  return (
    <Box mih="100dvh" p="md" maw={1100} mx="auto">
      <Stack gap="md">
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <CloseButton size="xl" aria-label={t('own.close')} onClick={() => navigate('/songs')} />
          <Title order={1} size="h3" style={{ flex: 1, minWidth: 0 }} lineClamp={1}>
            {piece.title}
          </Title>
          {phase === 'play' && <InputSwitch input={input} />}
        </Group>
        {phase === 'play' && <HeardNote mode={input.mode} />}

        {phase === 'intro' && (
          <Card withBorder radius="xl" padding="xl" maw={560} mx="auto" w="100%">
            <Stack align="center" gap="md">
              <Buddy mood="happy" size={kids ? 110 : 80} />
              <Title order={2} ta="center">
                {piece.title}
              </Title>
              {piece.composer && <Text c="dimmed">{piece.composer}</Text>}
              <Alert color="blue" variant="light" w="100%">
                {t('own.practiceOnly')}
              </Alert>
              <Button
                size="lg"
                onClick={() => {
                  input.startPreferred();
                  setPhase('play');
                }}
                data-testid="own-start"
              >
                {t('own.start')}
              </Button>
              {source && (
                <Text size="xs" c="dimmed" ta="center" data-testid="classic-source">
                  {t('classics.credit', { by: source.by, license: source.license })} ·{' '}
                  <Anchor
                    href={source.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="xs"
                  >
                    {t('classics.license')}
                  </Anchor>
                </Text>
              )}
              <Button
                component={Link}
                to={printTo}
                variant="subtle"
                leftSection={<IconPrinter size={18} />}
              >
                {t('sheet.print')}
              </Button>
            </Stack>
          </Card>
        )}

        {phase === 'play' &&
          (piece.exercise.type === 'piece' ? (
            <PieceExercise key={run} exercise={piece.exercise} {...props} />
          ) : (
            <SongExercise key={run} exercise={piece.exercise} {...props} />
          ))}

        {phase === 'done' && (
          <Card withBorder radius="xl" padding="xl" maw={560} mx="auto" w="100%">
            <Stack align="center" gap="md">
              <Buddy mood="cheer" size={kids ? 120 : 80} />
              <Title order={2} ta="center" data-testid="own-done">
                {t('own.done')}
              </Title>
              <Group>
                <Button
                  variant="default"
                  onClick={() => {
                    setRun((r) => r + 1);
                    input.startPreferred();
                    setPhase('play');
                  }}
                >
                  {t('own.again')}
                </Button>
                <Button component={Link} to="/songs">
                  {t('own.back')}
                </Button>
              </Group>
            </Stack>
          </Card>
        )}
      </Stack>
    </Box>
  );
}

/** An own piece on paper. */
export function OwnSheetPage() {
  const { t } = useTranslation();
  const { piece, error, retry } = useOwnPiece();
  usePageTitle(piece ? t('sheet.pageTitle', { title: piece.title }) : t('sheet.title'));
  if (!piece) return <ProgressPending fullPage error={error} onRetry={retry} />;
  return (
    <SheetView
      title={piece.title}
      exercise={piece.exercise}
      chip={{ text: t('own.chip'), color: 'grape' }}
      note={piece.composer ?? t('own.yours')}
      backTo={`/own/${piece.id}`}
    />
  );
}
