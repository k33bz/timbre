// A card turned sideways to pay or act, or stood upright again. The card pivots on one corner and
// drags a curve of paper over the felt (a swell of band-passed noise that sweeps up as it turns
// over, down as it turns back), with a tiny tick as the corner lifts and a soft pat as it
// settles. Tapping settles heavier; readying settles lighter and squares up with a second tick.
export default {
  id: 'cards-tap',
  name: 'Card Tap',
  category: 'cards',
  tags: ['card', 'tap', 'untap', 'turn', 'sideways', 'rotate', 'exert', 'ready', 'felt'],
  desc: 'A card turned sideways on the felt with a short paper drag and a soft pat, or, switched off, stood back upright with a lighter settle.',
  dur: 0.24,
  family: 'paper',
  moments: ['card-tap'],
  params: {
    on: { min: 0, max: 1, def: 1, step: 1, role: 'on', desc: '1 turns the card sideways with a firm settle, 0 stands it up with a lighter one' },
    speed: { min: 0.6, max: 1.8, def: 1, unit: 'x', desc: 'Pace of the turn: low slow and drawn out, high quick' },
    weight: { min: 0, max: 1, def: 0.5, desc: 'Heft of the settle: 0 barely touches, 1 a firm pat' },
    tone: { min: 0, max: 1, def: 0.4, desc: 'Brightness of the paper drag: 0 dark felt, 1 bright and papery' },
  },
  play(T, out, t, p) {
    const s = 1 / p.speed;
    const tap = p.on >= 0.5;
    const turn = 0.1 * s;
    const lo = 650 + 400 * p.tone;
    const hi = 1700 + 900 * p.tone;
    // the corner lifts
    T.noise(out, t, { filter: 'highpass', f: 3000, to: 2200, q: 0.8, dur: 0.016, peak: tap ? 0.018 : 0.011, a: 0.002 });
    // the drag: rises as the card turns over to its side, falls as it turns back
    T.noise(out, t + 0.012, { filter: 'bandpass', f: tap ? lo : hi, to: tap ? hi : lo, q: 1.3, dur: turn, peak: tap ? 0.1 : 0.08, a: turn * 0.45 });
    // the settle
    const at = t + 0.012 + turn;
    const h = tap ? 0.3 + 0.7 * p.weight : 0.15 + 0.45 * p.weight;
    T.noise(out, at, { filter: 'lowpass', f: tap ? 1000 : 1300, to: tap ? 450 : 600, q: 1, dur: 0.04, peak: 0.07 * h, a: 0.002 });
    T.osc(out, at, { f: tap ? 190 : 230, to: tap ? 110 : 140, dur: 0.05, peak: 0.075 * h, a: 0.003 });
    // the corner touching down, or the card squaring up
    T.noise(out, at - 0.004, { filter: 'bandpass', f: 2200 + 400 * p.tone, q: 2.5, dur: 0.012, peak: 0.04 * (0.5 + 0.5 * h), a: 0.001 });
    if (!tap) T.noise(out, at + 0.035, { filter: 'bandpass', f: 2600, to: 2000, q: 2.5, dur: 0.012, peak: 0.03 * h + 0.012, a: 0.001 });
  },
};
