import { useEffect, useState } from 'react';
import { Alert, Button, FileButton, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import {
  IconBooks,
  IconFileMusic,
  IconNotes,
  IconPencil,
  IconPrinter,
  IconSearch,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { MAX_OWN_PIECES, UNTITLED, type ImportedPiece, type OwnPieceDto } from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useErrorText } from '../auth/useErrorText';
import { ConfirmModal } from '../components/ConfirmModal';
import { notify } from '../components/notify';
import { PieceReadError, readPieceFile } from '../import/readPiece';
import { PreviewButton } from '../components/PreviewButton';
import { useProgress } from '../lesson/useProgress';
import { ReadinessNote } from './ReadinessNote';
import { RenamePiece } from './RenamePiece';
import { LevelBadge } from './LevelBadge';
import { PieceRow } from './PieceRow';
import { levelFor } from './level';
import { LibraryPicker } from './LibraryPicker';
import { useSession } from '../auth/session';

/** from this many pieces on, the library can be searched */
const SEARCH_FROM = 6;

/**
 * «Eigene Stücke»: a family brings its own notes (MusicXML from MuseScore,
 * Finale, Sibelius, Dorico …) – to practise like a song of the course (no
 * stars) and to print. The file is read on the device; only the notes are
 * stored with the account.
 */
export function OwnPieces({ heading = true }: { heading?: boolean } = {}) {
  const { t } = useTranslation();
  const errorText = useErrorText();
  const [pieces, setPieces] = useState<OwnPieceDto[] | null>(null);
  const [draft, setDraft] = useState<ImportedPiece | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<OwnPieceDto | null>(null);
  const [renaming, setRenaming] = useState<OwnPieceDto | null>(null);
  const [query, setQuery] = useState('');
  const [library, setLibrary] = useState(false);
  const { config } = useSession();
  // the lessons done: from when on a piece is playable
  const { played, progress } = useProgress();
  const done = progress ? played : null;

  useEffect(() => {
    endpoints.pieces().then(setPieces, () => setPieces([]));
  }, []);

  /** `title`: the name it has where it comes from, for a file without a title of its own */
  const read = async (file: File | null, title?: string) => {
    setDraft(null);
    setProblem(null);
    if (!file) return;
    try {
      const piece = await readPieceFile(file);
      setDraft(title && piece.title === UNTITLED ? { ...piece, title } : piece);
    } catch (err) {
      setProblem(
        err instanceof PieceReadError ? t(`own.errors.${err.key}`, err.params) : errorText(err),
      );
    }
  };

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      const saved = await endpoints.addPiece({
        title: draft.title.slice(0, 120),
        composer: draft.composer?.slice(0, 120) ?? null,
        exercise: draft.exercise,
        keyboard: draft.keyboard,
      });
      setPieces((p) => [...(p ?? []), saved]);
      setDraft(null);
      notify(t('own.saved', { title: saved.title }));
    } catch (err) {
      setProblem(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!removing) return;
    try {
      await endpoints.deletePiece(removing.id);
      setPieces((p) => (p ?? []).filter((x) => x.id !== removing.id));
    } catch (err) {
      notify(errorText(err), 'red');
    } finally {
      setRemoving(null);
    }
  };

  const full = (pieces?.length ?? 0) >= MAX_OWN_PIECES;
  // the library: searched by title and composer
  const q = query.trim().toLowerCase();
  const shown = (pieces ?? []).filter(
    (p) => !q || `${p.title} ${p.composer ?? ''}`.toLowerCase().includes(q),
  );

  return (
    <section
      aria-labelledby={heading ? 'own-title' : undefined}
      aria-label={heading ? undefined : t('own.title')}
      data-testid="own-pieces"
    >
      {heading && (
        <Title order={2} size="h4" mb={4} id="own-title">
          {t('own.title')}
        </Title>
      )}
      <Text size="sm" c="dimmed" mb="xs">
        {t('own.intro')}
      </Text>
      <Stack gap="xs">
        {(pieces?.length ?? 0) >= SEARCH_FROM && (
          <TextInput
            leftSection={<IconSearch size={18} />}
            placeholder={t('own.search')}
            aria-label={t('own.search')}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            data-testid="own-search"
          />
        )}
        {shown.map((p) => {
          const { level, ready } = levelFor(p.exercise, done);
          return (
            <PieceRow
              key={p.id}
              to={`/own/${p.id}`}
              testId={`own-${p.id}`}
              icon={<IconFileMusic size={24} />}
              color="grape.7"
              title={p.title}
              meta={[
                p.composer,
                t(p.exercise.type === 'piece' ? 'own.bothHands' : 'own.oneHand'),
                t('own.bars', { count: p.exercise.bars.length }),
              ]
                .filter(Boolean)
                .join(' · ')}
              badge={<LevelBadge level={level} ready={ready} />}
              listen={<PreviewButton exercise={p.exercise} title={p.title} />}
              actions={[
                {
                  label: t('notes.openLabel', { title: p.title }),
                  icon: <IconNotes size={18} />,
                  to: `/own/${p.id}/notes`,
                },
                {
                  label: t('sheet.printSong', { title: p.title }),
                  icon: <IconPrinter size={18} />,
                  to: `/own/${p.id}/print`,
                },
                {
                  label: t('own.rename', { title: p.title }),
                  icon: <IconPencil size={18} />,
                  onClick: () => setRenaming(p),
                },
                {
                  label: t('own.remove', { title: p.title }),
                  icon: <IconTrash size={18} />,
                  onClick: () => setRemoving(p),
                  danger: true,
                },
              ]}
            />
          );
        })}
        {query && shown.length === 0 && (
          <Text size="sm" c="dimmed">
            {t('own.noMatch')}
          </Text>
        )}

        {draft && (
          <Alert color="grape" variant="light" data-testid="own-draft">
            <Stack gap="xs">
              <Text fw={800}>{draft.title}</Text>
              <Text size="sm">
                {t(draft.kind === 'piece' ? 'own.previewPiece' : 'own.previewSong', {
                  count: draft.exercise.bars.length,
                  time: draft.exercise.time,
                })}
              </Text>
              <ReadinessNote exercise={draft.exercise} completed={done} />
              <Group gap="xs">
                <Button onClick={() => void save()} loading={busy} data-testid="own-save">
                  {t('own.save')}
                </Button>
                <Button variant="subtle" color="gray" onClick={() => setDraft(null)}>
                  {t('common.cancel')}
                </Button>
              </Group>
            </Stack>
          </Alert>
        )}
        {problem && (
          <Alert color="red" variant="light" data-testid="own-problem">
            {problem}
          </Alert>
        )}

        <Group gap="sm">
          <FileButton onChange={(f) => void read(f)} accept=".musicxml,.xml,.mxl,.mid,.midi">
            {(props) => (
              <Button
                {...props}
                variant="light"
                leftSection={<IconUpload size={18} />}
                disabled={full}
                w="fit-content"
                data-testid="own-import"
              >
                {t('own.import')}
              </Button>
            )}
          </FileButton>
          {config?.pieceLibrary && (
            <Button
              variant="default"
              leftSection={<IconBooks size={18} />}
              disabled={full}
              onClick={() => setLibrary(true)}
              data-testid="own-library"
            >
              {t('own.library')}
            </Button>
          )}
        </Group>
        <LibraryPicker opened={library} onClose={() => setLibrary(false)} onFile={read} />
        <Text size="xs" c="dimmed">
          {full ? t('own.full', { count: MAX_OWN_PIECES }) : t('own.how')}
        </Text>
      </Stack>
      <RenamePiece
        piece={renaming}
        onClose={() => setRenaming(null)}
        onSaved={(saved) =>
          setPieces((list) => (list ?? []).map((x) => (x.id === saved.id ? saved : x)))
        }
      />
      <ConfirmModal
        opened={!!removing}
        title={t('own.removeTitle', { title: removing?.title ?? '' })}
        stay={t('common.cancel')}
        go={t('common.delete')}
        danger
        onStay={() => setRemoving(null)}
        onGo={() => void remove()}
      />
    </section>
  );
}
