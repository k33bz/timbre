// A neon grid rolling toward the horizon: deep sub pulses underneath, and over them a pair of detuned
// saws through a resonant lowpass that opens slowly, with a band of noise riding the same sweep. A
// short feedback delay (about 12 ms) puts a comb on all of it, so the wash rises wide and hollow, and
// a glass ping marks the horizon at the end. The scanner sweep in scifi is a beam wobbling up and
// back, and the warp jump winds up and leaps; this is a slow wash with a floor under it.
export default {
  id: 'fx-grid-sweep',
  name: 'Grid Sweep',
  category: 'fx',
  tags: ['grid', 'sweep', 'horizon', 'synthwave', 'retro', 'wash', 'sub', 'pulse', 'neon', 'rise'],
  desc: 'Deep sub pulses under a hollow rising wash that ends on a glass ping at the horizon. For a neon grid scrolling into view or a retro-futuristic scene opening.',
  dur: 1.5,
  family: 'synthetic',
  params: {
    pitch: { min: 35, max: 70, def: 50, unit: 'Hz', desc: 'Note of the sub pulses; the wash is tuned two octaves above' },
    length: { min: 0.6, max: 1.2, def: 0.9, unit: 's', desc: 'How long the wash takes to rise before the ping' },
    pulses: { min: 1, max: 4, def: 2, step: 1, desc: 'How many sub pulses throb under the wash' },
    bright: { min: 0, max: 1, def: 0.5, desc: 'How far the sweep opens: 0 stays dark and hollow, 1 climbs to a bright shimmer' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const n = Math.round(p.pulses);
    for (let k = 0; k < n; k++) {
      const at = t + (k / n) * L * 0.8;
      const lv = Math.pow(0.8, k);
      T.osc(out, at, { f: p.pitch * 1.6, to: p.pitch, glide: 0.08, dur: 0.3, peak: 0.08 * lv, a: 0.006 });
      // the second harmonic, so small speakers still hear the pulse
      T.osc(out, at, { type: 'triangle', f: p.pitch * 2, dur: 0.2, peak: 0.026 * lv, a: 0.006 });
    }
    // the wash: detuned saws and a square, opened by a resonant lowpass, then combed
    const comb = T.delay(out, t, { time: 0.0125, fb: 0.55, mix: 0.6, tone: 9000 });
    const lp = T.filter(comb, t, { type: 'lowpass', f: 250, to: 1500 + 5000 * p.bright, dur: L, q: 5 });
    const hold = { dur: L + 0.15, a: L * 0.5, s: 1, d: 0.05, r: 0.15 };
    T.osc(lp, t, Object.assign({ type: 'sawtooth', f: p.pitch * 4, peak: 0.024 }, hold));
    T.osc(lp, t, Object.assign({ type: 'sawtooth', f: p.pitch * 4 * 1.007, peak: 0.024 }, hold));
    T.osc(lp, t, Object.assign({ type: 'square', f: p.pitch * 2, peak: 0.012 }, hold));
    // a band of air riding the same sweep, so the wash has texture and not only pitch
    T.noise(comb, t, Object.assign({ filter: 'bandpass', f: 400, to: 2000 + 5000 * p.bright, q: 1.5, glide: L, peak: 0.05 }, hold));
    // the horizon
    T.bell(out, t + L * 0.9, { f: p.pitch * 28, partials: [[1, 1, 1], [2.76, 0.3, 0.4]], dur: 0.4, peak: 0.04 });
  },
};
