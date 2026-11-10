import { useState } from 'react';
import { seasonAt, type Season } from './season';

/** The festive season right now (worked out once per page). */
export function useSeason(): Season {
  const [season] = useState(() => seasonAt());
  return season;
}
