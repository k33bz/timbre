// A card turned face up: a fingertip scrape as the edge lifts, the paper snap as it pivots over,
// and a lighter set-down than a plain place. Speed scales the whole gesture.
export default {
  id: 'cards-flip',
  name: 'Card Flip',
  category: 'cards',
  tags: ['card', 'flip', 'turn', 'reveal', 'face-up', 'show'],
  desc: 'A card turned face up: a small scrape, a crisp snap at the turn and a light landing.',
  dur: 0.32,
  family: 'paper',
  moments: ['card-flip'],
  params: {
    speed: { min: 0.6, max: 1.8, def: 1, unit: 'x', desc: 'Pace of the whole gesture: low slow and drawn out, high quick' },
    snap: { min: 0, max: 1, def: 0.6, desc: 'Strength of the paper snap at the turn: 0 faint, 1 crisp' },
    tone: { min: 0, max: 1, def: 0.4, desc: 'Brightness of the scrape and snap: 0 dark, 1 bright' },
  },
  play(T, out, t, p) {
    const s = 1 / p.speed;
    const turn = t + 0.07 * s;
    const land = t + 0.15 * s;
    T.noise(out, t, { filter: 'bandpass', f: 1300 + 600 * p.tone, to: 2800 + 800 * p.tone, q: 1.3, dur: 0.07 * s, peak: 0.083, a: 0.03 * s });
    T.noise(out, turn, { filter: 'highpass', f: 2800 + 900 * p.tone, to: 1900, q: 0.9, dur: 0.034, peak: 0.009 + 0.048 * p.snap, a: 0.002 });
    T.osc(out, turn, { type: 'triangle', f: 520 + 160 * p.tone, to: 280, dur: 0.028, peak: 0.005 + 0.015 * p.snap, a: 0.002 });
    T.noise(out, land, { filter: 'lowpass', f: 1300, to: 560, q: 1, dur: 0.04, peak: 0.048, a: 0.002 });
    T.osc(out, land, { f: 220, to: 130, dur: 0.045, peak: 0.033, a: 0.003 });
  },
};
