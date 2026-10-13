// An overhand shuffle: the deck is held in one hand and chunks are peeled off the back into the
// other. Each chunk is a short dry ripple of paper that gets shorter as the stock runs down; a
// soft pat squares the deck at the end. Unlike the riffle it is a series of separate "thrrp" sounds.
export default {
  id: 'cards-shuffle-overhand',
  name: 'Overhand Shuffle',
  category: 'cards',
  tags: ['card', 'shuffle', 'overhand', 'paper', 'deck', 'chunks'],
  desc: 'An overhand shuffle: separate short ripples of paper as chunks drop off the deck, then a pat to square it.',
  dur: 1.31,
  family: 'paper',
  moments: ['shuffle'],
  params: {
    chunks: { min: 3, max: 7, def: 5, step: 1, desc: 'How many chunks are peeled off the deck' },
    pace: { min: 0.1, max: 0.17, def: 0.12, unit: 's', desc: 'Time between chunks' },
    pitch: { min: 800, max: 2400, def: 1400, unit: 'Hz', desc: 'Base frequency of the paper ripples: low dull, high crisp' },
    square: { min: 0, max: 1, def: 0.5, desc: 'Closing pat that squares the deck: 0 barely there, 1 firm' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.chunks);
    for (let k = 0; k < n; k++) {
      const at = t + k * p.pace;
      const ticks = Math.max(3, 7 - k);
      const l = 1 - 0.05 * k;
      for (let j = 0; j < ticks; j++) {
        T.noise(out, at + j * 0.009, {
          filter: 'bandpass', f: p.pitch * T.rand(0.85, 1.7), to: p.pitch * 0.6, q: 1.8,
          dur: 0.03, peak: (j === 0 ? 0.125 : 0.095) * l * T.rand(0.75, 1.2), a: 0.002,
        });
      }
      // the hand shifting under the chunk
      T.noise(out, at, { filter: 'lowpass', f: 700, to: 350, q: 1, dur: 0.05, peak: 0.02 * l, a: 0.004 });
    }
    const end = t + n * p.pace + 0.04;
    T.noise(out, end, { filter: 'lowpass', f: 1000, to: 450, q: 1, dur: 0.05, peak: 0.01 + 0.04 * p.square, a: 0.002 });
    T.osc(out, end, { f: 190, to: 110, dur: 0.06, peak: 0.003 + 0.03 * p.square, a: 0.003 });
  },
};
