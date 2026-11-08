import { inputHub } from '../input/noteBus';

/**
 * Klavi reads texts aloud with the speech synthesis built into the browser.
 * Only voices installed on the device are used (`localService`), so the text
 * never leaves the device. While Klavi speaks the microphone is muted – it
 * would otherwise hear the voice as notes.
 */

export interface VoiceLike {
  lang: string;
  name: string;
  localService: boolean;
  default?: boolean;
}

/**
 * The best local voice for a language: exactly the language (de-CH), then the
 * same language from elsewhere (de-DE, de-AT), the device default first.
 * Returns null when the device has no local voice for it.
 */
export function pickVoice<V extends VoiceLike>(voices: readonly V[], lang: string): V | null {
  const base = lang.slice(0, 2).toLowerCase();
  const local = voices.filter((v) => v.localService);
  const exact = local.filter((v) => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase());
  const same = local.filter((v) => v.lang.toLowerCase().startsWith(base));
  // English: British spelling in the texts, so prefer a British voice
  const preferred = base === 'en' ? same.filter((v) => /en[-_]gb/i.test(v.lang)) : [];
  for (const group of [exact, preferred, same]) {
    const voice = group.find((v) => v.default) ?? group[0];
    if (voice) return voice;
  }
  return null;
}

/** Tidy a text for speaking: no emoji, arrows or quotation marks, ♯/♭ as words. */
export function speakableText(text: string, lang: string): string {
  const de = lang.startsWith('de');
  return text
    .replace(/♯/g, de ? ' Kreuz' : ' sharp')
    .replace(/♭/g, de ? ' be' : ' flat')
    .replace(/[«»“”„"]/g, '')
    .replace(/[→←↑↓·•]/g, ' ')
    .replace(/\p{Extended_Pictographic}️?/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null;
}

export function localVoiceFor(lang: string): SpeechSynthesisVoice | null {
  const s = synth();
  return s ? pickVoice(s.getVoices(), lang) : null;
}

let current: SpeechSynthesisUtterance | null = null;

// which text is being spoken (an id chosen by the caller) – for the buttons
let speakingId: string | null = null;
const listeners = new Set<() => void>();
function setSpeaking(id: string | null) {
  speakingId = id;
  listeners.forEach((l) => l());
}
export function subscribeSpeaking(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function currentSpeakingId(): string | null {
  return speakingId;
}

/** Stop speaking (and let the microphone listen again shortly after). */
export function stopSpeaking() {
  const s = synth();
  if (!s || !current) return;
  current = null;
  s.cancel();
  setSpeaking(null);
  inputHub.muteMicrophoneUntil(performance.now() + 300);
}

/**
 * Speak a text; a running text is stopped first. Returns false when there is
 * no local voice for the language.
 */
export function speak(text: string, lang: string, id = 'text'): boolean {
  const s = synth();
  const voice = localVoiceFor(lang);
  const clean = speakableText(text, lang);
  if (!s || !voice || !clean) return false;
  s.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.92; // a little slower, for children
  u.pitch = 1.05;
  const finish = () => {
    if (current !== u) return; // replaced by a newer text
    current = null;
    setSpeaking(null);
    // a short tail: the room still echoes the voice for a moment
    inputHub.muteMicrophoneUntil(performance.now() + 400);
  };
  u.onend = finish;
  u.onerror = finish;
  current = u;
  setSpeaking(id);
  inputHub.muteMicrophoneUntil(Infinity);
  s.speak(u);
  return true;
}

/** Calls `cb` once the browser's voice list is known (it loads asynchronously). */
export function onVoicesReady(cb: () => void): () => void {
  const s = synth();
  if (!s) return () => {};
  cb();
  s.addEventListener('voiceschanged', cb);
  return () => s.removeEventListener('voiceschanged', cb);
}
