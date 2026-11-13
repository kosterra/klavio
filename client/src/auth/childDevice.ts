import { useEffect, useState } from 'react';
import type { DeviceProfilesResponse } from '@klavio/shared';
import { endpoints } from '../api/endpoints';

/**
 * Whether this browser is a child's device (and who can log in on it):
 * asked once per page load, shared by the start page and the login card.
 * `undefined` while asking, `null` when it is not one (or nobody has a PIN).
 */
let asked: Promise<DeviceProfilesResponse | null> | null = null;

export function forgetChildDevice() {
  asked = null;
}

export function useChildDevice(): DeviceProfilesResponse | null | undefined {
  const [device, setDevice] = useState<DeviceProfilesResponse | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    asked ??= endpoints.deviceProfiles().then(
      (d) => (d.profiles.length > 0 ? d : null),
      () => null,
    );
    void asked.then((d) => !cancelled && setDevice(d));
    return () => {
      cancelled = true;
    };
  }, []);
  return device;
}
