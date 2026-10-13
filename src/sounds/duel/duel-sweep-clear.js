// A patient build into a board wipe: a few soft card slides and ticks as cards stack up face down, a
// long low swell that fills the room like a wave, then a crash (a deep boom, a body of noise and a
// burst of glass) and the fallen characters breaking and dropping one after another into a hush.
export default {
  id: 'duel-sweep-clear',
  name: 'Sweep Clear',
  category: 'duel',
  tags: ['ink-duel', 'wipe', 'sweep', 'board-wipe', 'boost', 'swell', 'crash', 'banish', 'control', 'low'],
  desc: 'A board wipe: cards stack up quietly, a low swell rolls across the table and crashes, and the characters on the far side break and fall away.',
  dur: 2.64,
  family: 'impact',
  params: {
    stacks: { min: 2, max: 4, def: 3, step: 1, desc: 'How many face-down cards slide under before the swell' },
    swell: { min: 0.5, max: 1, def: 0.75, unit: 's', desc: 'How long the low swell builds before the crash' },
    crash: { min: 0, max: 1, def: 0.6, desc: 'Heft of the crash: a louder, longer boom and a bigger burst of glass' },
    fallen: { min: 1, max: 4, def: 3, step: 1, desc: 'How many characters break and fall after the crash' },
  },
  play(T, out, t, p) {
    const stacks = Math.round(p.stacks);
    const fallen = Math.round(p.fallen);
    const w = p.crash;
    // cards slide under a character: a paper whisper and a small soft tick, one more each turn
    for (let k = 0; k < stacks; k++) {
      const at = t + k * 0.2;
      T.noise(out, at, { filter: 'bandpass', f: 1300 + 100 * k, to: 2700, q: 1.1, dur: 0.09, peak: 0.05, a: 0.04 });
      T.tick(out, at + 0.085, { f: 1000 + 120 * k, q: 2, dur: 0.02, peak: 0.035, blip: 230 + 25 * k, blipPeak: 0.014, blipDur: 0.03 });
    }
    // the wave: a low swell and a band of noise that opens as it travels, ending at the crash
    const w0 = t + stacks * 0.2 + 0.08;
    const S = p.swell;
    const L = w0 + S;
    const lp = T.filter(out, w0, { type: 'lowpass', f: 160, to: 1800, dur: S, q: 1.5 });
    T.osc(lp, w0, { type: 'sawtooth', f: 46, to: 105, dur: S + 0.02, peak: 0.03, a: S * 0.96, trem: { rate: 5, depth: 0.25 } });
    T.osc(out, w0, { f: 46, to: 105, dur: S + 0.02, peak: 0.024, a: S * 0.96 });
    T.noise(out, w0, { filter: 'lowpass', f: 140, to: 2300, q: 0.9, dur: S + 0.02, peak: 0.056, a: S * 0.96 });
    T.noise(out, w0 + S * 0.35, { filter: 'bandpass', f: 600, to: 4200, q: 0.9, dur: S * 0.65 + 0.02, peak: 0.03, a: S * 0.6 });
    // the crash: a deep boom, a falling body of noise, a hard crack and a burst of glass
    T.osc(out, L, { f: 140, to: 36, dur: 0.45 + 0.25 * w, peak: 0.06 + 0.04 * w, a: 0.003 });
    T.noise(out, L, { filter: 'lowpass', f: 2600, to: 160, q: 0.8, dur: 0.3 + 0.2 * w, peak: 0.1 + 0.056 * w, a: 0.002 });
    T.noise(out, L, { filter: 'highpass', f: 3000, to: 1800, q: 0.8, dur: 0.04, peak: 0.027 + 0.042 * w, a: 0.001 });
    T.crackle(out, L, { dur: 0.3, rate: 130, f: 5200, to: 2000, spread: 0.6, q: 1.8, len: 0.009, peak: 0.021 + 0.037 * w });
    // the characters break and fall, one after another: a glass crackle and a falling glassy tone each
    for (let k = 0; k < fallen; k++) {
      const at = L + 0.08 + k * 0.1;
      T.crackle(out, at, { dur: 0.22, rate: 90, f: 4800 - 500 * k, to: 1800, spread: 0.5, q: 2.2, len: 0.007, peak: 0.06 });
      T.osc(out, at, { f: 2200 - 250 * k, to: 420, dur: 0.3, peak: 0.016, a: 0.004 });
      T.osc(out, at, { f: 110 - 10 * k, to: 55, dur: 0.12, peak: 0.03, a: 0.003 });
    }
    // the hush: a low rumble dying away with a little dust
    const h = L + 0.1;
    T.noise(out, h, { filter: 'lowpass', f: 380, to: 90, q: 0.8, dur: 0.65, peak: 0.05, a: 0.06 });
    T.noise(out, h + 0.2, { filter: 'bandpass', f: 3200, to: 1100, q: 1, dur: 0.45, peak: 0.012, a: 0.05 });
  },
};
