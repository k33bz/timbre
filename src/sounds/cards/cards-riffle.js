// Ported from the Deck Lab shuffle: a train of bandpassed noise micro-bursts, each card at a
// slightly different pitch and level, the first one a little louder. The sound of a bridge.
export default {
  id: 'cards-riffle',
  name: 'Deck Riffle',
  category: 'cards',
  tags: ['card', 'deck', 'riffle', 'shuffle', 'paper', 'bridge'],
  desc: 'A deck riffled together: a quick ripple of paper ticks, never two quite alike.',
  dur: 0.55,
  params: {
    cards: { min: 3, max: 14, def: 6, step: 1 },
    gap: { min: 0.014, max: 0.035, def: 0.022, unit: 's' },
    pitch: { min: 800, max: 2600, def: 1500, unit: 'Hz' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.cards);
    for (let k = 0; k < n; k++) {
      T.noise(out, t + k * p.gap, {
        filter: 'bandpass', f: p.pitch * T.rand(1, 1.93), to: p.pitch * 0.6, q: 2.2,
        dur: 0.045, peak: (k === 0 ? 0.135 : 0.104) * T.rand(0.75, 1.25), a: 0.003,
      });
    }
  },
};
