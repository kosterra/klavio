/**
 * Writes the OpenAPI description of Klavio's API to docs/openapi.json – built
 * from the same Zod schemas the server validates with, so it can't drift.
 * The running server publishes no spec; this file in the repository is it.
 *
 *   npm run openapi          write docs/openapi.json
 *   npm run openapi -- --check   fail if the file is out of date (CI)
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import swagger from '@fastify/swagger';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import { APP_CONFIG } from '@klavio/shared';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

const OUT = fileURLToPath(new URL('../../docs/openapi.json', import.meta.url));

const config = loadConfig({
  NODE_ENV: 'test',
  AUTH_SECRET: 'openapi-openapi-openapi-openapi-openapi',
  APP_ORIGIN: 'https://klavio.example.ch',
  RP_ID: 'klavio.example.ch',
});

const app = await buildApp({
  config,
  mailer: { send: async () => {} },
  rateLimit: false,
  beforeRoutes: async (instance) => {
    await instance.register(swagger, {
      openapi: {
        openapi: '3.1.0',
        info: {
          title: `${APP_CONFIG.name} API`,
          // not the release number: the file would change with every version bump
          version: 'unversioned',
          description: [
            `The API behind the ${APP_CONFIG.name} web app. It is made for the app itself, not as a public API: it may change with every release.`,
            '',
            'Sign-in sets the httpOnly cookie `klavio_sid` (path `/api`). Requests that change something (POST, PUT, PATCH, DELETE) must carry an `Origin` header equal to the instance address, otherwise they get 403 `BAD_ORIGIN`.',
            '',
            'Errors are JSON: `{ "error": "<CODE>" }`; failed validation adds `issues`.',
          ].join('\n'),
          license: { name: 'AGPL-3.0-only', url: 'https://www.gnu.org/licenses/agpl-3.0.html' },
        },
        servers: [{ url: '/', description: 'the Klavio instance itself' }],
        components: {
          securitySchemes: {
            session: { type: 'apiKey', in: 'cookie', name: 'klavio_sid' },
          },
        },
      },
      transform: jsonSchemaTransform,
    });
  },
});
await app.ready();
const spec = `${JSON.stringify(app.swagger(), null, 2)}\n`;
await app.close();

if (process.argv.includes('--check')) {
  const current = await readFile(OUT, 'utf8').catch(() => '');
  if (current !== spec) {
    console.error('docs/openapi.json is out of date – run `npm run openapi` and commit it.');
    process.exit(1);
  }
  console.log('docs/openapi.json is up to date.');
} else {
  await writeFile(OUT, spec);
  console.log(`wrote ${OUT}`);
}
