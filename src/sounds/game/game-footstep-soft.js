// A step on something that gives: a soft-attack puff of lowpassed noise over a quiet sine thud.
// Surface opens the filter and adds a little high grit, from carpet to gravel. Kept quiet because
// it repeats constantly; T.rand varies every step.
export default {
  id: 'game-footstep-soft',
  name: 'Footstep Soft',
  category: 'game',
  tags: ['footstep', 'step', 'walk', 'run', 'grass', 'carpet', 'sand', 'soft'],
  desc: 'A quiet step on carpet, grass or sand. Use Vary so a walk never repeats exactly.',
  dur: 0.22,
  params: {
    weight: { min: 0, max: 1, def: 0.4 },
    surface: { min: 0, max: 1, def: 0.4 },
    length: { min: 0.06, max: 0.16, def: 0.1, unit: 's' },
  },
  play(T, out, t, p) {
    const j = T.rand(0.9, 1.1);
    const l = T.rand(0.85, 1.15);
    T.noise(out, t, {
      filter: 'lowpass', f: (500 + 1700 * p.surface) * j, to: 250, q: 0.8,
      dur: p.length, peak: (0.053 + 0.053 * p.weight) * l, a: 0.012,
    });
    T.osc(out, t, {
      f: (70 + 30 * p.weight) * j, to: 45, dur: p.length * 1.1,
      peak: (0.009 + 0.015 * p.weight) * l, a: 0.008,
    });
    // gravel crunch: scales with surface, so carpet gets none
    T.noise(out, t + 0.01, {
      filter: 'highpass', f: 3500, q: 0.8, dur: 0.04 + 0.04 * p.surface,
      peak: 0.009 * p.surface * l, a: 0.006,
    });
  },
};
