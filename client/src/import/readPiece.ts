import {
  MidiImportError,
  MusicXmlImportError,
  importMusicXml,
  midiToMusicXml,
  type ImportedPiece,
} from '@klavio/shared';
import { musicXmlText } from './mxl';

/** Why a file could not be read: a key under `own.errors` and its parameters. */
export class PieceReadError extends Error {
  constructor(
    public readonly key: string,
    public readonly params: { bar?: number } = {},
  ) {
    super(key);
  }
}

/**
 * Reads a MusicXML (.musicxml, .xml, .mxl) or MIDI file on the device – a
 * MIDI file goes through MusicXML, named after the file. Nothing is sent
 * anywhere until the piece is saved.
 */
export async function readPieceFile(file: File): Promise<ImportedPiece> {
  if (file.size > 5 * 1024 * 1024) throw new PieceReadError('TOO_BIG');
  try {
    const midi = /\.midi?$/i.test(file.name);
    const xml = midi
      ? midiToMusicXml(new Uint8Array(await file.arrayBuffer()), {
          title: file.name.replace(/\.midi?$/i, '').replace(/[-_]+/g, ' '),
        })
      : await musicXmlText(file);
    return importMusicXml(xml);
  } catch (err) {
    if (err instanceof MusicXmlImportError) throw new PieceReadError(err.code, { bar: err.bar });
    throw new PieceReadError(err instanceof MidiImportError ? 'NOT_MIDI' : 'NOT_MUSICXML');
  }
}
