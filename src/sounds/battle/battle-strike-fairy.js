// A fairy strike in two beats. The flight is a bright rush of air with two triangle tones a few
// cents apart climbing together and a pair of glints along the way. The impact is the same detuned
// pair falling softly, a puff of high air and three glints that twinkle upward. Same
// flight-then-impact shape and knobs as every element strike.
export default {
  id: 'battle-strike-fairy',
  name: 'Fairy Strike',
  category: 'battle',
  tags: ['strike', 'fairy', 'twinkle', 'glint', 'shimmer', 'attack', 'projectile', 'impact', 'element'],
  desc: 'A fairy strike: a bright rush climbs with a shimmering pair of tones and glints, then lands as a soft chime and a twinkle. For a fairy attack.',
  dur: 1.09,
  family: 'glass',
  moments: ['crit'],
  params: {
    travel: { min: 0.2, max: 0.8, def: 0.5, unit: 's', desc: 'How long the shimmer climbs before it lands: short a snap, long a slow approach' },
    power: { min: 0, max: 1, def: 0.5, desc: 'How hard it lands: from a light, high chime up to a lower, fuller one' },
    weak: { min: 0, max: 1, def: 0, step: 1, desc: '1 adds a bright double bell on the landing for a doubled hit, 0 leaves it off' },
  },
  play(T, out, t, p) {
    const D = p.travel;
    const pw = p.power;
    const L = t + D;
    const mix = T.gain(out, 0.69);  // one trim sets the whole strike to the house level
    const fly = (o) => Object.assign({ a: 0.7 * D, dur: D, tail: 0.3, fade: 0.03 }, o);
    T.noise(mix, t, fly({ filter: 'bandpass', f: 1500, to: 4800, q: 1.1, peak: 0.048 }));
    T.osc(mix, t, fly({ type: 'triangle', f: 1046.5, to: 1568, peak: 0.036 }));
    T.osc(mix, t, fly({ type: 'triangle', f: 1056, to: 1582, peak: 0.028 }));
    T.osc(mix, t + 0.5 * D, { f: 2637, dur: 0.12, peak: 0.024, a: 0.004 });
    T.osc(mix, t + 0.75 * D, { f: 3136, dur: 0.12, peak: 0.02, a: 0.004 });
    // the impact: two triangles about 15 cents apart, falling a little, so they shimmer
    const f = 760 - 200 * pw;
    const len = 0.16 + 0.05 * pw;
    T.osc(mix, L, { type: 'triangle', f, to: f * 0.78, dur: len, peak: 0.14, a: 0.008 });
    T.osc(mix, L, { type: 'triangle', f: f * 1.009, to: f * 0.79, dur: len, peak: 0.12, a: 0.008 });
    T.noise(mix, L, { filter: 'highpass', f: 5000, to: 7000, q: 0.8, dur: 0.09, peak: 0.06, a: 0.002 });
    [2637, 3136, 3951].forEach((g, k) => {
      T.osc(mix, L + 0.03 + k * 0.035, { f: g, dur: 0.18, peak: 0.04, a: 0.003 });
    });
    if (p.weak >= 0.5) {
      // the doubled accent: two struck-bell dings a beat apart, bright and clear of the low end
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1245, to: 1180, dur: 0.16, peak: 0.1, a: 0.004 });
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1868, to: 1790, dur: 0.13, peak: 0.06, a: 0.004 });
      T.osc(mix, L + 0.085, { type: 'triangle', f: 2490, to: 2360, dur: 0.11, peak: 0.045, a: 0.004 });
      T.noise(mix, L + 0.03, { filter: 'highpass', f: 5200, to: 3600, q: 0.8, dur: 0.05, peak: 0.05, a: 0.002 });
    }
  },
};
