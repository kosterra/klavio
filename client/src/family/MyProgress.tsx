import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localIsoDate, type ProfileOverviewDto } from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useSession } from '../auth/session';
import { ProgressCard } from './ProgressCard';

/** «Mein Profil»: one's own progress and practice history. */
export function MyProgress() {
  const { t } = useTranslation();
  const { activeProfile } = useSession();
  const [data, setData] = useState<ProfileOverviewDto | null>(null);
  const id = activeProfile?.id;
  useEffect(() => {
    if (!id) return;
    endpoints.profileOverview(localIsoDate()).then(
      (all) => setData(all.find((d) => d.profile.id === id) ?? null),
      () => setData(null), // offline: the card simply stays away
    );
  }, [id]);
  return data ? <ProgressCard data={data} title={t('family.mine')} /> : null;
}
