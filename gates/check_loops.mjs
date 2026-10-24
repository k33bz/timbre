#!/usr/bin/env node
// Loop gate. Every bed marked loop: true is cut into a seamless loop in dist/timbre.html (the same
// loopBuffer the gallery and the soundscape Copy use), at its defaults and 2 more seeds, and the loop
// is measured where it wraps:
//   length  the loop is at least 6 s, so it does not repeat too obviously
//   seam    every 0.2 s window across the join (the wrap, then the crossfade where the loop's head
//           blends with the continuation of its tail) stays inside the bed's own range of levels
//           elsewhere (its 2nd to 98th percentile, widened by 3 dB): the join is never the
//           quietest or loudest moment, whatever the bed does on its own (a sparse bed of bird
//           calls varies a lot, a pad hardly at all; a crossfade of correlated audio would dip)
//   click   the jump from the last sample to the first is no larger than twice the bed's own
//           99.9th percentile sample-to-sample step: nothing to hear at the join
//   node gates/check_loops.mjs [id-filter]
// Exit 1 on any failure.
import { launch, distUrl, table } from './lib/browser.mjs';

const SEEDS = [1, 2, 3];
const only = process.argv[2] || '';
export const LOOP_LIMITS = { minLength: 6, seamDb: 0, click: 2 };

/** Measure one loop's wrap (in the page: plain arrays in, numbers out). */
const MEASURE = `(r) => {
  const sr = r.sr, chs = r.channels, n = chs[0].length;
  const db = (e) => 10 * Math.log10(Math.max(1e-12, e));
  const w = Math.round(0.1 * sr);
  const energy = (from, len) => { let e = 0; for (const ch of chs) for (let i = 0; i < len; i++) { const v = ch[(from + i + n) % n]; e += v * v; } return e / (len * chs.length); };
  // the join: from 0.1 s before the wrap to the end of the crossfade (r.xfade s into the loop)
  const joinEnd = Math.round((r.xfade + 0.1) * sr);
  const inJoin = (i) => i >= n - w || i < joinEnd;
  const rest = [];
  const join = [];
  for (let i = 0; i + 2 * w <= n; i += w / 2) (inJoin(i) ? join : rest).push(db(energy(i, 2 * w)));
  join.push(db(energy(n - w, 2 * w)));
  rest.sort((a, b) => a - b);
  const lo = rest[Math.floor(rest.length * 0.02)] - 3, hi = rest[Math.floor(rest.length * 0.98)] + 3;
  // how far the join goes outside the bed's own range, in dB (0 = inside)
  let seam = 0;
  for (const v of join) { if (v < lo && lo - v > Math.abs(seam)) seam = v - lo; if (v > hi && v - hi > Math.abs(seam)) seam = v - hi; }
  const steps = [];
  for (const ch of chs) for (let i = 1; i < n; i += 3) steps.push(Math.abs(ch[i] - ch[i - 1]));
  steps.sort((a, b) => a - b);
  const p999 = steps[Math.floor(steps.length * 0.999)] || 1e-9;
  let jump = 0;
  for (const ch of chs) jump = Math.max(jump, Math.abs(ch[0] - ch[n - 1]));
  return { length: n / sr, seam, click: jump / p999 };
}`;

const b = await launch({ width: 900, height: 700 });
let failed = 0;
const rows = [];
try {
  await b.goto(distUrl());
  await new Promise((r) => setTimeout(r, 1200));
  const ids = await b.eval(`Timbre.sounds.filter((s) => s.loop).map((s) => s.id)`);
  for (const id of ids.filter((x) => x.includes(only))) {
    const ms = [];
    for (const seed of SEEDS) {
      ms.push(await b.eval(`Timbre.loop(${JSON.stringify(id)}, null, ${seed}).then((r) => r ? (${MEASURE})(r) : null)`));
    }
    const bad = [];
    if (ms.some((m) => !m)) bad.push('no steady span to loop');
    const ok = ms.filter(Boolean);
    const len = Math.min(...ok.map((m) => m.length));
    const seam = ok.reduce((a, m) => (Math.abs(m.seam) > Math.abs(a) ? m.seam : a), 0);
    const click = Math.max(...ok.map((m) => m.click));
    if (ok.length && len < LOOP_LIMITS.minLength) bad.push(`loop ${len.toFixed(1)} s < ${LOOP_LIMITS.minLength} s`);
    if (Math.abs(seam) > LOOP_LIMITS.seamDb) bad.push(`seam ${seam.toFixed(1)} dB`);
    if (click > LOOP_LIMITS.click) bad.push(`click ${click.toFixed(2)}x`);
    if (bad.length) failed++;
    rows.push([id, len.toFixed(2), seam.toFixed(2), click.toFixed(2), bad.length ? 'FAIL ' + bad.join('; ') : 'ok']);
  }
} finally {
  await b.close();
}
console.log(table(rows, ['bed', 'loop s', 'seam out dB', 'click', '']));
console.log(`\nloops: ${rows.length - failed}/${rows.length} beds loop seamlessly (3 seeds; length >= ${LOOP_LIMITS.minLength} s, the join inside the bed's own level range, click <= ${LOOP_LIMITS.click}x the bed's own steps)`);
process.exit(failed ? 1 : 0);
