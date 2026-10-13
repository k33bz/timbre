// A warm swell: a root, a fifth and an octave rise a few semitones together with slow attacks, so
// it blooms instead of pinging, with a faint highpassed glow and a distant bell at the crest.
export default {
  id: 'game-heal',
  name: 'Heal',
  category: 'game',
  tags: ['heal', 'health', 'restore', 'regen', 'recover', 'potion', 'warm', 'soft'],
  desc: 'A warm rising swell with a soft glow on top, for health restored. Gentle by design; it can repeat.',
  dur: 0.95,
  params: {
    pitch: { min: 220, max: 700, def: 392, unit: 'Hz' },
    length: { min: 0.3, max: 0.9, def: 0.6, unit: 's' },
    rise: { min: 0, max: 7, def: 4, step: 1, unit: 'st' },
    glow: { min: 0, max: 1, def: 0.4 },
  },
  play(T, out, t, p) {
    const L = p.length;
    const up = Math.pow(2, Math.round(p.rise) / 12);
    T.osc(out, t, { f: p.pitch, to: p.pitch * up, glide: L * 0.6, dur: L, peak: 0.04, a: L * 0.3 });
    T.osc(out, t, { f: p.pitch * 1.5, to: p.pitch * 1.5 * up, glide: L * 0.6, dur: L, peak: 0.028, a: L * 0.35 });
    T.osc(out, t, { type: 'triangle', f: p.pitch * 2, to: p.pitch * 2 * up, glide: L * 0.6, dur: L, peak: 0.02, a: L * 0.4 });
    T.noise(out, t, { filter: 'highpass', f: 5500, to: 8000, q: 0.8, dur: L, peak: 0.03 * p.glow, a: L * 0.4 });
    // the crest: a single soft bell partial pair, scaled by glow so glow 0 is a plain swell
    T.bell(out, t + L * 0.3, {
      f: p.pitch * 4 * up, partials: [[1, 1, 1], [2.76, 0.3, 0.5]], dur: Math.min(0.45, L * 0.7),
      peak: 0.018 * p.glow, a: 0.004,
    });
  },
};
