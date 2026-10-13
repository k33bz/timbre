// Resist: damage chipped off by armor. A bright metal tink for each point resisted, each a little
// lower, then a small step down in pitch as the number shrinks, and a single dry tick for the one
// point that gets through.
export default {
  id: 'duel-resist-plink',
  name: 'Resist Plink',
  category: 'duel',
  tags: ['ink-duel', 'resist', 'keyword', 'tink', 'plink', 'metal', 'armor', 'plate'],
  desc: 'A bright metal tink or two off armor, a small step down, then one dry tick: damage shaved down. For Resist.',
  dur: 0.34,
  family: 'metal',
  moments: ['ability'],
  params: {
    pitch: { min: 1500, max: 3600, def: 2400, unit: 'Hz', desc: 'Note of the armor plate: low a heavy plate, high a thin one' },
    chips: { min: 1, max: 3, def: 2, step: 1, desc: 'How many points the armor chips off, one tink each' },
    drop: { min: 0, max: 1, def: 0.5, desc: 'The downward blip after the tinks: 0 barely a step, 1 a deep slide' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.chips);
    const gap = 0.075;
    const metal = [[1, 1, 1], [2.76, 0.5, 0.5], [5.4, 0.22, 0.3]];
    // one tink per point resisted, each a little lower and softer
    for (let k = 0; k < n; k++) {
      const at = t + k * gap;
      T.bell(out, at, { f: p.pitch * Math.pow(0.88, k) * T.rand(0.99, 1.01), partials: metal, dur: 0.13, peak: 0.03 * (1 - 0.12 * k), a: 0.001 });
      T.noise(out, at, { filter: 'highpass', f: 5000, q: 0.8, dur: 0.006, peak: 0.03, a: 0.001 });
    }
    // the number shrinks: a short step down
    const down = t + n * gap + 0.01;
    T.osc(out, down, { f: 1150, to: 1150 * (1 - 0.55 * p.drop), dur: 0.06, peak: 0.035, a: 0.003 });
    // the single point that lands: a dry damage tick
    T.tick(out, down + 0.06, { f: 2300, q: 2, dur: 0.013, peak: 0.09, blip: 700, blipTo: 520, blipPeak: 0.03, blipDur: 0.03 });
  },
};
