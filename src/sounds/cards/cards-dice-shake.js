// Dice rattled in a hand or a cup. The shake is a handful of back-and-forth strokes; at each turn
// the dice clatter against each other and the walls (hard noise ticks with a wooden tock under
// them) and the cup gives a low knock. The whole rattle swells in the middle and eases out.
export default {
  id: 'cards-dice-shake',
  name: 'Dice Shake',
  category: 'cards',
  tags: ['dice', 'shake', 'rattle', 'cup', 'roll', 'craps', 'board-game'],
  desc: 'Dice shaken in a cup: bursts of hard little clacks at each stroke, swelling and fading.',
  dur: 1.0,
  params: {
    shakes: { min: 2, max: 5, def: 4, step: 1 },
    length: { min: 0.35, max: 0.95, def: 0.6, unit: 's' },
    pitch: { min: 0.7, max: 1.5, def: 1, unit: 'x' },
    dice: { min: 1, max: 4, def: 2, step: 1 },
  },
  play(T, out, t, p) {
    const n = Math.round(p.shakes);
    const per = p.length / n;
    // a faint steady rattle of dice sliding over each other, under the clacks
    T.noise(out, t, { filter: 'bandpass', f: 2200 * p.pitch, to: 1800 * p.pitch, q: 0.9, dur: p.length + 0.05, peak: 0.016, a: p.length * 0.4 });
    const many = 4 + 3 * Math.round(p.dice);
    for (let s = 0; s < n; s++) {
      const centre = t + per * (s + 0.5);
      const u = (s + 0.5) / n;
      const swell = 0.45 + 0.55 * Math.sin(Math.PI * u);
      T.noise(out, centre - per * 0.45, { filter: 'lowpass', f: 520, to: 260, q: 1, dur: 0.05, peak: 0.03 * swell, a: 0.004 });
      for (let j = 0; j < many; j++) {
        const at = centre + per * T.rand(-0.42, 0.42);
        const f = 2400 * p.pitch * T.rand(0.7, 1.5);
        const l = swell * T.rand(0.55, 1.15);
        T.noise(out, at, { filter: 'bandpass', f, to: f * 0.8, q: 2.5, dur: 0.02, peak: 0.1 * l, a: 0.001 });
        T.osc(out, at, { f: 900 * p.pitch * T.rand(0.8, 1.3), to: 500 * p.pitch, dur: 0.02, peak: 0.016 * l, a: 0.001 });
      }
    }
  },
};
