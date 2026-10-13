// A drawn shot seen from the target's side: the creak of a bow drawing, the arrow's whistle
// closing in, and the thunk where it lands with a short quiver. Not the game arrow shot (the
// twang of the release): this one is the draw, the flight and the arrival, with no string ring.
export default {
  id: 'battle-arch-arrow',
  name: 'Drawn Arrow',
  category: 'battle',
  tags: ['arrow', 'bow', 'drawn', 'whistle', 'thunk', 'ranged', 'attack', 'battle', 'archetype'],
  desc: 'A bow drawn tight, an arrow whistling in and a thunk where it lands. No twang, dry, so it stacks under any element.',
  dur: 0.96,
  family: 'organic',
  params: {
    draw: { min: 0.08, max: 0.35, def: 0.2, unit: 's', desc: 'How long the bow is drawn: a creak of rising tension before the release' },
    flight: { min: 0.1, max: 0.4, def: 0.2, unit: 's', desc: 'How long the arrow whistles in flight' },
    whistle: { min: 1800, max: 4500, def: 2800, unit: 'Hz', desc: 'Note of the whistle as the arrow closes in' },
    thunk: { min: 0, max: 1, def: 0.5, desc: 'Weight of the landing: 0 a light tick, 1 a heavy thud' },
    quiver: { min: 0, max: 1, def: 0.4, desc: 'Level of the short shiver of the shaft after it lands, 0 none' },
  },
  play(T, out, t, p) {
    const r = t + p.draw;
    const h = r + p.flight;
    // the draw: wood and string creaking tighter, a narrow band over a rising tone
    T.osc(out, t, { type: 'triangle', f: 160, to: 235, dur: p.draw, peak: 0.04, a: p.draw * 0.8 });
    T.noise(out, t, { filter: 'bandpass', f: 900, to: 1100, q: 4, dur: p.draw, peak: 0.15, a: p.draw * 0.8 });
    // the flight: a whistle rising as the arrow closes in
    T.noise(out, r, { filter: 'bandpass', f: p.whistle, to: p.whistle * 1.6, q: 3, dur: p.flight, peak: 0.15, a: p.flight * 0.65 });
    T.osc(out, r, { f: p.whistle * 0.73, to: p.whistle * 0.88, dur: p.flight, peak: 0.022, a: p.flight * 0.7 });
    // the landing: a short body, a dry tick of wood, and the shaft shivering
    T.osc(out, h, { f: 340 - 120 * p.thunk, to: 120 - 40 * p.thunk, dur: 0.12, peak: 0.055 + 0.065 * p.thunk, a: 0.002 });
    T.noise(out, h, { filter: 'highpass', f: 2600, to: 1600, q: 0.8, dur: 0.04, peak: 0.06, a: 0.002 });
    if (p.quiver > 0.02) {
      T.osc(out, h + 0.01, { type: 'triangle', f: 330, to: 300, dur: 0.18, peak: 0.04 * p.quiver, a: 0.004, trem: { rate: 28, depth: 0.8 } });
    }
  },
};
