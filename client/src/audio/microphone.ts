import processorUrl from './pitch/pitch-processor.ts?worker&url';
import type { AnalysisFrame } from './pitch/types';

export type MicErrorCode = 'MIC_UNSUPPORTED' | 'MIC_DENIED' | 'MIC_NOT_FOUND' | 'MIC_FAILED';

export class MicError extends Error {
  constructor(readonly code: MicErrorCode) {
    super(code);
  }
}

export interface MicInfo {
  sampleRate: number;
  windowSize: number;
  hopSize: number;
  /** Output/processing latency reported by the browser (s), if any. */
  baseLatency: number;
  deviceLabel: string;
}

export interface MicSession {
  info: MicInfo;
  onFrame(listener: (frame: AnalysisFrame) => void): () => void;
  stop(): Promise<void>;
}

export function microphoneSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof AudioWorkletNode !== 'undefined'
  );
}

/**
 * Opens the microphone and starts pitch analysis in an AudioWorklet.
 * Must be called from a user gesture (iOS only starts audio after a tap).
 * Browser "voice" processing is switched off: it would distort a piano.
 */
export async function openMicrophone(deviceId?: string): Promise<MicSession> {
  if (!microphoneSupported()) throw new MicError('MIC_UNSUPPORTED');

  // Create/resume the context synchronously inside the gesture (Safari).
  const context = new AudioContext({ latencyHint: 'interactive' });
  const resumed = context.resume();

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      },
    });
  } catch (err) {
    await context.close();
    const name = err instanceof DOMException ? err.name : '';
    if (name === 'NotAllowedError' || name === 'SecurityError') throw new MicError('MIC_DENIED');
    if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      throw new MicError('MIC_NOT_FOUND');
    }
    throw new MicError('MIC_FAILED');
  }

  try {
    await resumed;
    await context.audioWorklet.addModule(processorUrl);
    const source = context.createMediaStreamSource(stream);
    const node = new AudioWorkletNode(context, 'klavio-pitch', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 1,
      channelCountMode: 'explicit',
    });
    // Some browsers only pull nodes that lead to the destination; keep it silent.
    const mute = context.createGain();
    mute.gain.value = 0;
    source.connect(node).connect(mute).connect(context.destination);

    const listeners = new Set<(frame: AnalysisFrame) => void>();
    const config = await new Promise<{ windowSize: number; hopSize: number }>((resolve) => {
      node.port.onmessage = (e: MessageEvent) => {
        const data = e.data as { type?: string } & AnalysisFrame;
        if (data.type === 'config') {
          resolve(data as unknown as { windowSize: number; hopSize: number });
          return;
        }
        for (const l of listeners) l(data);
      };
    });

    return {
      info: {
        sampleRate: context.sampleRate,
        windowSize: config.windowSize,
        hopSize: config.hopSize,
        baseLatency: context.baseLatency ?? 0,
        deviceLabel: stream.getAudioTracks()[0]?.label ?? '',
      },
      onFrame(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      async stop() {
        listeners.clear();
        node.port.onmessage = null;
        stream.getTracks().forEach((t) => t.stop());
        source.disconnect();
        node.disconnect();
        await context.close();
      },
    };
  } catch {
    stream.getTracks().forEach((t) => t.stop());
    await context.close();
    throw new MicError('MIC_FAILED');
  }
}
