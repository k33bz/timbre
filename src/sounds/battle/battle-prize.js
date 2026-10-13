// A prize card taken: the card lifts with a soft flick, turns over in the air with a three-note
// glint, and a two-note chime (a rising fifth) lands the reward. Taking more than one repeats the
// flick and glint, each a little higher, and the chime comes once at the end.
export default {
  id: 'battle-prize',
  name: 'Prize Taken',
  category: 'battle',
  tags: ['prize', 'reward', 'take', 'score', 'point', 'card', 'glint', 'chime', 'card-game'],
  desc: 'A prize card lifted and turned over with a glint, then a bright two-note chime. For scoring a point by taking a prize.',
  dur: 0.75,
  family: 'orchestral',
  moments: ['score'],
  params: {
    count: { min: 1, max: 3, def: 1, step: 1, desc: 'How many prize cards are taken at once' },
    pitch: { min: 660, max: 1100, def: 880, unit: 'Hz', desc: 'First note of the chime; the second is a fifth above and the glint sits well over both' },
    gap: { min: 0.08, max: 0.16, def: 0.12, unit: 's', desc: 'Time between prize cards when more than one is taken' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.count);
    for (let k = 0; k < n; k++) {
      const at = t + k * p.gap;
      const r = 1 + 0.06 * k;
      T.noise(out, at, { filter: 'highpass', f: 2800, to: 1800, q: 0.9, dur: 0.034, peak: 0.032, a: 0.002 });
      T.osc(out, at, { type: 'triangle', f: 480, to: 260, dur: 0.028, peak: 0.01, a: 0.002 });
      [2.378, 2.997, 3.564].forEach((m, j) => {
        T.osc(out, at + 0.06 + j * 0.03, { type: 'triangle', f: p.pitch * m * r, dur: 0.18, peak: 0.034 - 0.006 * j, a: 0.004 });
      });
      T.noise(out, at + 0.06, { filter: 'highpass', f: 6000, to: 7000, q: 0.8, dur: 0.12, peak: 0.025, a: 0.01 });
    }
    const c = t + (n - 1) * p.gap + 0.15;
    T.osc(out, c, { type: 'triangle', f: p.pitch, dur: 0.13, peak: 0.09, a: 0.008 });
    T.osc(out, c + 0.1, { type: 'triangle', f: p.pitch * 1.498, dur: 0.16, peak: 0.08, a: 0.008 });
    T.osc(out, c + 0.1, { f: p.pitch * 2.996, dur: 0.12, peak: 0.025, a: 0.008 });
  },
};
