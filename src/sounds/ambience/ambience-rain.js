// A broad hiss for the wash of many drops, scattered tick-sized noise bursts for single drops on
// leaves, and a few tiny rising sine plinks for drops landing in puddles.
export default {
  id: 'ambience-rain',
  name: 'Rain',
  category: 'ambience',
  tags: ['rain', 'drizzle', 'downpour', 'weather', 'water', 'outdoor', 'bed'],
  desc: 'Rain on leaves and puddles, from a drizzle to a steady downpour. Fades in and out.',
  dur: 8,
  loop: true,
  family: 'organic',
  moments: ['ambience'],
  params: {
    length: { min: 3, max: 8, def: 6, unit: 's', desc: 'Total duration of the bed, fades included' },
    rate: { min: 0, max: 1, def: 0.5, desc: 'Rain intensity: 0 light drizzle to 1 steady downpour, more drops and plinks' },
    tone: { min: 0, max: 1, def: 0.5, desc: 'Brightness of the hiss, drops and plinks: 0 dull, 1 bright' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const fade = Math.min(1, L * 0.25);
    const win = (x) => Math.min(1, x / fade, (L - x) / fade);
    const hi = 2200 + 3300 * p.tone;
    // the wash
    T.noise(out, t, {
      filter: 'bandpass', f: hi, q: 0.5, dur: L, peak: 0.011 + 0.026 * p.rate, a: fade, s: 1, d: 0.02, r: fade,
    });
    // single drops, thinning out at both ends
    const n = Math.round(L * (4 + 22 * p.rate));
    for (let k = 0; k < n; k++) {
      const at = T.rand(0.05, L - 0.1);
      T.noise(out, t + at, {
        filter: 'bandpass', f: hi * T.rand(0.7, 1.6), q: 2.5, dur: T.rand(0.015, 0.04),
        peak: 0.07 * T.rand(0.3, 1) * win(at), a: 0.002,
      });
    }
    // puddle plinks
    const m = Math.round(L * (1 + 5 * p.rate));
    for (let k = 0; k < m; k++) {
      const at = T.rand(0.1, L - 0.2);
      const f = T.rand(700, 1900) * (0.8 + 0.5 * p.tone);
      T.osc(out, t + at, { f, to: f * 1.6, glide: 0.04, dur: 0.08, peak: 0.016 * T.rand(0.5, 1) * win(at), a: 0.003 });
    }
  },
};
