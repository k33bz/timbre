// Sound levels: measured when the level gate's report is at hand, estimated otherwise.
//
// The catalog does not carry levels. The level gate (gates/check_levels.mjs) renders every sound in a
// browser and writes gates/out/levels.json; that file is gitignored, so it exists only on a machine
// that ran the gate. This module reads it when it can find it (TIMBRE_LEVELS, --levels, a levels.json
// beside the catalog, or ../gates/out/levels.json) and says so ("measured"). For every sound the
// report does not cover it falls back to an ESTIMATE made in Node, without a browser:
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
import path from 'node:path';
import vm from 'node:vm';
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

/** Read a level report: the gate's array of { id, renders: [...] } or a plain { id: { peak, rms } } map. */
export function parseReport(json) {
  const out = new Map();
  const rows = Array.isArray(json) ? json : Object.entries(json && typeof json === 'object' ? json : {}).map(([id, v]) => ({ id, ...v }));
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
      out.set(row.id, { peak: row.peak, rms: Number.isFinite(row.rms) ? row.rms : null, pre: null, range: null, end: null, renders: 1, problems: 0 });
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
    if (process.env.TIMBRE_DEBUG) console.error(e);
    return null;
  }
}

// ------------------------------------------------------------------ the level book

/**
 * Levels for a catalog: the gate's report where it covers a sound, an estimate for the rest.
 * Estimates are made on first use and kept until the sound's source changes.
 */
export class LevelBook {
  constructor({ catalogDir, explicit = null, catalogMtimeMs = 0, logger = null } = {}) {
    this.catalogDir = catalogDir;
    this.explicit = explicit;
    this.logger = logger;
    this.cache = new Map();
    this.report = null;
    this.reload(catalogMtimeMs);
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

  /** Levels of one catalog sound: { peak, rms, band, source, ... } or null when unknown. */
  levelOf(sound, helperSrc) {
    const rep = this.report && this.report.byId.get(sound.id);
    if (rep) {
      return {
        peak: rep.peak, rms: rep.rms, band: bandOf(rep.peak), source: 'measured',
        ...(rep.pre != null ? { preLimiter: rep.pre } : {}),
        ...(rep.range ? { peakRange: rep.range } : {}),
        ...(this.reportStale ? { stale: true } : {}),
      };
    }
    if (!sound.copyable) return null;
    const key = sound.id + '|' + sound.play + '|' + sound.helpers.map((h) => (helperSrc[h] ? helperSrc[h].src.length : 0)).join(',');
    if (this.cache.has(key)) return this.cache.get(key);
    const est = estimateLevels(sound, helperSrc);
    const lv = est ? { peak: est.peak, rms: est.rms, band: bandOf(est.peak), source: 'estimated', audibleEnd: est.end } : null;
    this.cache.set(key, lv);
    return lv;
  }
}
