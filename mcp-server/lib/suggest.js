// Suggestions: from an app moment or a plain description to ranked sounds with reasons.
//
// A moment's score is the catalog search score of its vocabulary (lib/moments.js) against each
// sound, then multiplied by fit factors: the category, the length (a button click wants a short
// sound), the loudness band, the mood, a rule-out list, and a nudge for the sounds a theme already
// uses. Every factor that moved a score leaves a reason, so an agent can show why a sound was picked.
import { SearchIndex, applyFilters, queryTokens } from './search.js';
import { MOMENTS, momentsIn, moodsIn } from './moments.js';
import { stems } from './text.js';

const indexCache = new WeakMap();

/** The search index for a catalog, rebuilt when the catalog reloads (or its levels change). */
export function indexFor(catalog) {
  const key = `${catalog.generation}|${catalog.levels.sig || ''}`;
  const hit = indexCache.get(catalog);
  if (hit && hit.key === key) return hit.index;
  const index = new SearchIndex(catalog.sounds, (s) => catalog.levelOf(s));
  indexCache.set(catalog, { key, index });
  return index;
}

const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

/** A moment spec for any name: the lexicon's, or one made from the words of the name. */
export function specFor(name) {
  const key = String(name).toLowerCase().trim().replace(/\s+/g, '-');
  if (MOMENTS[key]) return { ...MOMENTS[key], known: true };
  const words = stems(key.replace(/-/g, ' '));
  return {
    name: key, known: false, about: `A custom moment named "${key}".`, tags: [key], terms: [], categories: [],
    tagStems: words, termStems: [], detectStems: words, avoidStems: [], avoid: [], phrases: [], loud: [], rawTags: key.includes('-') ? [key] : [],
  };
}

/** The active moods for a text (explicit mood words first, then words in the description). */
export function activeMoods(...texts) {
  const out = new Map();
  for (const t of texts) {
    if (!t) continue;
    for (const { mood, hits } of moodsIn(t)) if (!out.has(mood.name)) out.set(mood.name, { mood, hits });
  }
  return [...out.values()];
}

/** The theme a free text names (its name or id, every word of it), or null. */
export function themeFromText(catalog, text) {
  const have = new Set(stems(text));
  if (!have.size) return null;
  let best = null;
  for (const th of catalog.themes) {
    const words = new Set([...stems(th.name), ...stems(th.id.replace(/-/g, ' '))]);
    if (words.size && [...words].every((w) => have.has(w))) {
      if (!best || words.size > best.size) best = { theme: th, size: words.size };
    }
  }
  return best ? best.theme : null;
}

/**
 * Rank every sound for one moment. ctx: { moods, theme, used, filters }.
 * Returns [{ sound, score, reasons, strong, level }] best first (score > 0 only).
 */
export function rankMoment(catalog, spec, ctx = {}) {
  const index = indexFor(catalog);
  const docs = applyFilters(catalog, index.docs, ctx.filters || {});
  const tokens = [];
  const seen = new Set();
  const add = (stem, w) => { if (!seen.has(stem)) { seen.add(stem); tokens.push({ stem, w }); } };
  for (const w of spec.tagStems) add(w, 1);
  for (const w of stems(spec.name.replace(/-/g, ' '))) if (w !== 'up') add(w, 1);
  for (const w of spec.termStems) add(w, 0.6);
  const themeEntry = ctx.theme ? ctx.theme.moments[spec.name] : null;
  const rows = [];
  for (const d of docs) {
    const r = index.score(d, tokens, { coverage: false });
    const themed = themeEntry && themeEntry.sound === d.s.id;
    // whole hyphenated tags ("level-up", "power-up") count as exact tag hits
    const rawHits = (spec.rawTags || []).filter((t) => d.s.tags.includes(t));
    if (r.score <= 0 && !themed && !rawHits.length) continue;
    let score = r.score + rawHits.length * 14;
    const reasons = [];
    // what matched, in words
    const byField = {};
    for (const w of r.why) {
      const [field, rest] = w.split(':');
      (byField[field] = byField[field] || []).push(rest);
    }
    const word = (stem) => d.disp.get(stem) || stem;
    // the whole tag a stem came from (8-bit, not bit), when the sound has one
    const tagOf = (stem) => d.s.tags.find((t) => stems(t.replace(/-/g, ' ')).includes(stem)) || word(stem);
    const direct = (f) => (byField[f] || []).filter((x) => !x.includes('~'));
    const viaSyn = Object.values(byField).flat().filter((x) => x.includes('~'));
    // a tag is a strong match when it is one of the moment's own tag stems, found directly
    const tagHits = direct('tag').filter((x) => spec.tagStems.includes(x) || spec.termStems.includes(x));
    const strong = tagHits.length > 0 || rawHits.length > 0 || direct('name').some((x) => spec.tagStems.includes(x));
    if (tagHits.length || rawHits.length) reasons.push(`tagged ${[...rawHits, ...tagHits.map(word)].join(', ')}`);
    else if (direct('name').length) reasons.push(`name matches ${direct('name').map(word).join(', ')}`);
    else if (direct('desc').length) reasons.push(`description mentions ${direct('desc').slice(0, 3).map(word).join(', ')}`);
    else if (viaSyn.length) reasons.push(`related words: ${viaSyn.slice(0, 3).map((x) => word(x.split('~')[0])).join(', ')}`);
    // category
    const ci = spec.categories.indexOf(d.s.category);
    if (spec.categories.length) {
      const f = ci === 0 ? 1.25 : ci > 0 ? 1.12 : 0.88;
      score *= f;
      if (ci >= 0) reasons.push(`${d.s.category} sounds fit this moment`);
    }
    // rule-outs
    const clash = spec.avoidStems.filter((w) => d.tags.has(w) || d.name.has(w));
    if (clash.length) { score *= 0.35; reasons.push(`tagged ${clash.map(word).join(', ')}, which clashes with ${spec.name}`); }
    // length
    const dur = d.s.dur;
    if (spec.maxDur && dur > spec.maxDur) {
      score *= Math.pow(spec.maxDur / dur, 0.6);
      reasons.push(`${dur} s is long for ${spec.name} (aim for under ${spec.maxDur} s)`);
    } else if (spec.minDur && dur < spec.minDur) {
      score *= Math.pow(dur / spec.minDur, 0.6);
      reasons.push(`${dur} s is short for ${spec.name} (aim for over ${spec.minDur} s)`);
    } else if (spec.maxDur && spec.maxDur <= 0.4) {
      reasons.push(`${dur} s: short enough to repeat`);
    }
    // loudness
    const lv = d.level;
    if (lv && spec.loud.length) {
      const li = spec.loud.indexOf(lv.band);
      score *= li === 0 ? 1.1 : li > 0 ? 1.0 : 0.8;
    }
    // moods
    for (const { mood } of ctx.moods || []) {
      const boost = mood.boost && mood.boost[d.s.category];
      if (boost) { score *= 1 + 0.12 * boost; reasons.push(`${d.s.category} suits a ${mood.name} mood`); }
      const pen = mood.penalty && mood.penalty[d.s.category];
      if (pen) score *= 1 - 0.1 * pen;
      const fam = mood.tagStems.filter((w) => d.tags.has(w));
      if (fam.length) { score *= 1 + (mood.tagBoost || 0.18) * Math.min(2, fam.length); reasons.push(`tagged ${[...new Set(fam.slice(0, 2).map(tagOf))].join(', ')}, a ${mood.name} mood`); }
      // a sound with a setting the mood asks for (the retro mood turns a chip switch on) can fulfil it
      const knob = Object.keys(mood.hints || {}).find((k) => d.s.params[k]);
      if (knob) { score *= 1.3; reasons.push(`has a ${knob} setting for the ${mood.name} mood`); }
      if (lv && mood.loud) {
        const mi = mood.loud.indexOf(lv.band);
        if (mi === 0) { score *= 1.1; reasons.push(`${lv.band} level suits a ${mood.name} mood`); }
        else if (mi < 0) score *= mood.dislike && mood.dislike.includes(lv.band) ? 0.7 : 0.88;
      }
    }
    // theme
    if (themed) { score *= 1.5; reasons.push(`the ${ctx.theme.name} theme uses it for ${spec.name}`); }
    // diversity when filling a kit
    if (ctx.used && ctx.used.has(d.s.id)) score *= 0.75;
    rows.push({ sound: d.s, score, reasons, strong: strong || !!themed, level: lv });
  }
  rows.sort((a, b) => b.score - a.score || a.sound.dur - b.sound.dur || a.sound.id.localeCompare(b.sound.id));
  return rows;
}

/** Drop the long tail: keep rows within reach of the best one (loose matches need more reach). */
export function trimRows(rows, limit) {
  if (!rows.length) return rows;
  const top = rows[0].score;
  const keep = rows.filter((r, i) => i === 0 || (r.score >= 0.2 * top && (r.strong || !rows[0].strong || r.score >= 0.35 * top)));
  return keep.slice(0, limit);
}

/**
 * Parameter values a moment (and then the moods) ask for, limited to parameters the sound has and
 * inside their range; the moment's own hints win over a mood's.
 */
export function hintsFor(spec, sound, moods = []) {
  const out = {};
  const take = (hints) => {
    for (const [k, v] of Object.entries(hints || {})) {
      const d = sound.params[k];
      if (!(k in out) && d && v >= d.min && v <= d.max) out[k] = v;
    }
  };
  take(spec.hints);
  for (const { mood } of moods) take(mood.hints);
  return out;
}

/** One candidate in the shape the tools return. */
export function candidateOf(row, spec, moods = []) {
  const s = row.sound;
  const hints = hintsFor(spec, s, moods);
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    dur: s.dur,
    desc: s.desc,
    score: round(row.score),
    fit: row.strong ? 'strong' : 'loose',
    reasons: row.reasons.slice(0, 5),
    ...(row.level ? { loudness: { band: row.level.band, peak: row.level.peak, source: row.level.source } } : {}),
    ...(Object.keys(hints).length ? { params: hints } : {}),
  };
}

/**
 * suggest_sounds: moments named in the request (or detected in a description) each get a ranked
 * list; with none, the description is searched as free text.
 */
export function suggest(catalog, { description = '', moments = [], mood = '', theme = null, limit = 3, filters = {} } = {}) {
  const moods = activeMoods(mood, description);
  const themeObj = theme ? catalog.theme(theme) : themeFromText(catalog, `${mood} ${description}`);
  const detected = description ? momentsIn(description) : [];
  const names = [];
  const origin = {};
  for (const m of moments) {
    const key = String(m).toLowerCase().trim().replace(/\s+/g, '-');
    if (key && !names.includes(key)) { names.push(key); origin[key] = 'requested'; }
  }
  for (const d of detected) if (!names.includes(d.moment)) { names.push(d.moment); origin[d.moment] = 'read from the description'; }
  const groups = [];
  for (const name of names) {
    const spec = specFor(name);
    const rows = rankMoment(catalog, spec, { moods, theme: themeObj, filters });
    groups.push({
      moment: name,
      about: spec.about,
      source: origin[name],
      candidates: trimRows(rows, limit).map((r) => candidateOf(r, spec, moods)),
      ...(rows.length ? {} : { note: `Nothing in the catalog matches "${name}" under these filters yet. Try search_sounds with a looser query or without filters.` }),
    });
  }
  let match = null;
  if (!groups.length || groups.every((g) => !g.candidates.length)) {
    // nothing recognizable: search the description as plain words, with the mood applied
    const text = `${description} ${mood}`.trim();
    const spec = specFor('match');
    const idx = indexFor(catalog);
    const docs = applyFilters(catalog, idx.docs, filters);
    const tokens = queryTokens(text);
    const rows = [];
    for (const d of docs) {
      const r = idx.score(d, tokens);
      if (r.score <= 0) continue;
      let score = r.score;
      for (const { mood: m } of moods) {
        const boost = m.boost && m.boost[d.s.category];
        if (boost) score *= 1 + 0.12 * boost;
        const fam = m.tagStems.filter((w) => d.tags.has(w));
        if (fam.length) score *= 1 + (m.tagBoost || 0.18) * Math.min(2, fam.length);
        if (d.level && m.loud && m.loud.indexOf(d.level.band) === 0) score *= 1.1;
      }
      rows.push({ sound: d.s, score, reasons: [`words match: ${[...new Set(r.why.slice(0, 4).map((w) => d.disp.get(w.split(':')[1].split('~')[0]) || w.split(':')[1].split('~')[0]))].join(', ')}`], strong: true, level: d.level });
    }
    rows.sort((a, b) => b.score - a.score || a.sound.id.localeCompare(b.sound.id));
    match = { candidates: rows.slice(0, Math.max(limit, 5)).map((r) => candidateOf(r, spec, moods)) };
  }
  return { moods, theme: themeObj, detected, groups, match };
}

/**
 * The best sound for one moment under a theme and mood, for build_kit.
 * Returns { row, spec, alternatives } or null.
 */
export function pickForMoment(catalog, name, { theme = null, moods = [], used = new Set(), filters = {} } = {}) {
  const spec = specFor(name);
  const rows = rankMoment(catalog, spec, { moods, theme, used, filters });
  return rows.length ? { row: rows[0], spec, alternatives: trimRows(rows, 4).slice(1) } : null;
}

