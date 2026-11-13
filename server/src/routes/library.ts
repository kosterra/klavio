import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { AppConfig } from '../config.js';
import { HttpError, notFound } from '../lib/errors.js';
import { getSettings } from '../lib/settings.js';
import {
  SOURCES,
  analyseLibrary,
  libraryEntries,
  libraryFile,
  libraryInfo,
  libraryPending,
  searchLibrary,
  type SourceKey,
} from '../lib/pieceLibrary.js';

const idParams = z.object({
  id: z
    .string()
    .min(5)
    .max(200)
    .regex(/^(?:[\w.\-() ',&]+\.mxl|mutopia-\d{1,7}\.mid)$/i),
});

/** «Aus der Bibliothek»: search the switched-on sheet music libraries and fetch a file. */
const libraryRoutes: FastifyPluginAsyncZod<{ config: AppConfig }> = async (app, { config }) => {
  /** the sources an admin switched on */
  const enabled = async (): Promise<SourceKey[]> => {
    const s = await getSettings(config);
    const keys: SourceKey[] = [];
    if (s.pieceLibrary) keys.push('musetrainer');
    if (s.mutopiaLibrary) keys.push('mutopia');
    return keys;
  };

  app.addHook('preHandler', app.requireAuth);

  app.get(
    '/',
    { schema: { querystring: z.object({ q: z.string().max(80).default('') }) } },
    async (req) => {
      const keys = await enabled();
      if (!keys.length) throw new HttpError(404, 'LIBRARY_OFF');
      let entries;
      try {
        entries = await libraryEntries(keys);
      } catch (err) {
        req.log.warn({ err }, 'library list not reachable');
        throw new HttpError(502, 'LIBRARY_UNREACHABLE');
      }
      // levels and sizes come in the background; the list says when some are missing
      analyseLibrary(entries).catch((err: unknown) => req.log.warn({ err }, 'library analysis'));
      const results = [];
      for (const e of searchLibrary(entries, req.query.q)) {
        const info = await libraryInfo(e);
        if (info && !info.readable) continue; // Klavio can't read it: not offered
        results.push({
          id: e.id,
          source: e.source,
          title: e.title,
          licence: e.licence,
          ...(info ?? {}),
          composer: e.composer ?? (info?.readable ? info.composer : null),
        });
      }
      let pending = false;
      for (const e of entries) if (!pending && (await libraryPending(e))) pending = true;
      return { sources: keys.map((k) => ({ key: k, ...SOURCES[k] })), results, pending };
    },
  );

  app.get('/:id/file', { schema: { params: idParams } }, async (req, reply) => {
    const keys = await enabled();
    if (!keys.length) throw new HttpError(404, 'LIBRARY_OFF');
    let found;
    try {
      found = await libraryFile(req.params.id, keys);
    } catch (err) {
      req.log.warn({ err }, 'library file not reachable');
      throw new HttpError(502, 'LIBRARY_UNREACHABLE');
    }
    if (!found) throw notFound();
    return reply
      .type(found.entry.source === 'mutopia' ? 'audio/midi' : 'application/vnd.recordare.musicxml')
      .send(Buffer.from(found.bytes));
  });
};

export default libraryRoutes;
