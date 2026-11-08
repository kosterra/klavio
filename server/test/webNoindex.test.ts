import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { buildApp } from '../src/app.js';
import { AppSettings } from '../src/models/index.js';

/** A private instance (a family, a school) can stay out of search engines. */
describe('web: search engines switched off', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await AppSettings.create({ _id: 'global', registrationOpen: true, searchIndexing: false });
    const root = mkdtempSync(join(tmpdir(), 'klavio-web-'));
    writeFileSync(
      join(root, 'index.html'),
      '<html lang="de-CH"><head><title>Klavio</title></head><body><div id="root"></div></body></html>',
    );
    const config = loadConfig({
      NODE_ENV: 'test',
      AUTH_SECRET: 'test-secret-test-secret-test-secret-123',
      APP_ORIGIN: 'https://klavio.example.ch',
      STATIC_DIR: root,
    });
    app = await buildApp({ config, rateLimit: false });
    await app.ready();
  });
  afterAll(async () => {
    await app.close();
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('says noindex everywhere, disallows all and has no sitemap', async () => {
    const page = await app.inject({ url: '/welcome', headers: { accept: 'text/html' } });
    expect(page.headers['x-robots-tag']).toBe('noindex, nofollow');
    expect(page.body).toContain('<meta name="robots" content="noindex, nofollow" />');
    expect((await app.inject({ url: '/robots.txt' })).body).toContain('Disallow: /\n');
    expect((await app.inject({ url: '/sitemap.xml' })).statusCode).toBe(404);
  });
});
