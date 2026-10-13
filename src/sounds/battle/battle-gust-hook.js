// A tether thrown out and a creature dragged in. A fast zip of air flies out with a rising whistle,
// the hook bites with a small metal clink, a ratchet reels the line in (clicks that fit the
// pull) under a long falling whoosh, and the dragged card is set down with a soft pat.
export default {
  id: 'battle-gust-hook',
  name: 'Tether Hook',
  category: 'battle',
  tags: ['hook', 'tether', 'drag', 'pull', 'gust', 'swap', 'switch', 'reel', 'ratchet', 'force-switch', 'card-game'],
  desc: 'A thrown line that hooks and reels something in: a fast zip out, a metal bite, a ratcheting pull and a soft landing. For dragging an opponent into play.',
  dur: 0.9,
  family: 'air',
  params: {
    length: { min: 0.45, max: 0.8, def: 0.68, unit: 's', desc: 'Time from the throw to the landing; the bite comes 40% of the way in' },
    clicks: { min: 3, max: 9, def: 6, step: 1, desc: 'How many ratchet clicks the reel makes' },
    pitch: { min: 1200, max: 2400, def: 1700, unit: 'Hz', desc: 'Note of the metal bite when the hook catches' },
  },
  play(T, out, t, p) {
    const D = p.length;
    const b = D * 0.4;
    // the throw: air and a rising whistle
    T.noise(out, t, { filter: 'bandpass', f: 1200, to: 4200, q: 1.2, dur: 0.12, peak: 0.07, a: 0.01 });
    T.osc(out, t, { type: 'triangle', f: 900, to: 1800, dur: 0.12, peak: 0.017, a: 0.01 });
    // the bite
    T.osc(out, t + b, { f: p.pitch, to: p.pitch * 0.98, dur: 0.12, peak: 0.045, a: 0.002 });
    T.osc(out, t + b, { f: p.pitch * 2.76, to: p.pitch * 2.7, dur: 0.08, peak: 0.022, a: 0.002 });
    T.noise(out, t + b, { filter: 'highpass', f: 4200, to: 3000, q: 0.8, dur: 0.02, peak: 0.028, a: 0.001 });
    // the reel: ratchet clicks spread over the pull, under a falling whoosh
    const n = Math.round(p.clicks);
    const step = Math.max(0.03, (D - b - 0.05) / n);
    for (let k = 0; k < n; k++) {
      T.tick(out, t + b + 0.05 + k * step, { filter: 'highpass', f: 2600, q: 0.8, dur: 0.014, peak: 0.034 * (1 - 0.08 * k), jitter: 0.5 });
    }
    T.noise(out, t + b, { filter: 'bandpass', f: 2400, to: 700, q: 1.1, dur: D - b + 0.05, peak: 0.056, a: 0.03 });
    // the card lands
    T.noise(out, t + D, { filter: 'lowpass', f: 1100, to: 480, q: 1, dur: 0.045, peak: 0.045, a: 0.002 });
    T.osc(out, t + D, { f: 200, to: 118, dur: 0.05, peak: 0.04, a: 0.003 });
  },
};
