// A hand dealt round the table: every card is a flick, a short skim and a landing, and each seat
// has its own landing pitch so the deal reads as cards going to different places.
export default {
  id: 'cards-deal-hand',
  name: 'Deal a Hand',
  category: 'cards',
  tags: ['card', 'deal', 'hand', 'round', 'seats', 'start'],
  desc: 'A hand dealt round the table, one card per seat, each landing a little differently.',
  dur: 1.47,
  family: 'paper',
  moments: ['card-draw'],
  params: {
    cards: { min: 2, max: 7, def: 5, step: 1, desc: 'How many cards are dealt, one per seat' },
    gap: { min: 0.1, max: 0.22, def: 0.15, unit: 's', desc: 'Time between one card and the next' },
    spread: { min: 0, max: 1, def: 0.6, desc: 'How much the landing thump pitch differs by seat: 0 all alike, 1 widest' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.cards);
    const seat = [1, 0.84, 1.19, 0.92, 1.06, 0.78, 1.28, 0.97];
    for (let k = 0; k < n; k++) {
      const at = t + k * p.gap;
      const l = 1 - 0.04 * k;
      const f = 200 * (1 + (seat[k] - 1) * p.spread) * T.rand(0.97, 1.03);
      const b = T.rand(0.2, 0.6);
      T.noise(out, at, { filter: 'highpass', f: 2600 + 900 * b, to: 1800, q: 0.9, dur: 0.034, peak: 0.034 * l, a: 0.002 });
      T.noise(out, at + 0.01, { filter: 'bandpass', f: 1900 * seat[k], to: 800, q: 1.1, dur: 0.1, peak: 0.094 * l, a: 0.035 });
      T.noise(out, at + 0.08, { filter: 'lowpass', f: 1100 * seat[k], to: 480, q: 1, dur: 0.045, peak: 0.05 * l, a: 0.002 });
      T.osc(out, at + 0.08, { f, to: f * 0.59, dur: 0.05, peak: 0.038 * l, a: 0.003 });
    }
  },
};
