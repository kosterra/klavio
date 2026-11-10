import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  PUBLIC_PAGES,
  SEO_LANGS,
  SEO_TEXTS,
  pageUrl,
  type PublicPage,
  type SeoLang,
} from '@klavio/shared';
import type { AppConfig } from '../config.js';
import { getSettings } from '../lib/settings.js';

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

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The page as search engines and link previews should see it. */
export function renderPage(
  index: string,
  origin: string,
  path: string,
  lang: SeoLang,
  indexable: boolean,
): string {
  const page = (path === '/' ? '/welcome' : path) as PublicPage;
  const isPublic = (PUBLIC_PAGES as readonly string[]).includes(page);
  let html = index.replace(/<html lang="[^"]*">/, `<html lang="${lang}">`);
  const head: string[] = [];
  if (!isPublic || !indexable) head.push('<meta name="robots" content="noindex, nofollow" />');
  if (isPublic) {
    const text = SEO_TEXTS[lang][page];
    const url = pageUrl(origin, page, lang);
    const meta = (attr: 'name' | 'property', key: string, value: string) => {
      html = html.replace(
        new RegExp(`<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*/?>`),
        `<meta ${attr}="${key}" content="${escape(value)}" />`,
      );
    };
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${escape(text.title)}</title>`);
    meta('name', 'description', text.description);
    meta('property', 'og:title', text.title);
    meta('property', 'og:description', text.description);
    meta('property', 'og:url', url);
    meta('property', 'og:locale', lang === 'en' ? 'en_GB' : 'de_CH');
    meta('property', 'og:locale:alternate', lang === 'en' ? 'de_CH' : 'en_GB');
    head.push(`<link rel="canonical" href="${escape(url)}" />`);
    for (const l of SEO_LANGS) {
      head.push(
        `<link rel="alternate" hreflang="${l}" href="${escape(pageUrl(origin, page, l))}" />`,
      );
    }
    head.push(
      `<link rel="alternate" hreflang="x-default" href="${escape(pageUrl(origin, page, 'de-CH'))}" />`,
    );
    // readable without JavaScript; the app replaces it when it starts
    const links = PUBLIC_PAGES.filter((p) => p !== page)
      .map(
        (p) =>
          `<a href="${escape(pageUrl('', p, lang))}">${escape(SEO_TEXTS[lang][p].heading)}</a>`,
      )
      .join(' · ');
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root"><main style="max-width:40rem;margin:2rem auto;padding:0 1rem;font-family:system-ui,sans-serif"><h1>${escape(text.heading)}</h1>${text.body
        .map((b) => `<p>${escape(b)}</p>`)
        .join('')}<nav>${links}</nav></main></div>`,
    );
  }
  return html.replace('</head>', `${head.map((h) => `    ${h}`).join('\n')}\n  </head>`);
}

/** «?lang=en» chooses the English version of a public page. */
function langOf(req: FastifyRequest): SeoLang {
  const q = (req.query as { lang?: string } | undefined)?.lang;
  return q === 'en' ? 'en' : 'de-CH';
}

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
    setHeaders: (reply, path) => {
      if (path.includes(`${join(root, 'assets')}`)) {
        reply.header('cache-control', 'public, max-age=31536000, immutable');
      } else if (path.endsWith('sw.js') || path.endsWith('.webmanifest')) {
        reply.header('cache-control', 'no-cache');
      } else {
        reply.header('cache-control', 'public, max-age=3600');
      }
    },
  });

  // Admins can keep a private instance out of search engines. The setting is
  // read in the background (at most every 30 s); a page never waits for the
  // database longer than half a second, and without it the last value counts.
  let indexing = true;
  let checkedAt = 0;
  let pending: Promise<void> | null = null;
  const refresh = () =>
    (pending ??= getSettings(config)
      .then((s) => {
        indexing = s.searchIndexing;
      })
      .catch(() => undefined)
      .finally(() => {
        checkedAt = Date.now();
        pending = null;
      }));
  const indexable = async () => {
    if (checkedAt === 0) {
      await Promise.race([refresh(), new Promise((r) => setTimeout(r, 500))]);
      checkedAt ||= Date.now(); // no answer yet: don't make the next pages wait too
    } else if (Date.now() - checkedAt > 30_000) void refresh();
    return indexing;
  };

  const sendIndex = async (req: FastifyRequest, reply: FastifyReply) => {
    const path = req.url.split('?')[0]!;
    const allowed = await indexable();
    if (!allowed) reply.header('x-robots-tag', 'noindex, nofollow');
    return reply
      .type('text/html; charset=utf-8')
      .header('cache-control', 'no-cache')
      .header('vary', 'accept-encoding')
      .send(renderPage(index, config.APP_ORIGIN, path, langOf(req), allowed));
  };

  app.get('/', sendIndex);
  app.get('/index.html', sendIndex);

  app.get('/robots.txt', async (_req, reply) => {
    const lines = (await indexable())
      ? ['User-agent: *', 'Disallow: /api/', '', `Sitemap: ${config.APP_ORIGIN}/sitemap.xml`]
      : ['User-agent: *', 'Disallow: /'];
    return reply.type('text/plain; charset=utf-8').send(`${lines.join('\n')}\n`);
  });

  app.get('/sitemap.xml', async (_req, reply) => {
    if (!(await indexable())) return reply.code(404).send({ error: 'NOT_FOUND' });
    const urls = PUBLIC_PAGES.flatMap((page) =>
      SEO_LANGS.map(
        (lang) =>
          `  <url><loc>${escape(pageUrl(config.APP_ORIGIN, page, lang))}</loc>${SEO_LANGS.map(
            (l) =>
              `<xhtml:link rel="alternate" hreflang="${l}" href="${escape(pageUrl(config.APP_ORIGIN, page, l))}"/>`,
          ).join('')}</url>`,
      ),
    );
    return reply
      .type('application/xml; charset=utf-8')
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`,
      );
  });

  // every page path of the app → index.html; unknown API paths stay a JSON 404
  app.setNotFoundHandler((req, reply) => {
    const path = req.url.split('?')[0]!;
    // a page of the app: no file extension (/welcome, /lesson/keys-c), or a browser asking for HTML
    const page = !/\.[a-z0-9]+$/i.test(path) || req.headers.accept?.includes('html');
    if (req.method === 'GET' && !path.startsWith('/api/') && page) return sendIndex(req, reply);
    return reply.code(404).send({ error: 'NOT_FOUND' });
  });
}
