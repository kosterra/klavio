import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { AppConfig } from '../config.js';
import { HttpError, notFound } from '../lib/errors.js';
import { getSettings } from '../lib/settings.js';
import { LIBRARY_SOURCE, libraryEntries, libraryFile, searchLibrary } from '../lib/pieceLibrary.js';

const idParams = z.object({
  id: z
    .string()
    .min(5)
    .max(200)
    .regex(/^[\w.\-() ',&]+\.mxl$/i),
});

/** «Aus der Bibliothek»: search the MuseTrainer library and fetch a file (when switched on). */
const libraryRoutes: FastifyPluginAsyncZod<{ config: AppConfig }> = async (app, { config }) => {
  app.addHook('preHandler', app.requireAuth);
  app.addHook('preHandler', async () => {
    if (!(await getSettings(config)).pieceLibrary) throw new HttpError(404, 'LIBRARY_OFF');
  });

  app.get(
    '/',
    { schema: { querystring: z.object({ q: z.string().max(80).default('') }) } },
    async (req) => {
      let entries;
      try {
        entries = await libraryEntries();
      } catch (err) {
        req.log.warn({ err }, 'library list not reachable');
        throw new HttpError(502, 'LIBRARY_UNREACHABLE');
      }
      return { source: LIBRARY_SOURCE, results: searchLibrary(entries, req.query.q) };
    },
  );

  app.get('/:id/file', { schema: { params: idParams } }, async (req, reply) => {
    let bytes;
    try {
      bytes = await libraryFile(req.params.id);
    } catch (err) {
      req.log.warn({ err }, 'library file not reachable');
      throw new HttpError(502, 'LIBRARY_UNREACHABLE');
    }
    if (!bytes) throw notFound();
    return reply.type('application/vnd.recordare.musicxml').send(Buffer.from(bytes));
  });
};

export default libraryRoutes;
