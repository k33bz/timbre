// A character is played and lands damp: a soft wet pat, a few beads of ink falling off it, then
// the colour floods in as a pair of soft tones opening behind a lowpass (wet to dry), ending in one
// tiny glass tip. The pat borrows the Deck Lab card-place idea but is duller and wetter.
export default {
  id: 'duel-card-land',
  name: 'Card Land',
  category: 'duel',
  tags: ['ink-duel', 'card', 'land', 'play', 'character', 'wet', 'dry', 'pat', 'drips'],
  desc: 'A card landing damp with a soft pat, beads of ink falling from it, then a warm shimmer opening as it dries. For playing a character.',
  dur: 0.7,
  family: 'soft',
  params: {
    weight: { min: 0, max: 1, def: 0.5, desc: 'Heft of the landing pat: 0 light, 1 a deeper thump' },
    beads: { min: 0, max: 5, def: 3, step: 1, desc: 'How many beads of ink fall off the card after it lands' },
    dry: { min: 0, max: 1, def: 0.6, desc: 'The shimmer as the card dries: 0 none, 1 a full warm bloom with a glass tip' },
  },
  play(T, out, t, p) {
    const w = p.weight;
    // the landing: a lowpassed pat over a short thump, both dulled so the card sounds damp
    T.noise(out, t, { filter: 'lowpass', f: 1100, to: 280, q: 1, dur: 0.06, peak: 0.09 + 0.06 * w, a: 0.002 });
    T.osc(out, t, { f: 190 - 30 * w, to: 100 - 15 * w, dur: 0.075, peak: 0.03 + 0.08 * w, a: 0.003 });
    // beads falling off the wet card, each a small bent plink, a little quieter than the last
    const n = Math.round(p.beads);
    for (let k = 0; k < n; k++) {
      const f = T.rand(650, 1250);
      T.osc(out, t + 0.07 + k * 0.065 + T.rand(0, 0.02), { f, to: f * 1.45, glide: 0.025, dur: 0.07, peak: 0.032 * (1 - 0.12 * k), a: 0.002 });
    }
    // drying: the colour floods in, two soft tones opening behind a lowpass
    const dry = t + 0.2;
    const lp = T.filter(out, dry, { type: 'lowpass', f: 420, to: 4200, dur: 0.4, q: 1.2 });
    T.osc(lp, dry, { type: 'triangle', f: 784, dur: 0.5, peak: 0.036 * p.dry, a: 0.2, s: 0.7, d: 0.08, r: 0.2 });
    T.osc(lp, dry, { f: 1175, dur: 0.5, peak: 0.024 * p.dry, a: 0.22, s: 0.7, d: 0.08, r: 0.2 });
    T.bell(out, dry + 0.25, { f: 3136, partials: [[1, 1, 1], [2.32, 0.4, 0.5]], dur: 0.25, peak: 0.016 * p.dry, a: 0.003 });
  },
};
