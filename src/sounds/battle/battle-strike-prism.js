// A prism strike in two beats: the three elements at once. The flight layers a fire rumble, a
// water hush and a lightning rush a few milliseconds apart under one shared swell. The impact
// lands them one after another (crack, whoomph, splash) and a refracted triple glint rings over
// the top. Same flight-then-impact shape and knobs as every element strike.
export default {
  id: 'battle-strike-prism',
  name: 'Prism Strike',
  category: 'battle',
  tags: ['strike', 'prism', 'rainbow', 'multi', 'elements', 'layered', 'attack', 'projectile', 'impact', 'element'],
  desc: 'A strike of three elements at once: fire, water and lightning rush in under one swell, then land crack, whoomph and splash with a glint. For a multi-element attack.',
  dur: 1.15,
  family: 'glass',
  moments: ['attack', 'hit'],
  params: {
    travel: { min: 0.2, max: 0.8, def: 0.5, unit: 's', desc: 'How long the layered swell flies before it lands: short a snap, long a slow approach' },
    power: { min: 0, max: 1, def: 0.5, desc: 'How hard it lands: from a light burst up to deeper, longer layers' },
    weak: { min: 0, max: 1, def: 0, step: 1, desc: '1 adds a bright double bell on the landing for a doubled hit, 0 leaves it off' },
  },
  play(T, out, t, p) {
    const D = p.travel;
    const pw = p.power;
    const L = t + D;
    const mix = T.gain(out, 0.85);  // one trim sets the whole strike to the house level
    // one swell carries all three flights; each voice just holds its level inside it
    const sw = T.bus(mix, t, { a: 0.7 * D, dur: D, tail: 0.3, fade: 0.03 });
    const hold = (o) => Object.assign({ a: 0.02, s: 1, d: 0.01, r: 0.02 }, o);
    T.noise(sw, t, hold({ dur: D, filter: 'lowpass', f: 300, to: 1200, q: 1, peak: 0.063 }));
    T.noise(sw, t, hold({ dur: D, filter: 'bandpass', f: 500, to: 2200, q: 1.1, peak: 0.045 }));
    T.noise(sw, t + 0.05 * D, hold({ dur: 0.95 * D, filter: 'lowpass', f: 300, to: 2200, q: 0.8, peak: 0.063 }));
    T.osc(sw, t + 0.4 * D, hold({ dur: 0.08, f: 560, to: 1200, peak: 0.036 }));
    T.noise(sw, t + 0.1 * D, hold({ dur: 0.9 * D, filter: 'bandpass', f: 700, to: 3000, q: 1.1, peak: 0.045 }));
    for (let k = 0; k < 3; k++) {
      T.osc(sw, t + D * (0.3 + 0.2 * k), hold({ type: 'triangle', dur: 0.05, f: 2200, to: 700, peak: 0.045 }));
    }
    // the impact: the lightning crack, then the fire whoomph and roar, then the water splash
    T.noise(mix, L, { filter: 'highpass', f: 2400, to: 6200, q: 0.7, dur: 0.06, peak: 0.12, a: 0.001 });
    T.osc(mix, L, { type: 'square', f: 900, to: 150, dur: 0.05, peak: 0.05, a: 0.001 });
    T.osc(mix, L + 0.015, { f: 118 - 40 * pw, to: 46, dur: 0.16 + 0.08 * pw, peak: 0.15, a: 0.003 });
    T.noise(mix, L + 0.015, { filter: 'bandpass', f: 2600, to: 420, q: 0.9, dur: 0.18 + 0.08 * pw, peak: 0.11, a: 0.003 });
    T.noise(mix, L + 0.035, { filter: 'lowpass', f: 320, to: 2500, q: 0.8, dur: 0.19 + 0.08 * pw, peak: 0.11, a: 0.012 });
    T.osc(mix, L + 0.1, { f: 680 + 240 * pw, to: 1500, dur: 0.07, peak: 0.07, a: 0.004 });
    // the refracted glints
    [1568, 1976, 2349].forEach((g, k) => {
      T.bell(mix, L + 0.06 + k * 0.04, { f: g, partials: [[1, 1, 1], [3.9, 0.25, 0.5]], dur: 0.2, peak: 0.035, a: 0.003 });
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
