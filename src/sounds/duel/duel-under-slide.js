// Boost: ink paid, then a card tucked face down under another. One tiny drip for each ink paid, a
// band of paper noise that goes dark as the card slides under, and a small soft click as it settles.
export default {
  id: 'duel-under-slide',
  name: 'Under Slide',
  category: 'duel',
  tags: ['ink-duel', 'boost', 'keyword', 'paper', 'drip', 'click', 'tuck', 'stack'],
  desc: 'Ink dripping to pay, then a card sliding softly under another and settling with a small click. For Boost.',
  dur: 0.54,
  family: 'paper',
  moments: ['ability'],
  params: {
    cost: { min: 0, max: 3, def: 2, step: 1, desc: 'How many ink drips are paid before the card slides: 0 none' },
    slide: { min: 0.08, max: 0.25, def: 0.14, unit: 's', desc: 'How long the card takes to slide under' },
    tone: { min: 0, max: 1, def: 0.4, desc: 'Paper color: 0 dull and dark, 1 crisp and bright' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.cost);
    const gap = 0.075;
    // ink paid: a small soft drip (a sine that bends up, with a glassy edge), one per point
    for (let k = 0; k < n; k++) {
      const at = t + k * gap;
      const f = 720 * T.rand(0.94, 1.06);
      T.osc(out, at, { f: f * 0.7, to: f * 1.5, glide: 0.03, dur: 0.07, peak: 0.04, a: 0.003 });
      T.bell(out, at, { f: f * 3.3, partials: [[1, 1, 1], [2.32, 0.4, 0.5]], dur: 0.08, peak: 0.014, a: 0.002 });
    }
    // the card slides under: paper that darkens as it goes
    const s = t + n * gap + (n > 0 ? 0.03 : 0);
    const L = p.slide;
    T.noise(out, s, {
      filter: 'bandpass', f: 1500 + 2500 * p.tone, to: 700 + 700 * p.tone, q: 0.9, dur: L, peak: 0.105,
      a: L * 0.3, s: 0.6, d: L * 0.15, r: L * 0.45, lp: { f: 6000, to: 1100 },
    });
    // it settles
    T.tick(out, s + L * 0.9, { f: 1700 + 800 * p.tone, q: 1.3, dur: 0.014, peak: 0.07, blip: 140, blipTo: 100, blipPeak: 0.035, blipDur: 0.04 });
  },
};
