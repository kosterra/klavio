import {
  createCipheriv,
  createECDH,
  createHmac,
  createPrivateKey,
  randomBytes,
  sign,
} from 'node:crypto';

/**
 * Web Push without a library: the message is encrypted for the one browser
 * (RFC 8291, aes128gcm) and signed with the server's key (VAPID, RFC 8292).
 * The browser maker's push service only passes on what it cannot read.
 */

export const b64u = {
  encode: (b: Buffer | Uint8Array) => Buffer.from(b).toString('base64url'),
  decode: (s: string) => Buffer.from(s, 'base64url'),
};

/** The push services of the browsers – the only hosts the server sends to (no requests to anywhere else). */
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/,
  /^android\.googleapis\.com$/,
  /^updates\.push\.services\.mozilla\.com$/,
  /^push\.services\.mozilla\.com$/,
  /^web\.push\.apple\.com$/,
  /^[a-z0-9-]+\.push\.apple\.com$/,
  /^[a-z0-9-]+\.notify\.windows\.com$/,
];

export function isPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return url.protocol === 'https:' && !url.port && PUSH_HOSTS.some((h) => h.test(url.hostname));
  } catch {
    return false;
  }
}

/** A new VAPID key pair (base64url): the public key goes to the browsers, the private one stays secret. */
export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  const ecdh = createECDH('prime256v1');
  ecdh.generateKeys();
  return {
    publicKey: b64u.encode(ecdh.getPublicKey()),
    privateKey: b64u.encode(ecdh.getPrivateKey()),
  };
}

function hkdf(salt: Buffer, ikm: Buffer, info: Buffer, length: number): Buffer {
  const prk = createHmac('sha256', salt).update(ikm).digest();
  return createHmac('sha256', prk)
    .update(Buffer.concat([info, Buffer.from([1])]))
    .digest()
    .subarray(0, length);
}

/** Encrypts `payload` for a browser's subscription keys (p256dh, auth). */
export function encryptPayload(payload: Buffer, p256dh: string, auth: string): Buffer {
  const uaPublic = b64u.decode(p256dh);
  const authSecret = b64u.decode(auth);
  const ecdh = createECDH('prime256v1');
  ecdh.generateKeys();
  const asPublic = ecdh.getPublicKey();
  const shared = ecdh.computeSecret(uaPublic);
  const ikm = hkdf(
    authSecret,
    shared,
    Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic]),
    32,
  );
  const salt = randomBytes(16);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const cipher = createCipheriv('aes-128-gcm', cek, nonce);
  // one record: the message and the padding delimiter 0x02
  const body = Buffer.concat([
    cipher.update(Buffer.concat([payload, Buffer.from([2])])),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  const header = Buffer.alloc(21);
  salt.copy(header, 0);
  header.writeUInt32BE(4096, 16);
  header.writeUInt8(asPublic.length, 20);
  return Buffer.concat([header, asPublic, body]);
}

/** The VAPID token for one push service (valid 12 hours). */
export function vapidAuthorization(
  endpoint: string,
  keys: { publicKey: string; privateKey: string },
  subject: string,
  now = Date.now(),
): string {
  const pub = b64u.decode(keys.publicKey);
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: keys.privateKey,
    x: b64u.encode(pub.subarray(1, 33)),
    y: b64u.encode(pub.subarray(33, 65)),
  };
  const key = createPrivateKey({ key: jwk, format: 'jwk' });
  const head = b64u.encode(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64u.encode(
    Buffer.from(
      JSON.stringify({
        aud: new URL(endpoint).origin,
        exp: Math.floor(now / 1000) + 12 * 3600,
        sub: subject,
      }),
    ),
  );
  const signature = sign('sha256', Buffer.from(`${head}.${claims}`), {
    key,
    dsaEncoding: 'ieee-p1363',
  });
  return `vapid t=${head}.${claims}.${b64u.encode(signature)}, k=${keys.publicKey}`;
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Sends one push message. Returns `gone` when the browser has dropped the
 * subscription (it is to be deleted), otherwise whether it was accepted.
 */
export async function sendPush(
  target: PushTarget,
  message: unknown,
  keys: { publicKey: string; privateKey: string },
  subject: string,
  fetchFn: typeof fetch = fetch,
): Promise<'sent' | 'gone' | 'failed'> {
  if (!isPushEndpoint(target.endpoint)) return 'gone';
  const res = await fetchFn(target.endpoint, {
    method: 'POST',
    headers: {
      authorization: vapidAuthorization(target.endpoint, keys, subject),
      'content-encoding': 'aes128gcm',
      'content-type': 'application/octet-stream',
      ttl: '3600',
      urgency: 'normal',
    },
    body: encryptPayload(Buffer.from(JSON.stringify(message)), target.p256dh, target.auth),
    signal: AbortSignal.timeout(10_000),
    redirect: 'error',
  });
  if (res.status === 404 || res.status === 410) return 'gone';
  return res.ok ? 'sent' : 'failed';
}
