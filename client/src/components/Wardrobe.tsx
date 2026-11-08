import { useState } from 'react';
import { Card, SimpleGrid, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { OUTFITS, type Outfit } from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useSession } from '../auth/session';
import { useErrorText } from '../auth/useErrorText';
import { Figure } from './Figure';
import { notify } from './notify';
import classes from './Wardrobe.module.css';

/**
 * The wardrobe: a cap, a bow, glasses … for one's figure. Each piece comes
 * with a level – nothing is bought, nothing is lost.
 */
export function Wardrobe() {
  const { t } = useTranslation();
  const { activeProfile, refresh } = useSession();
  const errorText = useErrorText();
  const [busy, setBusy] = useState(false);
  if (!activeProfile) return null;
  const level = activeProfile.level;
  const choose = async (outfit: Outfit | null) => {
    if (busy || outfit === activeProfile.outfit) return;
    setBusy(true);
    try {
      await endpoints.updateProfile(activeProfile.id, { outfit });
      await refresh();
    } catch (err) {
      notify(errorText(err), 'red');
    } finally {
      setBusy(false);
    }
  };
  const items: { id: Outfit | null; level: number }[] = [{ id: null, level: 1 }, ...OUTFITS];
  return (
    <Card withBorder radius="lg" padding="lg" data-testid="wardrobe">
      <Stack gap="sm">
        <div>
          <Title order={2} size="h3">
            {t('wardrobe.title')}
          </Title>
          <Text size="sm" c="dimmed">
            {t('wardrobe.hint')}
          </Text>
        </div>
        <SimpleGrid
          cols={{ base: 3, sm: 4, md: 7 }}
          spacing="xs"
          role="radiogroup"
          aria-label={t('wardrobe.title')}
        >
          {items.map(({ id, level: need }) => {
            const locked = level < need;
            const selected = (activeProfile.outfit ?? null) === id;
            const name = t(`wardrobe.items.${id ?? 'none'}`);
            return (
              <UnstyledButton
                key={id ?? 'none'}
                role="radio"
                aria-checked={selected}
                aria-disabled={locked || undefined}
                aria-label={locked ? t('wardrobe.lockedLabel', { name, level: need }) : name}
                className={classes.item}
                data-selected={selected || undefined}
                data-locked={locked || undefined}
                onClick={() => !locked && void choose(id)}
              >
                <Figure avatar={activeProfile.avatar} outfit={id} size={64} still />
                <Text size="xs" fw={700} aria-hidden>
                  {locked ? (
                    <>
                      <IconLock size={12} /> {t('wardrobe.fromLevel', { level: need })}
                    </>
                  ) : (
                    name
                  )}
                </Text>
              </UnstyledButton>
            );
          })}
        </SimpleGrid>
      </Stack>
    </Card>
  );
}
