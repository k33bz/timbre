#!/usr/bin/env node
// Copy gate. For every sound, at its defaults (seed 1) and at one random parameter set (seed 5):
//   1. take the gallery's Copy text and its own offline render (Timbre.copy, Timbre.render)
//   2. paste the Copy text into a blank page (about:blank, no Timbre) as a script
//   3. call the pasted function on an OfflineAudioContext and render it the same way
//   4. compare peak and RMS: they must agree within 0.5 dB, over both channels and in each channel
//      on its own, so a sound that places voices in stereo (T.pan) must keep its left and right
//      levels in the Copy (a Copy that lost or mirrored the panning would fail here)
// The Copy carries its parameter values and seed, so the pasted function is called with no options.
// Then the same for five lines from the Speak rack (speech and babble): the Copy with the line baked
// in against the gallery's render of the line, and its end time against the line's length.
//   node gates/check_copy.mjs [id-filter]     (the filter "speak-line" runs only the lines)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, distUrl, table } from './lib/browser.mjs';
import { randomParamSets } from '../build.mjs';
import { camel } from '../src/core/copy.js';

const TOL = 0.5;
const only = process.argv[2] || '';
// lines for the Speak rack's Copy (filter "speak-line" runs only these)
const LINES = [
  { mode: 'speak', text: 'Access granted. Welcome back, commander.', voice: 'announcer', seed: 1 },
  { mode: 'speak', text: 'Is the system online?', voice: 'retro', pitch: 3, rate: 1.2, range: 1.5, seed: 1 },
  { mode: 'speak', text: 'Behind you...', voice: 'whisper', seed: 7 },
  { mode: 'babble', text: 'Oh, hi there! Are you new in town?', voice: 'cute', seed: 1 },
  { mode: 'babble', text: 'Hmph. What do you want?', voice: 'gruff', speed: 0.8, spread: 1.5, seed: 5 },
];

async function main() {
  const b = await launch();
  const rows = [];
  const stereo = new Set();   // sounds whose gallery render differs between left and right
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
        const r = await Timbre.render(id, p, sd);
        const one = (k) => Timbre.measure({ sr: r.sr, dur: r.dur, post: [r.post[k], r.post[k]], pre: null });
        let side = 0;
        for (let i = 0; i < r.post[0].length; i++) side = Math.max(side, Math.abs(r.post[0][i] - r.post[1][i]));
        return { copy: Timbre.copy(id, p, sd), m: Timbre.measure(r), L: one(0), R: one(1), stereo: side > 1e-4 };
      })()`);
      Object.assign(c, { copy: g.copy, gallery: g.m, galleryLR: [g.L, g.R], stereo: g.stereo });
    }
    // lines from the Speak rack: its Copy (the line baked in) against the gallery's render of it
    const lineCases = only && !'speak-line'.includes(only) ? [] : LINES.map((cfg) => ({ cfg }));
    for (const c of lineCases) {
      const g = await b.eval(`(async () => {
        const cfg = ${JSON.stringify(c.cfg)};
        const s = Timbre.speak.sound(cfg);
        return { copy: Timbre.speak.copy(cfg), dur: s.dur, m: Timbre.measure(await Timbre.speak.render(cfg, cfg.seed)) };
      })()`);
      Object.assign(c, { copy: g.copy, dur: g.dur, gallery: g.m });
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
        const L = buf.getChannelData(0).subarray(skip), R = buf.getChannelData(1).subarray(skip);
        const m = measure({ sr, dur, post: [L, R], pre: null });
        m.L = measure({ sr, dur, post: [L, L], pre: null });
        m.R = measure({ sr, dur, post: [R, R], pre: null });
        m.endTime = end;
        return m;
      })()`);
      if (r.error) { rows.push([c.s.id, c.label, '-', '-', '-', '-', '-', '-', 'FAIL ' + r.error]); failed++; continue; }
      const dp = Math.abs(r.peak - c.gallery.peak);
      const dr = Math.abs(r.rms - c.gallery.rms);
      // each channel on its own: the worst peak or RMS difference of the two
      const dch = Math.max(...[r.L, r.R].map((x, k) => Math.max(Math.abs(x.peak - c.galleryLR[k].peak), Math.abs(x.rms - c.galleryLR[k].rms))));
      const endOk = Math.abs(r.endTime - (preroll + c.s.dur)) < 1e-6;
      const pass = dp <= TOL && dr <= TOL && dch <= TOL && !r.silent && endOk;
      if (!pass) failed++;
      if (c.stereo) stereo.add(c.s.id);
      rows.push([c.s.id, c.label, c.gallery.peak.toFixed(1), r.peak.toFixed(1), c.gallery.rms.toFixed(1), r.rms.toFixed(1),
        `${dp.toFixed(2)}/${dr.toFixed(2)}`, c.stereo ? dch.toFixed(2) : '-',
        (pass ? 'ok' : 'FAIL') + (endOk ? '' : ' (end time ' + r.endTime + ')') + ' ' + (c.copy.length / 1024).toFixed(1) + ' KB']);
    }
    for (const c of lineCases) {
      const r = await b.eval(`(async () => {
        const el = document.createElement('script');
        el.textContent = ${JSON.stringify(c.copy)};
        document.head.appendChild(el);
        el.remove();
        const fname = ${JSON.stringify(c.copy)}.match(/^function (\\w+)/m)[1];
        const fn = window[fname];
        if (typeof fn !== 'function') return { error: 'the pasted code did not define ' + fname + '()' };
        const sr = ${sr}, dur = ${c.dur}, skip = Math.round(${preroll} * sr);
        const ctx = new OfflineAudioContext(2, skip + Math.ceil((dur + 0.25) * sr), sr);
        const end = fn(ctx, undefined, 0);
        const buf = await ctx.startRendering();
        const measure = (${measureSrc});
        const m = measure({ sr, dur, post: [buf.getChannelData(0).subarray(skip), buf.getChannelData(1).subarray(skip)], pre: null });
        m.endTime = end;
        m.fname = fname;
        return m;
      })()`);
      const label = `${c.cfg.mode} ${c.cfg.voice}`;
      if (r.error) { rows.push(['speak-line', label, '-', '-', '-', '-', '-', '-', 'FAIL ' + r.error]); failed++; continue; }
      const dp = Math.abs(r.peak - c.gallery.peak);
      const dr = Math.abs(r.rms - c.gallery.rms);
      // the line's end: the gallery's dur is the engine's length rounded up, plus 20 ms
      const endOk = r.endTime > preroll && r.endTime <= preroll + c.dur - 0.018 && r.endTime > preroll + c.dur - 0.0225;
      const pass = dp <= TOL && dr <= TOL && !r.silent && endOk;
      if (!pass) failed++;
      rows.push(['speak-line', label, c.gallery.peak.toFixed(1), r.peak.toFixed(1), c.gallery.rms.toFixed(1), r.rms.toFixed(1),
        `${dp.toFixed(2)}/${dr.toFixed(2)}`, '-', (pass ? 'ok' : 'FAIL') + (endOk ? '' : ' (end time ' + r.endTime + ')') + ' ' + r.fname + ' ' + (c.copy.length / 1024).toFixed(1) + ' KB']);
    }
    if (b.errors.length) { console.error('page errors:\n  ' + b.errors.join('\n  ')); failed++; }
  } finally {
    await b.close();
  }
  console.log(table(rows, ['sound', 'case', 'gal pk', 'copy pk', 'gal rms', 'copy rms', 'd pk/rms', 'd L/R', '']));
  console.log(`\ncopy: ${rows.length - failed}/${rows.length} pasted functions match the gallery within ${TOL} dB`);
  console.log(`stereo: ${stereo.size} sounds render a different left and right, each channel held to ${TOL} dB: ${[...stereo].join(', ') || 'none'}`);
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.stack || e); process.exit(1); });
}
