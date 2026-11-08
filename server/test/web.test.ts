import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { buildApp } from '../src/app.js';

/** The Docker image serves the built app itself (STATIC_DIR). */
describe('web: the app from the same server', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    const root = mkdtempSync(join(tmpdir(), 'klavio-web-'));
    mkdirSync(join(root, 'assets'));
    writeFileSync(
      join(root, 'index.html'),
      '<html><head><meta property="og:image" content="__KLAVIO_ORIGIN__/og-image.jpg"></head></html>',
    );
    writeFileSync(join(root, 'assets', 'app-123.js'), 'console.log(1)');
    writeFileSync(join(root, 'sw.js'), '// sw');
    const config = loadConfig({
      NODE_ENV: 'test',
      AUTH_SECRET: 'test-secret-test-secret-test-secret-123',
      APP_ORIGIN: 'https://klavio.example.ch',
      STATIC_DIR: root,
    });
    // with the rate limit, as in production
    app = await buildApp({ config, rateLimit: true });
    await app.ready();
  });
  afterAll(() => app.close());

  it('fills in the address for link previews and sends the page security headers', async () => {
    const res = await app.inject({ url: '/', headers: { accept: 'text/html' } });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('content="https://klavio.example.ch/og-image.jpg"');
    expect(res.headers['content-security-policy']).toContain("script-src 'self'");
    expect(res.headers['permissions-policy']).toContain('microphone=(self)');
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  it('answers the paths of the app with the page', async () => {
    const res = await app.inject({ url: '/lesson/keys-c', headers: { accept: 'text/html' } });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    // also for link-preview services and crawlers that ask for anything (*/*)
    expect((await app.inject({ url: '/welcome', headers: { accept: '*/*' } })).statusCode).toBe(
      200,
    );
    // a missing file stays a 404
    expect((await app.inject({ url: '/missing.png' })).statusCode).toBe(404);
  });

  it('serves built files, the hashed ones cached for good, the service worker never', async () => {
    const asset = await app.inject({ url: '/assets/app-123.js' });
    expect(asset.statusCode).toBe(200);
    expect(asset.headers['cache-control']).toContain('immutable');
    expect((await app.inject({ url: '/sw.js' })).headers['cache-control']).toBe('no-cache');
  });

  it('keeps the API strict: JSON 404 and its own CSP', async () => {
    const missing = await app.inject({ url: '/api/nope', headers: { accept: 'text/html' } });
    expect(missing.statusCode).toBe(404);
    expect(missing.json()).toEqual({ error: 'NOT_FOUND' });
    const health = await app.inject({ url: '/api/health' });
    expect(health.headers['content-security-policy']).toContain("default-src 'none'");
  });

  it('counts only API requests against the rate limit, not the app’s files', async () => {
    // one page load fetches dozens of files; a family reloads often
    for (let i = 0; i < 320; i++) {
      const res = await app.inject({ url: '/assets/app-123.js' });
      if (res.statusCode !== 200) throw new Error(`file ${i}: ${res.statusCode}`);
    }
    let status = 200;
    for (let i = 0; i < 320 && status === 200; i++) {
      status = (await app.inject({ url: '/api/health' })).statusCode;
    }
    expect(status).toBe(429);
  });
});
