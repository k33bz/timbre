// A toast sliding in from the edge: a short airy swish that stops on a small tick, then a landing
// signature that names the severity (info, success, warning, danger, critical). The tone picks
// pitch, interval and timbre together, so a stack of toasts can be told apart by ear. Smaller and
// quieter than the full notify-* tones, since toasts come often; critical is the exception and sits
// at the top of the range.
export default {
  id: 'notify-toast-in',
  name: 'Toast Arrive',
  category: 'notify',
  tags: ['toast', 'snackbar', 'notification', 'slide-in', 'severity', 'info', 'success', 'warning', 'danger', 'critical'],
  desc: 'A quick side swish that lands on a small tick and a short tone for the severity: a soft ping, a rising pair, a falling pair, a low buzz or three urgent stabs.',
  dur: 0.43,
  family: 'soft',
  moments: ['notify'],
  params: {
    tone: { min: 0, max: 4, def: 0, step: 1, choices: ['info', 'success', 'warning', 'danger', 'critical'], desc: 'Severity of the toast: each has its own notes and voice' },
    pitch: { min: -4, max: 4, def: 0, unit: 'st', desc: 'Moves the landing notes down or up together' },
    swish: { min: 0, max: 1, def: 0.5, desc: 'Level of the side swish before the landing: 0 just the tick, 1 a clear sweep' },
  },
  play(T, out, t, p) {
    const tone = Math.round(p.tone);
    const k = Math.pow(2, p.pitch / 12);
    const land = 0.065;                    // the swish ends as the toast stops
    const at = t + land;
    // the swish rises and cuts off into the tick, like something sliding in and stopping
    T.noise(out, t, { filter: 'bandpass', f: 1400, to: 5200, q: 2, dur: land + 0.01, peak: 0.17 * p.swish, a: land * 0.6 });
    T.tick(out, at, { f: 2600, q: 1.2, dur: 0.012, peak: 0.022 });
    if (tone === 0) {
      // info: one small bell tap
      T.bell(out, at, { f: 880 * k, dur: 0.3, peak: 0.062, a: 0.004, partials: [[1, 1, 1], [2, 0.2, 0.5], [2.76, 0.06, 0.2]] });
    } else if (tone === 1) {
      // success: a rising fifth in round triangles with a glint on the top note
      T.osc(out, at, { type: 'triangle', f: 659 * k, dur: 0.13, peak: 0.08, a: 0.006 });
      T.osc(out, at + 0.08, { type: 'triangle', f: 988 * k, dur: 0.22, peak: 0.08, a: 0.006 });
      T.osc(out, at + 0.08, { f: 1976 * k, dur: 0.09, peak: 0.02, a: 0.006 });
    } else if (tone === 2) {
      // warning: two notes falling a major third, the second longer and wavering
      const lp = T.filter(out, at, { type: 'lowpass', f: 2200, q: 0.7 });
      T.osc(lp, at, { type: 'triangle', f: 554 * k, dur: 0.1, peak: 0.09, a: 0.008 });
      T.osc(lp, at + 0.11, { type: 'triangle', f: 440 * k, dur: 0.24, peak: 0.09, a: 0.01, vib: { rate: 6, depth: 18 } });
    } else if (tone === 3) {
      // danger: two low buzzes, each a step down, through a dull lowpass (a short cousin of the error buzz)
      const lp = T.filter(out, at, { type: 'lowpass', f: 1000, q: 0.8 });
      for (let n = 0; n < 2; n++) {
        const f = 196 * k * Math.pow(0.89, n);
        T.osc(lp, at + n * 0.115, {
          type: 'square', f, to: f * 0.96, dur: 0.1, peak: 0.06, a: 0.005, s: 0.6, d: 0.02, r: 0.03,
          trem: { rate: 34, depth: 0.5 },
        });
      }
    } else {
      // critical: three quick stabs of a tritone buzz, each a little higher, with a sub under the first
      const lp = T.filter(out, at, { type: 'lowpass', f: 2600, q: 0.8 });
      for (let n = 0; n < 3; n++) {
        const f = 294 * k * Math.pow(2, (n * 2) / 12);
        const o = { type: 'sawtooth', dur: 0.075, peak: 0.045, a: 0.004, s: 0.7, d: 0.02, r: 0.025 };
        T.osc(lp, at + n * 0.095, Object.assign({ f }, o));
        T.osc(lp, at + n * 0.095, Object.assign({ f: f * 1.4142 }, o));
      }
      T.osc(out, at, { f: 82 * k, dur: 0.3, peak: 0.07, a: 0.01, s: 0.7, d: 0.04, r: 0.08 });
    }
  },
};
