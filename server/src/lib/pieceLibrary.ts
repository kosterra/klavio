import { inflateRawSync } from 'node:zlib';
import {
  MusicXmlImportError,
  importMusicXml,
  midiToMusicXml,
  musicXmlFromBytes,
  pieceLevel,
  pieceReadiness,
  type MxlIo,
  type PieceLevel,
} from '@klavio/shared';
import { LibraryCache } from '../models/index.js';

/**
 * Sheet music libraries an admin can switch on: Klavio lists their pieces and
 * passes a file on to the learner's device, where it is read like an upload –
 * the browser itself never talks to other servers.
 *
 * - MuseTrainer (github.com/musetrainer/library): MusicXML files, published as
 *   public domain.
 * - Mutopia Project (mutopiaproject.org): solo piano pieces as MIDI, public
 *   domain or Creative Commons – the licence goes with each piece.
 *
 * Lists and what Klavio made of each file (level, size) are kept in the
 * database, so the sources are not asked again after a restart.
 */
export type SourceKey = 'musetrainer' | 'mutopia';

export const SOURCES: Record<SourceKey, { name: string; url: string }> = {
  musetrainer: { name: 'MuseTrainer', url: 'https://github.com/musetrainer/library' },
  mutopia: { name: 'Mutopia Project', url: 'https://www.mutopiaproject.org' },
};

const MUSETRAINER_LIST = 'https://api.github.com/repos/musetrainer/library/contents/scores';
const MUSETRAINER_FILES = 'https://musetrainer.github.io/library/scores/';
const MUTOPIA_TABLE = 'https://www.mutopiaproject.org/cgibin/make-table.cgi';
const MUTOPIA_FILES = 'https://www.mutopiaproject.org/ftp/';
/** how long a list is kept before it is fetched again */
const LIST_TTL_MS: Record<SourceKey, number> = {
  musetrainer: 24 * 60 * 60 * 1000,
  // ~80 pages of ten: asked once a week
  mutopia: 7 * 24 * 60 * 60 * 1000,
};
export const MAX_LIBRARY_FILE = 5 * 1024 * 1024;
const HEADERS = { 'user-agent': 'Klavio' };

export interface LibraryEntry {
  /** "Fur_Elise.mxl" (MuseTrainer) or "mutopia-223.mid" */
  id: string;
  source: SourceKey;
  title: string;
  composer: string | null;
  /** short: "Public Domain", "CC BY-SA 3.0" … (null: as the source says for all) */
  licence: string | null;
  /** the file's version (hash or date): a changed file is looked at again */
  version: string;
  /** where the file is fetched */
  url: string;
}

/** What Klavio makes of a file: its level and size, or why it cannot read it. */
export type LibraryInfo =
  | {
      readable: true;
      composer: string | null;
      level: PieceLevel;
      /** the lesson after which it can be played */
      lessonId: string;
      bars: number;
      hands: 1 | 2;
    }
  | { readable: false; problem: string };

/** "J._S._Bach_-_Air_on_the_G_String.mxl" → "J. S. Bach - Air on the G String" */
export function titleOf(file: string): string {
  return file
    .replace(/\.(mxl|musicxml|xml)$/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "by Ludwig van Beethoven(1770–1827)" → "Ludwig van Beethoven" */
export function cleanComposer(composer: string | null | undefined): string | null {
  const c = composer
    ?.replace(/^by\s+/i, '')
    .replace(/\(\s*\d{4}\s*[–-]\s*\d{4}\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return c && !/^unknown$/i.test(c) ? c : null;
}

/** "Creative Commons Attribution-ShareAlike 3.0" → "CC BY-SA 3.0" */
export function shortLicence(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim();
  const v = /(\d\.\d)/.exec(t)?.[1];
  if (/public domain/i.test(t)) return 'Public Domain';
  if (/ShareAlike/i.test(t)) return v ? `CC BY-SA ${v}` : 'CC BY-SA';
  if (/Attribution/i.test(t)) return v ? `CC BY ${v}` : 'CC BY';
  return t.slice(0, 60);
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};
function decode(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e: string) => {
      if (e[0] === '#') {
        const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1));
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The pieces on one page of Mutopia's table (solo piano). Pieces that come
 * only as several MIDI files (a zip, e.g. a suite) are left out.
 */
export function parseMutopiaTable(html: string): LibraryEntry[] {
  const out: LibraryEntry[] = [];
  for (const table of html.split('<table class="table-bordered result-table">').slice(1)) {
    const cells = [...table.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]!);
    const id = /piece-info\.cgi\?id=(\d+)/.exec(table)?.[1];
    const mid = /href="(https:\/\/www\.mutopiaproject\.org\/ftp\/[^"]+?\.mid)"/.exec(table)?.[1];
    if (!id || !mid || !mid.startsWith(MUTOPIA_FILES)) continue;
    out.push({
      id: `mutopia-${id}.mid`,
      source: 'mutopia',
      title: decode(cells[0] ?? '') || `Mutopia ${id}`,
      composer: cleanComposer(decode(cells[1] ?? '')),
      licence: cells[9] ? shortLicence(decode(cells[9])) : null,
      version: decode(cells[11] ?? '') || '0',
      url: mid,
    });
  }
  return out;
}

async function listMuseTrainer(fetcher: typeof fetch): Promise<LibraryEntry[]> {
  const res = await fetcher(MUSETRAINER_LIST, {
    headers: { accept: 'application/vnd.github+json', ...HEADERS },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`MuseTrainer list: ${res.status}`);
  const list = (await res.json()) as { name?: unknown; type?: unknown; sha?: unknown }[];
  return list
    .filter((x) => x.type === 'file' && typeof x.name === 'string' && /\.mxl$/i.test(x.name))
    .map((x) => ({
      id: x.name as string,
      source: 'musetrainer' as const,
      title: titleOf(x.name as string),
      composer: null,
      licence: null,
      version: typeof x.sha === 'string' ? x.sha : '',
      url: MUSETRAINER_FILES + encodeURIComponent(x.name as string),
    }));
}

async function listMutopia(fetcher: typeof fetch): Promise<LibraryEntry[]> {
  const out: LibraryEntry[] = [];
  // ten pieces a page, one page after the other (at most 2000 pieces)
  for (let start = 0; start < 2000; start += 10) {
    const res = await fetcher(`${MUTOPIA_TABLE}?startat=${start}&Instrument=Piano&solo=1`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`Mutopia list: ${res.status}`);
    const html = await res.text();
    if (!html.includes('result-table')) break;
    out.push(...parseMutopiaTable(html));
  }
  if (!out.length) throw new Error('Mutopia list: empty');
  return out;
}

const LISTERS: Record<SourceKey, (fetcher: typeof fetch) => Promise<LibraryEntry[]>> = {
  musetrainer: listMuseTrainer,
  mutopia: listMutopia,
};

const lists = new Map<SourceKey, { at: number; entries: LibraryEntry[] }>();
const listing = new Map<SourceKey, Promise<LibraryEntry[]>>();

/** One source's list: from memory, the database, or fetched (one fetch at a time). */
async function sourceEntries(key: SourceKey, fetcher: typeof fetch): Promise<LibraryEntry[]> {
  const fresh = (at: number) => Date.now() - at < LIST_TTL_MS[key];
  const mem = lists.get(key);
  if (mem && fresh(mem.at)) return mem.entries;
  const stored = await LibraryCache.findById(`list:${key}`).lean();
  if (stored && fresh(Number(stored.version))) {
    const entries = stored.data as LibraryEntry[];
    lists.set(key, { at: Number(stored.version), entries });
    return entries;
  }
  let running = listing.get(key);
  if (!running) {
    running = LISTERS[key](fetcher)
      .then(async (entries) => {
        const at = Date.now();
        lists.set(key, { at, entries });
        await LibraryCache.updateOne(
          { _id: `list:${key}` },
          { $set: { version: String(at), data: entries } },
          { upsert: true },
        );
        return entries;
      })
      .catch((err: unknown) => {
        // an old list is better than none
        const old = mem?.entries ?? (stored?.data as LibraryEntry[] | undefined);
        if (old) return old;
        throw err;
      })
      .finally(() => listing.delete(key));
    listing.set(key, running);
  }
  return running;
}

/**
 * The pieces of the switched-on sources, sorted by title. A source that
 * cannot be reached is left out; only when none can, it fails.
 */
export async function libraryEntries(
  keys: SourceKey[],
  fetcher: typeof fetch = fetch,
): Promise<LibraryEntry[]> {
  const settled = await Promise.allSettled(keys.map((k) => sourceEntries(k, fetcher)));
  const ok = settled.filter((s) => s.status === 'fulfilled');
  if (keys.length && !ok.length) throw (settled[0] as PromiseRejectedResult).reason;
  return ok.flatMap((s) => s.value).sort((a, b) => a.title.localeCompare(b.title));
}

/** Search by words of the title and composer (all must occur, in any order, ignoring accents). */
export function searchLibrary<T extends { title: string; composer?: string | null }>(
  entries: T[],
  query: string,
  limit = 2000,
): T[] {
  const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const words = fold(query).split(/\s+/).filter(Boolean);
  return entries
    .filter((e) => {
      const text = fold(`${e.title} ${e.composer ?? ''}`);
      return words.every((w) => text.includes(w));
    })
    .slice(0, limit);
}

async function download(entry: LibraryEntry, fetcher: typeof fetch): Promise<Uint8Array> {
  const res = await fetcher(entry.url, { headers: HEADERS, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`library file: ${res.status}`);
  const size = Number(res.headers.get('content-length') ?? 0);
  if (size > MAX_LIBRARY_FILE) throw new Error('library file too big');
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length > MAX_LIBRARY_FILE) throw new Error('library file too big');
  return bytes;
}

/** One file of the switched-on sources, as bytes (only files from their lists are fetched). */
export async function libraryFile(
  id: string,
  keys: SourceKey[],
  fetcher: typeof fetch = fetch,
): Promise<{ bytes: Uint8Array; entry: LibraryEntry } | null> {
  const entry = (await libraryEntries(keys, fetcher)).find((e) => e.id === id);
  if (!entry) return null;
  const bytes = await download(entry, fetcher);
  if (!(await libraryInfo(entry))) await remember(entry, await analyseFile(bytes, entry.title));
  return { bytes, entry };
}

/** Unpacking on the server: zlib and Node's buffers. */
const io: MxlIo = {
  inflate: (raw) => new Uint8Array(inflateRawSync(raw)),
  text: (bytes) => Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('utf8'),
};

/** Reads a file (MusicXML, .mxl or MIDI) as the learner's device would, for its level and size. */
export async function analyseFile(bytes: Uint8Array, title = ''): Promise<LibraryInfo> {
  try {
    const midi = bytes[0] === 0x4d && bytes[1] === 0x54 && bytes[2] === 0x68 && bytes[3] === 0x64;
    const xml = midi ? midiToMusicXml(bytes, { title }) : await musicXmlFromBytes(bytes, io);
    const piece = importMusicXml(xml);
    const readiness = pieceReadiness(piece.exercise);
    return {
      readable: true,
      composer: cleanComposer(piece.composer),
      level: pieceLevel(piece.exercise, readiness),
      lessonId: readiness.lesson.id,
      bars: piece.exercise.bars.length,
      hands: piece.kind === 'piece' ? 2 : 1,
    };
  } catch (err) {
    return {
      readable: false,
      problem: err instanceof MusicXmlImportError ? err.code : 'NOT_READABLE',
    };
  }
}

/** Looked-at files, loaded once from the database (one load, however many ask). */
let infos: Promise<Map<string, { version: string; info: LibraryInfo }>> | null = null;
function loadInfos() {
  infos ??= LibraryCache.find({ _id: /^info:/ })
    .lean()
    .then(
      (docs) =>
        new Map(
          docs.map((d) => [d._id.slice(5), { version: d.version, info: d.data as LibraryInfo }]),
        ),
    );
  return infos;
}

async function remember(entry: LibraryEntry, info: LibraryInfo) {
  (await loadInfos()).set(entry.id, { version: entry.version, info });
  await LibraryCache.updateOne(
    { _id: `info:${entry.id}` },
    { $set: { version: entry.version, data: info } },
    { upsert: true },
  );
}

export async function libraryInfo(entry: LibraryEntry): Promise<LibraryInfo | null> {
  const hit = (await loadInfos()).get(entry.id);
  return hit && hit.version === entry.version ? hit.info : null;
}

/** files that could not be fetched, and when: tried again after an hour */
const failed = new Map<string, number>();
const RETRY_MS = 60 * 60 * 1000;
let analysing: Promise<void> | null = null;

/** Whether a file still waits to be looked at (not looked at, and not just failed). */
export async function libraryPending(entry: LibraryEntry): Promise<boolean> {
  return !(await libraryInfo(entry)) && Date.now() - (failed.get(entry.id) ?? 0) > RETRY_MS;
}

/**
 * Looks at every file not looked at yet, a few at a time, in the background:
 * the list shows levels as they come in. One run at a time; a file that
 * cannot be fetched is tried again an hour later.
 */
export function analyseLibrary(
  entries: LibraryEntry[],
  fetcher: typeof fetch = fetch,
): Promise<void> {
  analysing ??= (async () => {
    const todo: LibraryEntry[] = [];
    for (const e of entries) if (await libraryPending(e)) todo.push(e);
    const run = async () => {
      while (todo.length) {
        const entry = todo.shift()!;
        try {
          await remember(entry, await analyseFile(await download(entry, fetcher), entry.title));
          failed.delete(entry.id);
        } catch {
          failed.set(entry.id, Date.now());
        }
      }
    };
    await Promise.all([run(), run(), run()]);
  })().finally(() => {
    analysing = null;
  });
  return analysing;
}

/** for tests: forget lists and what was looked at (the database is reset separately) */
export function resetLibraryCache() {
  lists.clear();
  listing.clear();
  infos = null;
  failed.clear();
}
