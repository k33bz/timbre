// A grass strike in two beats. The flight is a resonant rustle of leaves rushing past, two narrow
// bands of noise with a thin blade whistle. The impact is the rustle breaking on a soft thwack, a
// quick lash and a scatter of leaf crackles. A narrow band throws most of the noise away, so the
// rustle voices carry big peaks to land at the same loudness as the other strikes.
export default {
  id: 'battle-strike-grass',
  name: 'Grass Strike',
  category: 'battle',
  tags: ['strike', 'grass', 'leaf', 'leaves', 'nature', 'rustle', 'attack', 'projectile', 'impact', 'element'],
  desc: 'A grass strike: leaves rush in with a resonant rustle and a thin whistle, then land as a thwack and a scatter of leaves. For a plant attack.',
  dur: 1.19,
  family: 'organic',
  moments: ['crit'],
  params: {
    travel: { min: 0.2, max: 0.8, def: 0.5, unit: 's', desc: 'How long the leaves rush before they land: short a snap, long a slow approach' },
    power: { min: 0, max: 1, def: 0.5, desc: 'How hard it lands: from a light brush up to a heavier thwack and longer scatter' },
    weak: { min: 0, max: 1, def: 0, step: 1, desc: '1 adds a bright double bell on the landing for a doubled hit, 0 leaves it off' },
  },
  play(T, out, t, p) {
    const D = p.travel;
    const pw = p.power;
    const L = t + D;
    const mix = T.gain(out, 0.68);  // one trim sets the whole strike to the house level
    const fly = (o) => Object.assign({ a: 0.7 * D, dur: D, tail: 0.3, fade: 0.03 }, o);
    T.noise(mix, t, fly({ filter: 'bandpass', f: 1000, to: 1800, q: 3.6, peak: 0.26 }));
    T.noise(mix, t, fly({ filter: 'bandpass', f: 1700, to: 2600, q: 3, peak: 0.11 }));
    T.osc(mix, t, fly({ f: 1200, to: 2200, peak: 0.02 }));
    // the impact
    T.noise(mix, L, { filter: 'bandpass', f: 1500, to: 820, q: 3.6, dur: 0.19 + 0.08 * pw, peak: 0.52, a: 0.004 });
    T.osc(mix, L, { f: 300 - 90 * pw, to: 150, dur: 0.11 + 0.04 * pw, peak: 0.22, a: 0.003 });
    T.noise(mix, L, { filter: 'highpass', f: 3500, to: 2500, q: 0.8, dur: 0.02, peak: 0.06, a: 0.001 });
    const span = 0.25 + 0.1 * pw;
    const leaves = T.bus(mix, L + 0.03, { a: 0.01, dur: span, tail: 0.05, fade: 0.02 });
    T.crackle(leaves, L + 0.03, { dur: span, rate: 60, f: 2800, to: 1600, q: 2.5, spread: 0.7, len: 0.01, peak: 0.17 });
    if (p.weak >= 0.5) {
      // the doubled accent: two struck-bell dings a beat apart, bright and clear of the low end
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1245, to: 1180, dur: 0.16, peak: 0.1, a: 0.004 });
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1868, to: 1790, dur: 0.13, peak: 0.06, a: 0.004 });
      T.osc(mix, L + 0.085, { type: 'triangle', f: 2490, to: 2360, dur: 0.11, peak: 0.045, a: 0.004 });
      T.noise(mix, L + 0.03, { filter: 'highpass', f: 5200, to: 3600, q: 0.8, dur: 0.05, peak: 0.05, a: 0.002 });
    }
  },
};
