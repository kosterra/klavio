import { describe, expect, it } from 'vitest';
import {
  createDecipheriv,
  createECDH,
  createHmac,
  createPublicKey,
  randomBytes,
  verify,
} from 'node:crypto';
import {
  b64u,
  encryptPayload,
  generateVapidKeys,
  isPushEndpoint,
  sendPush,
  vapidAuthorization,
} from '../src/lib/webPush.js';

function hkdf(salt: Buffer, ikm: Buffer, info: Buffer, length: number) {
  const prk = createHmac('sha256', salt).update(ikm).digest();
  return createHmac('sha256', prk)
    .update(Buffer.concat([info, Buffer.from([1])]))
    .digest()
    .subarray(0, length);
}

/** What the browser does: decrypt with its private key and auth secret (RFC 8291). */
function decrypt(body: Buffer, ua: ReturnType<typeof createECDH>, auth: Buffer): string {
  const salt = body.subarray(0, 16);
  const idlen = body.readUInt8(20);
  const asPublic = body.subarray(21, 21 + idlen);
  const ct = body.subarray(21 + idlen);
  const shared = ua.computeSecret(asPublic);
  const ikm = hkdf(
    auth,
    shared,
    Buffer.concat([Buffer.from('WebPush: info\0'), ua.getPublicKey(), asPublic]),
    32,
  );
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const d = createDecipheriv('aes-128-gcm', cek, nonce);
  d.setAuthTag(ct.subarray(ct.length - 16));
  const plain = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
  expect(plain.at(-1)).toBe(2); // padding delimiter
  return plain.subarray(0, -1).toString();
}

describe('web push', () => {
  const ua = createECDH('prime256v1');
  ua.generateKeys();
  const auth = randomBytes(16);
  const sub = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
    p256dh: b64u.encode(ua.getPublicKey()),
    auth: b64u.encode(auth),
  };

  it('encrypts so that only the browser can read it', () => {
    const body = encryptPayload(Buffer.from('{"title":"Hallo"}'), sub.p256dh, sub.auth);
    expect(decrypt(body, ua, auth)).toBe('{"title":"Hallo"}');
  });

  it('signs a VAPID token the push service can check', () => {
    const keys = generateVapidKeys();
    const header = vapidAuthorization(sub.endpoint, keys, 'mailto:admin@example.ch', 0);
    const [, token, k] = /^vapid t=([^,]+), k=(.+)$/.exec(header)!;
    expect(k).toBe(keys.publicKey);
    const [h, c, s] = token!.split('.');
    expect(JSON.parse(b64u.decode(c!).toString())).toMatchObject({
      aud: 'https://fcm.googleapis.com',
      sub: 'mailto:admin@example.ch',
    });
    const pub = b64u.decode(keys.publicKey);
    const key = createPublicKey({
      key: {
        kty: 'EC',
        crv: 'P-256',
        x: b64u.encode(pub.subarray(1, 33)),
        y: b64u.encode(pub.subarray(33)),
      },
      format: 'jwk',
    });
    expect(
      verify(
        'sha256',
        Buffer.from(`${h}.${c}`),
        { key, dsaEncoding: 'ieee-p1363' },
        b64u.decode(s!),
      ),
    ).toBe(true);
  });

  it('only sends to the browsers’ push services', async () => {
    expect(isPushEndpoint('https://fcm.googleapis.com/fcm/send/x')).toBe(true);
    expect(isPushEndpoint('https://web.push.apple.com/abc')).toBe(true);
    expect(isPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/x')).toBe(true);
    expect(isPushEndpoint('http://fcm.googleapis.com/x')).toBe(false);
    expect(isPushEndpoint('https://localhost/x')).toBe(false);
    expect(isPushEndpoint('https://169.254.169.254/latest')).toBe(false);
    expect(isPushEndpoint('https://fcm.googleapis.com.evil.example/x')).toBe(false);
    expect(isPushEndpoint('https://fcm.googleapis.com:8443/x')).toBe(false);

    const keys = generateVapidKeys();
    const calls: string[] = [];
    const fake = (async (url: string) => {
      calls.push(url);
      return new Response(null, { status: url.endsWith('/gone') ? 410 : 201 });
    }) as unknown as typeof fetch;
    expect(await sendPush(sub, { t: 1 }, keys, 'mailto:a@b.ch', fake)).toBe('sent');
    expect(
      await sendPush({ ...sub, endpoint: sub.endpoint + '/gone' }, {}, keys, 'mailto:a@b.ch', fake),
    ).toBe('gone');
    expect(
      await sendPush(
        { ...sub, endpoint: 'https://evil.example/x' },
        {},
        keys,
        'mailto:a@b.ch',
        fake,
      ),
    ).toBe('gone');
    expect(calls).toHaveLength(2);
  });
});
