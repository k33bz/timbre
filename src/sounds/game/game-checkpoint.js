// A banner planted: a soft low thump, then a root, fifth and octave struck in turn as warm,
// near-harmonic bells that ring on together. Spread sets how fast the three arrive.
export default {
  id: 'game-checkpoint',
  name: 'Checkpoint',
  category: 'game',
  tags: ['checkpoint', 'save', 'flag', 'respawn', 'progress', 'reached', 'banner', 'chime'],
  desc: 'A soft thump and three bells fanning up that ring together: progress saved. Warmer than a success chime.',
  dur: 1.17,
  params: {
    pitch: { min: 262, max: 784, def: 392, unit: 'Hz' },
    spread: { min: 0.04, max: 0.14, def: 0.08, unit: 's' },
    ring: { min: 0.35, max: 0.85, def: 0.65, unit: 's' },
  },
  play(T, out, t, p) {
    const steps = [0, 7, 12];
    // the bell partials sit near whole multiples, so it sounds like a held chord, not struck metal
    const warm = [[1, 1, 1], [2, 0.3, 0.5], [3, 0.15, 0.3], [4.07, 0.1, 0.2]];
    T.osc(out, t, { f: 110, to: 70, dur: 0.15, peak: 0.06, a: 0.004 });
    for (let k = 0; k < 3; k++) {
      T.bell(out, t + 0.03 + k * p.spread, {
        f: p.pitch * Math.pow(2, steps[k] / 12), partials: warm, dur: p.ring, peak: 0.055, a: 0.003,
      });
    }
    T.noise(out, t + 0.03 + 2 * p.spread, {
      filter: 'highpass', f: 6000, to: 9000, q: 0.8, dur: 0.15, peak: 0.02, a: 0.03,
    });
  },
};
