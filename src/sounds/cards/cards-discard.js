// A card tossed onto the discard pile: a flick away, a breath of air, then a duller landing than
// a card on bare felt, with a few paper ticks as it settles on the cards already there. Pile is
// how many are under it: more pile, more rustle and less thump.
export default {
  id: 'cards-discard',
  name: 'Card Discard',
  category: 'cards',
  tags: ['card', 'discard', 'toss', 'pile', 'throw-away', 'muck'],
  desc: 'A card tossed onto the discard pile: a flick, a short flight and a papery landing on the stack.',
  dur: 0.23,
  params: {
    toss: { min: 0, max: 1, def: 0.4 },
    pile: { min: 0, max: 1, def: 0.5 },
    weight: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    const air = 0.03 + 0.1 * p.toss;
    const at = t + 0.02 + 0.1 * p.toss;
    T.noise(out, t, { filter: 'highpass', f: 2700, to: 1800, q: 0.9, dur: 0.03, peak: 0.034, a: 0.002 });
    T.noise(out, t + 0.01, { filter: 'bandpass', f: 1800, to: 700, q: 1.1, dur: air + 0.02, peak: 0.098, a: air * 0.4 });
    const thump = 1 - 0.5 * p.pile;
    T.noise(out, at, { filter: 'lowpass', f: 950, to: 400, q: 1, dur: 0.06, peak: (0.039 + 0.039 * p.weight) * thump, a: 0.002 });
    T.osc(out, at, { f: 175, to: 100, dur: 0.07, peak: (0.013 + 0.052 * p.weight) * thump, a: 0.003 });
    const ticks = 1 + Math.round(4 * p.pile);
    for (let j = 0; j < ticks; j++) {
      T.noise(out, at + 0.006 + j * 0.014, {
        filter: 'bandpass', f: 2300 * T.rand(0.8, 1.4), to: 1400, q: 2, dur: 0.025,
        peak: 0.117 * (0.5 + 0.5 * p.pile) * (1 - 0.14 * j) * T.rand(0.8, 1.2), a: 0.002,
      });
    }
  },
};
