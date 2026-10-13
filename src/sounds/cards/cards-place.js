// The Deck Lab sPat: a card set down softly, a lowpassed noise puff over a short sine thump.
// Tone moves the noise from felt (dark) towards wood (bright); drop adds the paper tick of a card
// let go from a little height.
export default {
  id: 'cards-place',
  name: 'Card Place',
  category: 'cards',
  tags: ['card', 'place', 'pat', 'set-down', 'felt', 'table', 'land'],
  desc: 'A single card set down on the table with a soft pat, felt-dark or wood-bright.',
  dur: 0.09,
  family: 'paper',
  moments: ['drop'],
  params: {
    weight: { min: 0, max: 1, def: 0.5, desc: 'Heft of the pat: 0 light, 1 louder with a deeper thump' },
    tone: { min: 0, max: 1, def: 0.35, desc: 'Surface color: 0 felt-dark, 1 wood-bright' },
    drop: { min: 0, max: 1, def: 0.2, desc: 'Height the card falls from: adds a paper tick and a slightly later landing' },
  },
  play(T, out, t, p) {
    const f = 700 + 900 * p.tone;
    if (p.drop > 0.02) {
      T.noise(out, t, { filter: 'highpass', f: 2800, to: 2000, q: 0.9, dur: 0.02, peak: 0.004 + 0.04 * p.drop, a: 0.002 });
    }
    const at = t + 0.012 * p.drop;
    T.noise(out, at, { filter: 'lowpass', f, to: f * 0.44, q: 1, dur: 0.045, peak: 0.05 + 0.033 * p.weight, a: 0.002 });
    T.osc(out, at, { f: 200 - 30 * p.weight, to: 118 - 18 * p.weight, dur: 0.055, peak: 0.016 + 0.065 * p.weight, a: 0.003 });
  },
};
