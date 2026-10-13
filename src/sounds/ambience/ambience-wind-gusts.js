// Bandpassed noise for the steady air, a few slow swells that sweep their pitch for the gusts, and
// one very narrow noise band drifting upward for the thin whistle through a gap.
export default {
  id: 'ambience-wind-gusts',
  name: 'Wind Gusts',
  category: 'ambience',
  tags: ['wind', 'gust', 'breeze', 'storm', 'outdoor', 'bed', 'loop'],
  desc: 'An open-air wind bed: steady air with slow gusts rolling through and a faint whistle. Fades in and out.',
  dur: 8,
  params: {
    length: { min: 3, max: 8, def: 6, unit: 's' },
    gust: { min: 0, max: 1, def: 0.55 },
    pitch: { min: 0.6, max: 1.6, def: 1, unit: 'x' },
    whistle: { min: 0, max: 1, def: 0.25 },
  },
  play(T, out, t, p) {
    const L = p.length;
    const fade = Math.min(1.3, L * 0.3);
    // a higher band passes more of the noise: trim it so the level holds as pitch moves
    const comp = 1 / Math.sqrt(p.pitch);
    T.noise(out, t, {
      filter: 'bandpass', f: 380 * p.pitch, q: 0.9, dur: L, peak: 0.055 * comp, a: fade, s: 1, d: 0.02, r: fade,
    });
    // gusts: one swell per two seconds, each rising or falling in pitch as it passes
    const n = Math.max(1, Math.round(L / 2));
    const span = L / n;
    for (let k = 0; k < n; k++) {
      const at = k * span + T.rand(0, span * 0.3);
      const len = Math.min(span * T.rand(1.3, 1.7), L - at);
      const up = T.rand() < 0.5;
      T.noise(out, t + at, {
        filter: 'bandpass', f: (up ? 260 : 700) * p.pitch, to: (up ? 700 : 260) * p.pitch, q: 1.4,
        dur: len, peak: 0.17 * p.gust * comp * T.rand(0.7, 1), a: len * 0.4,
      });
    }
    // the whistle: a narrow band is a nearly pure tone, so it needs a much higher peak to be heard
    T.noise(out, t + L * 0.2, {
      filter: 'bandpass', f: 1150 * p.pitch, to: 1500 * p.pitch, q: 22,
      dur: L * 0.65, peak: 0.16 * p.whistle * comp, a: L * 0.25,
    });
  },
};
