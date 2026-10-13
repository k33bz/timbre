// Chips stacked one on another: the same clay click as the single chip, repeated with uneven
// spacing and a little pitch and level drift, climbing slightly as the stack grows (chip on chip
// rings higher than chip on felt). The last chip settles with a faint second click.
export default {
  id: 'cards-chip-stack',
  name: 'Chip Stack',
  category: 'cards',
  tags: ['chip', 'poker', 'stack', 'pile', 'bet', 'casino', 'count'],
  desc: 'Poker chips stacked one by one: uneven clay clicks climbing a little as the stack grows.',
  dur: 0.8,
  params: {
    chips: { min: 2, max: 8, def: 5, step: 1 },
    pace: { min: 0.04, max: 0.1, def: 0.065, unit: 's' },
    pitch: { min: 1500, max: 3200, def: 2300, unit: 'Hz' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.chips);
    let at = t;
    for (let k = 0; k < n; k++) {
      const f = p.pitch * (1 + 0.025 * k) * T.rand(0.92, 1.08);
      const l = T.rand(0.8, 1.15) * (k === 0 ? 1.2 : 0.9);
      T.noise(out, at, { filter: 'bandpass', f, to: f * 0.93, q: 9, dur: 0.04, peak: 0.2 * l, a: 0.001 });
      T.noise(out, at, { filter: 'bandpass', f: f * 1.62, to: f * 1.5, q: 9, dur: 0.03, peak: 0.115 * l, a: 0.001 });
      T.noise(out, at, { filter: 'highpass', f: 3800, to: 2600, q: 0.8, dur: 0.012, peak: 0.02 * l, a: 0.001 });
      T.osc(out, at, { f: 700, to: 380, dur: 0.03, peak: 0.013 * l, a: 0.002 });
      if (k === n - 1) {
        // the top chip rocks once as it settles
        T.noise(out, at + 0.028, { filter: 'bandpass', f: f * 1.1, to: f, q: 9, dur: 0.025, peak: 0.09, a: 0.001 });
      }
      at += p.pace * T.rand(0.75, 1.3);
    }
  },
};
