// A slow heart, lub then dub, two muffled thumps felt more than heard, over a low dread drone. The
// tempo slides from a calm pulse to panic and the drone from a hush to a looming weight.
export default {
  id: 'dark-heartbeat',
  name: 'Heartbeat in the Dark',
  category: 'dark',
  tags: ['heartbeat', 'heart', 'pulse', 'thump', 'bed', 'dread', 'fear', 'panic', 'dark', 'tension', 'ambience'],
  desc: 'A muffled heartbeat thudding over a low dread drone. Slow is held-breath stillness, fast is panic. For hiding, a monster nearby or a low-health warning.',
  dur: 7.5,
  family: 'organic',
  moments: ['tension', 'ambience'],
  params: {
    tempo: { min: 50, max: 120, def: 62, unit: 'bpm', desc: 'Heart rate: slow and heavy up to a racing panic' },
    dread: { min: 0, max: 1, def: 0.5, desc: 'The drone under it: 0 almost silent, 1 a looming, beating weight' },
    thud: { min: 0, max: 1, def: 0.5, desc: 'How hard each beat lands: 0 far away and muffled, 1 right in your chest' },
  },
  play(T, out, t, p) {
    const L = 7.2;
    const room = T.reverb(out, t, { time: 1.4, mix: 0.2, tone: 0.2 });
    const period = 60 / p.tempo;
    // the second thump follows sooner as the heart speeds up
    const gap = Math.min(0.32, 0.12 + 0.25 * period);
    const beat = (at, f, peak, len) => {
      T.osc(room, at, { f: f * 1.5, to: f, glide: 0.05, dur: len, peak: peak, a: 0.008, lp: { f: 160 + 220 * p.thud, q: 0.7 } });
      T.osc(room, at, { f: f * 3, to: f * 2, glide: 0.04, dur: len * 0.4, peak: peak * 0.3 * p.thud, a: 0.006, lp: 300 });
      T.noise(room, at, { filter: 'lowpass', f: 120 + 200 * p.thud, q: 0.7, dur: 0.05, a: 0.004, peak: peak * 0.5 });
    };
    // the first beat sits at 0.35 s; stop when the next would overrun the bed
    for (let at = 0.35; at + gap + 0.3 < L - 0.4; at += period) {
      const v = T.rand(0.9, 1);
      beat(t + at, 56, (0.07 + 0.03 * p.thud) * v, 0.2);
      beat(t + at + gap, 48, (0.042 + 0.023 * p.thud) * v, 0.26);
    }
    // the drone: two close low notes that beat against each other, a bowed bass above them
    const bed = { a: 2.2, s: 1, d: 0.02, r: 2 };
    const g = 0.02 + 0.04 * p.dread;
    T.osc(room, t, Object.assign({ f: 41.2, dur: L, peak: g, lp: 160 }, bed));
    T.osc(room, t, Object.assign({ f: 41.2 * Math.pow(2, (0.5 + 2 * p.dread) / 12), dur: L, peak: g * 0.8, lp: 160, type: 'triangle' }, bed));
    T.bow(room, t, { f: 55, dur: L, a: 2.5, r: 2, players: 3, body: 0.6, bright: 0.15, pressure: 0.1, vib: 3, peak: 0.04 * p.dread });
  },
};
