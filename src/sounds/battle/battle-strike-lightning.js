// A lightning strike in two beats. The flight is a charge building: a thin rising rush over a
// fizzing hum, with sparks and a few short zaps. The impact is mostly crack: a bright burst of noise,
// a snapping zap, a small low thump, a quick sizzle and a faint rumble after. Same flight-then-impact
// shape and knobs as every element strike.
export default {
  id: 'battle-strike-lightning',
  name: 'Lightning Strike',
  category: 'battle',
  tags: ['strike', 'lightning', 'bolt', 'electric', 'zap', 'attack', 'projectile', 'impact', 'crack', 'element'],
  desc: 'A lightning bolt: a charge builds with a fizzing hum and sparks, then lands as a bright crack, a sizzle and a low rumble. For an electric attack.',
  dur: 1.16,
  family: 'synthetic',
  moments: ['crit'],
  params: {
    travel: { min: 0.2, max: 0.8, def: 0.5, unit: 's', desc: 'How long the charge builds before the bolt lands: short a snap, long a slow build' },
    power: { min: 0, max: 1, def: 0.5, desc: 'How hard it lands: from a thin snap up to a deeper crack and longer sizzle' },
    weak: { min: 0, max: 1, def: 0, step: 1, desc: '1 adds a bright double bell on the landing for a doubled hit, 0 leaves it off' },
  },
  play(T, out, t, p) {
    const D = p.travel;
    const pw = p.power;
    const L = t + D;
    const mix = T.gain(out, 0.58);  // one trim sets the whole strike to the house level
    const fly = (o) => Object.assign({ a: 0.7 * D, dur: D, tail: 0.3, fade: 0.03 }, o);
    T.noise(mix, t, fly({ filter: 'bandpass', f: 700, to: 3000, q: 1.1, peak: 0.15 }));
    T.osc(mix, t, fly({ type: 'sawtooth', f: 95, to: 190, lp: 900, peak: 0.05 }));
    const sparks = T.bus(mix, t, fly({}));
    T.crackle(sparks, t + 0.15 * D, { dur: 0.8 * D, rate: 30, f: 4500, to: 6000, q: 1.5, len: 0.004, peak: 0.12 });
    for (let k = 0; k < 3; k++) {
      T.osc(mix, t + D * (0.25 + 0.25 * k), { type: 'triangle', f: 2200, to: 700, dur: 0.05, peak: 0.095, a: 0.002 });
    }
    // the impact: a crack with little body (the small low thump is only there to give it a chest).
    // A little drive rounds off the noise peaks so the crack carries more energy at the same peak.
    const arc = T.drive(mix, L, { amount: 0.04, ref: 0.3 });
    T.noise(arc, L, { filter: 'highpass', f: 2400, to: 6200, q: 0.7, dur: 0.075, peak: 0.16, a: 0.001 });
    T.osc(arc, L, { type: 'square', f: 1000 - 300 * pw, to: 150, dur: 0.06, peak: 0.1, a: 0.001 });
    T.osc(arc, L + 0.035, { type: 'triangle', f: 2400, to: 900, dur: 0.05, peak: 0.07, a: 0.002 });
    T.noise(arc, L, { filter: 'bandpass', f: 1800, to: 700, q: 2, dur: 0.14, peak: 0.14, a: 0.001 });
    T.osc(arc, L, { f: 120 - 30 * pw, to: 55, dur: 0.09 + 0.05 * pw, peak: 0.1, a: 0.002 });
    T.osc(mix, L + 0.01, { f: 3800, to: 3000, dur: 0.22, peak: 0.035, a: 0.004 });
    // the rumble that follows a bolt, kept low so the crack stays the peak
    T.noise(mix, L + 0.02, { filter: 'lowpass', f: 700, to: 150, q: 0.8, dur: 0.26 + 0.08 * pw, peak: 0.07, a: 0.03 });
    const span = 0.22 + 0.1 * pw;
    const fizz = T.bus(mix, L + 0.03, { a: 0.005, dur: span, tail: 0.05, fade: 0.02 });
    T.crackle(fizz, L + 0.03, { dur: span, rate: 90, f: 6000, to: 3500, q: 1.5, len: 0.004, peak: 0.1 });
    if (p.weak >= 0.5) {
      // the doubled accent: two struck-bell dings a beat apart, bright and clear of the low end
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1245, to: 1180, dur: 0.16, peak: 0.1, a: 0.004 });
      T.osc(mix, L + 0.03, { type: 'triangle', f: 1868, to: 1790, dur: 0.13, peak: 0.06, a: 0.004 });
      T.osc(mix, L + 0.085, { type: 'triangle', f: 2490, to: 2360, dur: 0.11, peak: 0.045, a: 0.004 });
      T.noise(mix, L + 0.03, { filter: 'highpass', f: 5200, to: 3600, q: 0.8, dur: 0.05, peak: 0.05, a: 0.002 });
    }
  },
};
