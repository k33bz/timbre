// A table wash: a deck spread face down and mixed with both palms in wide circles. Each hand makes
// its own sweeping strokes of paper over felt (a broad swell of noise whose band glides up on one
// stroke and down on the next, the two hands overlapping in the left and right ears) over a faint
// felt bed, with a scatter of fine paper grit from the cards rubbing on each other.
export default {
  id: 'cards-wash',
  name: 'Table Wash',
  category: 'cards',
  tags: ['card', 'wash', 'shuffle', 'mix', 'table', 'spread', 'circles', 'felt', 'hands'],
  desc: 'A deck mixed with both hands in wide circles on the table: overlapping paper sweeps in each ear and a scatter of fine grit.',
  dur: 1.46,
  family: 'paper',
  moments: ['shuffle'],
  params: {
    length: { min: 0.5, max: 1.2, def: 0.9, unit: 's', desc: 'How long the wash lasts' },
    strokes: { min: 4, max: 10, def: 7, step: 1, desc: 'How many sweeps the hands make, alternating left and right' },
    grit: { min: 0, max: 1, def: 0.5, desc: 'Fine paper grit on top: 0 smooth felt, 1 gritty cards' },
    tone: { min: 0, max: 1, def: 0.5, desc: 'Brightness of the sweeps: 0 dark, 1 bright and airy' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.strokes);
    const L = p.length;
    const step = L / n;
    const len = step * 1.8;
    const hands = [T.pan(out, t, { x: -0.45 }), T.pan(out, t, { x: 0.45 })];
    const mid = 800 + 700 * p.tone;
    for (let k = 0; k < n; k++) {
      const up = k % 4 < 2;
      const f = mid * T.rand(0.85, 1.15);
      const l = 0.75 + 0.25 * Math.sin(Math.PI * (k + 0.5) / n);
      T.noise(hands[k % 2], t + k * step, {
        filter: 'bandpass', f: up ? f * 0.65 : f * 1.4, to: up ? f * 1.4 : f * 0.65, q: 0.9,
        dur: len, peak: 0.11 * l * T.rand(0.85, 1.1), a: len * 0.35, s: 0.35, d: len * 0.2, r: len * 0.35,
      });
    }
    // the felt under the cards, and the grit between them (one scatter per hand)
    T.noise(out, t, { filter: 'bandpass', f: 420, to: 650, q: 0.7, dur: L + step * 0.8, peak: 0.03, a: L * 0.4 });
    const rate = 15 + 110 * p.grit;
    for (let h = 0; h < 2; h++) {
      T.crackle(hands[h], t, { dur: L + step * 0.6, rate, f: 2800 + 800 * p.tone, spread: 0.5, q: 2, len: 0.008, peak: 0.07 * p.grit + 0.01, vary: 0.7 });
    }
  },
};
