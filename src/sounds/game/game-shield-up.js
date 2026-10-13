// An energy shield charging: two detuned saws behind a lowpass that opens as the pitch climbs,
// a shimmer that rises with it, and a glassy ping when it locks in at the top.
export default {
  id: 'game-shield-up',
  name: 'Shield Up',
  category: 'game',
  tags: ['shield', 'barrier', 'defend', 'guard', 'charge', 'activate', 'energy', 'buff'],
  desc: 'An energy field charging up: a humming rise that opens and locks in with a ping. For shields and buffs.',
  dur: 0.95,
  params: {
    pitch: { min: 80, max: 300, def: 150, unit: 'Hz' },
    length: { min: 0.3, max: 0.8, def: 0.5, unit: 's' },
    shimmer: { min: 0, max: 1, def: 0.5 },
    lock: { min: 0, max: 1, def: 0.6 },
  },
  play(T, out, t, p) {
    const L = p.length;
    const lp = T.filter(out, t, { type: 'lowpass', f: 300, to: 4200, dur: L * 0.9, q: 1.5 });
    T.osc(lp, t, {
      type: 'sawtooth', f: p.pitch, to: p.pitch * 2, glide: L * 0.9, dur: L, peak: 0.05, a: L * 0.55, s: 0.8, d: 0.02, r: L * 0.3,
      trem: { rate: 18, depth: 0.3 },
    });
    T.osc(lp, t, {
      type: 'sawtooth', f: p.pitch, to: p.pitch * 2, glide: L * 0.9, dur: L, peak: 0.04, a: L * 0.55, s: 0.8, d: 0.02, r: L * 0.3, detune: 14,
    });
    T.noise(out, t, {
      filter: 'highpass', f: 3000, to: 7500, q: 0.8, dur: L, peak: 0.04 * p.shimmer, a: L * 0.6,
    });
    // the lock-in ping, an octave and a half above the hum's start
    T.bell(out, t + L * 0.8, {
      f: p.pitch * 8, partials: [[1, 1, 1], [2.76, 0.35, 0.6]], dur: 0.3, peak: 0.05 * p.lock, a: 0.003,
    });
  },
};
