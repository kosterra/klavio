import { inflateRawSync } from 'node:zlib';
import {
  MusicXmlImportError,
  importMusicXml,
  musicXmlFromBytes,
  pieceLevel,
  pieceReadiness,
  type MxlIo,
  type PieceLevel,
} from '@klavio/shared';

/**
 * The MuseTrainer library (github.com/musetrainer/library): MusicXML files
 * published as public domain. Klavio lists them and passes a file on to the
 * learner's device, where it is read like an upload – the browser itself
 * never talks to other servers. Off unless an admin switches it on.
 */
export const LIBRARY_SOURCE = {
  name: 'MuseTrainer',
  url: 'https://github.com/musetrainer/library',
};
const LIST_URL = 'https://api.github.com/repos/musetrainer/library/contents/scores';
const FILE_URL = 'https://musetrainer.github.io/library/scores/';
/** the list changes rarely: fetched again after a day */
const LIST_TTL_MS = 24 * 60 * 60 * 1000;
export const MAX_LIBRARY_FILE = 5 * 1024 * 1024;

export interface LibraryEntry {
  /** the file name, e.g. "Fur_Elise.mxl" */
  id: string;
  title: string;
  /** GitHub's hash of the file: a changed file is looked at again */
  sha: string;
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

let cache: { at: number; entries: LibraryEntry[] } | null = null;

/** "J._S._Bach_-_Air_on_the_G_String.mxl" → "J. S. Bach - Air on the G String" */
export function titleOf(file: string): string {
  return file
    .replace(/\.(mxl|musicxml|xml)$/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The library's files (cached for a day). */
export async function libraryEntries(fetcher: typeof fetch = fetch): Promise<LibraryEntry[]> {
  if (cache && Date.now() - cache.at < LIST_TTL_MS) return cache.entries;
  const res = await fetcher(LIST_URL, {
    headers: { accept: 'application/vnd.github+json', 'user-agent': 'Klavio' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`library list: ${res.status}`);
  const list = (await res.json()) as { name?: unknown; type?: unknown; sha?: unknown }[];
  const entries = list
    .filter((x) => x.type === 'file' && typeof x.name === 'string' && /\.mxl$/i.test(x.name))
    .map((x) => ({
      id: x.name as string,
      title: titleOf(x.name as string),
      sha: typeof x.sha === 'string' ? x.sha : '',
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
  cache = { at: Date.now(), entries };
  return entries;
}

/** Search by words of the title (all must occur, in any order, ignoring accents). */
export function searchLibrary<T extends { title: string }>(
  entries: T[],
  query: string,
  limit = 500,
): T[] {
  const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const words = fold(query).split(/\s+/).filter(Boolean);
  return entries.filter((e) => words.every((w) => fold(e.title).includes(w))).slice(0, limit);
}

/** One file of the library, as bytes (only names from the list are fetched). */
export async function libraryFile(
  id: string,
  fetcher: typeof fetch = fetch,
): Promise<Uint8Array | null> {
  const entry = (await libraryEntries(fetcher)).find((e) => e.id === id);
  if (!entry) return null;
  const bytes = await download(id, fetcher);
  if (!infos.has(id)) infos.set(id, { sha: entry.sha, info: await analyseFile(bytes) });
  return bytes;
}

async function download(id: string, fetcher: typeof fetch): Promise<Uint8Array> {
  const res = await fetcher(FILE_URL + encodeURIComponent(id), {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`library file: ${res.status}`);
  const size = Number(res.headers.get('content-length') ?? 0);
  if (size > MAX_LIBRARY_FILE) throw new Error('library file too big');
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length > MAX_LIBRARY_FILE) throw new Error('library file too big');
  return bytes;
}

/** Unpacking on the server: zlib and Node's buffers. */
const io: MxlIo = {
  inflate: (raw) => new Uint8Array(inflateRawSync(raw)),
  text: (bytes) => Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('utf8'),
};

/** "Ludwig van Beethoven(1770–1827)" → "Ludwig van Beethoven" */
export function cleanComposer(composer: string | null): string | null {
  const c = composer
    ?.replace(/\(\s*\d{4}\s*[–-]\s*\d{4}\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return c && !/^unknown$/i.test(c) ? c : null;
}

/** Reads a file as the learner's device would, for its level and size. */
export async function analyseFile(bytes: Uint8Array): Promise<LibraryInfo> {
  try {
    const piece = importMusicXml(await musicXmlFromBytes(bytes, io));
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
      problem: err instanceof MusicXmlImportError ? err.code : 'NOT_MUSICXML',
    };
  }
}

/** Looked-at files (kept while the server runs; a changed file is looked at again). */
const infos = new Map<string, { sha: string; info: LibraryInfo }>();
/** files that could not be fetched, and when: tried again after an hour */
const failed = new Map<string, number>();
const RETRY_MS = 60 * 60 * 1000;
let analysing: Promise<void> | null = null;

/** Whether a file still waits to be looked at (not looked at, and not just failed). */
export function libraryPending(entry: LibraryEntry): boolean {
  return !libraryInfo(entry) && Date.now() - (failed.get(entry.id) ?? 0) > RETRY_MS;
}

export function libraryInfo(entry: LibraryEntry): LibraryInfo | null {
  const hit = infos.get(entry.id);
  return hit && hit.sha === entry.sha ? hit.info : null;
}

/**
 * Looks at every file not looked at yet, a few at a time, in the background:
 * the list shows levels as they come in. One run at a time; a file that
 * cannot be fetched is tried again on the next run.
 */
export function analyseLibrary(
  entries: LibraryEntry[],
  fetcher: typeof fetch = fetch,
): Promise<void> {
  if (analysing) return analysing;
  const todo = entries.filter(libraryPending);
  if (!todo.length) return Promise.resolve();
  const run = async () => {
    while (todo.length) {
      const entry = todo.shift()!;
      try {
        infos.set(entry.id, {
          sha: entry.sha,
          info: await analyseFile(await download(entry.id, fetcher)),
        });
        failed.delete(entry.id);
      } catch {
        // not reachable right now: in an hour
        failed.set(entry.id, Date.now());
      }
    }
  };
  analysing = Promise.all([run(), run(), run()]).then(() => {
    analysing = null;
  });
  return analysing;
}

/** for tests: forget the cached list and what was looked at */
export function resetLibraryCache() {
  cache = null;
  infos.clear();
  failed.clear();
}
