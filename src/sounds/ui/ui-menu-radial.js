// A radial menu or speed-dial fanning open: one small pip per petal, climbing the major pentatonic
// while each lands a little further round the ring (the stereo position sweeps from left to right).
// Closing folds back: the same petals in reverse, falling and sweeping right to left. Glass family.
export default {
  id: 'ui-menu-radial',
  name: 'Radial Fan',
  category: 'ui',
  tags: ['radial', 'menu', 'fan', 'petals', 'speed-dial', 'fab', 'long-press', 'open', 'close', 'glass'],
  desc: 'A quick fan of small pips round a ring for a radial menu or speed-dial opening, one per petal; closing folds back down.',
  dur: 0.31,
  family: 'glass',
  moments: ['open', 'close'],
  params: {
    open: { min: 0, max: 1, def: 1, step: 1, role: 'open', desc: '1 fans out rising from left to right, 0 folds back falling from right to left' },
    petals: { min: 3, max: 8, def: 5, step: 1, desc: 'Number of petals, one pip each' },
    pitch: { min: 390, max: 880, def: 523, unit: 'Hz', desc: 'Note of the first petal; the others climb the pentatonic above it' },
    gap: { min: 0.015, max: 0.035, def: 0.022, unit: 's', desc: 'Time between pips: short for a flutter, long for a stepped fan' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.petals);
    const open = p.open >= 0.5;
    const scale = [0, 2, 4, 7, 9, 12, 14, 16];
    for (let k = 0; k < n; k++) {
      const at = t + k * p.gap;
      const f = p.pitch * Math.pow(2, scale[open ? k : n - 1 - k] / 12);
      const x = (open ? -0.7 : 0.7) + (open ? 1.4 : -1.4) * (k / (n - 1));
      const ring = T.pan(out, at, { x });
      T.osc(ring, at, { type: 'triangle', f, to: f * (open ? 1.04 : 0.96), dur: 0.05, peak: open ? 0.04 : 0.032, a: 0.002 });
      T.noise(ring, at, { filter: 'highpass', f: 4500, q: 0.7, dur: 0.008, peak: 0.006, a: 0.002 });
    }
  },
};
