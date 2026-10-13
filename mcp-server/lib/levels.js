// Sound levels: measured when the level gate's numbers are at hand, estimated otherwise.
//
// The level gate (gates/check_levels.mjs) renders every sound in a browser and writes
// catalog/levels.json, and the build embeds each current measurement in the manifest (a sound's
// `levels`, kept only while its fingerprint matches what was measured). Those come first. Then a
// report file when one is found (TIMBRE_LEVELS, --levels, catalog/levels.json, or the gate's full
// gates/out/levels.json), entries carrying a fingerprint used only while it matches the sound. Both
// say "measured". For every sound neither covers it falls back to an ESTIMATE made in Node, without
// a browser:
//
//   1. run the sound's own `play` (from the catalog) with the catalog's helper sources against a
//      recording mock of the audio graph, at the sound's default parameters and seed 1;
//   2. play the recorded graph back offline (lib/render.js: oscillators, the seeded noise the helper
//      generated, filters, envelopes, shapers);
//   3. pass the result through the master chain's warm steady state (a gain of about unity and the
//      tanh ceiling, docs/DESIGN.md) and read peak, RMS and audible length the way the gate does.
//
// Reverb and delay tails are not simulated, so a sound that leans on one reads slightly low (an
// allowance covers it). Against the gate on the first 133 sounds: peak within 0.8 dB on average
// (median 0.4, worst 3.8), the same loudness band for 123 of 133. It is a ranking aid for "quiet,
// medium or loud", never presented as a measurement: every level carries
// source: 'measured' | 'estimated' (test/levels.test.js re-checks it against a stored copy of the
// gate's report).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { MockContext } from './mockaudio.js';
import { renderGraph, measureSignal } from './render.js';
import { dedent, playSource, paramsFor } from './copy.js';

/** Loudness bands on the default peak in dBFS (docs/ADDING_SOUNDS.md, "Levels"). */
export const BANDS = [
  { name: 'quiet', max: -23, note: 'small textures: clicks, ticks, air, paper (-28 to -23 dBFS)' },
  { name: 'medium', max: -17, note: 'ordinary effects and cues (-23 to -17 dBFS)' },
  { name: 'loud', max: Infinity, note: 'the loudest hits in the house range (-17 to -12 dBFS)' },
];
export const BAND_NAMES = BANDS.map((b) => b.name);

/** The band a peak (dBFS) falls in. */
export function bandOf(peak) {
  for (const b of BANDS) if (peak <= b.max) return b.name;
  return 'loud';
}

const round1 = (v) => Math.round(v * 10) / 10;
const dB = (a) => (a > 0 ? round1(20 * Math.log10(a)) : -120);

// ------------------------------------------------------------------ measured (the gate's report)

/**
 * Read a level report: the gate's array of { id, renders: [...] } (gates/out/levels.json), the
 * catalog's { sounds: { id: { fingerprint, peak, rms, worstPeak, lowestPeak, pre, end } } }
 * (catalog/levels.json) or a plain { id: { peak, rms } } map.
 */
export function parseReport(json) {
  const out = new Map();
  const isMap = (v) => v && typeof v === 'object' && !Array.isArray(v);
  const src = isMap(json) && isMap(json.sounds) ? json.sounds : json;
  const rows = Array.isArray(src) ? src : Object.entries(isMap(src) ? src : {}).map(([id, v]) => ({ id, ...v }));
  for (const row of rows) {
    if (!row || typeof row.id !== 'string') continue;
    if (Array.isArray(row.renders) && row.renders.length) {
      const good = row.renders.filter((m) => m && Number.isFinite(m.peak));
      if (!good.length) continue;
      const def = good.filter((m) => m.label === 'defaults');
      const base = def.length ? def : good;
      const num = (set, k) => set.filter((m) => Number.isFinite(m[k])).map((m) => m[k]);
      const pk = num(base, 'peak');
      const rms = num(base, 'rms');
      const all = num(good, 'peak');
      out.set(row.id, {
        peak: Math.max(...pk),
        rms: rms.length ? round1(rms.reduce((a, b) => a + b, 0) / rms.length) : null,
        pre: num(base, 'pre').length ? Math.max(...num(base, 'pre')) : null,
        range: { min: Math.min(...all), max: Math.max(...all) },
        end: num(base, 'end').length ? Math.max(...num(base, 'end')) : null,
        renders: good.length,
        problems: Array.isArray(row.problems) ? row.problems.length : 0,
      });
    } else if (Number.isFinite(row.peak)) {
      const num = (k) => (Number.isFinite(row[k]) ? row[k] : null);
      out.set(row.id, {
        peak: row.peak, rms: num('rms'), pre: num('pre'),
        range: num('lowestPeak') != null && num('worstPeak') != null ? { min: row.lowestPeak, max: row.worstPeak } : null,
        end: num('end'), renders: 1, problems: 0,
        ...(typeof row.fingerprint === 'string' ? { fingerprint: row.fingerprint } : {}),
      });
    }
  }
  return out;
}

/** Candidate report paths, most specific first. */
export function reportCandidates(catalogDir, explicit) {
  if (explicit === false) return []; // levels: false (or --levels none) turns discovery off
  const list = [];
  if (explicit) list.push(path.resolve(explicit));
  if (process.env.TIMBRE_LEVELS) list.push(path.resolve(process.env.TIMBRE_LEVELS));
  list.push(path.join(catalogDir, 'levels.json'));
  list.push(path.resolve(catalogDir, '..', 'gates', 'out', 'levels.json'));
  return [...new Set(list)];
}

/** Load the first report that exists and parses. Resolves to { file, mtimeMs, byId } or null. */
export function loadReport(catalogDir, explicit) {
  for (const file of reportCandidates(catalogDir, explicit)) {
    try {
      const st = fs.statSync(file);
      if (!st.isFile()) continue;
      const byId = parseReport(JSON.parse(fs.readFileSync(file, 'utf8')));
      if (byId.size) return { file, mtimeMs: st.mtimeMs, byId };
    } catch (e) { /* missing or unreadable: try the next */ }
  }
  return null;
}

// ------------------------------------------------------------------ estimated (a mock run)

const SR = 48000;
const GAIN = 1.02;        // master gain 0.55 x the warm limiter's makeup (about +5.4 dB): about unity (docs/DESIGN.md)
// A reverb or delay tail is not simulated (lib/render.js). Across the 27 sounds that use one the
// peak read 1.5 dB low on average, so they get 1 dB back (an allowance fitted on the first
// 133-sound catalog against the gate's report: band agreement 123 of 133, mean absolute error 0.8 dB). The
// dry sounds read 0.5 dB low on average; that is mostly the gate keeping the worst of three seeds
// while this reads one, and it is left alone because correcting it lowers band agreement.
const WET_DB = 1;
const TAIL = 0.25;        // seconds rendered past dur, as the gate does

/** Evaluate a sound's helpers and play in an isolated context. */
function compileSound(sound, helperSrc) {
  const vmctx = vm.createContext({});
  const src = sound.helpers.map((h) => dedent(helperSrc[h].src)).join('\n');
  const body = `(function () {\n${src}\nreturn { T: { ${sound.uses.join(', ')} }, seed: typeof seed === 'function' ? seed : null };\n})()`;
  const kit = vm.runInContext(body, vmctx, { timeout: 2000 });
  const play = vm.runInContext('(' + playSource(sound.play) + ')', vmctx, { timeout: 2000 });
  return { T: kit.T, seed: kit.seed, play, vmctx };
}

/** The master chain at its warm steady state: gain, then the tanh ceiling. */
function throughMaster(y) {
  for (let i = 0; i < y.length; i++) y[i] = 0.5 * Math.tanh(2 * y[i] * GAIN);
  return y;
}

/**
 * Estimated levels of a sound at `params` (defaults when omitted) and a seed.
 * Returns { peak, rms, end, tail } in dBFS and seconds, or null when the sound cannot be run here.
 */
export function estimateLevels(sound, helperSrc, params, seedValue = 1, { timeout = 3000 } = {}) {
  try {
    const { T, seed, play, vmctx } = compileSound(sound, helperSrc);
    const ctx = new MockContext(SR);
    const out = ctx.createGain();
    out.connect(ctx.destination);
    vmctx.__call = { play, T, seed, out, p: paramsFor(sound, params), s: seedValue };
    vm.runInContext('(function () { var c = __call; if (c.seed) c.seed(c.s); c.play(c.T, c.out, 0, c.p); })()', vmctx, { timeout });
    if (!ctx.nodes.some((nd) => nd.started != null)) return null;
    const wet = ctx.nodes.some((nd) => nd.kind === 'convolver' || nd.kind === 'delay');
    const y = throughMaster(renderGraph(ctx, sound.dur + TAIL));
    const m = measureSignal(y, SR, sound.dur);
    if (m.silent) return null;
    return { peak: wet ? Math.round((m.peak + WET_DB) * 10) / 10 : m.peak, rms: m.rms, end: m.end, tail: m.tail, wet };
  } catch (e) {
    return null;   // a sound that cannot be run here has no estimate; the tools report it as unknown
  }
}

// ------------------------------------------------------------------ the estimate cache

/** Bump when the estimator changes what it computes, so cached numbers are not trusted. */
export const ESTIMATOR_VERSION = 1;
const hashOf = (text) => crypto.createHash('sha1').update(text).digest('hex').slice(0, 16);

/** Where estimates are kept between runs: TIMBRE_MCP_CACHE, else the platform's cache directory. */
export function defaultCacheDir() {
  if (process.env.TIMBRE_MCP_CACHE) return path.resolve(process.env.TIMBRE_MCP_CACHE);
  const base = process.platform === 'win32'
    ? process.env.LOCALAPPDATA
    : process.env.XDG_CACHE_HOME || (process.env.HOME ? path.join(process.env.HOME, '.cache') : null);
  return path.join(base || os.tmpdir(), 'timbre-mcp');
}

/** The cache file for one catalog directory. */
export function cacheFileFor(catalogDir, cacheDir = defaultCacheDir()) {
  return path.join(cacheDir, `levels-${hashOf(path.resolve(catalogDir))}.json`);
}

// ------------------------------------------------------------------ the level book

/**
 * Levels for a catalog: the gate's report where it covers a sound, an estimate for the rest.
 * Estimates are made on first use and kept until the sound's source changes.
 */
export class LevelBook {
  constructor({ catalogDir, explicit = null, catalogMtimeMs = 0, logger = null, cache = new Map(), cacheFile = null } = {}) {
    this.catalogDir = catalogDir;
    this.explicit = explicit;
    this.logger = logger;
    this.cache = cache;          // estimates by key; shared across catalog reloads when passed in
    this.cacheFile = cacheFile;  // where they are kept between runs (null: not kept)
    this.dirty = false;
    this.flushTimer = null;
    this.keys = new WeakMap();
    this.report = null;
    if (cacheFile) this.loadCache();
    this.reload(catalogMtimeMs);
  }

  loadCache() {
    try {
      const j = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
      if (j && j.version === ESTIMATOR_VERSION && j.entries && typeof j.entries === 'object') {
        for (const [k, v] of Object.entries(j.entries)) if (!this.cache.has(k)) this.cache.set(k, v);
      }
    } catch (e) { /* no cache yet, or an unreadable one: start empty */ }
  }

  /** Write the estimates to the cache file now (best effort). */
  flush() {
    if (this.flushTimer) { clearTimeout(this.flushTimer); this.flushTimer = null; }
    if (!this.cacheFile || !this.dirty) return false;
    try {
      fs.mkdirSync(path.dirname(this.cacheFile), { recursive: true });
      const tmp = `${this.cacheFile}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify({ version: ESTIMATOR_VERSION, entries: Object.fromEntries(this.cache) }));
      fs.renameSync(tmp, this.cacheFile);
      this.dirty = false;
      return true;
    } catch (e) {
      if (this.logger) this.logger.warn(`level cache not written: ${e.message}`);
      return false;
    }
  }

  scheduleFlush() {
    this.dirty = true;
    if (!this.cacheFile || this.flushTimer) return;
    this.flushTimer = setTimeout(() => this.flush(), 1500);
    this.flushTimer.unref();
  }

  /** The first report candidate that exists, as a comparable signature. */
  reportSignature() {
    if (!this.catalogDir) return '';
    for (const file of reportCandidates(this.catalogDir, this.explicit)) {
      try {
        const st = fs.statSync(file);
        if (st.isFile()) return `${file}:${st.mtimeMs}:${st.size}`;
      } catch (e) { /* next */ }
    }
    return '';
  }

  /** Re-read the report file when it changed (it is rewritten whenever the gate is rerun). */
  reload(catalogMtimeMs = 0) {
    this.catalogMtimeMs = catalogMtimeMs;
    const sig = this.reportSignature();
    if (this.sig === sig && this.report !== undefined) return;
    this.sig = sig;
    this.report = this.catalogDir ? loadReport(this.catalogDir, this.explicit) : null;
  }

  /** The report file's path when one is loaded. */
  get reportFile() { return this.report ? this.report.file : null; }

  /** True when the report is older than the catalog (the sounds may have changed since). */
  get reportStale() { return !!(this.report && this.catalogMtimeMs && this.report.mtimeMs < this.catalogMtimeMs); }

  /**
   * The measured level of a sound: the catalog's own (embedded by the build, current by construction)
   * first, then the report's. levels: false (--levels none) turns both off.
   */
  measured(sound) {
    if (this.explicit === false) return null;
    const l = sound.levels;
    if (l && Number.isFinite(l.peak)) {
      return {
        peak: l.peak, rms: Number.isFinite(l.rms) ? l.rms : null, band: bandOf(l.peak), source: 'measured', from: 'catalog',
        ...(Number.isFinite(l.pre) ? { preLimiter: l.pre } : {}),
        ...(Number.isFinite(l.lowestPeak) && Number.isFinite(l.worstPeak) ? { peakRange: { min: l.lowestPeak, max: l.worstPeak } } : {}),
        ...(Number.isFinite(l.worstRms) ? { worstRms: l.worstRms } : {}),
        ...(Number.isFinite(l.end) ? { audibleEnd: l.end } : {}),
      };
    }
    const rep = this.report && this.report.byId.get(sound.id);
    if (!rep) return null;
    // a report entry that names the version it measured is used only for that version
    if (rep.fingerprint && sound.fingerprint && rep.fingerprint !== sound.fingerprint) return null;
    return {
      peak: rep.peak, rms: rep.rms, band: bandOf(rep.peak), source: 'measured', from: 'report',
      ...(rep.pre != null ? { preLimiter: rep.pre } : {}),
      ...(rep.range ? { peakRange: rep.range } : {}),
      ...(rep.end != null ? { audibleEnd: rep.end } : {}),
      ...(this.reportStale && !rep.fingerprint ? { stale: true } : {}),
    };
  }

  /** A key that changes when the sound's recipe, the helpers it uses or the estimator change. */
  cacheKey(sound, helperSrc) {
    let k = this.keys.get(sound);
    if (!k) {
      k = hashOf([ESTIMATOR_VERSION, sound.id, sound.play, ...sound.helpers.map((h) => (helperSrc[h] ? helperSrc[h].src : ''))].join('\n#\n'));
      this.keys.set(sound, k);
    }
    return k;
  }

  /** Levels already known (measured, or estimated earlier), without computing anything. */
  peek(sound, helperSrc) {
    const m = this.measured(sound);
    if (m) return m;
    if (!sound.copyable) return null;
    const key = this.cacheKey(sound, helperSrc);
    return this.cache.has(key) ? this.cache.get(key) : undefined;
  }

  /** Levels of one catalog sound: { peak, rms, band, source, ... } or null when unknown. */
  levelOf(sound, helperSrc) {
    const m = this.measured(sound);
    if (m) return m;
    if (!sound.copyable) return null;
    const key = this.cacheKey(sound, helperSrc);
    if (this.cache.has(key)) return this.cache.get(key);
    const est = estimateLevels(sound, helperSrc);
    const lv = est ? { peak: est.peak, rms: est.rms, band: bandOf(est.peak), source: 'estimated', audibleEnd: est.end } : null;
    this.cache.set(key, lv);
    this.scheduleFlush();
    return lv;
  }
}
