import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CookieJar, ORIGIN, setupTestApp } from './helpers.js';
import { AppSettings } from '../src/models/index.js';
import { resetLibraryCache, searchLibrary, titleOf } from '../src/lib/pieceLibrary.js';

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
          { name: 'Fur_Elise.mxl', type: 'file' },
          { name: 'Minuet_in_G_Major_Bach.mxl', type: 'file' },
          { name: 'README.md', type: 'file' },
        ]),
        { headers: { 'content-type': 'application/json' } },
      );
    if (u === 'https://musetrainer.github.io/library/scores/Fur_Elise.mxl')
      return new Response(new Uint8Array([80, 75, 3, 4]), {
        headers: { 'content-length': '4' },
      });
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
    expect(found.json().results).toEqual([{ id: 'Fur_Elise.mxl', title: 'Fur Elise' }]);
    expect(found.json().source.name).toBe('MuseTrainer');

    const file = await call(jar, 'GET', '/api/library/Fur_Elise.mxl/file');
    expect(file.statusCode).toBe(200);
    expect([...file.rawPayload]).toEqual([80, 75, 3, 4]);
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
});
