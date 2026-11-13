import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  MAX_OWN_PIECES,
  ownPieceInputSchema,
  ownPieceMetaSchema,
  type OwnPieceDto,
} from '@klavio/shared';
import { OwnPiece } from '../models/index.js';
import { HttpError, notFound } from '../lib/errors.js';

const idParams = z.object({ id: z.string().regex(/^[0-9a-f]{24}$/) });

type Doc = {
  _id: { toString(): string };
  title: string;
  composer?: string | null;
  exercise: unknown;
  keyboard?: { from?: number | null; to?: number | null } | null;
  source?: string | null;
  createdAt: Date;
};

function toDto(p: Doc): OwnPieceDto {
  return {
    id: p._id.toString(),
    title: p.title,
    composer: p.composer ?? null,
    exercise: p.exercise as OwnPieceDto['exercise'],
    keyboard: { from: p.keyboard?.from ?? 48, to: p.keyboard?.to ?? 72 },
    source: p.source ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

/** «Eigene Stücke» of the account: every profile can play them; adding and removing needs no parent area. */
const pieceRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', app.requireAuth);

  app.get('/', async (req): Promise<OwnPieceDto[]> => {
    const list = await OwnPiece.find({ userId: req.auth!.user._id }).sort({ createdAt: 1 }).lean();
    return list.map((p) => toDto(p as unknown as Doc));
  });

  app.get('/:id', { schema: { params: idParams } }, async (req): Promise<OwnPieceDto> => {
    const p = await OwnPiece.findOne({ _id: req.params.id, userId: req.auth!.user._id }).lean();
    if (!p) throw notFound();
    return toDto(p as unknown as Doc);
  });

  app.post(
    '/',
    { schema: { body: ownPieceInputSchema }, bodyLimit: 2 * 1024 * 1024 },
    async (req, reply): Promise<OwnPieceDto> => {
      const userId = req.auth!.user._id;
      if ((await OwnPiece.countDocuments({ userId })) >= MAX_OWN_PIECES)
        throw new HttpError(400, 'PIECE_LIMIT');
      const created = await OwnPiece.create({ ...req.body, userId });
      reply.code(201);
      return toDto(created.toObject() as unknown as Doc);
    },
  );

  app.patch(
    '/:id',
    { schema: { params: idParams, body: ownPieceMetaSchema } },
    async (req): Promise<OwnPieceDto> => {
      const p = await OwnPiece.findOneAndUpdate(
        { _id: req.params.id, userId: req.auth!.user._id },
        { $set: { title: req.body.title, composer: req.body.composer } },
        { new: true },
      ).lean();
      if (!p) throw notFound();
      return toDto(p as unknown as Doc);
    },
  );

  app.delete('/:id', { schema: { params: idParams } }, async (req, reply) => {
    const res = await OwnPiece.deleteOne({ _id: req.params.id, userId: req.auth!.user._id });
    if (res.deletedCount === 0) throw notFound();
    return reply.code(204).send();
  });
};

export default pieceRoutes;
