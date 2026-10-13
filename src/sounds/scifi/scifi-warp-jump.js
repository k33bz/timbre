// An engine winding up (two detuned saws and a thin FM whine under an opening resonant lowpass),
// then the jump: a falling streak of noise, a zip and a deep thump as the ship vanishes.
export default {
  id: 'scifi-warp-jump',
  name: 'Warp Jump',
  category: 'scifi',
  tags: ['warp', 'jump', 'hyperspace', 'ftl', 'engine', 'lightspeed', 'transition'],
  desc: 'An engine whine winds up, then the ship leaps: a stretched streak and a deep thump as it vanishes.',
  dur: 1.95,
  params: {
    charge: { min: 0.3, max: 1.0, def: 0.6, unit: 's' },
    pitch: { min: 60, max: 160, def: 90, unit: 'Hz' },
    boom: { min: 0, max: 1, def: 0.5 },
    tail: { min: 0.3, max: 0.9, def: 0.5, unit: 's' },
  },
  play(T, out, t, p) {
    const C = p.charge;
    const lp = T.filter(out, t, { type: 'lowpass', f: 250, to: 7000, dur: C, q: 3 });
    T.osc(lp, t, { type: 'sawtooth', f: p.pitch, to: p.pitch * 8, dur: C + 0.05, peak: 0.04, a: C * 0.9, glide: C });
    T.osc(lp, t, { type: 'sawtooth', f: p.pitch, to: p.pitch * 8, detune: 14, dur: C + 0.05, peak: 0.03, a: C * 0.9, glide: C });
    T.fm(out, t, { f: p.pitch * 6, to: p.pitch * 40, ratio: 2, index: 0.8, dur: C + 0.05, peak: 0.02, a: C * 0.9, glide: C });
    // the jump
    const j = t + C;
    T.noise(out, j, { filter: 'bandpass', f: 7000, to: 300, q: 1.2, dur: p.tail, peak: 0.12, a: 0.01 });
    T.osc(out, j, { f: p.pitch * 40, to: p.pitch * 3, dur: 0.25, peak: 0.04, a: 0.004 });
    T.osc(out, j, { f: 150, to: 30, dur: 0.5, peak: 0.02 + 0.09 * p.boom, a: 0.004 });
  },
};
