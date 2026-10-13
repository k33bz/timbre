// An X shear: two crossing cuts (the first rising, the second falling) each ending in a small
// metal snap, then a low chop where they cross. Dry and short, not the ringing clang of two swords
// meeting and not the single swish of a swing: this is a pair of cuts that close like shears.
export default {
  id: 'battle-arch-blade',
  name: 'Crossing Shear',
  category: 'battle',
  tags: ['shear', 'slash', 'cross', 'cut', 'snap', 'blade', 'attack', 'battle', 'archetype'],
  desc: 'Two crossing cuts that snap shut like shears, with a low chop where they meet. Short and dry, so it stacks under any element.',
  dur: 0.34,
  family: 'metal',
  params: {
    gap: { min: 0.04, max: 0.14, def: 0.075, unit: 's', desc: 'Time between the two cuts; short is one slash, long is two' },
    edge: { min: 0, max: 1, def: 0.5, desc: 'Steel in the cut: 0 a plain whip of air, 1 bright metallic snaps' },
    weight: { min: 0, max: 1, def: 0.4, desc: 'Low body where the cuts cross: 0 a thin slice, 1 a solid chop' },
  },
  play(T, out, t, p) {
    const g = p.gap;
    const x = t + g + 0.03;
    const snap = (at, f, l) => {
      T.bell(out, at, { f, partials: [[1, 1, 1], [2.76, 0.5, 0.7]], dur: 0.08, peak: 0.04 * l * p.edge, a: 0.002 });
      T.noise(out, at, { filter: 'highpass', f: 4200, to: 3000, q: 0.8, dur: 0.02, peak: 0.05 * l * p.edge, a: 0.001 });
    };
    // two cuts, the second sweeping the other way so they read as an X
    T.noise(out, t, { filter: 'bandpass', f: 2800, to: 6000, q: 1.2, dur: 0.1, peak: 0.13, a: 0.012 });
    T.noise(out, t + g, { filter: 'bandpass', f: 6000, to: 2800, q: 1.2, dur: 0.1, peak: 0.11, a: 0.012 });
    snap(t + 0.04, 1900, 1);
    snap(t + g + 0.05, 2300, 1.2);
    // the chop where they cross
    T.osc(out, x, { f: 200, to: 90, dur: 0.14, peak: 0.05 + 0.12 * p.weight, a: 0.003 });
    T.noise(out, x, { filter: 'lowpass', f: 2000, to: 600, q: 1, dur: 0.12, peak: 0.03 + 0.08 * p.weight, a: 0.003 });
  },
};
