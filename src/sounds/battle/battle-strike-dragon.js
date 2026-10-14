// A dragon strike in two beats. The flight is a growling rush: band noise with a low tone rising and
// wavering underneath. The impact is a falling tone with a partial at 2.41 times its pitch (an
// inharmonic ratio, so it reads as a roar, not a chord), an FM roar at the same ratio and a breath
// of band noise. Same flight-then-impact shape and knobs as every element strike.
export default {
  id: 'battle-strike-dragon',
  name: 'Dragon Strike',
  category: 'battle',
  tags: ['strike', 'dragon', 'roar', 'growl', 'breath', 'attack', 'projectile', 'impact', 'beast', 'element'],
  desc: 'A dragon strike: a growling rush rises with a low tone wavering, then lands as a rough falling roar and a breath of air. For a dragon attack.',
  dur: 1.21,
  family: 'organic',
  moments: ['crit'],
  params: {
    travel: { min: 0.2, max: 0.8, def: 0.5, unit: 's', desc: 'How long the growl rises before it lands: short a snap, long a slow approach' },
    power: { min: 0, max: 1, def: 0.5, desc: 'How hard it lands: from a light, high roar up to a deeper, longer one' },
    weak: { min: 0, max: 1, def: 0, step: 1, desc: '1 adds a bright double bell on the landing for a doubled hit, 0 leaves it off' },
  },
  play(T, out, t, p) {
    const D = p.travel;
    const pw = p.power;
    const L = t + D;
    const mix = T.gain(out, 0.62);  // one trim sets the whole strike to the house level
    const fly = (o) => Object.assign({ a: 0.7 * D, dur: D, tail: 0.3, fade: 0.03 }, o);
    T.noise(mix, t, fly({ filter: 'bandpass', f: 500, to: 1400, q: 1.3, peak: 0.077 }));
    T.osc(mix, t, fly({ f: 92, to: 140, vib: { rate: 9, depth: 25 }, peak: 0.05 }));
    T.osc(mix, t, fly({ f: 222, to: 337, peak: 0.019 }));
    // the impact
    const f = 300 - 100 * pw;
    T.osc(mix, L, { f, to: f * 0.55, dur: 0.19 + 0.06 * pw, peak: 0.19, a: 0.004 });
    T.osc(mix, L, { f: f * 2.41, to: f * 2.2, dur: 0.11, peak: 0.09, a: 0.004 });
    T.fm(mix, L, { f: 190 - 60 * pw, to: 80, ratio: 2.41, index: 3, index1: 0.5, dur: 0.3 + 0.1 * pw, peak: 0.09, a: 0.01 });
    T.noise(mix, L, { filter: 'bandpass', f: 1700, to: 600, q: 1.3, dur: 0.17 + 0.05 * pw, peak: 0.13, a: 0.004 });
    if (p.weak >= 0.5) {
      // the doubled accent: two struck-bell dings a beat apart, bright and clear of the low end
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1245, to: 1180, dur: 0.16, peak: 0.1, a: 0.004 });
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1868, to: 1790, dur: 0.13, peak: 0.06, a: 0.004 });
      T.osc(mix, L + 0.085, { type: 'triangle', f: 2490, to: 2360, dur: 0.11, peak: 0.045, a: 0.004 });
      T.noise(mix, L + 0.03, { filter: 'highpass', f: 5200, to: 3600, q: 0.8, dur: 0.05, peak: 0.05, a: 0.002 });
    }
  },
};
