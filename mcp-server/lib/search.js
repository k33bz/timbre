// Ranked search over the catalog's own words.
//
// Each sound becomes a small document: its tags (the strongest signal, they are written to be
// searched), its name, the moments it was made for, its family, the words of its id, its category
// (with a few plain words for it) and its description. A query is stemmed and matched field by field with a weight per field, scaled by how
// rare the word is in this catalog (IDF), with prefix matches at half weight and thesaurus
// neighbours at 0.4. Every hit records why it matched, so results can explain themselves.
//
// The same scorer ranks sounds for a moment or a mood (lib/suggest.js): it takes weighted stems.
import { stems, stemPairs, related, stemMatch } from './text.js';
import { BAND_NAMES } from './levels.js';
import { CATEGORIES } from './catalog.js';
import { FAMILIES } from './moments.js';

const FIELD_WEIGHT = { tag: 6, name: 5, moment: 4, family: 4, cat: 3, id: 3, desc: 1.5 };
const FIELDS = [['tags', 'tag'], ['name', 'name'], ['mom', 'moment'], ['fam', 'family'], ['cat', 'cat'], ['id', 'id'], ['desc', 'desc']];
const TOKEN_CAP = 14;
const SYNONYM_FACTOR = 0.4;
const PREFIX_FACTOR = 0.5;

/** Plain words that stand for a category, so "interface" or "notification" find the right group. */
export const CATEGORY_WORDS = {
  ui: ['ui', 'interface', 'user interface', 'app'],
  notify: ['notify', 'notification', 'alert', 'cue'],
  game: ['game', 'gaming', 'play'],
  cards: ['card', 'cards', 'deck', 'tabletop'],
  magic: ['magic', 'fantasy', 'spell'],
  scifi: ['scifi', 'sci fi', 'science fiction', 'space', 'futuristic'],
  dark: ['dark', 'horror', 'gothic', 'dread', 'ominous', 'brooding', 'spooky'],
  ambience: ['ambience', 'ambient', 'atmosphere', 'background'],
  music: ['music', 'musical', 'melody'],
};

const uniq = (a) => [...new Set(a)];

export class SearchIndex {
  constructor(sounds, levelOf = () => null) {
    this.docs = sounds.map((s) => {
      // disp maps a stem back to a word the sound really carries (tags first), for readable reasons
      const disp = new Map();
      const take = (text) => {
        const set = new Set();
        for (const { word, stem } of stemPairs(text)) { set.add(stem); if (!disp.has(stem)) disp.set(stem, word); }
        return set;
      };
      const tagStems = take(s.tags.map((t) => t.replace(/-/g, ' ')).join(' '));
      const doc = {
        s,
        disp,
        tags: tagStems,
        name: take(s.name),
        mom: take((s.moments || []).join(' ').replace(/-/g, ' ')),
        fam: take(s.family || ''),
        id: take(s.id.replace(/-/g, ' ')),
        cat: take((CATEGORY_WORDS[s.category] || [s.category]).join(' ') + ' ' + s.category),
        desc: take(s.desc),
      };
      // levels can cost an estimate each: only work them out for a sound when something asks
      let level;
      let known = false;
      Object.defineProperty(doc, 'level', {
        enumerable: true,
        get() { if (!known) { level = levelOf(s); known = true; } return level; },
      });
      return doc;
    });
    this.n = this.docs.length;
    this.df = new Map();
    for (const d of this.docs) {
      const all = new Set([...d.tags, ...d.name, ...d.mom, ...d.fam, ...d.id, ...d.cat, ...d.desc]);
      for (const w of all) this.df.set(w, (this.df.get(w) || 0) + 1);
    }
  }

  idf(w) {
    const df = this.df.get(w) || 0;
    return Math.min(3, Math.max(0.5, Math.log((this.n + 1) / (df + 0.5)) + 0.5));
  }

  /** Field hits of one stem in one document: [{ field, kind }]. */
  hits(doc, q) {
    const out = [];
    for (const [field, label] of FIELDS) {
      let kind = null;
      for (const d of doc[field]) {
        const m = stemMatch(d, q);
        if (m === 'exact') { kind = 'exact'; break; }
        if (m && !kind) kind = m;
      }
      if (kind) out.push({ field: label, kind });
    }
    return out;
  }

  /** Score of one stem in one document, with the reasons. */
  tokenScore(doc, q, skip) {
    let sum = 0;
    const why = [];
    const direct = this.hits(doc, q);
    for (const h of direct) {
      sum += FIELD_WEIGHT[h.field] * (h.kind === 'exact' ? 1 : PREFIX_FACTOR);
      why.push(`${h.field}:${q}`);
    }
    const scored = [];
    for (const r of related(q)) {
      if (skip && skip.has(r)) continue;
      let rs = 0;
      const rhits = this.hits(doc, r);
      for (const h of rhits) rs += FIELD_WEIGHT[h.field] * (h.kind === 'exact' ? 1 : PREFIX_FACTOR);
      if (rs > 0) scored.push({ r, rs, h: rhits[0].field });
    }
    scored.sort((a, b) => b.rs - a.rs);
    for (const x of scored.slice(0, 2)) {
      sum += x.rs * SYNONYM_FACTOR;
      why.push(`${x.h}:${x.r}~${q}`);
    }
    return { score: Math.min(TOKEN_CAP, sum) * this.idf(q), why, direct: direct.length > 0, any: sum > 0 };
  }

  /**
   * Score a document against weighted stems [{ stem, w }].
   * With coverage, the score is scaled by the share of the query's weight that found something.
   */
  score(doc, tokens, { coverage = true } = {}) {
    const skip = new Set(tokens.map((t) => t.stem));
    let total = 0;
    let found = 0;
    let weight = 0;
    const why = [];
    for (const t of tokens) {
      weight += t.w;
      const r = this.tokenScore(doc, t.stem, skip);
      if (r.any) { found += t.w; total += r.score * t.w; why.push(...r.why); }
    }
    if (!weight || !total) return { score: 0, why: [] };
    const cov = found / weight;
    return { score: total * (coverage ? 0.5 + 0.5 * cov : 1), why: uniq(why), coverage: cov };
  }
}

/** Parse a loudness filter: a band name or a list of them. */
export function bandsOf(v) {
  if (v == null) return null;
  const list = (Array.isArray(v) ? v : [v]).map((x) => String(x).toLowerCase());
  return list;
}

/**
 * Filters shared by search and suggestions. Returns the sounds that pass, or throws a message-bearing
 * Error for a value that cannot be right (an unknown category or loudness band).
 */
export function applyFilters(catalog, docs, f) {
  const cats = f.category == null ? null : (Array.isArray(f.category) ? f.category : [f.category]).map((c) => String(c).toLowerCase());
  const known = new Set([...CATEGORIES, ...catalog.sounds.map((s) => s.category)]);
  if (cats) for (const c of cats) if (!known.has(c)) throw new FilterError(`Unknown category "${c}". Categories: ${[...known].join(', ')}.`, 'bad_category');
  const bands = bandsOf(f.loudness);
  if (bands) for (const b of bands) if (!BAND_NAMES.includes(b)) throw new FilterError(`Unknown loudness band "${b}". Use: ${BAND_NAMES.join(', ')}.`, 'bad_loudness');
  const fams = f.family == null ? null : (Array.isArray(f.family) ? f.family : [f.family]).map((c) => String(c).toLowerCase());
  if (fams) {
    const knownF = new Set([...Object.keys(FAMILIES), ...catalog.sounds.map((s) => s.family).filter(Boolean)]);
    for (const c of fams) if (!knownF.has(c)) throw new FilterError(`Unknown family "${c}". Families: ${[...knownF].join(', ')}.`, 'bad_family');
  }
  const needTags = f.tags && f.tags.length ? f.tags.flatMap((t) => stems(String(t).replace(/-/g, ' '))) : null;
  return docs.filter((d) => {
    const s = d.s;
    if (cats && !cats.includes(s.category)) return false;
    if (fams && !fams.includes(s.family)) return false;
    if (f.max_duration != null && s.dur > f.max_duration) return false;
    if (f.min_duration != null && s.dur < f.min_duration) return false;
    if (bands) {
      const band = d.level && d.level.band;
      if (!band || !bands.includes(band)) return false;
    }
    if (needTags) for (const t of needTags) if (![...d.tags].some((x) => stemMatch(x, t) === 'exact')) return false;
    return true;
  });
}

export class FilterError extends Error {
  constructor(message, code) { super(message); this.name = 'FilterError'; this.code = code; }
}

/** Plain-text query to weighted stems (all weight 1), without repeats. */
export function queryTokens(text) {
  return uniq(stems(text)).map((stem) => ({ stem, w: 1 }));
}

/**
 * Search. Returns { total, items } with items sorted best first; with no query, every sound that
 * passes the filters in gallery order.
 */
export function search(catalog, index, { query = '', filters = {}, limit = 10, offset = 0 } = {}) {
  const pass = applyFilters(catalog, index.docs, filters);
  const tokens = queryTokens(query);
  let rows;
  if (!tokens.length) {
    rows = pass.map((d) => ({ d, score: 0, why: [] }));
  } else {
    rows = [];
    const phrase = String(query).toLowerCase().trim();
    for (const d of pass) {
      const r = index.score(d, tokens);
      if (r.score <= 0) continue;
      let score = r.score;
      if (phrase.length > 2 && (d.s.name.toLowerCase().includes(phrase) || d.s.id.includes(phrase.replace(/\s+/g, '-')))) score += 3;
      rows.push({ d, score, why: r.why });
    }
    rows.sort((a, b) => b.score - a.score || a.d.s.dur - b.d.s.dur || a.d.s.id.localeCompare(b.d.s.id));
  }
  return { total: rows.length, rows: rows.slice(offset, offset + limit), all: rows };
}
