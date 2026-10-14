// A metal strike in two beats. The flight is a bright rush of air with two thin tones singing on it,
// like a blade cutting through. The impact is a clang: steel partials at the inharmonic ratios 1,
// 2.76, 5.4 and 8.93, a hard tick of high noise and a small clunk of weight. Same flight-then-impact
// shape and knobs as every element strike.
export default {
  id: 'battle-strike-metal',
  name: 'Metal Strike',
  category: 'battle',
  tags: ['strike', 'metal', 'steel', 'clang', 'blade', 'ring', 'attack', 'projectile', 'impact', 'element'],
  desc: 'A metal strike: a bright rush with a thin singing tone, then lands as a steel clang with a hard tick and a short ring. For a steel attack.',
  dur: 1.21,
  family: 'metal',
  moments: ['attack', 'hit'],
  params: {
    travel: { min: 0.2, max: 0.8, def: 0.5, unit: 's', desc: 'How long the blade sings before it lands: short a snap, long a slow approach' },
    power: { min: 0, max: 1, def: 0.5, desc: 'How hard it lands: from a light, high tink up to a lower, heavier clang' },
    weak: { min: 0, max: 1, def: 0, step: 1, desc: '1 adds a bright double bell on the landing for a doubled hit, 0 leaves it off' },
  },
  play(T, out, t, p) {
    const D = p.travel;
    const pw = p.power;
    const L = t + D;
    const mix = T.gain(out, 0.66);  // one trim sets the whole strike to the house level
    const fly = (o) => Object.assign({ a: 0.7 * D, dur: D, tail: 0.3, fade: 0.03 }, o);
    T.noise(mix, t, fly({ filter: 'bandpass', f: 1500, to: 3800, q: 1.1, peak: 0.056 }));
    T.osc(mix, t, fly({ f: 880, to: 900, peak: 0.032 }));
    T.osc(mix, t, fly({ f: 2430, to: 2480, peak: 0.018 }));
    // the impact: a steel bell struck, with its high partials dying first
    const steel = [[1, 1, 1], [2.76, 0.6, 0.7], [5.4, 0.35, 0.5], [8.93, 0.2, 0.3]];
    T.bell(mix, L, { f: 430 - 140 * pw, partials: steel, drift: 0.98, dur: 0.3 + 0.1 * pw, peak: 0.09, a: 0.001 });
    T.noise(mix, L, { filter: 'highpass', f: 4200, to: 3000, q: 0.8, dur: 0.045, peak: 0.1, a: 0.001 });
    T.osc(mix, L, { f: 150, to: 80, dur: 0.08, peak: 0.1, a: 0.002 });
    if (p.weak >= 0.5) {
      // the doubled accent: two struck-bell dings a beat apart, bright and clear of the low end
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1245, to: 1180, dur: 0.16, peak: 0.1, a: 0.004 });
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1868, to: 1790, dur: 0.13, peak: 0.06, a: 0.004 });
      T.osc(mix, L + 0.085, { type: 'triangle', f: 2490, to: 2360, dur: 0.11, peak: 0.045, a: 0.004 });
      T.noise(mix, L + 0.03, { filter: 'highpass', f: 5200, to: 3600, q: 0.8, dur: 0.05, peak: 0.05, a: 0.002 });
    }
  },
};
