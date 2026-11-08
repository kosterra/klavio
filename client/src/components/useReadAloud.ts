import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localVoiceFor, onVoicesReady, stopSpeaking } from '../audio/speech';
import { useSession } from '../auth/session';

const AUTO_KEY = 'klavio-read-aloud';

function readAutoMap(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(AUTO_KEY) ?? '{}') as Record<string, boolean>;
  } catch {
    return {};
  }
}

const autoListeners = new Set<() => void>();

/**
 * «Klavi liest vor» per profile on this device: on by default for Kids
 * profiles (many children cannot read yet), off for Classic.
 */
export function useAutoRead(): [boolean, (on: boolean) => void] {
  const { activeProfile } = useSession();
  const [, rerender] = useState(0);
  useEffect(() => {
    const l = () => rerender((n) => n + 1);
    autoListeners.add(l);
    return () => void autoListeners.delete(l);
  }, []);
  const id = activeProfile?.id;
  const fallback = activeProfile ? activeProfile.uiMode !== 'classic' : false;
  const on = id ? (readAutoMap()[id] ?? fallback) : false;
  const set = (value: boolean) => {
    if (!id) return;
    try {
      localStorage.setItem(AUTO_KEY, JSON.stringify({ ...readAutoMap(), [id]: value }));
    } catch {
      // storage unavailable: the default stays
    }
    if (!value) stopSpeaking();
    autoListeners.forEach((l) => l());
  };
  return [on, set];
}

/** Is there a voice on this device for the current language? (voices load late) */
export function useCanSpeak(): boolean {
  const { i18n } = useTranslation();
  const [can, setCan] = useState(false);
  useEffect(() => onVoicesReady(() => setCan(!!localVoiceFor(i18n.language))), [i18n.language]);
  return can;
}
