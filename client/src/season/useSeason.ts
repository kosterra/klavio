import { useState } from 'react';
import { useSession } from '../auth/session';
import { previewDate, readSeasonPreview } from './preview';
import { seasonAt, type Season } from './season';

/**
 * The festive season right now (worked out once per page) – or, for an admin
 * trying it out, on the day picked under «Verwaltung».
 */
export function useSeason(): Season {
  const { me } = useSession();
  const admin = me?.user.role === 'admin';
  const [season] = useState(() => {
    const preview = admin ? readSeasonPreview() : null;
    return seasonAt(preview ? previewDate(preview) : new Date());
  });
  return season;
}
