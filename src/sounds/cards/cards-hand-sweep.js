// A whole hand swept away into the deck: a flick per card under one swoosh of air, the deck taking
// the cards with a dull bump, then a short riffle as they slide in among the others. The flicks
// are the draw flick turned down and packed close; the riffle is the bridge turned down.
export default {
  id: 'cards-hand-sweep',
  name: 'Hand Sweep',
  category: 'cards',
  tags: ['card', 'hand', 'sweep', 'shuffle-in', 'return', 'deck', 'swoosh', 'bump', 'riffle'],
  desc: 'A hand of cards swept back into the deck: a quick run of flicks under one swoosh, a dull bump, then a short riffle.',
  dur: 1.0,
  family: 'paper',
  moments: ['shuffle'],
  params: {
    cards: { min: 3, max: 8, def: 6, step: 1, desc: 'How many cards are swept, one flick each' },
    gap: { min: 0.025, max: 0.05, def: 0.035, unit: 's', desc: 'Time between flicks: short a quick scoop, long a slower sweep' },
    reach: { min: 0.15, max: 0.4, def: 0.26, unit: 's', desc: 'How far the swoosh carries after the last flick, before the deck bumps' },
    riffle: { min: 0, max: 1, def: 0.6, desc: 'The riffle as the cards slide in: 0 only the bump, 1 a longer, louder ripple' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.cards);
    const last = t + (n - 1) * p.gap;
    // one swoosh over the whole sweep: air rising as the hand moves, hushing as the deck is reached
    const air = (n - 1) * p.gap + p.reach + 0.02;
    T.noise(out, t, { filter: 'bandpass', f: 600, to: 2400, q: 0.9, dur: air, peak: 0.085, a: air * 0.3, tail: 0.15 });
    for (let k = 0; k < n; k++) {
      const at = t + k * p.gap;
      T.noise(out, at, { filter: 'highpass', f: 2870 * T.rand(0.95, 1.05), to: 1800, q: 0.9, dur: 0.034, peak: 0.032 * (1 - 0.03 * k), a: 0.002 });
      T.osc(out, at, { type: 'triangle', f: 556, to: 260, dur: 0.028, peak: 0.009, a: 0.002 });
    }
    // the deck takes them
    const bump = last + p.reach;
    T.osc(out, bump, { f: 150, to: 80, dur: 0.07, peak: 0.06, a: 0.003 });
    T.noise(out, bump, { filter: 'lowpass', f: 500, to: 250, q: 1, dur: 0.05, peak: 0.045, a: 0.002 });
    const ticks = Math.round(7 * p.riffle);
    for (let k = 0; k < ticks; k++) {
      T.noise(out, bump + 0.03 + k * 0.024, {
        filter: 'bandpass', f: T.rand(1500, 2900), to: 900, q: 2.2, dur: 0.045,
        peak: (k === 0 ? 0.12 : 0.09) * (0.5 + 0.5 * p.riffle) * T.rand(0.8, 1.2), a: 0.003,
      });
    }
  },
};
