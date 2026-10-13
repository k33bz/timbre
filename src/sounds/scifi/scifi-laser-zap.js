// The classic "pew": a square and a sine falling together, a metallic FM layer an octave under,
// and a hard noise tick at the start, through a lowpass that takes the fizz off the top.
export default {
  id: 'scifi-laser-zap',
  name: 'Laser Zap',
  category: 'scifi',
  tags: ['laser', 'zap', 'pew', 'shoot', 'ray', 'shot', 'retro'],
  desc: 'A bright falling pew for a laser shot. Fire it once, or in a quick burst of up to four.',
  dur: 0.8,
  params: {
    pitch: { min: 1200, max: 4000, def: 2400, unit: 'Hz' },
    drop: { min: 0.5, max: 0.95, def: 0.85 },
    shots: { min: 1, max: 4, def: 1, step: 1 },
    rate: { min: 0.06, max: 0.2, def: 0.1, unit: 's' },
    edge: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    const lp = T.filter(out, t, { type: 'lowpass', f: 7000, q: 0.7 });
    const n = Math.round(p.shots);
    for (let k = 0; k < n; k++) {
      const at = t + k * p.rate;
      // each shot in a burst is a touch lower than the last
      const f = p.pitch * (1 - 0.04 * k);
      const to = f * (1 - p.drop);
      T.osc(lp, at, { type: 'square', f, to, dur: 0.17, peak: 0.012 + 0.045 * p.edge, a: 0.002, glide: 0.15 });
      T.osc(lp, at, { f, to, dur: 0.17, peak: 0.06, a: 0.002, glide: 0.15 });
      T.fm(lp, at, { f: f * 0.5, to: to * 0.5, ratio: 3.5, index: 2.5, index1: 0.3, dur: 0.12, peak: 0.02, a: 0.002 });
      T.noise(out, at, { filter: 'highpass', f: 6000, q: 0.8, dur: 0.015, peak: 0.04, a: 0.001 });
    }
  },
};
