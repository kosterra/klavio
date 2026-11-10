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
      [
        '<html lang="de-CH"><head><title>Klavio</title>',
        '<meta name="description" content="x" />',
        '<meta property="og:url" content="__KLAVIO_ORIGIN__/welcome" />',
        '<meta property="og:image" content="__KLAVIO_ORIGIN__/og-image.jpg"></head>',
        '<body><div id="root"></div></body></html>',
      ].join('\n'),
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

  it('gives search engines title, canonical, languages and text of the public pages', async () => {
    const de = await app.inject({ url: '/welcome', headers: { accept: 'text/html' } });
    expect(de.body).toContain('<html lang="de-CH">');
    expect(de.body).toContain('<title>Klavio – Klavier lernen am echten Klavier');
    expect(de.body).toContain('<link rel="canonical" href="https://klavio.example.ch/welcome" />');
    expect(de.body).toContain('hreflang="en" href="https://klavio.example.ch/welcome?lang=en"');
    expect(de.body).toContain('<h1>Klavier lernen – am echten Klavier, wie im Spiel.</h1>');
    expect(de.body).not.toContain('noindex');

    const en = await app.inject({ url: '/privacy?lang=en', headers: { accept: 'text/html' } });
    expect(en.body).toContain('<html lang="en">');
    expect(en.body).toContain('<title>Privacy – Klavio</title>');
    expect(en.body).toContain('href="https://klavio.example.ch/privacy?lang=en" />');

    // pages behind the login are never listed
    const lesson = await app.inject({ url: '/lesson/keys-c', headers: { accept: 'text/html' } });
    expect(lesson.body).toContain('<meta name="robots" content="noindex, nofollow" />');
    expect(lesson.body).not.toContain('rel="canonical"');
  });

  it('has robots.txt and a sitemap with both languages', async () => {
    const robots = await app.inject({ url: '/robots.txt' });
    expect(robots.body).toContain('Disallow: /api/');
    expect(robots.body).toContain('Sitemap: https://klavio.example.ch/sitemap.xml');
    const map = await app.inject({ url: '/sitemap.xml' });
    expect(map.headers['content-type']).toContain('application/xml');
    expect(map.body).toContain('<loc>https://klavio.example.ch/whats-new?lang=en</loc>');
  });
});
