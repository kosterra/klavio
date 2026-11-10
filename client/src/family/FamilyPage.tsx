import { useEffect, useState } from 'react';
import { Alert, Center, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { localIsoDate, type ProfileOverviewDto } from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useErrorText } from '../auth/useErrorText';
import { usePageTitle } from '../components/usePageTitle';
import { ProgressCard } from './ProgressCard';

/** Parent area: every learner of the family at a glance. */
export function FamilyPage() {
  const { t } = useTranslation();
  usePageTitle(t('family.title'));
  const errorText = useErrorText();
  const [data, setData] = useState<ProfileOverviewDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    endpoints.profileOverview(localIsoDate()).then(setData, (e) => setError(errorText(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Stack gap="lg" maw={1100} mx="auto">
      <div>
        <Title order={1}>{t('family.title')}</Title>
        <Text c="dimmed" fz="lg">
          {t('family.intro')}
        </Text>
      </div>
      {error && <Alert color="red">{error}</Alert>}
      {!data && !error && (
        <Center py="xl">
          <Loader aria-label={t('common.loading')} />
        </Center>
      )}
      {data && (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          {data.map((d) => (
            <ProgressCard key={d.profile.id} data={d} />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
