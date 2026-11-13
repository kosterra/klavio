import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { Types } from 'mongoose';
import {
  childLoginSchema,
  deviceCreateSchema,
  profilePinSchema,
  type DeviceDto,
  type DeviceProfilesResponse,
  type ProfileDto,
} from '@klavio/shared';
import type { AppConfig } from '../config.js';
import { Device, Profile, User } from '../models/index.js';
import { HttpError, notFound } from '../lib/errors.js';
import { cookieBase, createSession } from '../lib/session.js';
import { hmac, randomToken, safeEqualHex, sha256 } from '../lib/crypto.js';
import { clearFailures, lockedFor, recordFailure, type ThrottlePolicy } from '../lib/throttle.js';

export const DEVICE_COOKIE = 'klavio_device';
/** a child's device stays one for a year after it was last used */
const DEVICE_MAX_AGE_S = 365 * 24 * 60 * 60;

/** 5 wrong PINs lock the profile's login for 15 minutes, then longer (at most a day). */
const CHILD_PIN_THROTTLE: ThrottlePolicy = {
  threshold: 5,
  lockMs: 15 * 60 * 1000,
  maxLockMs: 24 * 60 * 60 * 1000,
};

const idParams = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/) });

/**
 * Children log in on their own: a parent sets a PIN for each child (parent
 * area) and marks a browser as a child's device. There the start page shows
 * «Wer spielt?»; a child taps their figure and types their PIN. Such a session
 * stays with that profile and never opens the parent area without the parent
 * PIN.
 */
const deviceRoutes: FastifyPluginAsyncZod<{ config: AppConfig }> = async (app, { config }) => {
  const pinHash = (profileId: Types.ObjectId | string, pin: string) =>
    hmac(config.AUTH_SECRET, `child-pin:${profileId.toString()}:${pin}`);

  /** The device link of this browser (from its cookie), if any. */
  const thisDevice = async (token: string | undefined) =>
    token ? Device.findOne({ tokenHash: sha256(token) }) : null;

  // ------------------------------------------------------------ PIN per child
  app.put(
    '/profiles/:id/pin',
    { schema: { params: idParams, body: profilePinSchema }, preHandler: app.requireParent },
    async (req, reply) => {
      const res = await Profile.updateOne(
        { _id: req.params.id, userId: req.auth!.user._id },
        { pinHash: pinHash(req.params.id, req.body.pin) },
      );
      if (res.matchedCount === 0) throw notFound();
      await clearFailures(`child-pin:${req.params.id}`);
      return reply.code(204).send();
    },
  );

  app.delete(
    '/profiles/:id/pin',
    { schema: { params: idParams }, preHandler: app.requireParent },
    async (req, reply) => {
      const res = await Profile.updateOne(
        { _id: req.params.id, userId: req.auth!.user._id },
        { pinHash: null },
      );
      if (res.matchedCount === 0) throw notFound();
      return reply.code(204).send();
    },
  );

  // ------------------------------------------------------- children's devices
  /** This browser becomes a child's device of the account. */
  app.post(
    '/devices',
    { schema: { body: deviceCreateSchema }, preHandler: app.requireParent },
    async (req, reply): Promise<DeviceDto> => {
      const userId = req.auth!.user._id;
      // a browser is a child's device of one account only
      const old = await thisDevice(req.cookies[DEVICE_COOKIE]);
      if (old) await old.deleteOne();
      const token = randomToken(32);
      const device = await Device.create({ userId, tokenHash: sha256(token), name: req.body.name });
      reply.setCookie(DEVICE_COOKIE, token, { ...cookieBase(config), maxAge: DEVICE_MAX_AGE_S });
      reply.code(201);
      return {
        id: device._id.toString(),
        name: device.name,
        createdAt: device.createdAt.toISOString(),
        lastUsedAt: null,
        current: true,
      };
    },
  );

  app.get('/devices', { preHandler: app.requireParent }, async (req): Promise<DeviceDto[]> => {
    const token = req.cookies[DEVICE_COOKIE];
    const mine = token ? sha256(token) : null;
    const list = await Device.find({ userId: req.auth!.user._id }).sort({ createdAt: 1 }).lean();
    return list.map((d) => ({
      id: d._id.toString(),
      name: d.name,
      createdAt: d.createdAt.toISOString(),
      lastUsedAt: d.lastUsedAt?.toISOString() ?? null,
      current: d.tokenHash === mine,
    }));
  });

  app.delete(
    '/devices/:id',
    { schema: { params: idParams }, preHandler: app.requireParent },
    async (req, reply) => {
      const res = await Device.deleteOne({ _id: req.params.id, userId: req.auth!.user._id });
      if (res.deletedCount === 0) throw notFound();
      return reply.code(204).send();
    },
  );

  // ----------------------------------------------- on a child's device, no login
  /** «Wer spielt?»: the children who can log in here (those with a PIN). */
  app.get('/device/profiles', async (req, reply): Promise<DeviceProfilesResponse> => {
    const device = await thisDevice(req.cookies[DEVICE_COOKIE]);
    if (!device) {
      if (req.cookies[DEVICE_COOKIE]) reply.clearCookie(DEVICE_COOKIE, cookieBase(config));
      throw notFound();
    }
    const user = await User.findById(device.userId).lean();
    if (!user) throw notFound();
    const profiles = await Profile.find({ userId: device.userId, pinHash: { $ne: null } })
      .sort({ createdAt: 1 })
      .lean();
    return {
      family: user.displayName,
      profiles: profiles.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        avatar: p.avatar as ProfileDto['avatar'],
        outfit: (p.outfit ?? null) as ProfileDto['outfit'],
      })),
    };
  });

  app.post(
    '/device/login',
    {
      schema: { body: childLoginSchema },
      // besides the lock per profile below: not too many tries from one place
      config: { rateLimit: { max: 20, timeWindow: '5 minutes' } },
    },
    async (req, reply) => {
      const token = req.cookies[DEVICE_COOKIE];
      const device = await thisDevice(token);
      if (!device) throw new HttpError(403, 'NOT_A_CHILD_DEVICE');
      const profile = await Profile.findOne({ _id: req.body.profileId, userId: device.userId });
      if (!profile?.pinHash) throw notFound();
      const key = `child-pin:${profile._id.toString()}`;
      if ((await lockedFor(key, CHILD_PIN_THROTTLE)) > 0) throw new HttpError(429, 'RATE_LIMITED');
      if (!safeEqualHex(profile.pinHash, pinHash(profile._id, req.body.pin))) {
        await recordFailure(key);
        throw new HttpError(403, 'PIN_WRONG');
      }
      await clearFailures(key);
      await createSession(config, req, reply, device.userId, { profileId: profile._id });
      // used: the device stays one for another year
      await Device.updateOne({ _id: device._id }, { lastUsedAt: new Date() });
      reply.setCookie(DEVICE_COOKIE, token!, { ...cookieBase(config), maxAge: DEVICE_MAX_AGE_S });
      return { activeProfileId: profile._id.toString() };
    },
  );
};

export default deviceRoutes;
