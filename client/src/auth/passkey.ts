import { startAuthentication, startRegistration, WebAuthnError } from '@simplewebauthn/browser';
import { ApiError } from '../api/client';
import { endpoints } from '../api/endpoints';

/** Maps the user dismissing the OS passkey dialog to a friendly error code. */
async function guard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof WebAuthnError) {
      if (err.code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED') {
        throw new ApiError(400, 'PASSKEY_ALREADY_REGISTERED');
      }
      throw new ApiError(0, 'WEBAUTHN_CANCELLED');
    }
    if (
      err instanceof DOMException &&
      (err.name === 'NotAllowedError' || err.name === 'AbortError')
    ) {
      throw new ApiError(0, 'WEBAUTHN_CANCELLED');
    }
    throw err;
  }
}

export function loginWithPasskey() {
  return guard(async () => {
    const optionsJSON = await endpoints.loginOptions();
    const response = await startAuthentication({ optionsJSON });
    await endpoints.loginVerify(response);
  });
}

export function addPasskey() {
  return guard(async () => {
    const optionsJSON = await endpoints.addPasskeyOptions();
    const response = await startRegistration({ optionsJSON });
    return endpoints.addPasskeyVerify(response);
  });
}
