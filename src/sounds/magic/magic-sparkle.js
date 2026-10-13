// Built from the Deck Lab sparkles (the prize-card turn and the heal sparks): a rising major
// arpeggio of triangle notes, each with a faint octave, over a highpassed shimmer, in a small room.
export default {
  id: 'magic-sparkle',
  name: 'Magic Sparkle',
  category: 'magic',
  tags: ['magic', 'sparkle', 'shimmer', 'twinkle', 'fairy', 'heal', 'bonus'],
  desc: 'A rising twinkle of bright notes over a breath of shimmer, with a little room around it.',
  dur: 1.5,
  params: {
    notes: { min: 3, max: 7, def: 4, step: 1 },
    pitch: { min: 600, max: 2000, def: 1046.5, unit: 'Hz' },
    gap: { min: 0.025, max: 0.09, def: 0.05, unit: 's' },
    shimmer: { min: 0, max: 1, def: 0.5 },
    space: { min: 0, max: 0.6, def: 0.3 },
  },
  play(T, out, t, p) {
    const steps = [0, 4, 7, 12, 16, 19, 24];
    const n = Math.round(p.notes);
    const room = T.reverb(out, t, { time: 0.9, mix: p.space, tone: 0.7 });
    for (let k = 0; k < n; k++) {
      const f = p.pitch * Math.pow(2, steps[k] / 12);
      const at = t + k * p.gap;
      const l = 1 - 0.08 * k;
      T.osc(room, at, { type: 'triangle', f, dur: 0.22, peak: 0.06 * l, a: 0.004 });
      T.osc(room, at, { f: f * 2, to: f * 2.02, dur: 0.12, peak: 0.02 * l, a: 0.004 });
    }
    T.noise(room, t, { filter: 'highpass', f: 5000, to: 8000, q: 0.8, dur: n * p.gap + 0.25, peak: 0.06 * p.shimmer, a: 0.06 });
  },
};
