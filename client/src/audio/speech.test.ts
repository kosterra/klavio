import { describe, expect, it } from 'vitest';
import { pickVoice, speakableText } from './speech';

const v = (lang: string, localService = true, name = lang, def = false) => ({
  lang,
  name,
  localService,
  default: def,
});

describe('pickVoice', () => {
  it('prefers the exact language, then the same language from elsewhere', () => {
    expect(pickVoice([v('de-DE'), v('de-CH')], 'de-CH')?.lang).toBe('de-CH');
    expect(pickVoice([v('en-US'), v('de-AT')], 'de-CH')?.lang).toBe('de-AT');
  });

  it('prefers a British voice for English', () => {
    expect(pickVoice([v('en-US'), v('en-GB')], 'en')?.lang).toBe('en-GB');
    expect(pickVoice([v('en-US')], 'en')?.lang).toBe('en-US');
  });

  it('uses only voices on the device – online voices would send the text away', () => {
    expect(pickVoice([v('de-DE', false)], 'de-CH')).toBeNull();
    expect(pickVoice([], 'de-CH')).toBeNull();
  });

  it('takes the device default within a group', () => {
    expect(pickVoice([v('de-DE', true, 'A'), v('de-DE', true, 'B', true)], 'de-CH')?.name).toBe(
      'B',
    );
  });
});

describe('speakableText', () => {
  it('removes emoji, arrows and quotation marks and speaks ♯ and ♭', () => {
    expect(speakableText('Super! 🎉 Spiel «C♯» → weiter', 'de-CH')).toBe(
      'Super! Spiel C Kreuz weiter',
    );
    expect(speakableText('B♭ and F♯', 'en')).toBe('B flat and F sharp');
  });
});
