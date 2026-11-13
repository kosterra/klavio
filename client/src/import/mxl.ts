import { musicXmlFromBytes, type MxlIo } from '@klavio/shared';

/** Unpacking in the browser: its own deflate stream and text decoder. */
const io: MxlIo = {
  inflate: async (data) => {
    const stream = new Blob([data as BlobPart])
      .stream()
      .pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  },
  text: (bytes) => new TextDecoder().decode(bytes),
};

/** The MusicXML text of a file: plain .xml/.musicxml as it is, .mxl unpacked. */
export async function musicXmlText(file: File): Promise<string> {
  return musicXmlFromBytes(new Uint8Array(await file.arrayBuffer()), io);
}
