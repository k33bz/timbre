// An early big drop: a dry turn tick, a few extra ink drips jumping into the well one after another
// (each a soft liquid plunk with a glassy edge), a riser that swells for the card on its way and then
// a heavy landing with a low ring, a shimmer of light and a few soft ticks as the ink is spent.
export default {
  id: 'duel-surge-drop',
  name: 'Surge Drop',
  category: 'duel',
  tags: ['ink-duel', 'ink', 'ramp', 'riser', 'land', 'heavy', 'big', 'early', 'surge', 'drop'],
  desc: 'Ink jumps ahead of the curve: quick drips, a swelling rise and a big card landing early with a low ring and a flash of gold.',
  dur: 2.01,
  family: 'impact',
  moments: ['resource'],
  params: {
    drips: { min: 1, max: 3, def: 2, step: 1, desc: 'How many extra ink drips jump into the well before the rise' },
    rise: { min: 0.35, max: 0.8, def: 0.55, unit: 's', desc: 'How long the swell builds before the card lands' },
    weight: { min: 0, max: 1, def: 0.6, desc: 'Heft of the landing: a louder, longer thump and a longer low ring' },
    pitch: { min: 70, max: 140, def: 100, unit: 'Hz', desc: 'Note of the rise, the landing thump and its ring; lower is deeper' },
  },
  play(T, out, t, p) {
    // the turn marker steps: one dry tick
    T.tick(out, t, { f: 2800, q: 3, dur: 0.012, peak: 0.05, blip: 1800, blipPeak: 0.016, blipDur: 0.02 });
    // an ink drip: a falling plunk with a quick liquid rise inside it, a glassy edge and a dark puff
    const drip = (at, up) => {
      T.osc(out, at, { f: 720 * up, to: 250 * up, dur: 0.1, peak: 0.05, a: 0.003 });
      T.osc(out, at + 0.012, { f: 420 * up, to: 980 * up, dur: 0.05, peak: 0.02, a: 0.004 });
      T.noise(out, at, { filter: 'bandpass', f: 2200 * up, q: 2, dur: 0.03, peak: 0.05, a: 0.002 });
      T.osc(out, at, { f: 3300 * up, dur: 0.05, peak: 0.01, a: 0.002 });
      T.noise(out, at + 0.01, { filter: 'lowpass', f: 420, q: 0.8, dur: 0.07, peak: 0.04, a: 0.006 });
    };
    const n = Math.round(p.drips);
    for (let k = 0; k < n; k++) drip(t + 0.11 + k * 0.1, 1 + 0.18 * k);
    // the rise: a saw and a band of noise opening together, cut off sharply at the landing
    const r0 = t + 0.2 + n * 0.1;
    const L = r0 + p.rise;
    const lp = T.filter(out, r0, { type: 'lowpass', f: 260, to: 3800, dur: p.rise, q: 2 });
    T.osc(lp, r0, { type: 'sawtooth', f: p.pitch * 1.2, to: p.pitch * 3.4, dur: p.rise + 0.02, peak: 0.042, a: p.rise * 0.95 });
    T.osc(lp, r0, { type: 'sawtooth', f: p.pitch * 1.2, to: p.pitch * 3.4, dur: p.rise + 0.02, peak: 0.03, a: p.rise * 0.95, detune: 13 });
    T.noise(out, r0, { filter: 'bandpass', f: 500, to: 5500, q: 1.1, dur: p.rise + 0.02, peak: 0.085, a: p.rise * 0.95 });
    // the landing: a deep falling thump, a lowpassed body, a wooden knock and a low metal ring
    const w = p.weight;
    T.osc(out, L, { f: p.pitch * 1.6, to: p.pitch * 0.45, dur: 0.3 + 0.25 * w, peak: 0.08 + 0.055 * w, a: 0.003 });
    T.noise(out, L, { filter: 'lowpass', f: 1400, to: 160, q: 0.8, dur: 0.14 + 0.1 * w, peak: 0.11 + 0.08 * w, a: 0.002 });
    T.noise(out, L, { filter: 'bandpass', f: 1500, to: 900, q: 1.4, dur: 0.05, peak: 0.095, a: 0.001 });
    T.bell(out, L, { f: p.pitch * 2.5, partials: [[1, 1, 1], [2.76, 0.45, 0.6], [5.4, 0.2, 0.35]], dur: 0.35 + 0.35 * w, peak: 0.02, a: 0.002 });
    // light floods the card: a gold glass shimmer
    T.bell(out, L + 0.03, { f: 1320, partials: [[1, 1, 1], [2.32, 0.38, 0.55], [4.1, 0.14, 0.3]], dur: 0.6, peak: 0.03, a: 0.004 });
    // the ink is spent: soft ticks as the pips exert
    for (let k = 0; k < 3; k++) {
      T.tick(out, L + 0.2 + k * 0.07, { f: 1200 + 150 * k, q: 2, dur: 0.02, peak: 0.03, blip: 240, blipPeak: 0.012, blipDur: 0.03 });
    }
  },
};
