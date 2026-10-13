// Each wave is lowpassed noise whose cutoff opens as it builds, then a bandpassed foam fizz that
// arrives just after the crest. A fixed low bandpass underneath is the weight of the sea.
export default {
  id: 'ambience-ocean-surf',
  name: 'Ocean Surf',
  category: 'ambience',
  tags: ['ocean', 'sea', 'surf', 'waves', 'beach', 'shore', 'water', 'bed'],
  desc: 'Waves building and breaking on a beach, each with a hiss of foam, over a low swell. Fades in and out.',
  dur: 8,
  params: {
    length: { min: 3, max: 8, def: 7, unit: 's' },
    period: { min: 2.5, max: 6, def: 4, unit: 's' },
    foam: { min: 0, max: 1, def: 0.5 },
    depth: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    const L = p.length;
    const P = p.period;
    const fade = Math.min(1.2, L * 0.3);
    T.noise(out, t, {
      filter: 'lowpass', f: 130, q: 0.7, dur: L, peak: 0.18 * p.depth + 0.01, a: fade, s: 1, d: 0.02, r: fade,
    });
    const n = Math.max(1, Math.ceil((L - 0.4) / P));
    for (let k = 0; k < n; k++) {
      const at = k === 0 ? 0 : k * P + T.rand(-0.15, 0.15) * P;
      if (L - at < 0.8) continue;
      const len = Math.min(P * 1.3, L - at);
      const a = Math.min(P * 0.38, len * 0.5);
      const big = T.rand(0.75, 1);
      T.noise(out, t + at, {
        filter: 'lowpass', f: 250, to: 1300, q: 0.6, glide: a, dur: len, peak: 0.075 * big, a,
      });
      T.noise(out, t + at + a * 0.8, {
        filter: 'bandpass', f: 4200, to: 2600, q: 0.6,
        dur: Math.min(P * 0.9, L - at - a * 0.8), peak: 0.05 * p.foam * big, a: a * 0.35,
      });
    }
  },
};
