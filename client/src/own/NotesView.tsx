import { useState } from 'react';
import { Box, Button, Group, SegmentedControl, Stack, Switch, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconPlayerPlay, IconPrinter } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { pieceFingers, songFingers } from '@klavio/shared';
import { SheetMusic, type Printable } from '../print/SongSheetPage';
import { fitBarsPerLine } from '../notation/lineLength';
import classes from './Own.module.css';

const SIZES = { s: 120, m: 150, l: 190 } as const;
type Size = keyof typeof SIZES;

/**
 * «Noten ansehen»: a piece just as sheet music on the screen – for the music
 * stand, without an exercise. Names, fingers and the size of the notes can
 * be chosen; practising and printing are one tap away.
 */
export function NotesView({
  title,
  composer,
  exercise,
  practiceTo,
  printTo,
}: {
  title: string;
  composer: string | null;
  exercise: Printable;
  practiceTo: string;
  printTo: string;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('de') ? 'de' : 'en';
  const [names, setNames] = useState(false);
  const [fingers, setFingers] = useState(false);
  const [size, setSize] = useState<Size>('m');
  const narrow = useMediaQuery('(max-width: 36em)') ?? false;
  const base = size === 'l' ? (narrow ? 1 : 3) : narrow ? 2 : 4;
  const per = fitBarsPerLine(
    base,
    exercise.type === 'piece'
      ? exercise.bars.map((b) => Math.max(b.rh.length, b.lh.length))
      : exercise.bars.map((b) => b.length),
  );
  const hasFingers =
    exercise.type === 'piece'
      ? pieceFingers(exercise).some((b) => [...b.rh, ...b.lh].some((f) => f))
      : songFingers(exercise).some((f) => f);

  return (
    <Box p="md" maw={1300} mx="auto" data-testid="notes-view">
      <Stack gap="sm">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Button
            component={Link}
            to="/songs"
            variant="subtle"
            leftSection={<IconArrowLeft size={18} />}
          >
            {t('sheet.back')}
          </Button>
          <Group gap="xs">
            <Button
              component={Link}
              to={practiceTo}
              leftSection={<IconPlayerPlay size={18} />}
              data-testid="notes-practice"
            >
              {t('notes.practice')}
            </Button>
            <Button
              component={Link}
              to={printTo}
              variant="default"
              leftSection={<IconPrinter size={18} />}
            >
              {t('sheet.print')}
            </Button>
          </Group>
        </Group>
        <div>
          <Title order={1} size="h2">
            {title}
          </Title>
          {composer && <Text c="dimmed">{composer}</Text>}
        </div>
        <Group gap="md" wrap="wrap">
          <SegmentedControl
            value={size}
            onChange={(v) => setSize(v as Size)}
            aria-label={t('notes.size')}
            data={[
              { value: 's', label: t('notes.sizes.s') },
              { value: 'm', label: t('notes.sizes.m') },
              { value: 'l', label: t('notes.sizes.l') },
            ]}
          />
          <Switch
            checked={names}
            onChange={(e) => setNames(e.currentTarget.checked)}
            label={t('sheet.names')}
            size="md"
          />
          {hasFingers && (
            <Switch
              checked={fingers}
              onChange={(e) => setFingers(e.currentTarget.checked)}
              label={t('sheet.fingers')}
              size="md"
            />
          )}
        </Group>
        <div className={classes.notes}>
          <SheetMusic
            exercise={exercise}
            names={names}
            fingers={fingers}
            per={per}
            lang={lang}
            staffHeight={SIZES[size]}
          />
        </div>
      </Stack>
    </Box>
  );
}
