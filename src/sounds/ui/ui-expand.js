// Accordion segments unfolding: a quick run of short triangle blips up the C major pentatonic when a
// section expands, the same notes back down when it collapses (a little softer). Soft family.
export default {
  id: 'ui-expand',
  name: 'Expand and Collapse',
  category: 'ui',
  tags: ['expand', 'collapse', 'accordion', 'disclosure', 'unfold', 'section', 'soft'],
  desc: 'A quick stepped run of soft blips: rising when a section expands, falling and a touch quieter when it collapses.',
  dur: 0.26,
  params: {
    open: { min: 0, max: 1, def: 1, step: 1 },
    steps: { min: 2, max: 5, def: 3, step: 1 },
    gap: { min: 0.02, max: 0.05, def: 0.03, unit: 's' },
    pitch: { min: 330, max: 800, def: 523, unit: 'Hz' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.steps);
    const open = p.open >= 0.5;
    const scale = [0, 2, 4, 7, 9];
    for (let k = 0; k < n; k++) {
      const f = p.pitch * Math.pow(2, scale[open ? k : n - 1 - k] / 12);
      T.osc(out, t + k * p.gap, { type: 'triangle', f, to: f * 1.03, dur: 0.05, peak: open ? 0.05 : 0.04, a: 0.002 });
    }
    T.noise(out, t, { filter: 'highpass', f: 4500, q: 0.7, dur: 0.008, peak: 0.006, a: 0.002 });
  },
};
