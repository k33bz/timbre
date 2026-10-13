// A split-flap board changing: each character is a stack of hinged cards that fall one after
// another, every card a short hollow clack. The characters start a beat apart so the clatter rolls
// across the board, and each one finishes on a firmer, lower clack where its last card lands.
// Timing and level wander a little (seeded) so the rattle never sounds stamped. The level of each
// clack eases down as characters are added so a full board is busier but not louder.
export default {
  id: 'data-split-flap',
  name: 'Flap Clack',
  category: 'data',
  tags: ['split-flap', 'flip-clock', 'flap', 'clack', 'departures', 'board', 'digit', 'clatter', 'ticker', 'counter', 'tick'],
  desc: 'A rolling clatter of hinged cards falling, character by character, each landing on a firmer clack: for a split-flap board or flip clock changing.',
  dur: 0.92,
  family: 'mechanical',
  moments: ['data-tick'],
  params: {
    digits: { min: 1, max: 8, def: 4, step: 1, desc: 'Characters changing, starting one after another across the board' },
    cards: { min: 3, max: 8, def: 6, step: 1, desc: 'Cards each character flips through before it lands' },
    speed: { min: 0.03, max: 0.05, def: 0.04, unit: 's', desc: 'Time between cards: short a fast rattle, long a lazy fall' },
    tone: { min: 0, max: 1, def: 0.5, desc: 'Material: 0 soft cardboard flicks, 1 hard plastic clacks' },
  },
  play(T, out, t, p) {
    const nd = Math.round(p.digits);
    const nc = Math.round(p.cards);
    const sp = p.speed;
    const lag = sp * 1.3;
    const lv = 0.1 / Math.sqrt(1 + 0.45 * (nd - 1));
    const band = 1700 + 2300 * p.tone;
    for (let d = 0; d < nd; d++) {
      const start = t + d * lag + T.rand(0, 0.3) * sp;
      for (let c = 0; c < nc; c++) {
        const at = start + c * sp + T.rand(0, 0.15) * sp;
        if (c < nc - 1) {
          T.tick(out, at, { f: band, q: 1.3, dur: 0.009, peak: lv, blip: 190, blipTo: 140, blipPeak: lv * 0.3, blipDur: 0.018, jitter: 0.8 });
        } else {
          // the last card lands flat: lower, rounder and a little louder
          T.tick(out, at, { f: band * 0.6, q: 1, dur: 0.014, peak: lv * 1.4, blip: 130, blipTo: 85, blipPeak: lv * 0.7, blipDur: 0.04, jitter: 0.4 });
        }
      }
    }
  },
};
