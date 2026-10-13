// The Timbre catalog as the server sees it.
//
// Reads catalog/manifest.json (every field, the play source, the helper list and every helper's
// source; written by `node build.mjs`) and, when the manifest is missing, catalog/index.json (search
// fields only: then the Copy tools are unavailable). The directory is configurable; the default is
// ../catalog relative to this package.
//
// The catalog is data on disk that other tools rewrite, so this loader is defensive: a malformed
// sound is skipped with a warning instead of taking the server down, and the files are re-read when
// their modification time changes (a rebuilt catalog shows up without a restart).
//
// Schema 2 catalogs also carry, and the tools use instead of inferring: each sound's family and the
// moments it was made for, a description and a role for each parameter, its measured levels (from
// the level gate, embedded by the build), the version and the Copy contract.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { camel, isIdentifier, paramsFor } from './copy.js';
import { LevelBook, cacheFileFor, defaultCacheDir } from './levels.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_CATALOG_DIR = path.resolve(HERE, '..', '..', 'catalog');

/** Every category the build knows (build.mjs, CATEGORIES), in gallery order. */
export const CATEGORIES = ['ui', 'notify', 'game', 'cards', 'magic', 'scifi', 'ambience', 'music'];

export class CatalogError extends Error {
  constructor(message, code = 'catalog_unavailable') {
    super(message);
    this.name = 'CatalogError';
    this.code = code;
  }
}

const isStr = (v) => typeof v === 'string' && v.length > 0;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** How a parameter reads on a slider: switch (off/on), count (whole numbers), amount (0..1), value. */
export function paramKind(d) {
  if (d.step === 1 && d.min === 0 && d.max === 1 && !d.unit) return 'switch';
  if (d.step === 1) return 'count';
  if (!d.unit && d.min === 0 && d.max === 1) return 'amount';
  return 'value';
}

/** Normalize one parameter definition, or null when it is not usable. */
function normParam(name, d) {
  if (!d || typeof d !== 'object' || !isNum(d.min) || !isNum(d.max) || !isNum(d.def) || !(d.min < d.max)) return null;
  const out = { min: d.min, max: d.max, def: Math.min(d.max, Math.max(d.min, d.def)) };
  if (isStr(d.unit)) out.unit = d.unit;
  if (isNum(d.step) && d.step > 0) out.step = d.step;
  if (isStr(d.desc)) out.desc = d.desc;
  if (isStr(d.role)) out.role = d.role;
  return out;
}

const LEVEL_KEYS = ['peak', 'rms', 'worstPeak', 'worstRms', 'lowestPeak', 'pre', 'end'];

/** Measured levels the build embedded in the manifest (the level gate's numbers), or null. */
function normLevels(l) {
  if (!l || typeof l !== 'object' || !isNum(l.peak)) return null;
  const out = {};
  for (const k of LEVEL_KEYS) if (isNum(l[k])) out[k] = l[k];
  return out;
}

/** Normalize one catalog sound. Returns { sound } or { error }. */
function normSound(raw, helpers) {
  if (!raw || typeof raw !== 'object') return { error: 'not an object' };
  if (!isStr(raw.id) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(raw.id)) return { error: `bad id ${JSON.stringify(raw.id)}` };
  if (!isStr(raw.category)) return { error: 'missing category' };
  if (!isNum(raw.dur) || !(raw.dur > 0)) return { error: 'missing dur' };
  const params = {};
  for (const [k, d] of Object.entries(raw.params && typeof raw.params === 'object' ? raw.params : {})) {
    const np = normParam(k, d);
    if (!np) return { error: `param "${k}" needs numeric min < max and def` };
    params[k] = np;
  }
  const hasCode = isStr(raw.play) && Array.isArray(raw.uses) && Array.isArray(raw.helpers);
  const missing = hasCode ? raw.helpers.filter((h) => !helpers[h] || !isStr(helpers[h].src)) : [];
  const copyable = hasCode && !missing.length && isIdentifier(camel(raw.id));
  const s = {
    id: raw.id,
    name: isStr(raw.name) ? raw.name : raw.id,
    category: raw.category,
    tags: Array.isArray(raw.tags) ? raw.tags.filter(isStr) : [],
    desc: typeof raw.desc === 'string' ? raw.desc : '',
    dur: raw.dur,
    family: isStr(raw.family) ? raw.family : null,
    moments: Array.isArray(raw.moments) ? raw.moments.filter(isStr) : [],
    levels: normLevels(raw.levels),
    fingerprint: isStr(raw.fingerprint) ? raw.fingerprint : null,
    params,
    file: isStr(raw.file) ? raw.file : null,
    play: hasCode ? raw.play : null,
    uses: hasCode ? raw.uses.filter(isStr) : [],
    helpers: hasCode ? raw.helpers.filter(isStr) : [],
    copyable,
    fname: camel(raw.id),
  };
  s.defaults = paramsFor(s, null);
  s.paramList = Object.entries(params).map(([name, d]) => ({ name, ...d, kind: paramKind(d) }));
  if (hasCode && missing.length) s.copyIssue = `helper(s) missing from the catalog: ${missing.join(', ')}`;
  return { sound: s };
}

/** Normalize one theme against the sounds. Unknown sounds stay listed; they are reported, not hidden. */
function normTheme(raw) {
  if (!raw || typeof raw !== 'object' || !isStr(raw.id)) return null;
  const moments = {};
  const src = raw.moments && typeof raw.moments === 'object' && !Array.isArray(raw.moments) ? raw.moments : {};
  for (const [m, v] of Object.entries(src)) {
    if (v && typeof v === 'object' && isStr(v.sound)) moments[m] = { sound: v.sound, params: v.params && typeof v.params === 'object' ? { ...v.params } : {} };
  }
  return { id: raw.id, name: isStr(raw.name) ? raw.name : raw.id, desc: typeof raw.desc === 'string' ? raw.desc : '', moments, file: isStr(raw.file) ? raw.file : null };
}

const statOf = (f) => { try { const st = fs.statSync(f); return st.isFile() ? st : null; } catch (e) { return null; } };

export class Catalog {
  /**
   * @param {string} location  the catalog directory (default ../catalog), or a path to manifest.json
   * @param {object} opts      { levelsPath, logger }
   */
  constructor(location, opts = {}) {
    let loc = path.resolve(location || process.env.TIMBRE_CATALOG || DEFAULT_CATALOG_DIR);
    if (/\.json$/i.test(loc)) loc = path.dirname(loc);
    this.dir = loc;
    this.logger = opts.logger || null;
    this.levelsPath = opts.levelsPath === false ? false : opts.levelsPath || null;
    this.cache = opts.cache || false;      // true, or a directory: keep estimated levels between runs
    this.levelCache = new Map();           // estimates survive a reload of the catalog files
    this.signature = null;
    this.loadedAt = null;
    this.reset();
  }

  reset() {
    this.sounds = [];
    this.byId = new Map();
    this.themes = [];
    this.themeById = new Map();
    this.helpers = {};
    this.warnings = [];
    this.schema = null;
    this.version = null;
    this.copyContract = null;
    this.mode = 'empty';
    this.error = null;
    this.levels = this.makeLevelBook(0);
    this.generation = (this.generation || 0) + 1;
  }

  makeLevelBook(mtime) {
    const cacheFile = this.cache ? cacheFileFor(this.dir, typeof this.cache === 'string' ? this.cache : defaultCacheDir()) : null;
    return new LevelBook({ catalogDir: this.dir, explicit: this.levelsPath, catalogMtimeMs: mtime, logger: this.logger, cache: this.levelCache, cacheFile });
  }

  get manifestFile() { return path.join(this.dir, 'manifest.json'); }
  get indexFile() { return path.join(this.dir, 'index.json'); }

  /** Files this catalog depends on, with their modification times, as one comparable string. */
  currentSignature() {
    const parts = [];
    for (const f of [this.manifestFile, this.indexFile]) {
      const st = statOf(f);
      parts.push(st ? `${st.mtimeMs}:${st.size}` : '-');
    }
    const root = statOf(path.resolve(this.dir, '..', 'package.json'));
    parts.push(root ? String(root.mtimeMs) : '-');
    return parts.join('|');
  }

  /** Load the catalog now. Never throws: a failure is kept in `error` and reported by the tools. */
  load() {
    this.signature = this.currentSignature();
    const previous = this.sounds && this.sounds.length ? this.snapshot() : null;
    this.loadedAt = new Date().toISOString();
    this.reset();
    try {
      this.read();
    } catch (e) {
      const err = e instanceof CatalogError ? e : new CatalogError(String(e && e.message ? e.message : e));
      if (previous) {
        // a build rewriting the files can be caught half way: keep serving the last good catalog;
        // the next change to the files (the build finishing) triggers another try
        this.restore(previous);
        this.warnings.push(`kept the previous catalog: ${err.message}`);
      } else {
        this.error = err;
        this.sounds = [];
        this.byId = new Map();
      }
      if (this.logger) this.logger.warn(`catalog: ${err.message}`);
    }
    return this;
  }

  /** The loaded state, to put back if a reload fails. */
  snapshot() {
    const keys = ['sounds', 'byId', 'themes', 'themeById', 'helpers', 'warnings', 'schema', 'version', 'copyContract', 'mode', 'levels'];
    return Object.fromEntries(keys.map((k) => [k, this[k]]));
  }

  restore(snap) {
    Object.assign(this, snap, { warnings: [...snap.warnings], error: null });
  }

  /** Reload when the catalog files changed since the last load. Returns true when it reloaded. */
  refresh() {
    if (this.signature === this.currentSignature()) {
      if (this.levels) this.levels.reload(this.manifestMtime());
      return false;
    }
    this.load();
    return true;
  }

  manifestMtime() {
    const st = statOf(this.manifestFile) || statOf(this.indexFile);
    return st ? st.mtimeMs : 0;
  }

  read() {
    const mst = statOf(this.manifestFile);
    const ist = statOf(this.indexFile);
    if (!mst && !ist) {
      throw new CatalogError(`No Timbre catalog at ${this.dir} (manifest.json not found). Run \`node build.mjs\` in the Timbre repository, or point the server at a catalog directory with --catalog or TIMBRE_CATALOG.`);
    }
    const parse = (f) => {
      try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { throw new CatalogError(`${f} is not valid JSON: ${e.message}`, 'catalog_invalid'); }
    };
    let man = null;
    if (mst) {
      man = parse(this.manifestFile);
      if (!man || !Array.isArray(man.sounds)) throw new CatalogError(`${this.manifestFile} has no "sounds" array`, 'catalog_invalid');
      this.mode = 'manifest';
    } else {
      man = parse(this.indexFile);
      if (!man || !Array.isArray(man.sounds)) throw new CatalogError(`${this.indexFile} has no "sounds" array`, 'catalog_invalid');
      this.mode = 'index';
      this.warnings.push('manifest.json is missing: only the search index was loaded, so params, levels and the Copy tools are unavailable. Run `node build.mjs`.');
    }
    this.schema = man.schema == null ? null : man.schema;
    this.helpers = man.helpers && typeof man.helpers === 'object' ? man.helpers : {};
    this.version = this.readVersion(man);
    this.copyContract = man.copy && typeof man.copy === 'object' && isNum(man.copy.preroll) ? man.copy : null;
    for (const raw of man.sounds) {
      const r = normSound(raw, this.helpers);
      if (r.error) { this.warnings.push(`skipped a sound (${raw && raw.id ? raw.id : '?'}): ${r.error}`); continue; }
      if (this.byId.has(r.sound.id)) { this.warnings.push(`duplicate sound id "${r.sound.id}" ignored`); continue; }
      if (r.sound.copyIssue) this.warnings.push(`${r.sound.id}: ${r.sound.copyIssue}`);
      this.sounds.push(r.sound);
      this.byId.set(r.sound.id, r.sound);
    }
    // gallery order: by category (the build's order, unknown categories last), then id
    const order = (s) => { const i = CATEGORIES.indexOf(s.category); return i < 0 ? CATEGORIES.length : i; };
    this.sounds.sort((a, b) => order(a) - order(b) || a.id.localeCompare(b.id));
    for (const raw of Array.isArray(man.themes) ? man.themes : []) {
      const th = normTheme(raw);
      if (!th) { this.warnings.push('skipped a malformed theme'); continue; }
      if (this.themeById.has(th.id)) { this.warnings.push(`duplicate theme id "${th.id}" ignored`); continue; }
      this.themes.push(th);
      this.themeById.set(th.id, th);
    }
    if (this.mode === 'manifest' && man.count != null && man.count !== man.sounds.length) {
      this.warnings.push(`manifest.count says ${man.count} but it lists ${man.sounds.length} sounds: rebuild with \`node build.mjs\``);
    }
    this.levels = this.makeLevelBook(this.manifestMtime());
  }

  /** The Timbre version: manifest.version, else the repository's package.json beside the catalog. */
  readVersion(man) {
    if (isStr(man.version)) return man.version;
    try {
      const pkg = JSON.parse(fs.readFileSync(path.resolve(this.dir, '..', 'package.json'), 'utf8'));
      if (pkg && pkg.name === 'timbre' && isStr(pkg.version)) return pkg.version;
    } catch (e) { /* not inside a repository checkout */ }
    return null;
  }

  get(id) { return this.byId.get(id) || null; }

  /** Levels for a sound (measured when the gate's report covers it, else estimated). */
  levelOf(sound) { return this.levels.levelOf(sound, this.helpers); }

  /** Levels already known for a sound, without computing: a level, null (none possible) or undefined (not yet). */
  peekLevel(sound) { return this.levels.peek(sound, this.helpers); }

  theme(id) { return this.themeById.get(id) || null; }

  /** Count of sounds per family (sounds that declare one). */
  familyCounts() {
    const out = {};
    for (const s of this.sounds) if (s.family) out[s.family] = (out[s.family] || 0) + 1;
    return out;
  }

  /** Count of sounds per category, every known category included (zero when empty). */
  categoryCounts() {
    const out = {};
    for (const c of CATEGORIES) out[c] = 0;
    for (const s of this.sounds) out[s.category] = (out[s.category] || 0) + 1;
    return out;
  }
}
