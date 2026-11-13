import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CookieJar, ORIGIN, setupTestApp } from './helpers.js';
import { AppSettings } from '../src/models/index.js';
import { readFileSync } from 'node:fs';
import {
  analyseLibrary,
  cleanComposer,
  libraryEntries,
  parseMutopiaTable,
  resetLibraryCache,
  searchLibrary,
  shortLicence,
  titleOf,
} from '../src/lib/pieceLibrary.js';

/** a small MusicXML file: two bars for one hand */
const SONG = readFileSync(new URL('../../e2e/fixtures/mein-lied.musicxml', import.meta.url));

/** one piece of Mutopia's table, as its pages write it */
const mutopiaRow = (id: number, title: string, by: string, licence: string, file: string) =>
  `<table class="table-bordered result-table"> <tr><td>${title}</td> <td>by ${by}</td> <td>&nbsp;</td> <td>&nbsp;</td> </tr><tr> <td>for Piano</td> <td>&nbsp;</td> <td>Romantic</td> <td></td> </tr><tr> <td>Edition</td> <td><a href="../legal.html">${licence}</a></td> <td><a href="piece-info.cgi?id=${id}">More Information</a></td> <td>2019/07/24</td> </tr><tr> <td>Download: <a href="https://www.mutopiaproject.org/ftp/X/${file}/${file}.ly">.ly file</a></td> <td>${file ? `<a href="https://www.mutopiaproject.org/ftp/X/${file}/${file}.mid">.mid file</a>` : '<a href="x-mids.zip">.mid files</a>'}</td></tr></table>`;
const MUTOPIA_PAGE = `<html><body>${mutopiaRow(223, 'L&#39;Adieu', 'J. F. F. Burgmüller (1806–1874)', 'Public Domain', 'adieu')}${mutopiaRow(1731, 'Prélude', 'C.-V. Alkan (1813–1888)', 'Creative Commons Attribution-ShareAlike 3.0', 'alkan')}${mutopiaRow(492, 'Suite', 'J. S. Bach', 'Public Domain', '')}</body></html>`;

let ctx: Awaited<ReturnType<typeof setupTestApp>>;
beforeAll(async () => {
  ctx = await setupTestApp();
});
afterAll(async () => ctx.close());
beforeEach(async () => {
  await ctx.reset();
  resetLibraryCache();
});
afterEach(() => vi.unstubAllGlobals());

const call = async (jar: CookieJar, method: 'GET' | 'POST', url: string, payload?: unknown) => {
  const res = await ctx.app.inject({
    method,
    url,
    payload: payload as object,
    headers: { origin: ORIGIN, cookie: jar.header },
  });
  jar.store(res);
  return res;
};

async function account(email: string) {
  const jar = new CookieJar();
  await call(jar, 'POST', '/api/auth/email/request', { email });
  const code = /(\d{6})/.exec(ctx.outbox.at(-1)!.text)![1];
  await call(jar, 'POST', '/api/auth/email/verify', { email, code, displayName: 'Familie' });
  return jar;
}

/** GitHub and GitHub Pages, as the server sees them in the test */
function fakeGitHub() {
  const fetcher = vi.fn(async (url: string | URL) => {
    const u = String(url);
    if (u.startsWith('https://api.github.com/'))
      return new Response(
        JSON.stringify([
          { name: 'Fur_Elise.mxl', type: 'file', sha: 'a1' },
          { name: 'Minuet_in_G_Major_Bach.mxl', type: 'file', sha: 'b1' },
          { name: 'Broken.mxl', type: 'file', sha: 'c1' },
          { name: 'README.md', type: 'file' },
        ]),
        { headers: { 'content-type': 'application/json' } },
      );
    if (u === 'https://musetrainer.github.io/library/scores/Fur_Elise.mxl')
      return new Response(SONG, { headers: { 'content-length': String(SONG.length) } });
    if (u === 'https://musetrainer.github.io/library/scores/Broken.mxl')
      return new Response('<nothing/>');
    if (u.startsWith('https://www.mutopiaproject.org/cgibin/make-table.cgi'))
      return new Response(u.includes('startat=0&') ? MUTOPIA_PAGE : '<html>no more</html>');
    if (u === 'https://www.mutopiaproject.org/ftp/X/adieu/adieu.mid') return new Response(SONG); // the test serves MusicXML; read the same way
    return new Response('nope', { status: 404 });
  });
  vi.stubGlobal('fetch', fetcher);
  return fetcher;
}

describe('piece library (MuseTrainer)', () => {
  it('names files and finds them by words of the title', () => {
    expect(titleOf('J._S._Bach_-_Air_on_the_G_String.mxl')).toBe(
      'J. S. Bach - Air on the G String',
    );
    const entries = [
      { id: 'a.mxl', title: 'Für Elise' },
      { id: 'b.mxl', title: 'Minuet in G Major Bach' },
    ];
    expect(cleanComposer('Ludwig van Beethoven(1770–1827)')).toBe('Ludwig van Beethoven');
    expect(cleanComposer('Erik Satie(1866 – 1925)')).toBe('Erik Satie');
    expect(cleanComposer('Unknown')).toBeNull();
    expect(cleanComposer('by J. S. Bach (1685–1750)')).toBe('J. S. Bach');
    expect(shortLicence('Creative Commons Attribution-ShareAlike 4.0')).toBe('CC BY-SA 4.0');
    expect(shortLicence('Creative Commons Attribution 3.0')).toBe('CC BY 3.0');
    expect(shortLicence('Public Domain')).toBe('Public Domain');
    expect(searchLibrary(entries, 'fur').map((e) => e.id)).toEqual(['a.mxl']);
    expect(searchLibrary(entries, 'bach minuet').map((e) => e.id)).toEqual(['b.mxl']);
  });

  it('is off until an admin switches it on; then lists and passes files on', async () => {
    const fetcher = fakeGitHub();
    const jar = await account('lib@example.ch');
    expect((await call(jar, 'GET', '/api/library?q=elise')).statusCode).toBe(404);
    expect(fetcher).not.toHaveBeenCalled();

    await AppSettings.updateOne({ _id: 'global' }, { $set: { pieceLibrary: true } });
    const found = await call(jar, 'GET', '/api/library?q=elise');
    expect(found.statusCode).toBe(200);
    // levels come in the background: first only the names
    expect(found.json().results).toEqual([
      {
        id: 'Fur_Elise.mxl',
        source: 'musetrainer',
        title: 'Fur Elise',
        licence: null,
        composer: null,
      },
    ]);
    expect(found.json().pending).toBe(true);
    expect(found.json().sources).toEqual([
      { key: 'musetrainer', name: 'MuseTrainer', url: 'https://github.com/musetrainer/library' },
    ]);
    await analyseLibrary(await libraryEntries(['musetrainer']));
    const looked = (await call(jar, 'GET', '/api/library?q=')).json();
    expect(looked.pending).toBe(false);
    expect(looked.results).toEqual([
      {
        id: 'Fur_Elise.mxl',
        source: 'musetrainer',
        title: 'Fur Elise',
        licence: null,
        readable: true,
        composer: 'Lina',
        level: 1,
        lessonId: expect.any(String),
        bars: 2,
        hands: 1,
      },
      // the minuet could not be fetched (tried again later); the broken file is not offered
      {
        id: 'Minuet_in_G_Major_Bach.mxl',
        source: 'musetrainer',
        title: 'Minuet in G Major Bach',
        licence: null,
        composer: null,
      },
    ]);

    const file = await call(jar, 'GET', '/api/library/Fur_Elise.mxl/file');
    expect(file.statusCode).toBe(200);
    expect(file.rawPayload.equals(SONG)).toBe(true);
    // only names from the list – nothing else is fetched
    expect((await call(jar, 'GET', '/api/library/Other.mxl/file')).statusCode).toBe(404);
    expect((await call(jar, 'GET', '/api/library/..%2Fsecret.mxl/file')).statusCode).toBe(400);
    // the list is fetched once and kept
    expect(fetcher.mock.calls.filter(([u]) => String(u).includes('api.github.com'))).toHaveLength(
      1,
    );

    // without an account: nothing
    expect((await call(new CookieJar(), 'GET', '/api/library?q=elise')).statusCode).toBe(401);
  });

  it("reads Mutopia's table: title, composer, licence, the MIDI file (no zips)", () => {
    expect(parseMutopiaTable(MUTOPIA_PAGE)).toEqual([
      {
        id: 'mutopia-223.mid',
        source: 'mutopia',
        title: "L'Adieu",
        composer: 'J. F. F. Burgmüller',
        licence: 'Public Domain',
        version: '2019/07/24',
        url: 'https://www.mutopiaproject.org/ftp/X/adieu/adieu.mid',
      },
      {
        id: 'mutopia-1731.mid',
        source: 'mutopia',
        title: 'Prélude',
        composer: 'C.-V. Alkan',
        licence: 'CC BY-SA 3.0',
        version: '2019/07/24',
        url: 'https://www.mutopiaproject.org/ftp/X/alkan/alkan.mid',
      },
    ]);
  });

  it('Mutopia has its own switch; its list is kept in the database', async () => {
    const fetcher = fakeGitHub();
    const jar = await account('mutopia@example.ch');
    await AppSettings.updateOne({ _id: 'global' }, { $set: { mutopiaLibrary: true } });
    const res = (await call(jar, 'GET', '/api/library?q=adieu')).json();
    expect(res.sources.map((x: { key: string }) => x.key)).toEqual(['mutopia']);
    expect(res.results).toMatchObject([
      { id: 'mutopia-223.mid', source: 'mutopia', composer: 'J. F. F. Burgmüller' },
    ]);
    const file = await call(jar, 'GET', '/api/library/mutopia-223.mid/file');
    expect(file.statusCode).toBe(200);
    expect(file.headers['content-type']).toContain('audio/midi');
    // MuseTrainer is still off
    expect((await call(jar, 'GET', '/api/library/Fur_Elise.mxl/file')).statusCode).toBe(404);
    await analyseLibrary(await libraryEntries(['mutopia']));
    // after a restart the list comes from the database, not from Mutopia
    resetLibraryCache();
    const pages = () => fetcher.mock.calls.filter(([u]) => String(u).includes('make-table')).length;
    const before = pages();
    await call(jar, 'GET', '/api/library?q=');
    expect(pages()).toBe(before);
  });
});
