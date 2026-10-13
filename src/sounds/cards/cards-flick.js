// Ported from the Deck Lab card flick (sFlick: a highpassed paper snap over a tiny triangle body)
// and its draw fan, where each later card lands a touch brighter and softer.
export default {
  id: 'cards-flick',
  name: 'Card Flick',
  category: 'cards',
  tags: ['card', 'flick', 'paper', 'draw', 'deal', 'snap'],
  desc: 'A playing card flicked off the deck, or a short fan of them dealt one after another.',
  dur: 0.65,
  params: {
    count: { min: 1, max: 6, def: 1, step: 1 },
    gap: { min: 0.045, max: 0.12, def: 0.07, unit: 's' },
    bright: { min: 0, max: 1, def: 0.3 },
  },
  play(T, out, t, p) {
    const n = Math.round(p.count);
    for (let k = 0; k < n; k++) {
      const at = t + k * p.gap;
      const l = 1 - 0.06 * k;
      const b = Math.min(1, p.bright + k / 12);
      T.noise(out, at, { filter: 'highpass', f: 2600 + 900 * b, to: 1800, q: 0.9, dur: 0.034, peak: 0.037 * l, a: 0.002 });
      T.osc(out, at, { type: 'triangle', f: 460 + 160 * b, to: 260, dur: 0.028, peak: 0.011 * l, a: 0.002 });
    }
  },
};
