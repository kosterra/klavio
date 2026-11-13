import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Group,
  Loader,
  Modal,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { ImportedPiece, PieceLevel } from '@klavio/shared';
import { endpoints, type LibraryResult, type LibrarySource } from '../api/endpoints';
import { previewParts, startPreview, stopPreview, usePreview } from '../audio/preview';
import { ListenIcon } from '../components/PreviewButton';
import { PieceReadError, readPieceFile } from '../import/readPiece';
import { useProgress } from '../lesson/useProgress';
import { LevelBadge } from './LevelBadge';
import { PieceRow } from './PieceRow';
import classes from './PieceRow.module.css';

/** Files fetched for a «Hörprobe» – taking the piece over then needs no second download. */
const fetched = new Map<string, { file: File; piece: ImportedPiece | PieceReadError }>();

async function load(id: string) {
  let hit = fetched.get(id);
  if (!hit) {
    const file = await endpoints.libraryFile(id);
    let piece: ImportedPiece | PieceReadError;
    try {
      piece = await readPieceFile(file);
    } catch (err) {
      if (!(err instanceof PieceReadError)) throw err;
      piece = err;
    }
    hit = { file, piece };
    fetched.set(id, hit);
  }
  return hit;
}

/**
 * «Hörprobe» of a library piece: fetched and read on the first tap, then the
 * first bars are played like any other preview. A piece Klavio cannot read
 * says why instead.
 */
function LibraryPreview({
  result,
  onProblem,
}: {
  result: LibraryResult;
  onProblem: (text: string | null) => void;
}) {
  const { t } = useTranslation();
  const { playing, me } = usePreview();
  const [loading, setLoading] = useState(false);
  const listen = async () => {
    if (playing) return stopPreview();
    setLoading(true);
    try {
      const { piece } = await load(result.id);
      if (piece instanceof PieceReadError) {
        onProblem(
          t('own.libraryCannotRead', {
            title: result.title,
            reason: t(`own.errors.${piece.key}`, piece.params),
          }),
        );
        return;
      }
      onProblem(null);
      startPreview(me, previewParts(piece.exercise), piece.exercise.tempo);
    } catch {
      onProblem(t('own.libraryUnreachable'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <ListenIcon
      playing={playing}
      loading={loading}
      title={result.title}
      onClick={() => void listen()}
      testId="library-listen"
    />
  );
}

/** pieces whose level is not known yet go last */
const levelOf = (r: LibraryResult): PieceLevel | 6 => r.level ?? 6;

/**
 * «Aus der Bibliothek»: search the sheet music library the admin switched on
 * and take a piece over – it is read like an uploaded file and shown before
 * it is saved. Every piece shows its level (estimated on the server), the
 * easiest first.
 */
export function LibraryPicker({
  opened,
  onClose,
  onFile,
}: {
  opened: boolean;
  onClose: () => void;
  /** the chosen file, to read like an upload, with its name and origin in the library */
  onFile: (
    file: File,
    from: { title: string; composer: string | null; source: string },
  ) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debounced] = useDebouncedValue(query, 300);
  const [results, setResults] = useState<LibraryResult[] | null>(null);
  const [pending, setPending] = useState(false);
  const [sources, setSources] = useState<LibrarySource[]>([]);
  const [only, setOnly] = useState<'all' | LibrarySource['key']>('all');
  const [problem, setProblem] = useState<string | null>(null);
  const [taking, setTaking] = useState<string | null>(null);
  const [sort, setSort] = useState<'level' | 'title'>('level');
  const [round, setRound] = useState(0);
  const { played, progress } = useProgress();
  const done = progress ? played : null;

  useEffect(() => {
    if (!opened) return;
    let cancelled = false;
    endpoints.library(debounced).then(
      (r) => {
        if (cancelled) return;
        setResults(r.results);
        setPending(r.pending);
        setSources(r.sources);
        setProblem(null);
      },
      () => {
        if (!cancelled) setProblem(t('own.libraryUnreachable'));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [opened, debounced, t, round]);

  // the server is still estimating levels: ask again in a moment (a few times)
  useEffect(() => {
    if (!opened || !pending || round >= 20) return;
    const timer = setTimeout(() => setRound((n) => n + 1), 3000);
    return () => clearTimeout(timer);
  }, [opened, pending, round]);

  const sourceName = (key: LibrarySource['key']) => sources.find((s) => s.key === key)?.name ?? key;
  /** "Mutopia Project · CC BY-SA 3.0" */
  const origin = (r: LibraryResult) =>
    [
      sourceName(r.source),
      r.licence && (r.licence === 'Public Domain' ? t('own.publicDomain') : r.licence),
    ]
      .filter(Boolean)
      .join(' · ');

  const sorted = useMemo(
    () =>
      (results ?? [])
        .filter((r) => only === 'all' || r.source === only)
        .sort((a, b) =>
          sort === 'level'
            ? levelOf(a) - levelOf(b) || a.title.localeCompare(b.title)
            : a.title.localeCompare(b.title),
        ),
    [results, sort, only],
  );

  const take = async (r: LibraryResult) => {
    setTaking(r.id);
    try {
      stopPreview();
      await onFile((await load(r.id)).file, {
        title: r.title,
        composer: r.composer ?? null,
        source: origin(r),
      });
      onClose();
    } catch {
      setProblem(t('own.libraryUnreachable'));
    } finally {
      setTaking(null);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('own.libraryTitle')}
      size="lg"
      closeButtonProps={{ 'aria-label': t('common.close') }}
    >
      <Stack gap="sm" data-testid="library">
        <TextInput
          leftSection={<IconSearch size={18} />}
          placeholder={t('own.librarySearch')}
          aria-label={t('own.librarySearch')}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          data-autofocus
          data-testid="library-search"
        />
        <SegmentedControl
          fullWidth
          size="sm"
          value={sort}
          onChange={(v) => setSort(v as 'level' | 'title')}
          aria-label={t('own.librarySort')}
          data={[
            { value: 'level', label: t('own.librarySortLevel') },
            { value: 'title', label: t('own.librarySortTitle') },
          ]}
        />
        {sources.length > 1 && (
          <SegmentedControl
            fullWidth
            size="sm"
            value={only}
            onChange={(v) => setOnly(v as typeof only)}
            aria-label={t('own.librarySources')}
            data={[
              { value: 'all', label: t('own.libraryAll') },
              ...sources.map((s) => ({ value: s.key, label: s.name })),
            ]}
          />
        )}
        {pending && (
          <Group gap={6} wrap="nowrap">
            <Loader size="xs" aria-hidden />
            <Text size="xs" c="dimmed">
              {t('own.libraryLooking')}
            </Text>
          </Group>
        )}
        {problem && (
          <Alert color="red" variant="light" role="status">
            {problem}
          </Alert>
        )}
        {results === null && !problem && <Loader size="sm" aria-label={t('common.loading')} />}
        {results?.length === 0 && <Text size="sm">{t('own.libraryNone')}</Text>}
        <Stack gap="xs" role="list">
          {sorted.map((r) => (
            <div key={r.id} role="listitem">
              <PieceRow
                title={r.title}
                meta={
                  <>
                    {[
                      r.composer,
                      r.hands && t(r.hands === 2 ? 'own.bothHands' : 'own.oneHand'),
                      r.bars && t('own.bars', { count: r.bars }),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    <span className={classes.origin}>{origin(r)}</span>
                  </>
                }
                badge={
                  r.level ? (
                    <LevelBadge
                      level={r.level}
                      ready={r.level <= 3 && !!r.lessonId && !!done?.has(r.lessonId)}
                    />
                  ) : undefined
                }
                listen={<LibraryPreview result={r} onProblem={setProblem} />}
                trailing={
                  <ActionIcon
                    variant="light"
                    radius="xl"
                    size={48}
                    loading={taking === r.id}
                    disabled={!!taking && taking !== r.id}
                    onClick={() => void take(r)}
                    aria-label={t('own.libraryAddLabel', { title: r.title })}
                    data-testid="library-add"
                  >
                    <IconPlus size={24} />
                  </ActionIcon>
                }
              />
            </div>
          ))}
        </Stack>
        {sources.map((s) => (
          <Text size="xs" c="dimmed" key={s.key}>
            {t(`own.librarySource.${s.key}`, { name: s.name })}
          </Text>
        ))}
        {sources.length > 0 && (
          <Text size="xs" c="dimmed">
            {t('own.libraryHow')}
          </Text>
        )}
      </Stack>
    </Modal>
  );
}
