// A big impact: a deep falling sub, a lowpassed noise body that sweeps down, a sharp crack and a
// little tanh drive to thicken the whole thing. Loud on purpose; use it for rare, heavy moments.
export default {
  id: 'game-hit-heavy',
  name: 'Hit Heavy',
  category: 'game',
  tags: ['hit', 'heavy', 'slam', 'smash', 'boss', 'impact', 'thump', 'crit', 'combat'],
  desc: 'A heavy blow landing: deep sub, a body of rumble and a hard crack. For bosses, crits and slams.',
  dur: 0.78,
  family: 'impact',
  moments: ['hit', 'damage'],
  params: {
    weight: { min: 0, max: 1, def: 0.6, desc: 'Heft of the blow: a louder sub and rumble body' },
    pitch: { min: 45, max: 110, def: 70, unit: 'Hz', desc: 'Base note of the falling sub; lower is deeper' },
    crack: { min: 0, max: 1, def: 0.6, desc: 'Level of the hard high crack at the moment of impact' },
    tail: { min: 0.2, max: 0.6, def: 0.38, unit: 's', desc: 'How long the rumble body and sub carry on after the hit' },
  },
  play(T, out, t, p) {
    const bus = T.drive(out, t, { amount: 0.2, ref: 0.15 });
    T.osc(bus, t, {
      f: p.pitch * 2.2, to: p.pitch * 0.5, glide: 0.2, dur: p.tail + 0.1,
      peak: 0.1 + 0.1 * p.weight, a: 0.002,
    });
    T.noise(bus, t, {
      filter: 'lowpass', f: 1800, to: 150, q: 0.8, dur: p.tail, peak: 0.25 + 0.2 * p.weight, a: 0.002,
    });
    T.noise(bus, t, {
      filter: 'highpass', f: 3000, to: 1800, q: 0.8, dur: 0.035, peak: 0.04 + 0.12 * p.crack, a: 0.001,
    });
  },
};
