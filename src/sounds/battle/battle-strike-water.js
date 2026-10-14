// A water strike in two beats. The flight is a wave rushing in: a hush that opens up with a band of
// foam above it and a few bubbles popping on the way. The impact is a splash: a swell of water, a
// thump of weight, a flick of spray and droplets pattering down. Same flight-then-impact shape and
// knobs as every element strike.
export default {
  id: 'battle-strike-water',
  name: 'Water Strike',
  category: 'battle',
  tags: ['strike', 'water', 'wave', 'splash', 'attack', 'projectile', 'impact', 'droplets', 'element'],
  desc: 'A water strike: a wave rushes in with bubbles popping, then splashes down with a thump, spray and falling droplets. For a water attack.',
  dur: 1.17,
  family: 'organic',
  moments: ['crit'],
  params: {
    travel: { min: 0.2, max: 0.8, def: 0.5, unit: 's', desc: 'How long the wave rushes before it lands: short a snap, long a slow approach' },
    power: { min: 0, max: 1, def: 0.5, desc: 'How hard it lands: from a light splash up to a deeper, longer burst' },
    weak: { min: 0, max: 1, def: 0, step: 1, desc: '1 adds a bright double bell on the landing for a doubled hit, 0 leaves it off' },
  },
  play(T, out, t, p) {
    const D = p.travel;
    const pw = p.power;
    const L = t + D;
    const mix = T.gain(out, 0.93);  // one trim sets the whole strike to the house level
    const fly = (o) => Object.assign({ a: 0.7 * D, dur: D, tail: 0.3, fade: 0.03 }, o);
    T.noise(mix, t, fly({ filter: 'lowpass', f: 300, to: 2200, q: 0.8, peak: 0.09 }));
    T.noise(mix, t, fly({ filter: 'bandpass', f: 400, to: 1800, q: 1.1, peak: 0.068 }));
    for (let k = 0; k < 3; k++) {
      T.osc(mix, t + D * (0.3 + 0.2 * k), { f: 500 + 90 * k, to: 1100 + 120 * k, dur: 0.06, peak: 0.03, a: 0.004 });
    }
    // the impact
    T.noise(mix, L, { filter: 'lowpass', f: 320, to: 2500, q: 0.8, dur: 0.19 + 0.1 * pw, peak: 0.2, a: 0.012 });
    T.noise(mix, L, { filter: 'highpass', f: 2000, to: 4000, q: 0.8, dur: 0.03, peak: 0.1, a: 0.001 });
    T.osc(mix, L, { f: 150 - 40 * pw, to: 60, dur: 0.14 + 0.06 * pw, peak: 0.12, a: 0.004 });
    T.noise(mix, L + 0.07, { filter: 'highpass', f: 3000, to: 5200, q: 0.7, dur: 0.07, peak: 0.1, a: 0.004 });
    T.osc(mix, L + 0.1, { f: 680 + 240 * pw, to: 1500, dur: 0.07, peak: 0.09, a: 0.004 });
    for (let k = 0; k < 4; k++) {
      const f = T.rand(800, 1600);
      T.osc(mix, L + 0.15 + k * 0.045 + T.rand(0, 0.02), { f, to: f * 1.7, dur: 0.05, peak: 0.035, a: 0.003 });
    }
    if (p.weak >= 0.5) {
      // the doubled accent: two struck-bell dings a beat apart, bright and clear of the low end
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1245, to: 1180, dur: 0.16, peak: 0.1, a: 0.004 });
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1868, to: 1790, dur: 0.13, peak: 0.06, a: 0.004 });
      T.osc(mix, L + 0.085, { type: 'triangle', f: 2490, to: 2360, dur: 0.11, peak: 0.045, a: 0.004 });
      T.noise(mix, L + 0.03, { filter: 'highpass', f: 5200, to: 3600, q: 0.8, dur: 0.05, peak: 0.05, a: 0.002 });
    }
  },
};
