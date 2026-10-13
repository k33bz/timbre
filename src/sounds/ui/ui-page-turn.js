// A page turned: a slow bandpassed air sweep, a few high paper rustles scattered through it, and a soft
// landing as the page settles. Longer and softer than the card flick. Air family.
export default {
  id: 'ui-page-turn',
  name: 'Page Turn',
  category: 'ui',
  tags: ['page', 'turn', 'paper', 'next', 'book', 'swipe', 'air'],
  desc: 'A paper page turned: a soft sweep of air, light rustles and a quiet landing. For pagers, carousels and readers.',
  dur: 0.35,
  params: {
    length: { min: 0.14, max: 0.34, def: 0.22, unit: 's' },
    rustle: { min: 0, max: 1, def: 0.5 },
    bright: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    const len = p.length;
    T.noise(out, t, {
      filter: 'bandpass', f: 700 + 400 * p.bright, to: 2400 + 2000 * p.bright, q: 0.8,
      dur: len, a: len * 0.35, peak: 0.1,
    });
    for (let k = 0; k < 3; k++) {
      T.noise(out, t + len * (0.15 + 0.55 * T.rand()), { filter: 'highpass', f: 3500, q: 0.8, dur: 0.02, peak: 0.03 * p.rustle, a: 0.002 });
    }
    T.osc(out, t + len * 0.8, { f: 200, to: 140, dur: 0.06, peak: 0.03, a: 0.004 });
  },
};
