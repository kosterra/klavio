import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Button,
  Card,
  FileButton,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconFileMusic,
  IconPlayerPlay,
  IconPrinter,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  MAX_OWN_PIECES,
  MidiImportError,
  MusicXmlImportError,
  importMusicXml,
  midiToMusicXml,
  type ImportedPiece,
  type OwnPieceDto,
} from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useErrorText } from '../auth/useErrorText';
import { ConfirmModal } from '../components/ConfirmModal';
import { notify } from '../components/notify';
import { musicXmlText } from '../import/mxl';

/**
 * «Eigene Stücke»: a family brings its own notes (MusicXML from MuseScore,
 * Finale, Sibelius, Dorico …) – to practise like a song of the course (no
 * stars) and to print. The file is read on the device; only the notes are
 * stored with the account.
 */
export function OwnPieces() {
  const { t } = useTranslation();
  const errorText = useErrorText();
  const [pieces, setPieces] = useState<OwnPieceDto[] | null>(null);
  const [draft, setDraft] = useState<ImportedPiece | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<OwnPieceDto | null>(null);

  useEffect(() => {
    endpoints.pieces().then(setPieces, () => setPieces([]));
  }, []);

  const read = async (file: File | null) => {
    setDraft(null);
    setProblem(null);
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setProblem(t('own.errors.TOO_BIG'));
      return;
    }
    try {
      // a MIDI file goes through MusicXML (named after the file)
      const midi = /\.midi?$/i.test(file.name);
      const xml = midi
        ? midiToMusicXml(new Uint8Array(await file.arrayBuffer()), {
            title: file.name.replace(/\.midi?$/i, '').replace(/[-_]+/g, ' '),
          })
        : await musicXmlText(file);
      setDraft(importMusicXml(xml));
    } catch (err) {
      setProblem(
        err instanceof MusicXmlImportError
          ? t(`own.errors.${err.code}`, { bar: err.bar })
          : err instanceof MidiImportError
            ? t('own.errors.NOT_MIDI')
            : t('own.errors.NOT_MUSICXML'),
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

  return (
    <section aria-labelledby="own-title" data-testid="own-pieces">
      <Title order={2} size="h4" mb={4} id="own-title">
        {t('own.title')}
      </Title>
      <Text size="sm" c="dimmed" mb="xs">
        {t('own.intro')}
      </Text>
      <Stack gap="xs">
        {pieces?.map((p) => (
          <Group key={p.id} gap="xs" wrap="nowrap" align="stretch">
            <Card
              component={Link}
              to={`/own/${p.id}`}
              withBorder
              radius="lg"
              padding="sm"
              style={{ flex: 1, minWidth: 0 }}
              data-testid={`own-${p.id}`}
            >
              <Group wrap="nowrap" gap="sm">
                <ThemeIcon size={44} radius="xl" color="grape.7" aria-hidden>
                  <IconFileMusic size={24} />
                </ThemeIcon>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={800} lh={1.25} truncate>
                    {p.title}
                  </Text>
                  <Text size="sm" c="dimmed" truncate>
                    {p.composer ??
                      t(p.exercise.type === 'piece' ? 'own.kindPiece' : 'own.kindSong')}
                  </Text>
                </div>
                <IconPlayerPlay size={22} aria-hidden />
              </Group>
            </Card>
            <ActionIcon
              component={Link}
              to={`/own/${p.id}/print`}
              variant="default"
              radius="lg"
              size="auto"
              w={52}
              aria-label={t('sheet.printSong', { title: p.title })}
            >
              <IconPrinter size={22} />
            </ActionIcon>
            <ActionIcon
              variant="default"
              radius="lg"
              size="auto"
              w={52}
              aria-label={t('own.remove', { title: p.title })}
              onClick={() => setRemoving(p)}
            >
              <IconTrash size={22} />
            </ActionIcon>
          </Group>
        ))}

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
        <Text size="xs" c="dimmed">
          {full ? t('own.full', { count: MAX_OWN_PIECES }) : t('own.how')}
        </Text>
      </Stack>
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
