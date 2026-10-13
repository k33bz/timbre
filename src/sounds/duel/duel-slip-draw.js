// Evasive tempo in five beats: two ghost-edged attackers swoop past across the field, the defender's
// swing misses (a low whiff behind them), a bounce swirl pops it back to hand, the quest pays a couple
// of small gold glass chimes and the trigger flicks cards off the deck.
export default {
  id: 'duel-slip-draw',
  name: 'Slip and Draw',
  category: 'duel',
  tags: ['ink-duel', 'evasive', 'slip', 'swoop', 'bounce', 'draw', 'flick', 'quest', 'lore', 'air'],
  desc: 'Two airy attackers sweep past a defender that swings and misses, a swirl bounces it away, small gold chimes pay out and cards flick off the deck.',
  dur: 1.73,
  family: 'air',
  params: {
    pitch: { min: 0.7, max: 1.5, def: 1, unit: 'x', desc: 'Pitch of the swoops, the bounce and the chimes: low a heavy glide, high a thin one' },
    lore: { min: 1, max: 3, def: 2, step: 1, desc: 'How many small gold chimes the quest pays, each higher than the last' },
    draws: { min: 1, max: 3, def: 1, step: 1, desc: 'How many cards flick off the deck at the end' },
    ghost: { min: 0, max: 1, def: 0.5, desc: 'Level of the faint wavering glassy edge on the swoops, 0 plain air' },
  },
  play(T, out, t, p) {
    const x = p.pitch;
    // two attackers glide past from one side to the other: rushing in, then falling away
    for (let k = 0; k < 2; k++) {
      const at = t + k * 0.15;
      const lane = T.pan(out, at, { x: -0.8, to: 0.8, dur: 0.32 });
      T.noise(lane, at, { filter: 'bandpass', f: 450 * x * (1 + 0.25 * k), to: 3000 * x, q: 1.3, dur: 0.17, peak: 0.15, a: 0.075 });
      T.noise(lane, at + 0.1, { filter: 'bandpass', f: 2600 * x, to: 650 * x, q: 1.8, dur: 0.22, peak: 0.1, a: 0.03 });
      T.osc(lane, at, { f: 760 * x * (1 + 0.25 * k), to: 1500 * x, dur: 0.32, peak: 0.022 * p.ghost + 0.001, a: 0.1, vib: { rate: 9, depth: 45 } });
    }
    // the defender swings and misses: a lower, slower whiff that comes up late
    T.noise(out, t + 0.2, { filter: 'bandpass', f: 280, to: 950, q: 1, dur: 0.22, peak: 0.1, a: 0.09 });
    // the bounce: a swirl that tightens upward and ends in a soft bubbling pop
    const b = t + 0.56;
    T.osc(out, b, { f: 300 * x, to: 1500 * x, dur: 0.26, peak: 0.055, a: 0.04, trem: { rate: 22, depth: 0.5 } });
    T.noise(out, b, { filter: 'bandpass', f: 800 * x, to: 3600 * x, q: 3, dur: 0.26, peak: 0.1, a: 0.1 });
    T.tick(out, b + 0.27, { f: 1500 * x, q: 2, dur: 0.02, peak: 0.07, blip: 700 * x, blipTo: 320 * x, blipPeak: 0.05, blipDur: 0.06 });
    // the quest pays lore: small gold glass chimes, each a whole tone above the last
    const glassy = [[1, 1, 1], [2.32, 0.38, 0.55], [4.1, 0.14, 0.3]];
    const lore = Math.round(p.lore);
    const q0 = t + 0.92;
    for (let k = 0; k < lore; k++) {
      T.bell(out, q0 + k * 0.1, { f: 1175 * x * Math.pow(2, (2 * k) / 12), partials: glassy, dur: k === lore - 1 ? 0.6 : 0.42, peak: 0.075, a: 0.003 });
    }
    // the draw trigger: a short swish from the deck, then a flick per card
    const d0 = q0 + (lore - 1) * 0.1 + 0.27;
    const draws = Math.round(p.draws);
    for (let k = 0; k < draws; k++) {
      const at = d0 + k * 0.075;
      T.noise(out, at - 0.06, { filter: 'bandpass', f: 1400, to: 3400, q: 1, dur: 0.07, peak: 0.055, a: 0.03 });
      T.noise(out, at, { filter: 'highpass', f: 3000 + 250 * k, to: 1800, q: 0.9, dur: 0.034, peak: 0.07, a: 0.002 });
      T.osc(out, at, { type: 'triangle', f: 520 + 60 * k, to: 260, dur: 0.03, peak: 0.024, a: 0.002 });
    }
  },
};
