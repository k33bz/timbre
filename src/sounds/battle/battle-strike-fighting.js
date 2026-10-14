// A fighting strike in two beats. The flight is a rush of air with a low tone rising under it, like a
// fist coming through. The impact is a deep thud with a hard slap on the front and a puff of dust
// and grit settling after. Same flight-then-impact shape and knobs as every element strike.
export default {
  id: 'battle-strike-fighting',
  name: 'Fighting Strike',
  category: 'battle',
  tags: ['strike', 'fighting', 'fist', 'punch', 'thud', 'dust', 'attack', 'projectile', 'impact', 'element'],
  desc: 'A fighting strike: air rushes in with a low tone rising, then lands as a deep thud with a slap and a puff of dust. For a punch or kick attack.',
  dur: 1.2,
  family: 'impact',
  moments: ['crit'],
  params: {
    travel: { min: 0.2, max: 0.8, def: 0.5, unit: 's', desc: 'How long the rush lasts before the blow lands: short a snap, long a slow wind-up' },
    power: { min: 0, max: 1, def: 0.5, desc: 'How hard it lands: from a light thud up to a deeper, longer, dustier blow' },
    weak: { min: 0, max: 1, def: 0, step: 1, desc: '1 adds a bright double bell on the landing for a doubled hit, 0 leaves it off' },
  },
  play(T, out, t, p) {
    const D = p.travel;
    const pw = p.power;
    const L = t + D;
    const mix = T.gain(out, 0.63);  // one trim sets the whole strike to the house level
    const fly = (o) => Object.assign({ a: 0.7 * D, dur: D, tail: 0.3, fade: 0.03 }, o);
    T.noise(mix, t, fly({ filter: 'bandpass', f: 250, to: 1300, q: 1.1, peak: 0.15 }));
    T.osc(mix, t, fly({ f: 147, to: 196, peak: 0.075 }));
    // the impact
    T.osc(mix, L, { f: 176 - 70 * pw, to: 40, dur: 0.13 + 0.1 * pw, peak: 0.3, a: 0.003 });
    T.noise(mix, L, { filter: 'lowpass', f: 1500 - 500 * pw, to: 260, q: 1, dur: 0.1 + 0.05 * pw, peak: 0.15, a: 0.003 });
    T.noise(mix, L, { filter: 'bandpass', f: 1800, to: 900, q: 1.2, dur: 0.05, peak: 0.12, a: 0.001 });
    const span = 0.25 + 0.1 * pw;
    const dust = T.bus(mix, L + 0.04, { a: 0.01, dur: span, tail: 0.05, fade: 0.02 });
    T.crackle(dust, L + 0.04, { dur: span, rate: 45, f: 1400, to: 700, q: 0.8, len: 0.012, peak: 0.06 });
    if (p.weak >= 0.5) {
      // the doubled accent: two struck-bell dings a beat apart, bright and clear of the low end
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1245, to: 1180, dur: 0.16, peak: 0.1, a: 0.004 });
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1868, to: 1790, dur: 0.13, peak: 0.06, a: 0.004 });
      T.osc(mix, L + 0.085, { type: 'triangle', f: 2490, to: 2360, dur: 0.11, peak: 0.045, a: 0.004 });
      T.noise(mix, L + 0.03, { filter: 'highpass', f: 5200, to: 3600, q: 0.8, dur: 0.05, peak: 0.05, a: 0.002 });
    }
  },
};
