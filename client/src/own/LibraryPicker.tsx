import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { IconDownload, IconEar, IconPlayerStop, IconSearch } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { endpoints } from '../api/endpoints';
import { previewParts, startPreview, stopPreview, usePreview } from '../audio/preview';
import { PieceReadError, readPieceFile } from '../import/readPiece';
import type { ImportedPiece } from '@klavio/shared';

type Result = { id: string; title: string };

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
  result: Result;
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
    <ActionIcon
      variant={playing ? 'filled' : 'default'}
      size="xl"
      loading={loading}
      aria-label={t(playing ? 'preview.stop' : 'preview.listen', { title: result.title })}
      aria-pressed={playing}
      onClick={() => void listen()}
      data-testid="library-listen"
    >
      {playing ? <IconPlayerStop size={22} /> : <IconEar size={22} />}
    </ActionIcon>
  );
}

/**
 * «Aus der Bibliothek»: search the sheet music library the admin switched on
 * and take a piece over – it is read like an uploaded file and shown before
 * it is saved.
 */
export function LibraryPicker({
  opened,
  onClose,
  onFile,
}: {
  opened: boolean;
  onClose: () => void;
  /** the chosen file, to read like an upload, and its title in the library */
  onFile: (file: File, title: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debounced] = useDebouncedValue(query, 300);
  const [results, setResults] = useState<Result[] | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [taking, setTaking] = useState<string | null>(null);

  useEffect(() => {
    if (!opened) return;
    let cancelled = false;
    endpoints.library(debounced).then(
      (r) => {
        if (cancelled) return;
        setResults(r.results);
        setSource(r.source.name);
        setProblem(null);
      },
      () => {
        if (!cancelled) setProblem(t('own.libraryUnreachable'));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [opened, debounced, t]);

  const take = async (r: Result) => {
    setTaking(r.id);
    try {
      stopPreview();
      await onFile((await load(r.id)).file, r.title);
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
        {source && (
          <Text size="xs" c="dimmed">
            {t('own.librarySource', { name: source })}
          </Text>
        )}
        {problem && (
          <Alert color="red" variant="light" role="status">
            {problem}
          </Alert>
        )}
        {results === null && !problem && <Loader size="sm" aria-label={t('common.loading')} />}
        {results?.length === 0 && <Text size="sm">{t('own.libraryNone')}</Text>}
        <Stack gap={4} role="list">
          {results?.map((r) => (
            <Group key={r.id} justify="space-between" wrap="nowrap" gap="sm" role="listitem">
              <Text size="sm" fw={600} style={{ minWidth: 0 }} truncate>
                {r.title}
              </Text>
              <Group gap="xs" wrap="nowrap">
                <LibraryPreview result={r} onProblem={setProblem} />
                <Button
                  size="sm"
                  variant="default"
                  leftSection={<IconDownload size={16} />}
                  loading={taking === r.id}
                  disabled={!!taking}
                  onClick={() => void take(r)}
                  aria-label={t('own.libraryAddLabel', { title: r.title })}
                >
                  {t('own.libraryAdd')}
                </Button>
              </Group>
            </Group>
          ))}
        </Stack>
      </Stack>
    </Modal>
  );
}
