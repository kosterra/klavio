import { useCallback, useEffect, useRef } from 'react';
import { localIsoDate } from '@klavio/shared';
import { useSession } from '../auth/session';
import { useNoteEvents } from '../input/noteBus';
import { addPractice, flushPractice } from '../offline/practice';

/** Without a key played or a tap for this long, the time stops counting. */
export const IDLE_MS = 90_000;
/** Counted time is kept on the device (and sent) every this many seconds. */
const PIECE_SECONDS = 60;

/**
 * Counts practice time on a page – free play, games, pieces, the lesson's
 * explanations – for the daily goal: only while the page is visible and
 * someone played a note or tapped within the last 90 seconds. The time is
 * kept on the device first, so it shows at once and survives being offline.
 */
export function usePracticeTime(active = true): { add: (seconds: number) => void } {
  const { me, activeProfile } = useSession();
  const userId = me?.user.id;
  const profileId = activeProfile?.id;
  const lastInput = useRef(0);

  useNoteEvents((e) => {
    if (e.type === 'note-on') lastInput.current = performance.now();
  });
  useEffect(() => {
    lastInput.current = performance.now();
    const touched = () => {
      lastInput.current = performance.now();
    };
    window.addEventListener('pointerdown', touched);
    window.addEventListener('keydown', touched);
    return () => {
      window.removeEventListener('pointerdown', touched);
      window.removeEventListener('keydown', touched);
    };
  }, []);

  const add = useCallback(
    (seconds: number) => {
      if (!userId || !profileId || seconds < 1) return;
      addPractice({ userId, profileId, localDate: localIsoDate(), seconds: Math.round(seconds) });
      if (navigator.onLine !== false) void flushPractice(userId).catch(() => undefined);
    },
    [userId, profileId],
  );

  useEffect(() => {
    if (!active || !userId || !profileId) return;
    let counted = 0;
    let previous = performance.now();
    const keep = () => {
      const whole = Math.floor(counted);
      counted -= whole;
      add(whole);
    };
    const tick = window.setInterval(() => {
      const now = performance.now();
      // a sleeping tab ticks late: never more than a moment at once
      const step = Math.min(2, (now - previous) / 1000);
      previous = now;
      if (document.visibilityState === 'visible' && now - lastInput.current < IDLE_MS) {
        counted += step;
      }
      if (counted >= PIECE_SECONDS) keep();
    }, 1000);
    const hidden = () => {
      if (document.visibilityState === 'hidden') keep();
    };
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', keep);
    return () => {
      window.clearInterval(tick);
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', keep);
      keep();
    };
  }, [active, userId, profileId, add]);

  return { add };
}
