// Whole-tone steps downward (the error buzz steps by the same 0.89 ratio) on a triangle with a
// sine an octave under it, while a lowpass slowly closes. The last note sags in pitch like a
// battery giving out. Slow and soft: it should be noticed, never startle.
export default {
  id: 'notify-low-battery',
  name: 'Low Battery',
  category: 'notify',
  tags: ['battery', 'low', 'power', 'drain', 'warning', 'falling', 'charge'],
  desc: 'Three slow falling notes under a closing filter, the last one sagging. Power is running out.',
  dur: 1.4,
  params: {
    pitch: { min: 250, max: 700, def: 440, unit: 'Hz' },
    steps: { min: 2, max: 4, def: 3, step: 1 },
    gap: { min: 0.15, max: 0.3, def: 0.2, unit: 's' },
    tone: { min: 800, max: 3000, def: 1800, unit: 'Hz' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.steps);
    const lp = T.filter(out, t, { type: 'lowpass', f: p.tone, to: p.tone * 0.4, dur: (n - 1) * p.gap + 0.4, q: 0.8 });
    for (let k = 0; k < n; k++) {
      const f = p.pitch * Math.pow(0.89, k);
      const last = k === n - 1;
      const at = t + k * p.gap;
      T.osc(lp, at, { type: 'triangle', f, to: last ? f * 0.8 : f, dur: last ? 0.4 : 0.17, peak: 0.076, a: 0.012 });
      T.osc(lp, at, { f: f / 2, to: last ? f * 0.4 : f / 2, dur: last ? 0.4 : 0.17, peak: 0.036, a: 0.012 });
    }
  },
};
