// A colorless strike in two beats: the plain one of the family. The flight is an unadorned rush of
// air swelling in, and the impact is the same thud as the fighting strike made lighter and drier,
// with a short pop and no tail. Same flight-then-impact shape and knobs as every element strike.
export default {
  id: 'battle-strike-colorless',
  name: 'Colorless Strike',
  category: 'battle',
  tags: ['strike', 'colorless', 'plain', 'neutral', 'thump', 'attack', 'projectile', 'impact', 'dry', 'element'],
  desc: 'A plain strike: a clean rush of air swells in, then lands as a light, dry thump with a short pop and no tail. For a neutral attack.',
  dur: 1.01,
  family: 'impact',
  moments: ['crit'],
  params: {
    travel: { min: 0.2, max: 0.8, def: 0.5, unit: 's', desc: 'How long the rush lasts before the hit lands: short a snap, long a slow approach' },
    power: { min: 0, max: 1, def: 0.5, desc: 'How hard it lands: from a light, high thump up to a lower, longer one' },
    weak: { min: 0, max: 1, def: 0, step: 1, desc: '1 adds a bright double bell on the landing for a doubled hit, 0 leaves it off' },
  },
  play(T, out, t, p) {
    const D = p.travel;
    const pw = p.power;
    const L = t + D;
    const mix = T.gain(out, 0.71);  // one trim sets the whole strike to the house level
    const fly = (o) => Object.assign({ a: 0.7 * D, dur: D, tail: 0.3, fade: 0.03 }, o);
    T.noise(mix, t, fly({ filter: 'bandpass', f: 500, to: 2500, q: 1.1, peak: 0.23 }));
    // the impact
    T.osc(mix, L, { f: 236 - 80 * pw, to: 64, dur: 0.11 + 0.09 * pw, peak: 0.24, a: 0.003 });
    T.noise(mix, L, { filter: 'lowpass', f: 2300 - 700 * pw, to: 500, q: 0.9, dur: 0.08 + 0.03 * pw, peak: 0.12, a: 0.003 });
    T.noise(mix, L, { filter: 'highpass', f: 3000, to: 2200, q: 0.8, dur: 0.02, peak: 0.06, a: 0.001 });
    if (p.weak >= 0.5) {
      // the doubled accent: two struck-bell dings a beat apart, bright and clear of the low end
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1245, to: 1180, dur: 0.16, peak: 0.1, a: 0.004 });
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1868, to: 1790, dur: 0.13, peak: 0.06, a: 0.004 });
      T.osc(mix, L + 0.085, { type: 'triangle', f: 2490, to: 2360, dur: 0.11, peak: 0.045, a: 0.004 });
      T.noise(mix, L + 0.03, { filter: 'highpass', f: 5200, to: 3600, q: 0.8, dur: 0.05, peak: 0.05, a: 0.002 });
    }
  },
};
