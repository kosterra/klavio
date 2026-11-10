import { describe, expect, it } from 'vitest';
import { initialLanguage, languageFromUrl } from './language';

describe('initialLanguage', () => {
  it('keeps the language chosen on this device', () => {
    expect(initialLanguage('en', ['de-CH'])).toBe('en');
    expect(initialLanguage('de-CH', ['en-GB'])).toBe('de-CH');
  });

  it('otherwise follows the first browser language we offer', () => {
    expect(initialLanguage(null, ['de-DE', 'en'])).toBe('de-CH');
    expect(initialLanguage(null, ['en-US'])).toBe('en');
    expect(initialLanguage(null, ['fr-CH', 'en-GB', 'de'])).toBe('en');
  });

  it('falls back to Swiss German for unknown values', () => {
    expect(initialLanguage('xx', [])).toBe('de-CH');
    expect(initialLanguage(null, ['it-CH'])).toBe('de-CH');
  });

  it('takes the language from the address (links from search engines)', () => {
    expect(languageFromUrl('?lang=en')).toBe('en');
    expect(languageFromUrl('?x=1&lang=de')).toBe('de-CH');
    expect(languageFromUrl('')).toBeNull();
  });
});
