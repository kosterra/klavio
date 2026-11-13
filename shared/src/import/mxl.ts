/**
 * Compressed MusicXML (.mxl, a zip archive): the score named in
 * META-INF/container.xml (or the first .xml/.musicxml). Only «stored» and
 * «deflate» entries – what every notation program writes. Unpacking and text
 * decoding come from the caller (the browser's streams, or zlib on the server).
 */
export interface MxlIo {
  /** raw deflate → bytes */
  inflate(raw: Uint8Array): Uint8Array | Promise<Uint8Array>;
  /** UTF-8 bytes → text */
  text(bytes: Uint8Array): string;
}

interface Entry {
  name: string;
  method: number;
  size: number;
  offset: number;
}

function entries(buf: Uint8Array, io: MxlIo): Entry[] {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  // end of central directory: the last 22+ bytes
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('NOT_ZIP');
  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const out: Entry[] = [];
  for (let i = 0; i < count; i++) {
    if (view.getUint32(p, true) !== 0x02014b50) throw new Error('NOT_ZIP');
    const method = view.getUint16(p + 10, true);
    const size = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const offset = view.getUint32(p + 42, true);
    out.push({ name: io.text(buf.subarray(p + 46, p + 46 + nameLen)), method, size, offset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

async function read(buf: Uint8Array, e: Entry, io: MxlIo): Promise<string> {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const nameLen = view.getUint16(e.offset + 26, true);
  const extraLen = view.getUint16(e.offset + 28, true);
  const start = e.offset + 30 + nameLen + extraLen;
  const raw = buf.subarray(start, start + e.size);
  const data = e.method === 0 ? raw : e.method === 8 ? await io.inflate(raw) : null;
  if (!data) throw new Error('NOT_ZIP');
  return io.text(data);
}

/** The MusicXML text of a file: plain .xml/.musicxml as it is, .mxl unpacked. */
export async function musicXmlFromBytes(buf: Uint8Array, io: MxlIo): Promise<string> {
  // a zip starts with «PK»
  if (buf[0] !== 0x50 || buf[1] !== 0x4b) return io.text(buf);
  const list = entries(buf, io);
  const container = list.find((e) => e.name === 'META-INF/container.xml');
  let path: string | undefined;
  if (container) path = /full-path="([^"]+)"/.exec(await read(buf, container, io))?.[1];
  const score =
    list.find((e) => e.name === path) ??
    list.find((e) => /\.(xml|musicxml)$/i.test(e.name) && !e.name.startsWith('META-INF/'));
  if (!score) throw new Error('NOT_ZIP');
  return read(buf, score, io);
}
