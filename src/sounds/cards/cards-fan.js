// A hand of cards fanned open with the thumb: each card slips over the one below it, a fine tick
// that climbs in pitch, over a soft swell of air. Unlike the riffle (random ticks of a bridge) the
// pitch rises steadily and the ticks are evenly spaced, like a ratchet opening.
export default {
  id: 'cards-fan',
  name: 'Fan Out Hand',
  category: 'cards',
  tags: ['card', 'fan', 'spread', 'hand', 'ratchet', 'show'],
  desc: 'A hand of cards fanned open: a quick climbing ratchet of paper ticks over a breath of air.',
  dur: 0.57,
  family: 'paper',
  moments: ['card-flip'],
  params: {
    cards: { min: 4, max: 13, def: 8, step: 1, desc: 'How many cards tick past as the hand opens' },
    length: { min: 0.15, max: 0.5, def: 0.28, unit: 's', desc: 'Time to fan the whole hand open' },
    bright: { min: 0, max: 1, def: 0.5, desc: 'Frequency of the ticks and air swell: 0 darker, 1 brighter' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.cards);
    for (let k = 0; k < n; k++) {
      const u = k / (n - 1);
      const f = (1600 + 1800 * p.bright) * (1 + 0.6 * u) * T.rand(0.96, 1.04);
      const l = 0.75 + 0.25 * Math.sin(Math.PI * u);
      T.noise(out, t + p.length * u, { filter: 'bandpass', f, to: f * 0.7, q: 2.8, dur: 0.016, peak: 0.12 * l * T.rand(0.85, 1.15), a: 0.002 });
    }
    T.noise(out, t, { filter: 'bandpass', f: 800 + 400 * p.bright, to: 2600 + 800 * p.bright, q: 0.9, dur: p.length + 0.05, peak: 0.06, a: p.length * 0.45 });
  },
};
