import { parseMidiMessage } from './midiMessage';
import { inputHub, publishNote } from './noteBus';

export type MidiStatus = 'unsupported' | 'idle' | 'requesting' | 'ready' | 'denied';

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
}

export interface MidiState {
  status: MidiStatus;
  devices: MidiDevice[];
}

/**
 * Web MIDI input (Chrome, Edge, Opera, Android; not Safari/iOS or Firefox
 * without add-on). All connected inputs are used; hot-plugging is handled.
 */
class MidiService {
  private state: MidiState = {
    status:
      typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator ? 'idle' : 'unsupported',
    devices: [],
  };
  private readonly listeners = new Set<() => void>();
  private access: MIDIAccess | null = null;
  private readonly held = new Map<string, Set<number>>();

  getState = (): MidiState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private set(next: Partial<MidiState>) {
    this.state = { ...this.state, ...next };
    inputHub.midiConnected = this.state.devices.length > 0;
    for (const l of this.listeners) l();
  }

  /** Connect without prompting if the user allowed MIDI before. */
  async connectIfGranted(): Promise<void> {
    if (this.state.status !== 'idle' || !navigator.permissions) return;
    try {
      const p = await navigator.permissions.query({ name: 'midi' as PermissionName });
      if (p.state === 'granted') await this.connect();
    } catch {
      /* permission query for "midi" not supported → wait for the user */
    }
  }

  /** Ask for MIDI access (may show a browser prompt; call from a user action). */
  async connect(): Promise<void> {
    if (this.state.status === 'unsupported' || this.access) return;
    this.set({ status: 'requesting' });
    try {
      this.access = await navigator.requestMIDIAccess({ sysex: false });
    } catch {
      this.set({ status: 'denied' });
      return;
    }
    this.access.onstatechange = () => this.refreshInputs();
    this.refreshInputs();
    this.set({ status: 'ready' });
  }

  private refreshInputs() {
    const access = this.access!;
    const devices: MidiDevice[] = [];
    for (const input of access.inputs.values()) {
      if (input.state !== 'connected') {
        this.releaseAll(input.id);
        continue;
      }
      input.onmidimessage = (e) => this.onMessage(input.id, e);
      devices.push({
        id: input.id,
        name: input.name ?? 'MIDI',
        manufacturer: input.manufacturer ?? '',
      });
    }
    for (const id of this.held.keys()) {
      if (!devices.some((d) => d.id === id)) this.releaseAll(id);
    }
    this.set({ devices });
  }

  private onMessage(deviceId: string, e: MIDIMessageEvent) {
    if (!e.data) return;
    const note = parseMidiMessage(e.data);
    if (!note) return;
    const held = this.held.get(deviceId) ?? new Set<number>();
    this.held.set(deviceId, held);
    if (note.type === 'note-on') held.add(note.midi);
    else held.delete(note.midi);
    publishNote({
      type: note.type,
      midi: note.midi,
      velocity: note.velocity,
      time: performance.now(),
      source: 'midi',
    });
  }

  /** A device disappeared while keys were down: end those notes. */
  private releaseAll(deviceId: string) {
    const held = this.held.get(deviceId);
    if (!held) return;
    for (const midi of held) {
      publishNote({ type: 'note-off', midi, velocity: 0, time: performance.now(), source: 'midi' });
    }
    this.held.delete(deviceId);
  }
}

export const midiService = new MidiService();
