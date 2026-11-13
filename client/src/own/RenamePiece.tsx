import { useEffect, useState } from 'react';
import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { OwnPieceDto } from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useErrorText } from '../auth/useErrorText';
import { notify } from '../components/notify';

/** Renaming a piece of the library: its title and composer. */
export function RenamePiece({
  piece,
  onClose,
  onSaved,
}: {
  piece: OwnPieceDto | null;
  onClose: () => void;
  onSaved: (p: OwnPieceDto) => void;
}) {
  const { t } = useTranslation();
  const errorText = useErrorText();
  const [title, setTitle] = useState('');
  const [composer, setComposer] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    // a new piece to rename: start from its names
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(piece?.title ?? '');
    setComposer(piece?.composer ?? '');
  }, [piece]);

  const save = async () => {
    if (!piece || !title.trim()) return;
    setBusy(true);
    try {
      const saved = await endpoints.renamePiece(piece.id, {
        title: title.trim().slice(0, 120),
        composer: composer.trim().slice(0, 120) || null,
      });
      onSaved(saved);
      notify(t('own.renamed'));
      onClose();
    } catch (err) {
      notify(errorText(err), 'red');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      opened={!!piece}
      onClose={onClose}
      title={t('own.renameTitle')}
      centered
      closeButtonProps={{ 'aria-label': t('common.close') }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Stack gap="sm">
          <TextInput
            label={t('own.fieldTitle')}
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            maxLength={120}
            required
            data-autofocus
          />
          <TextInput
            label={t('own.fieldComposer')}
            value={composer}
            onChange={(e) => setComposer(e.currentTarget.value)}
            maxLength={120}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={busy} disabled={!title.trim()} data-testid="rename-save">
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
