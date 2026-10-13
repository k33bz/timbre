// A shift chain climbing form by form: each tier slides onto the stack with a paper whisper and a soft
// landing, adds one more detuned saw to a rising tone (so the stack thickens as it climbs) and lights
// a glass step; the last tier arrives free, with a small pop and three gold lore chimes over a bloom.
export default {
  id: 'duel-ladder-climb',
  name: 'Ladder Climb',
  category: 'duel',
  tags: ['ink-duel', 'shift', 'ladder', 'climb', 'stack', 'tiers', 'rising', 'steps', 'upgrade', 'free'],
  desc: 'A chain of upgrades: each form slides on with a soft landing and a step higher, the tone thickening, until the last arrives free with gold chimes.',
  dur: 1.84,
  family: 'synthetic',
  moments: ['ability'],
  params: {
    tiers: { min: 2, max: 4, def: 3, step: 1, desc: 'How many forms stack up, each one step higher and thicker' },
    rise: { min: 2, max: 7, def: 5, unit: 'st', desc: 'How far each step climbs: low a gentle stair, high a steep ladder' },
    pitch: { min: 90, max: 200, def: 130, unit: 'Hz', desc: 'Note of the first form; the last form and the chimes are built above it' },
    glass: { min: 0, max: 1, def: 0.6, desc: 'Level of the glass tick on each step and of the lore chimes, 0 none' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.tiers);
    const gap = 0.2;
    let top = p.pitch;
    for (let k = 0; k < n; k++) {
      const at = t + k * gap;
      const f = p.pitch * Math.pow(2, (k * p.rise) / 12);
      top = f;
      // the form slides onto the stack and lands: a whisper of paper, a soft knock
      T.noise(out, at, { filter: 'bandpass', f: 1500, to: 3400, q: 1.2, dur: 0.07, peak: 0.05, a: 0.03 });
      T.osc(out, at + 0.055, { f: 150, to: 62, dur: 0.14, peak: 0.06, a: 0.003 });
      // its tone: one more detuned saw per tier under a clear triangle an octave up, scooping into the
      // step through an opening filter; every tier but the last is cut short so each step is heard
      const last = k === n - 1;
      const len = last ? 0.9 : 0.25;
      const lp = T.filter(out, at + 0.05, { type: 'lowpass', f: 420, to: 1500 + 500 * k, dur: 0.2, q: 1.2 });
      for (let j = 0; j <= k; j++) {
        const spread = k === 0 ? 0 : (j / k - 0.5) * 22;
        T.osc(lp, at + 0.05, {
          type: 'sawtooth', f: f * 0.84, to: f, glide: 0.06, dur: len, peak: 0.05 / Math.sqrt(k + 1), a: 0.02,
          detune: spread, tail: 0.3, fade: 0.03,
        });
      }
      T.osc(out, at + 0.05, { type: 'triangle', f: f * 1.68, to: f * 2, glide: 0.06, dur: len, peak: 0.045, a: 0.012, tail: 0.3, fade: 0.03 });
      // the step lights up: a small glass tick an octave and a half above the tone
      T.bell(out, at + 0.07, { f: f * 6, partials: [[1, 1, 1], [2.32, 0.3, 0.5]], dur: 0.22, peak: 0.032 * p.glass, a: 0.002 });
    }
    // the last form arrives free: a small pop, a bloom of air and three lore stars in a rising stack
    const fin = t + (n - 1) * gap + 0.2;
    T.osc(out, fin, { f: 380, to: 900, dur: 0.06, peak: 0.05, a: 0.004 });
    T.noise(out, fin, { filter: 'highpass', f: 3500, to: 8000, q: 0.8, dur: 0.45, peak: 0.035, a: 0.12 });
    const glassy = [[1, 1, 1], [2.32, 0.38, 0.55], [4.1, 0.14, 0.3]];
    for (let k = 0; k < 3; k++) {
      T.bell(out, fin + 0.04 + k * 0.07, { f: top * (4 + k), partials: glassy, dur: k === 2 ? 0.85 : 0.55, peak: 0.05 * p.glass, a: 0.003 });
    }
  },
};
