// Soft triangle beeps in rising pairs (a fifth apart), repeated in rounds that each get louder.
// The last round always lands at the same level, so `swell` only changes how quiet the first is.
export default {
  id: 'notify-alarm',
  name: 'Gentle Alarm',
  category: 'notify',
  tags: ['alarm', 'wake', 'timer', 'beep', 'gentle', 'morning', 'swell'],
  desc: 'Soft rounded beeps in rising pairs that swell round by round. Wakes you without startling you.',
  dur: 2.3,
  params: {
    pitch: { min: 440, max: 1000, def: 659.25, unit: 'Hz' },
    rounds: { min: 2, max: 4, def: 3, step: 1 },
    pace: { min: 0.12, max: 0.25, def: 0.17, unit: 's' },
    swell: { min: 0, max: 1, def: 0.6 },
  },
  play(T, out, t, p) {
    const rounds = Math.round(p.rounds);
    const lp = T.filter(out, t, { type: 'lowpass', f: 2600, q: 0.7 });
    for (let r = 0; r < rounds; r++) {
      const lift = 1 - 0.6 * p.swell * (rounds - 1 - r) / (rounds - 1);
      for (let k = 0; k < 2; k++) {
        const f = p.pitch * (k ? 1.5 : 1);
        const at = t + r * 0.6 + k * p.pace;
        T.osc(lp, at, { type: 'triangle', f, dur: 0.15, peak: 0.1 * lift, a: 0.02 });
        T.osc(lp, at, { f: f * 2, dur: 0.1, peak: 0.02 * lift, a: 0.02 });
      }
    }
  },
};
