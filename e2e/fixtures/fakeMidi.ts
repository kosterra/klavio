/**
 * Replaces Web MIDI with a fake device controllable from the test:
 *   window.__fakeMidi.send([0x90, 60, 100]); window.__fakeMidi.unplug()
 * Runs in the page before any app code (page.addInitScript).
 */
export function installFakeMidi() {
  type Listener = ((e: { data: Uint8Array }) => void) | null;
  const input = {
    id: 'fake-1',
    name: 'Klavio Test Piano',
    manufacturer: 'E2E',
    state: 'connected',
    onmidimessage: null as Listener,
  };
  const inputs = new Map([[input.id, input]]);
  const access = {
    inputs,
    outputs: new Map(),
    onstatechange: null as (() => void) | null,
    sysexEnabled: false,
  };
  Object.defineProperty(Navigator.prototype, 'requestMIDIAccess', {
    configurable: true,
    value: () => Promise.resolve(access),
  });
  (window as unknown as { __fakeMidi: unknown }).__fakeMidi = {
    send: (bytes: number[]) => input.onmidimessage?.({ data: new Uint8Array(bytes) }),
    unplug: () => {
      input.state = 'disconnected';
      access.onstatechange?.();
    },
  };
}
