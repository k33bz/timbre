// A fist landing: a mid thump, a bandpassed fleshy smack and a slap of highs. Hits makes a flurry,
// each a little softer than the last, with T.rand keeping the smacks from matching.
export default {
  id: 'game-punch',
  name: 'Punch',
  category: 'game',
  tags: ['punch', 'fist', 'hit', 'smack', 'brawler', 'fight', 'combat', 'impact'],
  desc: 'A fist landing with a thump and a smack. Up to three in a flurry, each slightly softer.',
  dur: 0.46,
  params: {
    pitch: { min: 80, max: 220, def: 140, unit: 'Hz' },
    snap: { min: 0, max: 1, def: 0.5 },
    hits: { min: 1, max: 3, def: 1, step: 1 },
    gap: { min: 0.05, max: 0.12, def: 0.08, unit: 's' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.hits);
    for (let k = 0; k < n; k++) {
      const at = t + k * p.gap;
      const l = (1 - 0.12 * k) * T.rand(0.9, 1.1);
      T.osc(out, at, { f: p.pitch * 1.8, to: p.pitch * 0.6, dur: 0.13, peak: 0.065 * l, a: 0.002 });
      T.noise(out, at, {
        filter: 'bandpass', f: (700 + 800 * p.snap) * T.rand(0.9, 1.15), q: 0.8,
        dur: 0.06, peak: 0.16 * l, a: 0.002,
      });
      T.noise(out, at, {
        filter: 'highpass', f: 2500, q: 0.8, dur: 0.02, peak: (0.024 + 0.056 * p.snap) * l, a: 0.001,
      });
    }
  },
};
