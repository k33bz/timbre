// A heel on a hard floor: a sharp click, a knock from the body of the floor and, on stone, a tiny
// ring. Surface slides from wood (dull, lower knock) to stone (bright click, ring). Quiet because
// it repeats; T.rand varies every step.
export default {
  id: 'game-footstep-hard',
  name: 'Footstep Hard',
  category: 'game',
  tags: ['footstep', 'step', 'walk', 'run', 'stone', 'wood', 'floor', 'heel', 'hard'],
  desc: 'A step on wood, tile or stone: a crisp tap with a knock under it. Use Vary for a walking rhythm.',
  dur: 0.2,
  family: 'organic',
  moments: ['footstep'],
  params: {
    surface: { min: 0, max: 1, def: 0.5, desc: 'Floor material: 0 wood with a dull, lower knock, 1 stone with a bright click and ring' },
    weight: { min: 0, max: 1, def: 0.5, desc: 'How heavy the step is: a louder knock and a stronger low thud under it' },
    pitch: { min: 0.7, max: 1.5, def: 1, unit: 'x', desc: 'Scales the tuning of the whole step: click, knock, thud and ring' },
  },
  play(T, out, t, p) {
    const j = T.rand(0.92, 1.08) * p.pitch;
    const l = T.rand(0.85, 1.15);
    T.noise(out, t, {
      filter: 'bandpass', f: (2000 + 2200 * p.surface) * j, q: 1.2,
      dur: 0.02, peak: (0.05 + 0.03 * p.surface) * l, a: 0.001,
    });
    T.osc(out, t, {
      type: 'triangle', f: (280 - 70 * p.surface) * j, to: (150 - 30 * p.surface) * j,
      dur: 0.07, peak: (0.025 + 0.014 * p.weight) * l, a: 0.002,
    });
    T.osc(out, t, {
      f: 115 * j, to: 70, dur: 0.1, peak: (0.007 + 0.025 * p.weight) * l, a: 0.003,
    });
    T.bell(out, t, {
      f: 1800 * j, partials: [[1, 1, 1], [2.76, 0.4, 0.5]], dur: 0.06,
      peak: 0.008 * p.surface * l, a: 0.001,
    });
  },
};
