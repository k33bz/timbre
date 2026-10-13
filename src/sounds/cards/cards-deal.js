// A dealer's flick (the Deck Lab sFlick), a skim of air under the card as it crosses the felt, and
// a soft set-down (the sPat landing). Reach is the distance to the player's seat.
export default {
  id: 'cards-deal',
  name: 'Card Deal',
  category: 'cards',
  tags: ['card', 'deal', 'skim', 'felt', 'table', 'toss'],
  desc: 'One card dealt across the table: a flick off the deck, a soft skim over felt and a quiet landing.',
  dur: 0.39,
  params: {
    reach: { min: 0.1, max: 0.32, def: 0.17, unit: 's' },
    tone: { min: 0, max: 1, def: 0.4 },
    land: { min: 0, max: 1, def: 0.6 },
  },
  play(T, out, t, p) {
    const at = t + p.reach;
    T.noise(out, t, { filter: 'highpass', f: 2600 + 900 * p.tone, to: 1800, q: 0.9, dur: 0.034, peak: 0.037, a: 0.002 });
    T.osc(out, t, { type: 'triangle', f: 460 + 160 * p.tone, to: 260, dur: 0.028, peak: 0.01, a: 0.002 });
    // a wide, slow band: the skim must read as air under the card, never as a hit
    T.noise(out, t + 0.012, {
      filter: 'bandpass', f: 1500 + 1300 * p.tone, to: 650 + 350 * p.tone, q: 1.1,
      dur: p.reach + 0.03, peak: 0.125, a: p.reach * 0.35,
    });
    T.noise(out, at, { filter: 'lowpass', f: 1100, to: 480, q: 1, dur: 0.045, peak: 0.025 + 0.038 * p.land, a: 0.002 });
    T.osc(out, at, { f: 200, to: 118, dur: 0.05, peak: 0.01 + 0.038 * p.land, a: 0.003 });
  },
};
