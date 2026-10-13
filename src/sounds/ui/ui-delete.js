// Paper crumpled into a bin: short bandpassed noise crackles at uneven spacing that drift downward in
// pitch, then a dull thud as it lands. Spacing, length, level and pitch of every crackle come from
// T.rand, so each delete differs. Air family.
export default {
  id: 'ui-delete',
  name: 'Delete to Trash',
  category: 'ui',
  tags: ['delete', 'trash', 'remove', 'bin', 'crumple', 'discard', 'air'],
  desc: 'A short paper crumple that drops into a bin with a dull thud, for deleting or discarding an item.',
  dur: 0.27,
  params: {
    crunch: { min: 2, max: 6, def: 4, step: 1 },
    pitch: { min: 90, max: 260, def: 147, unit: 'Hz' },
    weight: { min: 0.2, max: 1, def: 0.6 },
  },
  play(T, out, t, p) {
    const n = Math.round(p.crunch);
    let at = t;
    for (let k = 0; k < n; k++) {
      const f = (3400 - k * 220) * T.rand(0.8, 1.2);
      T.noise(out, at, { filter: 'bandpass', f, q: 2.2, dur: T.rand(0.012, 0.022), peak: 0.1 * T.rand(0.6, 1) * (1 - 0.06 * k), a: 0.002 });
      at += T.rand(0.008, 0.024);
    }
    const land = at + 0.012;
    T.osc(out, land, { f: p.pitch * 1.4, to: p.pitch * 0.6, dur: 0.1, peak: 0.026 + 0.05 * p.weight, a: 0.003 });
    T.osc(out, land, { f: p.pitch * 2.8, to: p.pitch * 1.2, dur: 0.06, peak: 0.012 + 0.02 * p.weight, a: 0.003 });
    T.noise(out, land, { filter: 'lowpass', f: 900, q: 0.7, dur: 0.03, peak: 0.02 + 0.06 * p.weight, a: 0.002 });
  },
};
