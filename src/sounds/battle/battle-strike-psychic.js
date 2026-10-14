// A psychic strike in two beats. The flight is two sines a few cents apart that rise and waver, so
// they beat against each other, over a thin high ring. The impact is the same pair falling together
// with a soft ping on the front and a ring of band noise. Same flight-then-impact shape and knobs as
// every element strike.
export default {
  id: 'battle-strike-psychic',
  name: 'Psychic Strike',
  category: 'battle',
  tags: ['strike', 'psychic', 'mind', 'pulse', 'wobble', 'attack', 'projectile', 'impact', 'beating', 'element'],
  desc: 'A psychic strike: two wavering tones rise and beat against each other, then land as a falling pulse with a soft ping. For a mind attack.',
  dur: 1.11,
  family: 'synthetic',
  moments: ['attack', 'hit'],
  params: {
    travel: { min: 0.2, max: 0.8, def: 0.5, unit: 's', desc: 'How long the tones rise before they land: short a snap, long a slow approach' },
    power: { min: 0, max: 1, def: 0.5, desc: 'How hard it lands: from a light, high pulse up to a lower, longer one' },
    weak: { min: 0, max: 1, def: 0, step: 1, desc: '1 adds a bright double bell on the landing for a doubled hit, 0 leaves it off' },
  },
  play(T, out, t, p) {
    const D = p.travel;
    const pw = p.power;
    const L = t + D;
    const mix = T.gain(out, 0.84);  // one trim sets the whole strike to the house level
    const fly = (o) => Object.assign({ a: 0.7 * D, dur: D, tail: 0.3, fade: 0.03 }, o);
    T.osc(mix, t, fly({ f: 440, to: 700, trem: { rate: 6, depth: 0.5 }, peak: 0.072 }));
    T.osc(mix, t, fly({ f: 443, to: 697, trem: { rate: 4.5, depth: 0.6 }, peak: 0.055 }));
    T.noise(mix, t, fly({ filter: 'bandpass', f: 3200, to: 2600, q: 6, peak: 0.11 }));
    // the impact: two sines about 12 cents apart (they beat) falling together
    const f = 470 - 150 * pw;
    const len = 0.2 + 0.1 * pw;
    T.osc(mix, L, { f, to: f * 0.62, dur: len, peak: 0.09, a: 0.01 });
    T.osc(mix, L, { f: f * 1.007, to: f * 0.625, dur: len, peak: 0.08, a: 0.01 });
    T.osc(mix, L, { f: f * 2, to: f * 1.2, dur: 0.06, peak: 0.09, a: 0.002 });
    T.noise(mix, L, { filter: 'bandpass', f: 3200, to: 2200, q: 6, dur: 0.18, peak: 0.05, a: 0.004 });
    if (p.weak >= 0.5) {
      // the doubled accent: two struck-bell dings a beat apart, bright and clear of the low end
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1245, to: 1180, dur: 0.16, peak: 0.1, a: 0.004 });
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1868, to: 1790, dur: 0.13, peak: 0.06, a: 0.004 });
      T.osc(mix, L + 0.085, { type: 'triangle', f: 2490, to: 2360, dur: 0.11, peak: 0.045, a: 0.004 });
      T.noise(mix, L + 0.03, { filter: 'highpass', f: 5200, to: 3600, q: 0.8, dur: 0.05, peak: 0.05, a: 0.002 });
    }
  },
};
