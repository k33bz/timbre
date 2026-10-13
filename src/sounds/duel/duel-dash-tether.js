// Rush and Reckless: a fast dash and a tether pulled tight. A noise riser with a rising tone under
// it, a snap and short thump where it arrives, then a plucked string with a small bent twang as the
// tether goes taut.
export default {
  id: 'duel-dash-tether',
  name: 'Dash Tether',
  category: 'duel',
  tags: ['ink-duel', 'rush', 'reckless', 'keyword', 'riser', 'snap', 'twang', 'string'],
  desc: 'A fast rising rush into a snap, then a tight string twang: a dash pulled up short by a tether. For Rush and Reckless.',
  dur: 0.46,
  family: 'synthetic',
  moments: ['ability'],
  params: {
    speed: { min: 0.07, max: 0.2, def: 0.12, unit: 's', desc: 'How long the dash builds before the snap: short sudden, long a run-up' },
    snap: { min: 0, max: 1, def: 0.6, desc: 'Strength of the snap and thump where it arrives: 0 soft, 1 sharp' },
    tension: { min: 180, max: 420, def: 262, unit: 'Hz', desc: 'Note of the tether string: low a slack cord, high a tight wire' },
  },
  play(T, out, t, p) {
    const R = p.speed;
    // the dash: a band of noise rushing upward with a thin rising tone under it
    T.noise(out, t, { filter: 'bandpass', f: 500, to: 5200, q: 1.5, dur: R, peak: 0.105, a: R * 0.85 });
    T.osc(out, t, { type: 'sawtooth', f: 260, to: 1100, dur: R, peak: 0.016, a: R * 0.85, lp: 1800 });
    // the snap where the dash ends
    const s = t + R;
    T.noise(out, s, { filter: 'highpass', f: 2600, q: 0.8, dur: 0.02, peak: 0.026 + 0.05 * p.snap, a: 0.001 });
    T.osc(out, s, { f: 200, to: 85, dur: 0.07, peak: 0.013 + 0.026 * p.snap, a: 0.002 });
    // the tether goes taut: a plucked string and a small bent twang
    T.pluck(out, s, { f: p.tension, dur: 0.24, bright: 0.75, tone: 0.85, peak: 0.04 });
    T.osc(out, s, { type: 'triangle', f: p.tension * 1.08, to: p.tension, dur: 0.12, peak: 0.012, a: 0.003, vib: { rate: 9, depth: 25 } });
  },
};
