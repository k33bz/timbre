// An "uh-oh": two rounded notes falling a small step, the second longer with a slow waver. It
// borrows the error buzz's falling shape and lowpass but stays tonal and soft, so it cautions
// without scolding.
export default {
  id: 'notify-warning',
  name: 'Warning Tone',
  category: 'notify',
  tags: ['warning', 'caution', 'alert', 'uh-oh', 'attention', 'careful'],
  desc: 'A two-note falling "uh-oh" in a round triangle tone. Cautions without scolding; milder than the error buzz.',
  dur: 0.65,
  params: {
    pitch: { min: 250, max: 700, def: 440, unit: 'Hz' },
    drop: { min: 2, max: 7, def: 3, step: 1, unit: 'st' },
    gap: { min: 0.1, max: 0.3, def: 0.16, unit: 's' },
    tone: { min: 800, max: 4000, def: 1800, unit: 'Hz' },
  },
  play(T, out, t, p) {
    const lp = T.filter(out, t, { type: 'lowpass', f: p.tone, q: 0.7 });
    const low = p.pitch * Math.pow(2, -Math.round(p.drop) / 12);
    T.osc(lp, t, { type: 'triangle', f: p.pitch, dur: 0.15, peak: 0.1, a: 0.01 });
    T.osc(lp, t + p.gap, { type: 'triangle', f: low, dur: 0.3, peak: 0.1, a: 0.012, vib: { rate: 5, depth: 14 } });
  },
};
