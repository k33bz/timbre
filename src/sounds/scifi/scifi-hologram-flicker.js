// An unstable projection: a glassy FM tone chopped into uneven bursts, bitcrushed, with a puff of
// static in each gap. The last burst holds and fades, so the picture settles.
export default {
  id: 'scifi-hologram-flicker',
  name: 'Hologram Flicker',
  category: 'scifi',
  tags: ['hologram', 'flicker', 'glitch', 'projection', 'unstable', 'digital', 'static'],
  desc: 'A glassy digital tone that stutters and drops out as a projection flickers, with static in the gaps.',
  dur: 1.3,
  params: {
    pitch: { min: 400, max: 1600, def: 800, unit: 'Hz' },
    flickers: { min: 3, max: 9, def: 6, step: 1 },
    glitch: { min: 0, max: 1, def: 0.5 },
    length: { min: 0.5, max: 1.0, def: 0.8, unit: 's' },
  },
  play(T, out, t, p) {
    const cr = T.crush(out, t, { bits: 9 - 5 * p.glitch, ref: 0.1 });
    const n = Math.round(p.flickers);
    const slot = p.length / n;
    for (let k = 0; k < n; k++) {
      const start = t + k * slot;
      const last = k === n - 1;
      const on = last ? 0.3 : slot * T.rand(0.35, 0.8);
      // the pitch wanders further as the glitch amount rises
      const f = p.pitch * (1 + p.glitch * T.rand(-0.35, 0.35));
      T.fm(cr, start, { f, ratio: 2.76, index: 1.2, index1: 0.4, dur: on, peak: 0.08, a: 0.004, s: 0.8, d: 0.01, r: last ? 0.2 : 0.01 });
      if (!last) {
        T.noise(out, start + on, { filter: 'highpass', f: 3500, q: 0.8, dur: Math.max(0.015, slot - on), peak: 0.012 + 0.05 * p.glitch, a: 0.002 });
      }
    }
  },
};
