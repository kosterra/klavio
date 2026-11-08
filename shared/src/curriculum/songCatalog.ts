import type { GoalStyle, SkillId } from './skills.ts';

/**
 * A small built-in list of well-known songs with the kind of piece and the
 * skills a typical easy-piano arrangement needs. It only knows titles and
 * musical traits (key, time, texture) – never notes. Recognition runs locally;
 * nothing is sent anywhere.
 */
export interface CatalogSong {
  title: string;
  artist?: string;
  /** other names the song is known by (German titles, film names …) */
  aliases?: string[];
  style: GoalStyle;
  /** skills beyond the two-hand basics every arrangement needs */
  skills: SkillId[];
}

/** Every piano arrangement for two hands needs these. */
const TWO_HANDS: SkillId[] = ['left-hand', 'bass-clef', 'both-hands', 'grand-staff'];

type Row = [
  title: string,
  artist: string | undefined,
  style: GoalStyle,
  skills: string,
  aliases?: string[],
];

/* skills as short codes: keeps the table readable */
const CODES: Record<string, SkillId> = {
  bk: 'black-keys',
  imp: 'improvise',
  '8th': 'eighths',
  '34': 'three-four',
  '68': 'six-eight',
  dyn: 'dynamics',
  sc: 'scales',
  min: 'minor',
  ch: 'chords',
  arp: 'arpeggios',
  ped: 'pedal',
};

const ROWS: Row[] = [
  // ------------------------------------------------------------ rock & pop
  ['Nothing Else Matters', 'Metallica', 'ballad', 'min 68 arp ped dyn'],
  ['Stairway to Heaven', 'Led Zeppelin', 'ballad', 'min arp bk ped'],
  ['Hotel California', 'Eagles', 'ballad', 'min arp bk ch'],
  ['Let It Be', 'The Beatles', 'pop', 'ch 8th ped'],
  ['Hey Jude', 'The Beatles', 'pop', 'ch bk 8th'],
  ['Yesterday', 'The Beatles', 'ballad', 'min ch bk'],
  ['Imagine', 'John Lennon', 'ballad', 'ch arp bk ped'],
  ['Hallelujah', 'Leonard Cohen', 'ballad', '68 arp ch bk ped'],
  ['Bohemian Rhapsody', 'Queen', 'pop', 'ch bk min dyn 8th ped'],
  ['Piano Man', 'Billy Joel', 'pop', '34 ch'],
  ['Someone Like You', 'Adele', 'ballad', 'arp bk ped'],
  ['Skyfall', 'Adele', 'film', 'min ch bk arp ped'],
  ['All of Me', 'John Legend', 'ballad', 'ch min bk ped'],
  ['Perfect', 'Ed Sheeran', 'ballad', '68 ch arp bk'],
  ['Shape of You', 'Ed Sheeran', 'pop', 'min bk 8th ch'],
  ['Someone You Loved', 'Lewis Capaldi', 'ballad', 'ch bk ped'],
  ['Clocks', 'Coldplay', 'pop', 'arp bk 8th'],
  ['Viva la Vida', 'Coldplay', 'pop', 'ch bk 8th'],
  ['The Scientist', 'Coldplay', 'ballad', 'ch min bk ped'],
  ['Fix You', 'Coldplay', 'ballad', 'ch bk ped dyn'],
  ['A Thousand Years', 'Christina Perri', 'ballad', '34 arp bk ped'],
  ["Don't Stop Believin'", 'Journey', 'pop', '8th bk ch'],
  ['Zombie', 'The Cranberries', 'pop', 'min ch'],
  ['Mad World', 'Gary Jules', 'ballad', 'min ch ped'],
  ['Creep', 'Radiohead', 'pop', 'ch bk min arp'],
  ["Knockin' on Heaven's Door", 'Bob Dylan', 'pop', 'ch bk'],
  ['Wind of Change', 'Scorpions', 'ballad', 'ch bk 8th'],
  ['Tears in Heaven', 'Eric Clapton', 'ballad', 'arp ch bk'],
  ['Lean on Me', 'Bill Withers', 'pop', 'ch'],
  ['Fly Me to the Moon', 'Frank Sinatra', 'pop', 'ch min bk 8th'],
  ['What a Wonderful World', 'Louis Armstrong', 'ballad', 'ch bk'],
  ["Can't Help Falling in Love", 'Elvis Presley', 'ballad', '68 ch arp bk'],
  ['Moon River', 'Audrey Hepburn', 'film', '34 ch bk'],
  ['Faded', 'Alan Walker', 'pop', 'min ch bk'],
  ['Bella Ciao', undefined, 'melody', 'min ch'],
  ['River Flows in You', 'Yiruma', 'ballad', 'arp bk ped 8th'],
  ['Kiss the Rain', 'Yiruma', 'ballad', 'arp bk ped'],
  ['Nuvole Bianche', 'Ludovico Einaudi', 'ballad', 'arp min bk ped dyn'],
  ['Una Mattina', 'Ludovico Einaudi', 'ballad', 'arp min ped'],
  ['Experience', 'Ludovico Einaudi', 'ballad', 'arp ped dyn'],

  // ------------------------------------------------------------ film & tv
  ['Game of Thrones', 'Ramin Djawadi', 'film', 'min 34 bk', ['Game of Thrones Theme']],
  ["Hedwig's Theme", 'John Williams', 'film', 'min 34 bk', ['Harry Potter']],
  [
    "He's a Pirate",
    'Klaus Badelt',
    'film',
    'min 68 bk 8th',
    ['Pirates of the Caribbean', 'Fluch der Karibik'],
  ],
  ['Star Wars', 'John Williams', 'film', 'ch bk dyn', ['Star Wars Main Theme']],
  ['Jurassic Park', 'John Williams', 'film', 'ch bk dyn'],
  ["Schindler's List", 'John Williams', 'film', 'min bk dyn', ['Schindlers Liste']],
  ['The Godfather', 'Nino Rota', 'film', 'min 34 bk', ['Der Pate', 'Speak Softly Love']],
  ['My Heart Will Go On', 'Celine Dion', 'film', 'ch bk dyn', ['Titanic']],
  ['Let It Go', 'Frozen', 'film', 'min ch bk', ['Lass jetzt los', 'Die Eiskönigin']],
  [
    'Concerning Hobbits',
    'Howard Shore',
    'film',
    'bk 8th',
    ['Lord of the Rings', 'Herr der Ringe', 'Auenland'],
  ],
  [
    'Merry-Go-Round of Life',
    'Joe Hisaishi',
    'film',
    'min 34 bk ch',
    ['Howl', 'Das wandelnde Schloss'],
  ],
  [
    'Comptine d’un autre été',
    'Yann Tiersen',
    'film',
    'min arp 8th ped',
    ['Comptine', 'Amelie', 'Die fabelhafte Welt der Amelie'],
  ],
  ['Interstellar', 'Hans Zimmer', 'film', 'min arp ped dyn', ['Cornfield Chase']],
  ['Married Life', 'Michael Giacchino', 'film', '34 bk ch', ['Oben', 'Up Theme']],
  [
    'The Pink Panther',
    'Henry Mancini',
    'film',
    'min bk 8th',
    ['Pink Panther', 'Rosaroter Panther', 'Paulchen Panther'],
  ],

  // ------------------------------------------------------------- classical
  ['Für Elise', 'Ludwig van Beethoven', 'classical', 'min bk arp 8th ped dyn', ['Fur Elise']],
  [
    'Moonlight Sonata',
    'Ludwig van Beethoven',
    'classical',
    'min bk arp ped dyn',
    ['Mondscheinsonate', 'Mondschein-Sonate'],
  ],
  ['Pathétique', 'Ludwig van Beethoven', 'classical', 'bk arp ped dyn'],
  [
    'Ode to Joy',
    'Ludwig van Beethoven',
    'melody',
    'ch',
    ['Freude schöner Götterfunken', 'Ode an die Freude'],
  ],
  [
    'Prelude in C',
    'Johann Sebastian Bach',
    'classical',
    'arp bk 8th',
    ['Präludium in C', 'Präludium C-Dur'],
  ],
  ['Minuet in G', 'Christian Petzold', 'classical', '34 bk 8th', ['Menuett in G', 'Menuett G-Dur']],
  [
    'Canon in D',
    'Johann Pachelbel',
    'classical',
    'ch bk arp 8th',
    ['Kanon in D', 'Pachelbel Canon'],
  ],
  ['Gymnopédie', 'Erik Satie', 'classical', '34 ch bk ped'],
  ['Clair de Lune', 'Claude Debussy', 'classical', 'bk arp ped dyn'],
  [
    'Rondo alla Turca',
    'Wolfgang Amadeus Mozart',
    'classical',
    'min 8th bk sc',
    ['Turkish March', 'Türkischer Marsch'],
  ],
  ['Eine kleine Nachtmusik', 'Wolfgang Amadeus Mozart', 'classical', 'bk 8th'],
  ['Nocturne', 'Frédéric Chopin', 'classical', '68 bk arp ped dyn'],
  [
    'Prelude in E minor',
    'Frédéric Chopin',
    'classical',
    'min ch bk ped dyn',
    ['Prélude e-Moll', 'Präludium e-Moll'],
  ],
  ['Waltz in A minor', 'Frédéric Chopin', 'classical', '34 min bk ped', ['Walzer a-Moll']],
  ['Träumerei', 'Robert Schumann', 'classical', 'bk ped dyn'],
  ['The Entertainer', 'Scott Joplin', 'classical', 'bk 8th ch'],
  ['Swan Lake', 'Pjotr Tschaikowsky', 'classical', 'min bk dyn', ['Schwanensee']],
  [
    'Sonatina in C',
    'Muzio Clementi',
    'classical',
    'sc 8th dyn',
    ['Sonatine in C', 'Sonatine C-Dur'],
  ],
  [
    'Wiegenlied',
    'Johannes Brahms',
    'melody',
    '34 ch',
    ["Brahms' Lullaby", 'Guten Abend, gut Nacht'],
  ],

  // -------------------------------------------- folk, children & christmas
  ['Flohwalzer', undefined, 'melody', '34 bk', ['Flea Waltz']],
  ['Stille Nacht', undefined, 'melody', '68 ch', ['Silent Night']],
  ['O Tannenbaum', undefined, 'melody', '34 ch', ['O Christmas Tree']],
  ['Jingle Bells', undefined, 'melody', '8th ch'],
  ['Happy Birthday', undefined, 'melody', '34 ch', ['Zum Geburtstag viel Glück']],
  ['Amazing Grace', undefined, 'melody', '34 ch'],
  ['Greensleeves', undefined, 'melody', 'min 68 bk ch'],
  ['Scarborough Fair', undefined, 'melody', 'min 34 ch'],
  ['When the Saints Go Marching In', undefined, 'melody', 'ch', ['Oh When the Saints']],
  ['Korobeiniki', undefined, 'melody', 'min 8th bk', ['Tetris']],
  ['Kalinka', undefined, 'melody', 'min 8th ch'],
  ['Bruder Jakob', undefined, 'melody', '8th', ['Frère Jacques', 'Frere Jacques']],
  ['Alle Vögel sind schon da', undefined, 'melody', 'ch'],
  [
    'Morgen kommt der Weihnachtsmann',
    undefined,
    'melody',
    'ch',
    ['Twinkle Twinkle Little Star', 'Funkel funkel kleiner Stern'],
  ],
  ['Alle meine Entchen', undefined, 'melody', ''],
];

export const SONG_CATALOG: CatalogSong[] = ROWS.map(([title, artist, style, codes, aliases]) => ({
  title,
  ...(artist ? { artist } : {}),
  ...(aliases ? { aliases } : {}),
  style,
  skills: [
    ...TWO_HANDS,
    ...codes
      .split(' ')
      .filter(Boolean)
      .map((c) => {
        const skill = CODES[c];
        if (!skill) throw new Error(`unknown skill code ${c} for ${title}`);
        return skill;
      }),
  ],
}));

// ------------------------------------------------------------- recognition

/** lower case, no accents or punctuation – «Für Elise!» → "fur elise" */
export function normalizeTitle(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/['’`´]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Does `haystack` contain `needle` as whole words? (both normalized) */
function containsWords(haystack: string, needle: string): boolean {
  return needle.length > 0 && ` ${haystack} `.includes(` ${needle} `);
}

/** Words in a title that hint at the kind of piece or a skill. */
const WORD_HINTS: { words: string[]; style?: GoalStyle; skills: SkillId[] }[] = [
  {
    words: [
      'bach',
      'mozart',
      'beethoven',
      'haydn',
      'schubert',
      'schumann',
      'brahms',
      'liszt',
      'grieg',
      'debussy',
      'satie',
      'vivaldi',
      'handel',
      'haendel',
      'tschaikowsky',
      'tchaikovsky',
      'clementi',
      'sonate',
      'sonata',
      'sonatine',
      'sonatina',
      'invention',
      'fuge',
      'fugue',
      'etude',
      'prelude',
      'praludium',
      'impromptu',
      'mazurka',
      'polonaise',
      'rondo',
      'bagatelle',
      'opus',
      'op',
      'bwv',
      'kv',
    ],
    style: 'classical',
    skills: ['grand-staff', 'black-keys', 'eighths', 'dynamics'],
  },
  {
    words: ['chopin', 'nocturne', 'notturno'],
    style: 'classical',
    skills: ['grand-staff', 'arpeggios', 'pedal', 'dynamics', 'black-keys'],
  },
  {
    words: ['einaudi', 'yiruma', 'ballade', 'ballad'],
    style: 'ballad',
    skills: ['arpeggios', 'pedal'],
  },
  {
    words: ['walzer', 'waltz', 'valse', 'menuett', 'minuet', 'menuet', 'landler'],
    skills: ['three-four'],
  },
  { words: ['barcarole', 'barcarolle', 'siciliano', 'tarantella', 'jig'], skills: ['six-eight'] },
  { words: ['moll', 'minor', 'mineur'], skills: ['minor'] },
  {
    words: ['theme', 'thema', 'soundtrack', 'filmmusik', 'hisaishi', 'disney'],
    style: 'film',
    skills: ['black-keys', 'dynamics', 'chords'],
  },
  {
    words: ['blues', 'boogie', 'jazz', 'swing', 'rag', 'ragtime'],
    style: 'pop',
    skills: ['black-keys', 'eighths', 'chords'],
  },
  {
    words: [
      'weihnacht',
      'weihnachtslied',
      'christmas',
      'kinderlied',
      'volkslied',
      'lullaby',
      'wiegenlied',
    ],
    style: 'melody',
    skills: ['chords'],
  },
];

export interface SongGuess {
  style: GoalStyle;
  skills: SkillId[];
  /** the recognised catalog song, or null when guessed from words in the title */
  song: CatalogSong | null;
  /** true when the title was recognised despite typos or missing letters */
  fuzzy?: boolean;
}

// ----------------------------------------------------------- fuzzy matching

/** Optimal string alignment distance (typos: missing, extra, wrong or swapped letters). */
export function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i]![j] = Math.min(d[i]![j]!, d[i - 2]![j - 2]! + 1);
      }
    }
  }
  return d[a.length]![b.length]!;
}

/** Typos allowed in a word: none for short words, one up to 6 letters, then two. */
function allowedTypos(word: string): number {
  return word.length <= 3 ? 0 : word.length <= 6 ? 1 : 2;
}

/**
 * How well a typed word fits a word of a title: 1 exact, 0.9 the start of it
 * (still typing), 0.8 within the allowed typos, 0 not at all.
 */
function wordFit(typed: string, word: string, allowPrefix: boolean): number {
  if (typed === word) return 1;
  if (allowPrefix && typed.length >= 2 && word.startsWith(typed)) return 0.9;
  if (
    Math.abs(typed.length - word.length) <= 2 &&
    editDistance(typed, word) <= allowedTypos(word)
  ) {
    return 0.8;
  }
  return 0;
}

/** filler words that may appear around a title («… von Metallica», «the …») */
const FILLER = new Set(['von', 'by', 'from', 'aus', 'the', 'der', 'die', 'das', 'de', 'la', 'le']);

function namesOf(song: CatalogSong): string[][] {
  return [song.title, ...(song.aliases ?? [])].map((n) => normalizeTitle(n).split(' '));
}

/**
 * Fuzzy title match: every word of the title name is typed (typos allowed,
 * the last typed word may be unfinished) and every typed word belongs to the
 * name or the artist. Returns a score (higher is better) or 0.
 */
function fuzzyScore(typed: string[], song: CatalogSong): number {
  const artist = song.artist ? normalizeTitle(song.artist).split(' ') : [];
  let best = 0;
  for (const name of namesOf(song)) {
    let sum = 0;
    let ok = true;
    for (const word of name) {
      const fit = Math.max(
        0,
        ...typed.map((t, i) => wordFit(t, word, i === typed.length - 1 && t.length >= 3)),
      );
      if (fit === 0 && !FILLER.has(word)) {
        ok = false;
        break;
      }
      sum += fit;
    }
    if (!ok) continue;
    const allTypedKnown = typed.every(
      (t) =>
        FILLER.has(t) ||
        name.some((w) => wordFit(t, w, true) > 0) ||
        artist.some((w) => wordFit(t, w, true) > 0),
    );
    if (allTypedKnown) best = Math.max(best, sum / name.length + name.length * 0.01);
  }
  return best;
}

/**
 * Songs for the dropdown while typing: every typed word must start (or,
 * with a typo, resemble) a word of the title, an alias or the artist.
 * Best matches first.
 */
export function searchSongs(input: string, limit = 8): CatalogSong[] {
  const typed = normalizeTitle(input).split(' ').filter(Boolean);
  if (!typed.length || typed.join('').length < 2) return [];
  const scored: { song: CatalogSong; score: number }[] = [];
  for (const song of SONG_CATALOG) {
    const words = [
      ...namesOf(song).flat(),
      ...(song.artist ? normalizeTitle(song.artist).split(' ') : []),
    ];
    let sum = 0;
    let ok = true;
    for (const t of typed) {
      const fit = Math.max(0, ...words.map((w) => wordFit(t, w, true)));
      if (fit === 0) {
        if (FILLER.has(t)) continue;
        ok = false;
        break;
      }
      sum += fit;
    }
    if (!ok) continue;
    // titles starting with what was typed come first
    const starts = namesOf(song).some((n) => n.join(' ').startsWith(typed.join(' '))) ? 1 : 0;
    scored.push({ song, score: starts + sum / typed.length });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.song.title.localeCompare(b.song.title))
    .slice(0, limit)
    .map((s) => s.song);
}

/** «Nothing Else Matters – Metallica»: how a catalog song is shown and stored */
export function songLabel(song: CatalogSong): string {
  return song.artist ? `${song.title} – ${song.artist}` : song.title;
}

/**
 * Recognise a dream song from what the learner typed («Nothing Else Matters –
 * Metallica», «Mondscheinsonate» …): a catalog song when one matches, else a
 * guess from words in the title, else null.
 */
export function recognizeSong(input: string): SongGuess | null {
  const text = normalizeTitle(input);
  if (text.length < 3) return null;

  // catalog: the longest matching title or alias wins; the artist breaks ties
  let best: { song: CatalogSong; score: number } | null = null;
  for (const song of SONG_CATALOG) {
    for (const name of [song.title, ...(song.aliases ?? [])]) {
      const key = normalizeTitle(name);
      if (!containsWords(text, key)) continue;
      const score =
        key.length * 2 + (song.artist && containsWords(text, normalizeTitle(song.artist)) ? 1 : 0);
      if (!best || score > best.score) best = { song, score };
    }
  }
  if (best) return { style: best.song.style, skills: [...best.song.skills], song: best.song };

  // typos or an unfinished title: «Nothing Else Matter», «Für Elize»
  const typed = text.split(' ');
  let fuzzy: { song: CatalogSong; score: number } | null = null;
  for (const song of SONG_CATALOG) {
    const score = fuzzyScore(typed, song);
    if (score > 0 && (!fuzzy || score > fuzzy.score)) fuzzy = { song, score };
  }
  if (fuzzy) {
    return {
      style: fuzzy.song.style,
      skills: [...fuzzy.song.skills],
      song: fuzzy.song,
      fuzzy: true,
    };
  }

  // words in the title (also matches the start of compound words: «Weihnachtslied»)
  const words = text.split(' ');
  const hits = WORD_HINTS.filter((h) =>
    h.words.some((w) => words.some((word) => word === w || (w.length >= 5 && word.startsWith(w)))),
  );
  if (!hits.length) return null;
  const style = hits.find((h) => h.style)?.style ?? 'melody';
  const skills = new Set<SkillId>(TWO_HANDS);
  for (const h of hits) h.skills.forEach((s) => skills.add(s));
  return { style, skills: [...skills], song: null };
}
