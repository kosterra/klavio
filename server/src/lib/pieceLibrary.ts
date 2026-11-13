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
}

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
  const list = (await res.json()) as { name?: unknown; type?: unknown }[];
  const entries = list
    .filter((x) => x.type === 'file' && typeof x.name === 'string' && /\.mxl$/i.test(x.name))
    .map((x) => ({ id: x.name as string, title: titleOf(x.name as string) }))
    .sort((a, b) => a.title.localeCompare(b.title));
  cache = { at: Date.now(), entries };
  return entries;
}

/** Search by words of the title (all must occur, in any order, ignoring accents). */
export function searchLibrary(entries: LibraryEntry[], query: string, limit = 30): LibraryEntry[] {
  const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const words = fold(query).split(/\s+/).filter(Boolean);
  return entries.filter((e) => words.every((w) => fold(e.title).includes(w))).slice(0, limit);
}

/** One file of the library, as bytes (only names from the list are fetched). */
export async function libraryFile(
  id: string,
  fetcher: typeof fetch = fetch,
): Promise<Uint8Array | null> {
  const entries = await libraryEntries(fetcher);
  if (!entries.some((e) => e.id === id)) return null;
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

/** for tests: forget the cached list */
export function resetLibraryCache() {
  cache = null;
}
