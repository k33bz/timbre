// A darkness strike in two beats. The flight is a smear of noise that closes downward, the opposite
// way to the other elements, over a sinking low tone and a faint falling wail. The impact is the
// smear collapsing into a deep sub with a second, slightly detuned sub beating against it. Same
// flight-then-impact shape and knobs as every element strike.
export default {
  id: 'battle-strike-darkness',
  name: 'Darkness Strike',
  category: 'battle',
  tags: ['strike', 'darkness', 'dark', 'shadow', 'smear', 'sub', 'attack', 'projectile', 'impact', 'element'],
  desc: 'A darkness strike: a shadow smears downward with a faint wail, then lands as a deep, dull thud that throbs and fades. For a dark attack.',
  dur: 1.11,
  family: 'impact',
  moments: ['crit'],
  params: {
    travel: { min: 0.2, max: 0.8, def: 0.5, unit: 's', desc: 'How long the shadow sinks before it lands: short a snap, long a slow dread' },
    power: { min: 0, max: 1, def: 0.5, desc: 'How hard it lands: from a light smear up to a deeper, longer, heavier one' },
    weak: { min: 0, max: 1, def: 0, step: 1, desc: '1 adds a bright double bell on the landing for a doubled hit, 0 leaves it off' },
  },
  play(T, out, t, p) {
    const D = p.travel;
    const pw = p.power;
    const L = t + D;
    const mix = T.gain(out, 0.7);  // one trim sets the whole strike to the house level
    const fly = (o) => Object.assign({ a: 0.7 * D, dur: D, tail: 0.3, fade: 0.03 }, o);
    T.noise(mix, t, fly({ filter: 'lowpass', f: 1800, to: 250, q: 1.4, peak: 0.11 }));
    T.osc(mix, t, fly({ f: 104, to: 78, peak: 0.064 }));
    T.osc(mix, t, fly({ f: 740, to: 300, vib: { rate: 6, depth: 40 }, peak: 0.016 }));
    // the impact
    T.noise(mix, L, { filter: 'lowpass', f: 1900, to: 170, q: 1.4, dur: 0.18 + 0.08 * pw, peak: 0.17, a: 0.015 });
    T.osc(mix, L, { f: 108 - 32 * pw, to: 52, dur: 0.14 + 0.08 * pw, peak: 0.2, a: 0.004 });
    T.osc(mix, L, { f: 111 - 32 * pw, to: 51, dur: 0.22 + 0.08 * pw, peak: 0.08, a: 0.01 });
    T.osc(mix, L + 0.04, { f: 740, to: 185, vib: { rate: 6, depth: 40 }, dur: 0.22, peak: 0.04, a: 0.03 });
    if (p.weak >= 0.5) {
      // the doubled accent: two struck-bell dings a beat apart, bright and clear of the low end
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1245, to: 1180, dur: 0.16, peak: 0.1, a: 0.004 });
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1868, to: 1790, dur: 0.13, peak: 0.06, a: 0.004 });
      T.osc(mix, L + 0.085, { type: 'triangle', f: 2490, to: 2360, dur: 0.11, peak: 0.045, a: 0.004 });
      T.noise(mix, L + 0.03, { filter: 'highpass', f: 5200, to: 3600, q: 0.8, dur: 0.05, peak: 0.05, a: 0.002 });
    }
  },
};
