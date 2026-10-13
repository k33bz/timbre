// A machine spinning up: ticks whose gaps shrink as the rotor speeds up, a saw whine climbing under
// an opening lowpass, and a square fifth that locks on when it reaches speed.
export default {
  id: 'scifi-power-up',
  name: 'Power Up',
  category: 'scifi',
  tags: ['power-up', 'charge', 'boot', 'startup', 'energize', 'spin-up', 'engine'],
  desc: 'A machine spinning up: accelerating ticks climb into a rising whine that locks on at full power.',
  dur: 1.65,
  params: {
    length: { min: 0.5, max: 1.4, def: 0.9, unit: 's' },
    pitch: { min: 80, max: 250, def: 130, unit: 'Hz' },
    ticks: { min: 4, max: 14, def: 9, step: 1 },
    bright: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    const L = p.length;
    const lp = T.filter(out, t, { type: 'lowpass', f: 300, to: 1500 + 4500 * p.bright, dur: L, q: 2 });
    T.osc(lp, t, { type: 'sawtooth', f: p.pitch, to: p.pitch * 8, dur: L + 0.25, peak: 0.07, a: L * 0.9, glide: L });
    T.osc(lp, t, { type: 'square', f: p.pitch * 2, to: p.pitch * 16, dur: L + 0.25, peak: 0.02, a: L * 0.9, glide: L });
    const n = Math.round(p.ticks);
    for (let k = 0; k < n; k++) {
      const u = k / n;
      // 1 - (1 - u)^1.8 packs the ticks closer together toward the end
      T.osc(out, t + L * (1 - Math.pow(1 - u, 1.8)), { type: 'square', f: p.pitch * 4 * Math.pow(2, u * 1.5), dur: 0.03, peak: 0.035, a: 0.002 });
    }
    // the lock-on: the whine ends at pitch * 8, so the chime is that note and its fifth
    const soft = T.filter(out, t, { type: 'lowpass', f: 4000, q: 0.7 });
    T.osc(soft, t + L, { type: 'square', f: p.pitch * 8, dur: 0.22, peak: 0.04, a: 0.003, s: 0.5, d: 0.04, r: 0.08 });
    T.osc(soft, t + L, { type: 'square', f: p.pitch * 12, dur: 0.22, peak: 0.03, a: 0.003, s: 0.5, d: 0.04, r: 0.08 });
  },
};
