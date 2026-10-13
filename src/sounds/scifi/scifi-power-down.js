// The reverse of Power Up: a saw whine sagging down under a closing lowpass while ticks slow to a
// stop, then a soft clunk as the last of it dies.
export default {
  id: 'scifi-power-down',
  name: 'Power Down',
  category: 'scifi',
  tags: ['power-down', 'shutdown', 'deactivate', 'off', 'spin-down', 'fail', 'engine'],
  desc: 'A machine spinning down: a falling whine closes under a slowing patter of ticks and ends in a soft clunk.',
  dur: 1.6,
  family: 'synthetic',
  moments: ['power-down'],
  params: {
    length: { min: 0.5, max: 1.4, def: 0.9, unit: 's', desc: 'Time the machine takes to wind down before the clunk' },
    pitch: { min: 60, max: 200, def: 110, unit: 'Hz', desc: "Machine's base pitch, tuning the falling whine and the ticks" },
    ticks: { min: 3, max: 12, def: 7, step: 1, desc: 'How many ticks slow to a stop under the whine' },
    bright: { min: 0, max: 1, def: 0.5, desc: 'Starting brightness of the closing lowpass, muted to bright' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const lp = T.filter(out, t, { type: 'lowpass', f: 1500 + 4500 * p.bright, to: 150, dur: L, q: 2 });
    T.osc(lp, t, { type: 'sawtooth', f: p.pitch * 10, to: p.pitch * 0.8, dur: L, peak: 0.07, a: 0.02, glide: L, s: 0.6, d: 0.15, r: L * 0.4 });
    T.osc(lp, t, { type: 'square', f: p.pitch * 20, to: p.pitch * 1.6, dur: L, peak: 0.02, a: 0.02, glide: L, s: 0.6, d: 0.15, r: L * 0.4 });
    const n = Math.round(p.ticks);
    for (let k = 0; k < n; k++) {
      const u = k / n;
      // u^1.8 spreads the ticks further apart toward the end, and each sits lower than the last
      T.osc(out, t + L * Math.pow(u, 1.8), { type: 'square', f: p.pitch * 6 * Math.pow(2, -u * 1.5), dur: 0.03, peak: 0.035, a: 0.002 });
    }
    // the last of it: a soft thud and a dull click
    T.osc(out, t + L, { f: 90, to: 40, dur: 0.14, peak: 0.09, a: 0.003 });
    T.noise(out, t + L, { filter: 'lowpass', f: 500, q: 0.8, dur: 0.05, peak: 0.12, a: 0.002 });
  },
};
