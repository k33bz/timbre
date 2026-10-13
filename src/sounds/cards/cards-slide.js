// A card (or a small stack) pushed across the table: a soft breathy band of noise that eases in and
// out, with fine grit on top. The Deck Lab slide (retreat, switch, promote) was a single narrow
// band; this one has a length, a direction and a grain you can turn.
export default {
  id: 'cards-slide',
  name: 'Card Slide',
  category: 'cards',
  tags: ['card', 'slide', 'push', 'drag', 'swap', 'felt', 'move'],
  desc: 'A card slid across the felt: a soft breathy glide that falls away from you or rises toward you.',
  dur: 0.52,
  params: {
    length: { min: 0.1, max: 0.5, def: 0.25, unit: 's' },
    pitch: { min: 0.6, max: 1.6, def: 1, unit: 'x' },
    rise: { min: 0, max: 1, def: 0.2 },
    grit: { min: 0, max: 1, def: 0.4 },
  },
  play(T, out, t, p) {
    const L = p.length;
    const from = p.pitch * (1000 - 650 * p.rise);
    const to = p.pitch * (350 + 650 * p.rise);
    // eased in, held, eased out: a sustained envelope, so the glide stays audible for its whole length
    T.noise(out, t, { filter: 'bandpass', f: from, to, q: 1.1, dur: L, peak: 0.16, a: Math.min(0.07, L * 0.3), s: 0.7, d: 0.05, r: Math.min(0.1, L * 0.4) });
    const grains = Math.round(p.grit * L * 60);
    for (let k = 0; k < grains; k++) {
      T.noise(out, t + T.rand(0.01, L - 0.03), { filter: 'bandpass', f: 3200 * p.pitch * T.rand(0.8, 1.3), q: 2.5, dur: 0.012, peak: 0.05, a: 0.002 });
    }
  },
};
