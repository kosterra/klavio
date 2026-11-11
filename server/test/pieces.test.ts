import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CookieJar, ORIGIN, setupTestApp } from './helpers.js';

let ctx: Awaited<ReturnType<typeof setupTestApp>>;
beforeAll(async () => {
  ctx = await setupTestApp();
});
afterAll(async () => ctx.close());
beforeEach(async () => ctx.reset());

const call = async (
  jar: CookieJar,
  method: 'GET' | 'POST' | 'DELETE',
  url: string,
  payload?: unknown,
) => {
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

const song = {
  title: 'Mein Lied',
  composer: null,
  keyboard: { from: 60, to: 76 },
  exercise: {
    type: 'song',
    clef: 'treble',
    time: '4/4',
    tempo: 90,
    showNames: false,
    bars: [
      [
        { midi: 60, value: 'q' },
        { midi: 62, value: 'q' },
        { midi: 64, value: 'h' },
      ],
    ],
  },
};

describe('own pieces', () => {
  it('are stored for the account, checked, private and can be removed', async () => {
    const jar = await account('own@example.ch');
    const created = await call(jar, 'POST', '/api/pieces', song);
    expect(created.statusCode).toBe(201);
    const id = created.json().id as string;
    expect((await call(jar, 'GET', '/api/pieces')).json()).toHaveLength(1);
    expect((await call(jar, 'GET', `/api/pieces/${id}`)).json().title).toBe('Mein Lied');

    // notes the app cannot draw are refused
    const bad = { ...song, exercise: { ...song.exercise, bars: [[{ midi: 200, value: 'q' }]] } };
    expect((await call(jar, 'POST', '/api/pieces', bad)).statusCode).toBe(400);
    const sixteenth = {
      ...song,
      exercise: { ...song.exercise, bars: [[{ midi: 60, value: '16' }]] },
    };
    expect((await call(jar, 'POST', '/api/pieces', sixteenth)).statusCode).toBe(400);

    // another family sees nothing and cannot delete
    const other = await account('other@example.ch');
    expect((await call(other, 'GET', '/api/pieces')).json()).toEqual([]);
    expect((await call(other, 'GET', `/api/pieces/${id}`)).statusCode).toBe(404);
    expect((await call(other, 'DELETE', `/api/pieces/${id}`)).statusCode).toBe(404);

    // in the data download
    const data = (await call(jar, 'GET', '/api/account/export')).json();
    expect(data.ownPieces[0].title).toBe('Mein Lied');

    expect((await call(jar, 'DELETE', `/api/pieces/${id}`)).statusCode).toBe(204);
    expect((await call(jar, 'GET', '/api/pieces')).json()).toEqual([]);
  });
});
