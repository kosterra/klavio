import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { APP_CONFIG } from '@klavio/shared';
import type { AppConfig } from '../config.js';
import { badRequest } from './errors.js';

/**
 * Thin wrapper so routes stay readable and tests can mock a single module
 * (real authenticators cannot run inside unit tests).
 */
export const webauthn = {
  registrationOptions(
    config: AppConfig,
    user: { webauthnUserId: string; displayName: string },
    exclude: { credentialId: string; transports: string[] }[] = [],
  ) {
    return generateRegistrationOptions({
      rpName: APP_CONFIG.name,
      rpID: config.RP_ID,
      userName: user.displayName,
      userDisplayName: user.displayName,
      userID: Buffer.from(user.webauthnUserId, 'base64url'),
      attestationType: 'none',
      excludeCredentials: exclude.map((c) => ({ id: c.credentialId, transports: c.transports })),
      authenticatorSelection: {
        // discoverable credential → login without typing a username
        residentKey: 'required',
        userVerification: 'preferred',
      },
    });
  },

  async verifyRegistration(config: AppConfig, response: unknown, expectedChallenge: string) {
    let result;
    try {
      result = await verifyRegistrationResponse({
        response: response as RegistrationResponseJSON,
        expectedChallenge,
        expectedOrigin: config.APP_ORIGIN,
        expectedRPID: config.RP_ID,
        requireUserVerification: false,
      });
    } catch {
      throw badRequest('WEBAUTHN_VERIFICATION_FAILED');
    }
    if (!result.verified) throw badRequest('WEBAUTHN_VERIFICATION_FAILED');
    const info = result.registrationInfo;
    return {
      credentialId: info.credential.id,
      publicKey: Buffer.from(info.credential.publicKey),
      counter: info.credential.counter,
      transports: info.credential.transports ?? [],
      deviceType: info.credentialDeviceType,
      backedUp: info.credentialBackedUp,
      providerName: Object.values(info.passkeyProviderMetadata?.friendlyNames ?? {})[0] as
        string | undefined,
    };
  },

  authenticationOptions(config: AppConfig) {
    return generateAuthenticationOptions({ rpID: config.RP_ID, userVerification: 'preferred' });
  },

  async verifyAuthentication(
    config: AppConfig,
    response: unknown,
    expectedChallenge: string,
    credential: { credentialId: string; publicKey: Buffer; counter: number; transports: string[] },
  ) {
    let result;
    try {
      result = await verifyAuthenticationResponse({
        response: response as AuthenticationResponseJSON,
        expectedChallenge,
        expectedOrigin: config.APP_ORIGIN,
        expectedRPID: config.RP_ID,
        credential: {
          id: credential.credentialId,
          publicKey: new Uint8Array(credential.publicKey),
          counter: credential.counter,
          transports: credential.transports,
        },
        requireUserVerification: false,
      });
    } catch {
      throw badRequest('WEBAUTHN_VERIFICATION_FAILED');
    }
    if (!result.verified) throw badRequest('WEBAUTHN_VERIFICATION_FAILED');
    return {
      newCounter: result.authenticationInfo.newCounter,
      backedUp: result.authenticationInfo.credentialBackedUp,
    };
  },
};
