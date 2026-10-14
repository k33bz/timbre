// A fire strike in two beats. The flight is a flare of rushing air with a roar building under it and
// a spit of embers, swelling for most of the travel. The impact is a low whoomph, a bandpassed roar
// that burns down and a scatter of crackles. Every element strike shares the flight-then-impact shape
// and the same three knobs; the weak switch adds the struck-bell accent for a doubled hit.
export default {
  id: 'battle-strike-fire',
  name: 'Fire Strike',
  category: 'battle',
  tags: ['strike', 'fire', 'flame', 'attack', 'projectile', 'impact', 'whoomph', 'blaze', 'element'],
  desc: 'A fire strike: a flare rushes in with embers spitting, then lands as a low whoomph and a roar that crackles out. For a fire attack.',
  dur: 1.16,
  family: 'organic',
  moments: ['attack', 'hit'],
  params: {
    travel: { min: 0.2, max: 0.8, def: 0.5, unit: 's', desc: 'How long the flare flies before it lands: short a snap, long a slow approach' },
    power: { min: 0, max: 1, def: 0.5, desc: 'How hard it lands: from a light burst up to a deeper, longer blow' },
    weak: { min: 0, max: 1, def: 0, step: 1, desc: '1 adds a bright double bell on the landing for a doubled hit, 0 leaves it off' },
  },
  play(T, out, t, p) {
    const D = p.travel;
    const pw = p.power;
    const L = t + D;
    const mix = T.gain(out, 0.58);  // one trim sets the whole strike to the house level
    // the flight swells to its peak about 70% of the way in and eases off just before contact
    const fly = (o) => Object.assign({ a: 0.7 * D, dur: D, tail: 0.3, fade: 0.03 }, o);
    T.noise(mix, t, fly({ filter: 'bandpass', f: 500, to: 2200, q: 1.1, peak: 0.21 }));
    T.noise(mix, t, fly({ filter: 'lowpass', f: 300, to: 1200, q: 1, peak: 0.19 }));
    const embers = T.bus(mix, t, fly({}));
    T.crackle(embers, t + 0.1 * D, { dur: 0.85 * D, rate: 40, f: 3000, to: 2400, spread: 0.6, len: 0.008, peak: 0.13 });
    // the impact
    T.osc(mix, L, { f: 124 - 46 * pw, to: 46, dur: 0.16 + 0.1 * pw, peak: 0.24, a: 0.003 });
    T.noise(mix, L, { filter: 'lowpass', f: 1100, to: 180, q: 0.9, dur: 0.22 + 0.1 * pw, peak: 0.16, a: 0.003 });
    T.noise(mix, L, { filter: 'bandpass', f: 2600, to: 420, q: 0.9, dur: 0.2 + 0.1 * pw, peak: 0.19, a: 0.003 });
    const span = 0.22 + 0.08 * pw;
    const ash = T.bus(mix, L + 0.05, { a: 0.01, dur: span, tail: 0.05, fade: 0.02 });
    T.crackle(ash, L + 0.05, { dur: span, rate: 55, f: 3600, to: 1800, len: 0.007, peak: 0.07 });
    if (p.weak >= 0.5) {
      // the doubled accent: two struck-bell dings a beat apart, bright and clear of the low end
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1245, to: 1180, dur: 0.16, peak: 0.1, a: 0.004 });
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1868, to: 1790, dur: 0.13, peak: 0.06, a: 0.004 });
      T.osc(mix, L + 0.085, { type: 'triangle', f: 2490, to: 2360, dur: 0.11, peak: 0.045, a: 0.004 });
      T.noise(mix, L + 0.03, { filter: 'highpass', f: 5200, to: 3600, q: 0.8, dur: 0.05, peak: 0.05, a: 0.002 });
    }
  },
};
