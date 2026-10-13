// A location is played: a wide card slides in on a low sweep, a banner unrolls above it in two
// cloth flaps (the second lower and softer), and a small gold chime ticks for the lore it will pay
// every turn. A location is bigger and slower than a character, so the sweep sits low.
export default {
  id: 'duel-banner-raise',
  name: 'Banner Raise',
  category: 'duel',
  tags: ['ink-duel', 'location', 'banner', 'play', 'sweep', 'cloth', 'flap', 'chime', 'card'],
  desc: 'A wide location card sliding in on a low sweep, a banner unrolling in two cloth flaps and a small gold chime for its lore.',
  dur: 0.84,
  family: 'air',
  params: {
    slide: { min: 0.15, max: 0.35, def: 0.26, unit: 's', desc: 'Length of the low sweep as the card slides in' },
    cloth: { min: 0, max: 1, def: 0.6, desc: 'Level of the two cloth flaps as the banner unrolls, 0 none' },
    chime: { min: 0, max: 1, def: 0.6, desc: 'Level of the small gold chime that follows, 0 none' },
  },
  play(T, out, t, p) {
    const S = p.slide;
    // the wide card slides in: a low breathy sweep that swells and settles, a deep tone beneath
    T.noise(out, t, { filter: 'bandpass', f: 220, to: 720, q: 1, dur: S, peak: 0.16, a: S * 0.55, s: 0.6, d: 0.05, r: S * 0.3 });
    T.osc(out, t, { f: 80, to: 130, dur: S, peak: 0.05, a: S * 0.55, s: 0.6, d: 0.05, r: S * 0.3 });
    // the banner unrolls: two cloth flaps, the second lower and softer, each a lowpassed puff
    const f1 = t + S * 0.7;
    T.noise(out, f1, { filter: 'bandpass', f: 800, to: 380, q: 2.4, dur: 0.1, peak: 0.4 * p.cloth, a: 0.012 });
    T.noise(out, f1 + 0.12, { filter: 'bandpass', f: 600, to: 300, q: 2.4, dur: 0.1, peak: 0.3 * p.cloth, a: 0.012 });
    // the gold chime for the lore it pays: two glass partials, a fourth apart in pitch
    const at = f1 + 0.22;
    const glass = [[1, 1, 1], [2.32, 0.42, 0.55], [4.25, 0.2, 0.34]];
    T.bell(out, at, { f: 1568, partials: glass, dur: 0.32, peak: 0.05 * p.chime, a: 0.002 });
    T.bell(out, at + 0.07, { f: 2093, partials: glass, dur: 0.3, peak: 0.05 * p.chime, a: 0.002 });
  },
};
