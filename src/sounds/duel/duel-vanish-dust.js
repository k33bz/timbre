// Vanish: a card dissolving the moment it is chosen. A tiny lock-on tick, then a band of airy noise
// that drifts down and thins out, a few high glints falling in pitch, and fine specks of dust.
export default {
  id: 'duel-vanish-dust',
  name: 'Vanish Dust',
  category: 'duel',
  tags: ['ink-duel', 'vanish', 'keyword', 'dust', 'dissolve', 'fade', 'glitter', 'air'],
  desc: 'A tiny lock-on tick, then a card dissolving into falling, glittering dust. For Vanish.',
  dur: 0.59,
  family: 'air',
  moments: ['ability'],
  params: {
    pitch: { min: 2500, max: 7000, def: 4500, unit: 'Hz', desc: 'Where the glittering dust starts: low a soft sigh, high a thin sparkle' },
    length: { min: 0.2, max: 0.5, def: 0.32, unit: 's', desc: 'How long the dissolve takes to thin out' },
    grit: { min: 0, max: 1, def: 0.5, desc: 'Fine specks of dust in the fade: 0 smooth, 1 busy' },
  },
  play(T, out, t, p) {
    const L = p.length;
    // the lock-on
    T.tick(out, t, { f: 4200, q: 3, dur: 0.008, peak: 0.04, blip: 2900, blipPeak: 0.02, blipDur: 0.03 });
    const d = t + 0.07;
    // the dissolve: airy noise drifting down and thinning
    T.noise(out, d, { filter: 'bandpass', f: p.pitch * 1.4, to: p.pitch * 0.5, q: 1.2, dur: L, peak: 0.085, a: 0.015, tail: 0.08, fade: 0.03 });
    // glints falling in pitch
    const g = 6;
    for (let k = 0; k < g; k++) {
      const u = k / g;
      const f = p.pitch * Math.pow(0.45, u) * T.rand(0.97, 1.03);
      T.osc(out, d + u * L * 0.85 + T.rand(0, 0.02), { f, to: f * 0.9, dur: 0.07, peak: 0.016 * (1 - 0.6 * u), a: 0.002 });
    }
    // dust specks
    if (p.grit > 0.02) {
      T.crackle(out, d, { dur: L, rate: 40 + 120 * p.grit, f: p.pitch * 1.3, to: p.pitch * 0.5, spread: 0.6, q: 2, len: 0.003, peak: 0.05 * p.grit, vary: 0.6 });
    }
  },
};
