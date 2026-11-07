import { formatRecoveryCode, hmac, randomRecoveryCode } from './crypto.js';

export const RECOVERY_CODE_COUNT = 8;

export function generateRecoveryCodes(secret: string) {
  const plain = Array.from({ length: RECOVERY_CODE_COUNT }, randomRecoveryCode);
  return {
    display: plain.map(formatRecoveryCode),
    hashes: plain.map((c) => hmac(secret, `recovery:${c}`)),
  };
}

/** `normalized` = 10 uppercase chars without dash (see recoveryCodeSchema). */
export function hashRecoveryCode(secret: string, normalized: string): string {
  return hmac(secret, `recovery:${normalized}`);
}
