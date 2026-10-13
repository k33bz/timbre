#!/usr/bin/env node
// Copy gate. For every sound, at its defaults (seed 1) and at one random parameter set (seed 5):
//   1. take the gallery's Copy text and its own offline render (Timbre.copy, Timbre.render)
//   2. paste the Copy text into a blank page (about:blank, no Timbre) as a script
//   3. call the pasted function on an OfflineAudioContext and render it the same way
//   4. compare peak and RMS: they must agree within 0.5 dB
// The Copy carries its parameter values and seed, so the pasted function is called with no options.
//   node gates/check_copy.mjs [id-filter]
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, distUrl, table } from './lib/browser.mjs';
import { randomParamSets } from '../build.mjs';
import { camel } from '../src/core/copy.js';

const TOL = 0.5;
const only = process.argv[2] || '';

async function main() {
  const b = await launch();
  const rows = [];
  let failed = 0;
  try {
    await b.goto(distUrl());
    const sounds = (await b.eval('Timbre.sounds.map((s) => ({ id: s.id, dur: s.dur, params: s.params }))')).filter((s) => s.id.includes(only));
    const { measureSrc, preroll, sr } = await b.eval('({ measureSrc: Timbre.measure.toString(), preroll: Timbre.preroll, sr: Timbre.sampleRate })');
    const cases = [];
    for (const s of sounds) {
      cases.push({ s, label: 'defaults', params: null, seed: 1 });
      cases.push({ s, label: 'random', params: randomParamSets(s, 1, 0xc0b1)[0], seed: 5 });
    }
    for (const c of cases) {
      const g = await b.eval(`(async () => {
        const id = ${JSON.stringify(c.s.id)}, p = ${JSON.stringify(c.params)}, sd = ${c.seed};
        return { copy: Timbre.copy(id, p, sd), m: Timbre.measure(await Timbre.render(id, p, sd)) };
      })()`);
      Object.assign(c, { copy: g.copy, gallery: g.m });
    }
    await b.goto('about:blank');
    const clean = await b.eval(`typeof Timbre === 'undefined' && document.scripts.length === 0`);
    if (!clean) throw new Error('about:blank is not blank');
    for (const c of cases) {
      const fname = camel(c.s.id);
      const r = await b.eval(`(async () => {
        const el = document.createElement('script');
        el.textContent = ${JSON.stringify(c.copy)};
        document.head.appendChild(el);
        el.remove();
        const fn = window[${JSON.stringify(fname)}];
        if (typeof fn !== 'function') return { error: 'the pasted code did not define ${fname}()' };
        const sr = ${sr}, dur = ${c.s.dur}, skip = Math.round(${preroll} * sr);
        const ctx = new OfflineAudioContext(2, skip + Math.ceil((dur + 0.25) * sr), sr);
        const end = fn(ctx, undefined, 0);
        const buf = await ctx.startRendering();
        const measure = (${measureSrc});
        const m = measure({ sr, dur, post: [buf.getChannelData(0).subarray(skip), buf.getChannelData(1).subarray(skip)], pre: null });
        m.endTime = end;
        return m;
      })()`);
      if (r.error) { rows.push([c.s.id, c.label, '-', '-', '-', '-', '-', 'FAIL ' + r.error]); failed++; continue; }
      const dp = Math.abs(r.peak - c.gallery.peak);
      const dr = Math.abs(r.rms - c.gallery.rms);
      const endOk = Math.abs(r.endTime - (preroll + c.s.dur)) < 1e-6;
      const pass = dp <= TOL && dr <= TOL && !r.silent && endOk;
      if (!pass) failed++;
      rows.push([c.s.id, c.label, c.gallery.peak.toFixed(1), r.peak.toFixed(1), c.gallery.rms.toFixed(1), r.rms.toFixed(1),
        `${dp.toFixed(2)}/${dr.toFixed(2)}`, (pass ? 'ok' : 'FAIL') + (endOk ? '' : ' (end time ' + r.endTime + ')') + ' ' + (c.copy.length / 1024).toFixed(1) + ' KB']);
    }
    if (b.errors.length) { console.error('page errors:\n  ' + b.errors.join('\n  ')); failed++; }
  } finally {
    await b.close();
  }
  console.log(table(rows, ['sound', 'case', 'gal pk', 'copy pk', 'gal rms', 'copy rms', 'd pk/rms', '']));
  console.log(`\ncopy: ${rows.length - failed}/${rows.length} pasted functions match the gallery within ${TOL} dB`);
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.stack || e); process.exit(1); });
}
