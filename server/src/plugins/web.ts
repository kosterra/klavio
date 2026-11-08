import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance, FastifyReply } from 'fastify';
import type { AppConfig } from '../config.js';

/** Where the build writes the absolute address for link previews (vite.config.ts). */
export const ORIGIN_PLACEHOLDER = '__KLAVIO_ORIGIN__';

/**
 * The page's security headers. Mantine injects <style> tags at runtime →
 * style-src needs 'unsafe-inline'. Scripts stay strict ('self' only; wasm for
 * pitch/ML modules).
 */
export const PAGE_CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const PERMISSIONS = 'microphone=(self), midi=(self), camera=(), geolocation=(), payment=()';

/**
 * Serves the built app (one image for app and API): the files of the client
 * build, every other page path answered with index.html (the app's router
 * takes over), the absolute address filled in for link previews.
 */
export async function registerWeb(app: FastifyInstance, config: AppConfig, root: string) {
  const indexFile = join(root, 'index.html');
  if (!existsSync(indexFile)) throw new Error(`STATIC_DIR has no index.html: ${root}`);
  const index = readFileSync(indexFile, 'utf8').replaceAll(ORIGIN_PLACEHOLDER, config.APP_ORIGIN);

  // the page needs a CSP of its own: the API's (helmet) allows nothing at all
  app.addHook('onSend', async (req, reply, payload) => {
    if (req.url.startsWith('/api/')) return payload;
    reply.header('content-security-policy', PAGE_CSP);
    reply.header('permissions-policy', PERMISSIONS);
    reply.header('cross-origin-resource-policy', 'same-origin');
    return payload;
  });

  await app.register(fastifyStatic, {
    root,
    index: false,
    wildcard: true,
    // our own rules below (the plugin's default would set max-age=0 on everything)
    cacheControl: false,
    setHeaders: (res, path) => {
      if (path.includes(`${join(root, 'assets')}`)) {
        res.setHeader('cache-control', 'public, max-age=31536000, immutable');
      } else if (path.endsWith('sw.js') || path.endsWith('.webmanifest')) {
        res.setHeader('cache-control', 'no-cache');
      } else {
        res.setHeader('cache-control', 'public, max-age=3600');
      }
    },
  });

  const sendIndex = (reply: FastifyReply) =>
    reply.type('text/html; charset=utf-8').header('cache-control', 'no-cache').send(index);

  app.get('/', (_req, reply) => sendIndex(reply));
  app.get('/index.html', (_req, reply) => sendIndex(reply));

  // every page path of the app → index.html; unknown API paths stay a JSON 404
  app.setNotFoundHandler((req, reply) => {
    const path = req.url.split('?')[0]!;
    // a page of the app: no file extension (/welcome, /lesson/keys-c), or a browser asking for HTML
    const page = !/\.[a-z0-9]+$/i.test(path) || req.headers.accept?.includes('html');
    if (req.method === 'GET' && !path.startsWith('/api/') && page) return sendIndex(reply);
    return reply.code(404).send({ error: 'NOT_FOUND' });
  });
}
