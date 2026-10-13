// Ported from the Deck Lab hammer: the swing's air rising, then a struck-metal clank, a bright
// crack, a falling ring and a low body thump at the moment of contact.
export default {
  id: 'game-hammer-hit',
  name: 'Hammer Hit',
  category: 'game',
  tags: ['hammer', 'hit', 'impact', 'metal', 'clank', 'anvil', 'smash'],
  desc: 'A hammer swung and landing on metal: air, then a clank with a thump under it.',
  dur: 0.95,
  params: {
    swing: { min: 0, max: 0.5, def: 0.32, unit: 's' },
    pitch: { min: 250, max: 1200, def: 560, unit: 'Hz' },
    weight: { min: 0, max: 1, def: 0.5 },
    ring: { min: 0.06, max: 0.4, def: 0.12, unit: 's' },
  },
  play(T, out, t, p) {
    const h = t + p.swing;
    const r = p.pitch / 560;
    if (p.swing > 0.05) {
      T.noise(out, t, { filter: 'bandpass', f: 350, to: 1700, q: 1.2, dur: p.swing + 0.02, peak: 0.055, a: p.swing * 0.85 });
    }
    T.bell(out, h, { f: p.pitch, partials: [[1, 1, 1], [2.76, 0.5, 0.67]], drift: 0.98, dur: p.ring, peak: 0.065 });
    T.noise(out, h, { filter: 'highpass', f: 4200, to: 3000, q: 0.8, dur: 0.02, peak: 0.04, a: 0.001 });
    T.noise(out, h, { filter: 'highpass', f: 3200, to: 2000, q: 0.8, dur: 0.05, peak: 0.037, a: 0.002 });
    T.osc(out, h, { type: 'triangle', f: 1800 * r, to: 700 * r, dur: 0.09, peak: 0.021, a: 0.002 });
    T.osc(out, h, { f: 140, to: 60, dur: 0.16, peak: 0.14 * p.weight + 0.01, a: 0.002 });
  },
};
