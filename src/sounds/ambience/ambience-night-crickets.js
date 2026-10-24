// Crickets as short packets of three sine pulses, each cricket with its own pitch, its own beat and
// a place in the field, chirping in runs with pauses between. Under them a low breath of cool night
// air and a faint rustle in the grass. The crickets sit in a small room so they stay a little far.
export default {
  id: 'ambience-night-crickets',
  name: 'Night Crickets',
  category: 'ambience',
  tags: ['crickets', 'night', 'summer', 'insects', 'chirp', 'evening', 'nature', 'wide', 'bed'],
  desc: 'A warm summer night: a few crickets chirping in runs from different places in the dark, over cool still air.',
  dur: 8,
  loop: true,
  family: 'organic',
  moments: ['ambience'],
  params: {
    length: { min: 3, max: 8, def: 6, unit: 's', desc: 'Total duration of the bed, fades included' },
    crickets: { min: 1, max: 6, def: 3, step: 1, desc: 'How many crickets are chirping, spread across the field' },
    pitch: { min: 0.8, max: 1.25, def: 1, unit: 'x', desc: 'Scales every cricket pitch: low and mellow, high and thin' },
    pace: { min: 0.6, max: 1.5, def: 1, unit: 'x', desc: 'How fast the chirps repeat: slow and cool to quick and warm' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const fade = Math.min(1.2, L * 0.3);
    const win = (x) => Math.min(1, x / 0.8, (L - x) / 1);
    // the night air: a low breath and a faint rustle, one independent noise per ear
    [-0.9, 0.9].forEach((x) => {
      const ear = T.pan(out, t, { x });
      T.noise(ear, t, { filter: 'lowpass', f: 320, q: 0.7, dur: L, peak: 0.07, a: fade, s: 1, d: 0.02, r: fade });
      T.noise(ear, t, { filter: 'bandpass', f: 1800, q: 0.5, dur: L, peak: 0.004, a: fade, s: 1, d: 0.02, r: fade });
    });
    // chirps ring a little in a small room, so the last must stop before the end
    const room = T.reverb(out, t, { time: 0.5, mix: 0.2, tone: 0.7 });
    const n = Math.round(p.crickets);
    for (let c = 0; c < n; c++) {
      const x = n === 1 ? T.rand(-0.5, 0.5) : -0.85 + (1.7 * c) / (n - 1) + T.rand(-0.1, 0.1);
      const f = T.rand(3700, 4800) * p.pitch;
      const beat = T.rand(0.36, 0.52) / p.pace;
      const lane = T.pan(room, t, { x });
      // runs of chirps at a steady beat, then a rest
      let at = T.rand(0.1, beat * 2);
      let runEnd = at + T.rand(1.4, 3);
      while (at < L - 0.4) {
        if (at > runEnd) {
          at += T.rand(0.5, 1.2);
          runEnd = at + T.rand(1.4, 3);
          continue;
        }
        const w = win(at) * T.rand(0.8, 1);
        for (let j = 0; j < 3; j++) {
          T.osc(lane, t + at + j * 0.034, {
            f, dur: 0.026, peak: 0.02 * w * (1 - 0.15 * j), a: 0.006, s: 1, d: 0.002, r: 0.008,
          });
        }
        at += beat;
      }
    }
  },
};
