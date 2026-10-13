#!/usr/bin/env node
// Level gate. Renders every sound in dist/timbre.html offline, through the real master chain, at
// its default parameters and at 3 random parameter sets (reproducible per sound id), each with 3
// noise seeds: 12 renders per sound. The worst result per sound must stay inside the house range
// (docs/DESIGN.md, "Level range"):
//   peak    <= -12 dBFS and >= -36 dBFS (loud enough to hear, never louder than the loudest hits)
//   clip    no sample above -1 dBFS after the master chain
//   pre     the voices' own sum stays <= -3 dBFS (the ceiling is a guard, never the sound)
//   dc      <= -50 dBFS over the audible span
//   tail    <= -60 dBFS after dur (the declared dur covers the whole sound)
//   never silent, never NaN
//   node gates/check_levels.mjs [id-filter]
// Writes gates/out/levels.json (every render) and catalog/levels.json (the measured levels per sound,
// which the build embeds in the manifest; see levelEntry). Exit 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, distUrl, OUT, ROOT, table } from './lib/browser.mjs';
import { randomParamSets, writeAtomic, LEVELS_FILE } from '../build.mjs';

export const LIMITS = { peakMax: -12, peakMin: -36, clipMax: -1, preMax: -3, dcMax: -50, tailMax: -60 };
const SEEDS = [1, 2, 3];
const only = process.argv[2] || '';

/** Problems with one render's measurements (empty = within the house range). */
export function problems(m, L = LIMITS) {
  const p = [];
  if (m.nan) p.push(`${m.nan} NaN samples`);
  if (m.silent) { p.push('silent'); return p; }
  if (m.peak > L.peakMax) p.push(`peak ${m.peak} > ${L.peakMax}`);
  if (m.peak < L.peakMin) p.push(`peak ${m.peak} < ${L.peakMin}`);
  if (m.clipped) p.push(`${m.clipped} samples above ${L.clipMax} dBFS`);
  if (m.pre != null && m.pre > L.preMax) p.push(`pre-limiter ${m.pre} > ${L.preMax}`);
  if (m.dc > L.dcMax) p.push(`dc ${m.dc} > ${L.dcMax}`);
  if (m.tail > L.tailMax) p.push(`tail ${m.tail} > ${L.tailMax} after dur`);
  return p;
}

/**
 * One sound's entry in catalog/levels.json, from its 12 renders: peak and rms at the defaults (the
 * worst peak and the mean RMS of the 3 seeds, as the table shows them), the loudest and quietest
 * peak and the loudest RMS over every render, the highest pre-limiter peak, the audible end at the
 * defaults, and the fingerprint of the sound that was measured (build.mjs, fingerprint).
 */
export function levelEntry(renders, fp) {
  const def = renders.filter((m) => m.label === 'defaults');
  const mx = (k, set) => Math.max(...set.map((m) => m[k]));
  const r1 = (v) => Math.round(v * 10) / 10;
  return {
    fingerprint: fp,
    peak: mx('peak', def),
    rms: r1(def.reduce((a, m) => a + m.rms, 0) / def.length),
    worstPeak: mx('peak', renders),
    worstRms: mx('rms', renders),
    lowestPeak: Math.min(...renders.map((m) => m.peak)),
    pre: mx('pre', renders),
    end: mx('end', def),
  };
}

/**
 * Merge new entries into catalog/levels.json: a run over some sounds keeps the others' entries, and
 * sounds no longer in the catalog drop out. Written only when something changed, and atomically.
 */
export function updateLevels(entries, ids, file = path.join(ROOT, LEVELS_FILE)) {
  let old = null;
  try { old = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { old = null; }
  const sounds = {};
  for (const id of [...ids].sort()) {
    const e = entries[id] || (old && old.sounds && old.sounds[id]);
    if (e) sounds[id] = e;
  }
  const doc = {
    schema: 1,
    about: 'Written by gates/check_levels.mjs, read by build.mjs (manifest levels) and the MCP server. dBFS after the master chain on a warm chain; see the manifest levels.about for each field. A sound whose fingerprint no longer matches the catalog has changed since it was measured.',
    sounds,
  };
  const text = JSON.stringify(doc, null, 1) + '\n';
  let before = null;
  try { before = fs.readFileSync(file, 'utf8'); } catch (e) { before = null; }
  if (before === text) return false;
  writeAtomic(file, text);
  return true;
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog', 'manifest.json'), 'utf8'));
  const fps = Object.fromEntries(manifest.sounds.map((s) => [s.id, s.fingerprint]));
  const entries = {};
  const b = await launch();
  let failed = 0;
  try {
    await b.goto(distUrl());
    const sounds = await b.eval('Timbre.sounds.map((s) => ({ id: s.id, dur: s.dur, params: s.params }))');
    const rows = [];
    const report = [];
    for (const s of sounds.filter((x) => x.id.includes(only))) {
      const sets = [['defaults', null], ...randomParamSets(s, 3, 0x1e7e1).map((p, i) => ['random ' + (i + 1), p])];
      const res = await b.eval(`(async () => {
        const out = [];
        for (const [label, p] of ${JSON.stringify(sets)}) for (const sd of ${JSON.stringify(SEEDS)}) {
          const m = Timbre.measure(await Timbre.render(${JSON.stringify(s.id)}, p, sd));
          out.push(Object.assign({ label, params: p, seed: sd }, m));
        }
        return out;
      })()`);
      const bad = [];
      for (const m of res) for (const why of problems(m)) bad.push(`${m.label} seed ${m.seed}: ${why}` + (m.params ? ' ' + JSON.stringify(m.params) : ''));
      const def = res.filter((m) => m.label === 'defaults');
      const mx = (k, set = res) => Math.max(...set.map((m) => m[k]));
      const mn = (k, set = res) => Math.min(...set.map((m) => m[k]));
      const avg = (k, set) => Math.round((10 * set.reduce((a, m) => a + m[k], 0)) / set.length) / 10;
      rows.push([s.id, s.dur.toFixed(2), mx('peak', def).toFixed(1), avg('rms', def).toFixed(1),
        `${mn('peak').toFixed(1)}..${mx('peak').toFixed(1)}`, mx('pre').toFixed(1), mx('dc').toFixed(1),
        mx('tail').toFixed(1), mx('end').toFixed(2), bad.length ? 'FAIL' : 'ok']);
      report.push({ id: s.id, dur: s.dur, renders: res, problems: bad });
      if (fps[s.id]) entries[s.id] = levelEntry(res, fps[s.id]);
      if (bad.length) failed++;
      for (const x of bad.slice(0, 6)) console.error(`  ${s.id}: ${x}`);
      if (bad.length > 6) console.error(`  ${s.id}: ... ${bad.length - 6} more`);
    }
    console.log(table(rows, ['sound', 'dur s', 'peak', 'rms', 'peak all', 'pre', 'dc', 'tail', 'end s', '']));
    console.log(`\nlevels: ${rows.length - failed}/${rows.length} sounds within the house range ` +
      `(${SEEDS.length} seeds x (defaults + 3 random sets); peak in [${LIMITS.peakMin}, ${LIMITS.peakMax}], ` +
      `pre <= ${LIMITS.preMax}, dc <= ${LIMITS.dcMax}, tail <= ${LIMITS.tailMax} dBFS)`);
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, 'levels.json'), JSON.stringify(report, null, 1));
    const missing = sounds.filter((s) => !fps[s.id]).map((s) => s.id);
    if (missing.length) console.error(`  not in catalog/manifest.json (run node build.mjs): ${missing.join(', ')}`);
    const changed = updateLevels(entries, manifest.sounds.map((s) => s.id));
    console.log(`${LEVELS_FILE}: ${changed ? 'updated; run node build.mjs to embed it in the manifest' : 'unchanged'}`);
    if (b.errors.length) { console.error('page errors:\n  ' + b.errors.join('\n  ')); failed++; }
  } finally {
    await b.close();
  }
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.stack || e); process.exit(1); });
}
