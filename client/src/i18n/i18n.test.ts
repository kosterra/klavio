import { describe, expect, it } from 'vitest';
import deCH from './de-CH.json';
import en from './en.json';

type Tree = { [k: string]: string | Tree };
const keys = (o: Tree, p = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'string' ? [p + k] : keys(v, `${p}${k}.`)));
const values = (o: Tree): string[] =>
  Object.values(o).flatMap((v) => (typeof v === 'string' ? [v] : values(v)));

describe('translations', () => {
  it('en has exactly the same keys as de-CH', () => {
    expect(keys(en).sort()).toEqual(keys(deCH).sort());
  });

  it('Swiss German spelling: no ß', () => {
    expect(values(deCH).filter((v) => v.includes('ß'))).toEqual([]);
  });

  it('keeps interpolation placeholders consistent', () => {
    const ph = (s: string) => (s.match(/{{\w+}}/g) ?? []).sort().join();
    const flatEn = Object.fromEntries(
      keys(en).map((k) => [k, k.split('.').reduce<Tree | string>((o, x) => (o as Tree)[x]!, en)]),
    );
    for (const k of keys(deCH)) {
      const de = k.split('.').reduce<Tree | string>((o, x) => (o as Tree)[x]!, deCH) as string;
      expect(ph(flatEn[k] as string), k).toBe(ph(de));
    }
  });
});
