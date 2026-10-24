// The vocabulary the suggestion tools use: app MOMENTS (what happened in the interface or the game)
// and MOODS (how the app should feel). Both are only hints layered over the catalog's own fields:
// a moment says which words and categories point at it, how long a sound for it can be, and how
// loud; a mood shifts categories, families, tags and loudness. Nothing here names a sound, so a sound
// added to the catalog is picked up the day it carries the right moments, family or tags.
//
// MOMENTS lives in the repository's shared vocabulary (src/vocabulary.js), the one list the build
// also validates sounds and themes against; this module adds what the suggestion tools derive from
// it (word stems, phrases). The tests check that every moment still finds a sound.
import { stems, stem } from './text.js';
import { MOMENTS as SHARED_MOMENTS, FAMILIES, ROLES } from '../../src/vocabulary.js';

export { FAMILIES, ROLES };

/** The shared moments, copied so the derived fields below never touch the shared objects. */
export const MOMENTS = Object.fromEntries(Object.entries(SHARED_MOMENTS).map(([k, m]) => [k, { ...m }]));

const MULTI = /[\s-]/;
for (const [name, m] of Object.entries(MOMENTS)) {
  m.name = name;
  const single = (list) => list.filter((t) => !MULTI.test(t));
  const multi = (list) => list.filter((t) => MULTI.test(t));
  m.tagStems = [...new Set(single(m.tags).flatMap((t) => stems(t)))];
  const termAll = [...new Set(single(m.terms).flatMap((t) => stems(t)))];
  m.termStems = termAll.filter((w) => !m.tagStems.includes(w));   // for scoring sounds
  m.detectStems = termAll;                                        // for reading a description
  m.avoidStems = [...new Set(m.avoid.flatMap((t) => stems(t.replace(/-/g, ' '))))];
  // whole hyphenated tags ("level-up"): matched against a sound's tags as they are written
  m.rawTags = multi(m.tags).map((t) => t.toLowerCase());
  // phrases as stem sequences: the moment's own multi-word name and any multi-word term or tag
  m.phrases = [...multi([name]), ...multi(m.terms), ...multi(m.tags)]
    .map((t) => stems(t.replace(/-/g, ' ')).join(' ')).filter((t) => t.includes(' '));
}

/**
 * Moods. Fields: words that signal it in a description; tags a sound carries when it fits (a tag
 * match lifts the sound); families (src/vocabulary.js) whose sounds fit, a match that counts like a
 * tag; category boosts; loudness preference (best first); categories that clash. hints set
 * parameters the same way a moment's do (the retro mood turns a sound's chip switch on).
 * Boosts are fractions: boost 1.5 lifts a score by 18 percent, and a penalty of 2 lowers it by 20
 * percent. The newer categories ride along with the older ones they serve: professional favours
 * data and ai and marks down battle and duel, gamey and tabletop favour battle, duel and cards, and
 * sci-fi favours fx, data and ai. A tag or family match lifts it by
 * tagBoost (default 0.18) per match, at most two; the style moods (wood, glass, mechanical, air,
 * retro) use 0.6 because naming a style is an explicit request.
 */
export const MOODS = {
  calm: {
    about: 'Quiet, unobtrusive feedback.',
    words: ['calm', 'soft', 'gentle', 'quiet', 'subtle', 'mindful', 'meditation', 'wellness', 'sleep', 'relax', 'relaxing', 'zen', 'minimal', 'peaceful', 'cozy', 'muted', 'unobtrusive', 'discreet'],
    tags: ['soft', 'gentle', 'cozy', 'warm', 'quiet'],
    families: ['soft'],
    boost: { ui: 1.5, notify: 1 }, loud: ['quiet', 'medium'], dislike: ['loud'],
  },
  professional: {
    about: 'Clean, restrained feedback for work tools.',
    words: ['professional', 'productivity', 'business', 'enterprise', 'saas', 'dashboard', 'work', 'serious', 'corporate', 'fintech', 'finance', 'banking', 'admin', 'office', 'tool', 'b2b'],
    tags: ['soft', 'glass'],
    families: ['soft', 'glass'],
    boost: { ui: 1.5, data: 1.5, notify: 1, ai: 1 }, loud: ['quiet', 'medium'], dislike: ['loud'],
    penalty: { game: 1.5, battle: 2, duel: 2, cards: 1, magic: 1, fx: 0.5 },
  },
  playful: {
    about: 'Bright, bouncy, rewarding.',
    words: ['playful', 'fun', 'kids', 'children', 'casual', 'cheerful', 'friendly', 'happy', 'cute', 'bouncy', 'colorful', 'family'],
    tags: ['cartoon', 'bounce', 'bubble', 'pop', 'cheerful', 'bloop'],
    boost: { game: 1, magic: 1.5 }, loud: ['medium', 'loud'],
  },
  retro: {
    about: 'Retro game feel: chiptune beeps and blips.',
    words: ['retro', 'arcade', '8bit', 'chiptune', 'pixel', 'nes', 'platformer', 'rpg'],
    tags: ['8-bit', 'chiptune', 'retro', 'arcade', 'square'],
    families: ['chip'],
    tagBoost: 0.6,
    hints: { chip: 1 },   // game sounds with a chip switch get their square-wave voicing
    boost: { game: 2 }, loud: ['medium', 'loud'],
  },
  gamey: {
    about: 'A video game.',
    words: ['game', 'gamey', 'gaming', 'gamer', 'videogame'],
    tags: [],
    boost: { game: 1, battle: 1, duel: 1, cards: 0.5 }, loud: ['medium', 'loud'],
  },
  'sci-fi': {
    about: 'Futuristic and technical.',
    words: ['scifi', 'sci', 'space', 'futuristic', 'cyber', 'cyberpunk', 'robot', 'tech', 'hud', 'starship', 'terminal'],
    tags: ['sci-fi', 'digital', 'robot', 'computer', 'terminal', 'console'],
    families: ['synthetic'],
    boost: { scifi: 2.5, fx: 1.5, data: 1, ai: 1 }, loud: ['medium'],
  },
  magical: {
    about: 'Fantasy and wonder.',
    words: ['magic', 'magical', 'fantasy', 'whimsical', 'fairy', 'wizard', 'enchanted', 'storybook', 'spell'],
    tags: ['magic', 'spell', 'fairy', 'sparkle', 'shimmer'],
    boost: { magic: 2.5 }, loud: ['medium', 'quiet'],
  },
  tabletop: {
    about: 'Cards, boards and dice.',
    words: ['cards', 'card', 'tabletop', 'board', 'poker', 'deck', 'solitaire', 'boardgame', 'dice', 'casino', 'chess', 'tcg', 'ccg'],
    tags: ['card', 'poker', 'board-game', 'casino', 'dice', 'chess'],
    families: ['paper', 'wood'],
    boost: { cards: 2.5, duel: 2, battle: 1.5, game: 0.5 }, loud: ['quiet', 'medium'],
  },
  atmospheric: {
    about: 'Immersive background sound.',
    words: ['ambient', 'atmospheric', 'immersive', 'ambience', 'soundscape'],
    tags: ['ambient', 'bed', 'nature'],
    families: ['organic'],
    boost: { ambience: 2.5 }, loud: ['quiet'],
  },
  musical: {
    about: 'Melodic, tuned feedback.',
    words: ['musical', 'melodic', 'music', 'melody', 'tuned'],
    tags: ['stinger', 'jingle', 'melody', 'arpeggio'],
    families: ['orchestral'],
    boost: { music: 2.5 }, loud: ['medium'],
  },
  dramatic: {
    about: 'Big, punchy, high impact.',
    words: ['dramatic', 'epic', 'intense', 'powerful', 'action', 'heavy', 'punchy', 'bold', 'loud', 'cinematic'],
    tags: ['heavy', 'boss', 'impact', 'combat'],
    families: ['impact'],
    boost: { game: 1 }, loud: ['loud', 'medium'],
  },
  dark: {
    about: 'Brooding, gothic or horror: choirs, organ, low strings, drones and dread.',
    words: ['dark', 'brooding', 'gothic', 'horror', 'spooky', 'creepy', 'eerie', 'ominous', 'sinister', 'haunted', 'dread', 'grim', 'noir', 'moody', 'somber', 'doom', 'occult', 'vampire', 'cathedral'],
    tags: ['dark', 'gothic', 'horror', 'ominous', 'dread', 'choir', 'organ', 'cello'],
    families: ['orchestral', 'voice'],
    boost: { dark: 3, ambience: 1, music: 1, magic: 0.5 }, loud: ['quiet', 'medium'], dislike: ['cheerful'],
    penalty: { ui: 0.5, cards: 1, duel: 1 },
  },
  wooden: {
    about: 'Warm, natural, wooden knocks.',
    words: ['wood', 'wooden', 'natural', 'organic', 'warm', 'analog', 'handmade', 'craft'],
    tags: ['wood', 'knock', 'thock'],
    families: ['wood'],
    tagBoost: 0.6,
    boost: {}, loud: ['quiet', 'medium'],
  },
  glassy: {
    about: 'Bright, clear, glassy ticks and pings.',
    words: ['glass', 'glassy', 'crystal', 'crystalline', 'shiny', 'crisp', 'clear', 'bright', 'sleek', 'modern'],
    tags: ['glass', 'crystal', 'ting', 'bright'],
    families: ['glass'],
    tagBoost: 0.6,
    boost: {}, loud: ['quiet', 'medium'],
  },
  mechanical: {
    about: 'Switches, keys and latches.',
    words: ['mechanical', 'keyboard', 'clicky', 'industrial', 'switch', 'tactile'],
    tags: ['mechanical', 'clicky', 'thock', 'latch'],
    families: ['mechanical'],
    tagBoost: 0.6,
    boost: {}, loud: ['quiet', 'medium'],
  },
  airy: {
    about: 'Light, breathy, airy.',
    words: ['airy', 'breathy', 'whisper', 'floaty', 'light', 'ethereal'],
    tags: ['air', 'breeze'],
    families: ['air'],
    tagBoost: 0.6,
    boost: {}, loud: ['quiet'],
  },
};
for (const [name, m] of Object.entries(MOODS)) {
  m.name = name;
  m.wordStems = [...new Set(m.words.map((w) => stem(w)))];
  m.tagStems = [...new Set(m.tags.flatMap((t) => stems(t.replace(/-/g, ' '))))].filter((w) => w !== '8');
  m.families = m.families || [];
}

/** The moods named by words in a text, strongest first (by number of words matched). */
export function moodsIn(text) {
  const have = new Set(stems(text));
  const out = [];
  for (const m of Object.values(MOODS)) {
    const hits = m.wordStems.filter((w) => have.has(w));
    if (hits.length) out.push({ mood: m, hits });
  }
  return out.sort((a, b) => b.hits.length - a.hits.length);
}

// How many moments each stem points at: a word shared by several moments says less about any one.
const SHARED = new Map();
for (const m of Object.values(MOMENTS)) {
  const own = MULTI.test(m.name) ? [] : stems(m.name);
  for (const w of new Set([...own, ...m.tagStems, ...m.detectStems])) SHARED.set(w, (SHARED.get(w) || 0) + 1);
}

/** Detection needs this much evidence in total, and at least one strong hit. */
const DETECT_MIN = 1.4;

/**
 * The moments a free-text description names: [{ moment, strength, matched, first }], in order of
 * first mention. A moment's own name or phrase counts most, then its terms, then its tags; a word
 * that several moments share counts for less in each, and shared tags alone never detect a moment.
 */
export function momentsIn(text) {
  const toks = stems(text);
  const joined = ' ' + toks.join(' ') + ' ';
  // every position in the text where a stem sequence (one word or a phrase) occurs
  const positions = (seq) => {
    const words = seq.split(' ');
    const out = [];
    for (let i = 0; i + words.length <= toks.length; i++) {
      if (words.every((x, k) => toks[i + k] === x)) for (let k = 0; k < words.length; k++) out.push(i + k);
    }
    return out;
  };
  const found = [];
  const inPhrase = new Set();   // words that a phrase of some moment already accounts for
  for (const m of Object.values(MOMENTS)) {
    const matched = [];
    const where = new Set();
    let strength = 0;
    let strong = false;
    let phrase = false;
    let first = Infinity;
    const note = (w, base, isTag) => {
      if (matched.includes(w)) return;
      const weight = base / Math.sqrt(SHARED.get(w) || 1);
      matched.push(w);
      strength += weight;
      if (isTag ? weight >= 1.4 : weight >= 1.0) strong = true;
      const at = joined.indexOf(' ' + w + ' ');
      if (at >= 0 && at < first) first = at;
      for (const i of positions(w)) where.add(i);
    };
    for (const ph of m.phrases) {
      if (!joined.includes(' ' + ph + ' ')) continue;
      note(ph, 3, false);
      phrase = true;
      for (const i of positions(ph)) inPhrase.add(i);
    }
    if (!MULTI.test(m.name)) for (const w of stems(m.name)) if (toks.includes(w)) note(w, 3, false);
    for (const w of m.detectStems) if (toks.includes(w)) note(w, 2, false);
    for (const w of m.tagStems) if (toks.includes(w)) note(w, 1.5, true);
    if (strong && strength >= DETECT_MIN) found.push({ moment: m.name, strength: Math.round(strength * 10) / 10, matched, first, where, phrase });
  }
  // "warp jump" is a teleport, not also a jump: a moment whose every word sits inside another
  // moment's phrase, and which has no phrase of its own, is dropped
  return found
    .filter((f) => f.phrase || ![...f.where].every((i) => inPhrase.has(i)))
    .map(({ where, phrase, ...rest }) => rest)
    .sort((a, b) => a.first - b.first);
}
