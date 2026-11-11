import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { loadConfig } from '../src/config.js';
import { buildApp } from '../src/app.js';
import type { Mail, Mailer } from '../src/lib/mailer.js';

export const ORIGIN = 'https://klavio.test';

export async function setupTestApp({
  rateLimit = false,
  env = {},
}: { rateLimit?: boolean; env?: Record<string, string> } = {}) {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await mongoose.connection.syncIndexes();

  const config = loadConfig({
    NODE_ENV: 'test',
    AUTH_SECRET: 'test-secret-test-secret-test-secret-123',
    APP_ORIGIN: ORIGIN,
    RP_ID: 'klavio.test',
    REGISTRATION_OPEN_DEFAULT: 'true',
    ...env,
  });
  const outbox: Mail[] = [];
  const mailer: Mailer = { send: async (m) => void outbox.push(m) };
  const app = await buildApp({ config, mailer, rateLimit });
  await app.ready();

  return {
    app,
    config,
    outbox,
    async reset() {
      outbox.length = 0;
      await mongoose.connection.db!.dropDatabase();
      await mongoose.connection.syncIndexes();
    },
    async close() {
      await app.close();
      await mongoose.disconnect();
      await mongo.stop();
    },
  };
}

/** Minimal cookie jar for app.inject() round trips. */
export class CookieJar {
  private cookies = new Map<string, string>();

  store(res: { cookies: { name: string; value: string; maxAge?: number; expires?: Date }[] }) {
    for (const c of res.cookies) {
      const expired =
        c.maxAge === 0 || (c.expires && c.expires.getTime() < Date.now()) || c.value === '';
      if (expired) this.cookies.delete(c.name);
      else this.cookies.set(c.name, c.value);
    }
  }

  get header() {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  has(name: string) {
    return this.cookies.has(name);
  }
}
