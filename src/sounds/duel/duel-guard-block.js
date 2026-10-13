// Bodyguard stepping in: a blow stopped dead by a guard. A short wooden thud (a falling knock under
// a woody band of noise), a crack at the moment of contact, and a brief metal ring over it, quick
// enough to ride on an attack without hiding it.
export default {
  id: 'duel-guard-block',
  name: 'Guard Block',
  category: 'duel',
  tags: ['ink-duel', 'bodyguard', 'keyword', 'knock', 'thud', 'wood', 'ring', 'protect'],
  desc: 'A solid wooden thud with a short metal ring: a blow stopped by a guard. For a Bodyguard stepping in to take an attack.',
  dur: 0.28,
  family: 'wood',
  moments: ['ability'],
  params: {
    pitch: { min: 110, max: 300, def: 175, unit: 'Hz', desc: 'Note of the wooden thud; the metal ring sits well above it' },
    ring: { min: 0, max: 1, def: 0.5, desc: 'How much the guard rings after the knock: 0 a dry thud, 1 a longer metal ring' },
    weight: { min: 0, max: 1, def: 0.5, desc: 'Heft of the blow: 0 a light knock, 1 a fuller, harder thud' },
  },
  play(T, out, t, p) {
    const f = p.pitch * T.rand(0.97, 1.03);
    // the thud: a falling knock and a woody band of noise
    T.osc(out, t, { f: f * 1.55, to: f * 0.6, dur: 0.075, peak: 0.023 + 0.04 * p.weight, a: 0.002 });
    T.noise(out, t, { filter: 'bandpass', f: 520 + f * 3, to: 380 + f * 1.5, q: 1.1, dur: 0.05, peak: 0.052 + 0.048 * p.weight, a: 0.001 });
    // the crack where the blow lands
    T.noise(out, t, { filter: 'highpass', f: 3000, to: 2200, q: 0.8, dur: 0.012, peak: 0.026 + 0.026 * p.weight, a: 0.001 });
    // the metal ring: struck metal partials, longer as the ring knob rises
    const metal = [[1, 1, 1], [2.76, 0.55, 0.6], [5.4, 0.3, 0.35]];
    T.bell(out, t + 0.004, { f: f * 7, partials: metal, dur: 0.06 + 0.2 * p.ring, peak: 0.004 + 0.03 * p.ring, a: 0.001 });
  },
};
