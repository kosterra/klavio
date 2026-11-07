/**
 * AudioWorklet processor: runs the pitch analysis on the audio thread and posts
 * one small {@link AnalysisFrame} per hop (~11 ms) to the main thread.
 * Audio samples never leave this processor — only pitch/level numbers do.
 */
import { StreamAnalyzer } from './analyzer';
import type { AnalysisFrame } from './types';

// AudioWorkletGlobalScope (not part of TypeScript's DOM lib)
declare const sampleRate: number;
declare function registerProcessor(name: string, ctor: unknown): void;
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
}

class PitchProcessor extends AudioWorkletProcessor {
  private readonly analyzer = new StreamAnalyzer({ sampleRate });
  private readonly send = (frame: AnalysisFrame) => this.port.postMessage(frame);

  constructor() {
    super();
    this.port.postMessage({
      type: 'config',
      sampleRate,
      windowSize: this.analyzer.windowSize,
      hopSize: this.analyzer.hopSize,
    });
  }

  process(inputs: Float32Array[][]): boolean {
    const channel = inputs[0]?.[0];
    if (channel) this.analyzer.push(channel, this.send);
    return true; // keep running while the node is connected
  }
}

registerProcessor('klavio-pitch', PitchProcessor);
