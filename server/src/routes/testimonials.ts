import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  testimonialInputSchema,
  type PublicTestimonialDto,
  type TestimonialDto,
} from '@klavio/shared';
import { Testimonial } from '../models/index.js';
import { HttpError, notFound } from '../lib/errors.js';

const idParams = z.object({ id: z.string().regex(/^[0-9a-f]{24}$/) });

type Doc = {
  _id: { toString(): string };
  text: string;
  author: string;
  role?: string | null;
  status: string;
  createdAt: Date;
};

const toDto = (t: Doc): TestimonialDto => ({
  id: t._id.toString(),
  text: t.text,
  author: t.author,
  role: t.role ?? null,
  status: t.status as TestimonialDto['status'],
  createdAt: t.createdAt.toISOString(),
});

/**
 * Testimonials: parents write (parent area – publishing is their decision),
 * admins approve, the public page shows only approved ones.
 */
const testimonialRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/public', async (): Promise<PublicTestimonialDto[]> => {
    const list = await Testimonial.find({ status: 'approved' })
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean();
    return list.map((t) => ({ text: t.text, author: t.author, role: t.role ?? null }));
  });

  /** what this account has written */
  app.get('/mine', { preHandler: app.requireAuth }, async (req): Promise<TestimonialDto[]> => {
    const list = await Testimonial.find({ userId: req.auth!.user._id })
      .sort({ createdAt: -1 })
      .lean();
    return list.map((t) => toDto(t as unknown as Doc));
  });

  app.post(
    '/',
    {
      schema: { body: testimonialInputSchema },
      preHandler: app.requireParent,
      config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
    },
    async (req, reply): Promise<TestimonialDto> => {
      const userId = req.auth!.user._id;
      if ((await Testimonial.countDocuments({ userId, status: 'pending' })) >= 3)
        throw new HttpError(400, 'TOO_MANY_PENDING');
      const { text, author, role } = req.body;
      const created = await Testimonial.create({ userId, text, author, role: role || null });
      reply.code(201);
      return toDto(created.toObject() as unknown as Doc);
    },
  );

  /** taking one's words back – also after they were published */
  app.delete(
    '/:id',
    { schema: { params: idParams }, preHandler: app.requireParent },
    async (req, reply) => {
      const res = await Testimonial.deleteOne({ _id: req.params.id, userId: req.auth!.user._id });
      if (res.deletedCount === 0) throw notFound();
      return reply.code(204).send();
    },
  );

  // ---------------------------------------------------------------- admins
  app.get('/all', { preHandler: app.requireAdmin }, async (): Promise<TestimonialDto[]> => {
    const list = await Testimonial.find().sort({ createdAt: -1 }).limit(200).lean();
    return list.map((t) => toDto(t as unknown as Doc));
  });

  app.patch(
    '/:id',
    {
      schema: {
        params: idParams,
        body: z.object({ status: z.enum(['approved', 'rejected', 'pending']) }),
      },
      preHandler: app.requireAdmin,
    },
    async (req): Promise<TestimonialDto> => {
      const t = await Testimonial.findByIdAndUpdate(
        req.params.id,
        { $set: { status: req.body.status } },
        { returnDocument: 'after', lean: true },
      );
      if (!t) throw notFound();
      return toDto(t as unknown as Doc);
    },
  );
};

export default testimonialRoutes;
