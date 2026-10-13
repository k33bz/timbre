// A card drawn off the top of the deck: its edge drags over the card beneath (a rub that swells
// to the moment it comes free), then a faint snap as it clears the stack. No landing: the card is
// in the hand now, which is what separates a draw from a deal.
export default {
  id: 'cards-draw',
  name: 'Card Draw',
  category: 'cards',
  tags: ['card', 'draw', 'pull', 'deck', 'top', 'pick-up'],
  desc: 'A card drawn off the top of the deck: a rising paper rub that ends in a small snap as it comes free.',
  dur: 0.27,
  params: {
    reach: { min: 0.07, max: 0.22, def: 0.12, unit: 's' },
    tone: { min: 0, max: 1, def: 0.4 },
    snap: { min: 0, max: 1, def: 0.6 },
  },
  play(T, out, t, p) {
    const r = p.reach;
    const end = t + r;
    // the rub swells until the card clears, so the attack takes most of the length
    T.noise(out, t, { filter: 'bandpass', f: 600 + 500 * p.tone, to: 1900 + 1500 * p.tone, q: 1.4, dur: r + 0.02, peak: 0.085, a: r * 0.85 });
    T.noise(out, t, { filter: 'highpass', f: 3600, to: 5200, q: 0.8, dur: r + 0.02, peak: 0.016, a: r * 0.85 });
    T.noise(out, end, { filter: 'highpass', f: 2700 + 900 * p.tone, to: 1900, q: 0.9, dur: 0.03, peak: 0.003 + 0.022 * p.snap, a: 0.002 });
    T.osc(out, end, { type: 'triangle', f: 480 + 140 * p.tone, to: 270, dur: 0.026, peak: 0.002 + 0.007 * p.snap, a: 0.002 });
  },
};
