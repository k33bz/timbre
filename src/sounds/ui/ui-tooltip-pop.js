// A tiny glassy bubble: a two-operator FM voice that bends upward while its modulation index falls to
// zero, so it starts glittery and settles to a pure pip. Default pitch is E6. Glass family.
export default {
  id: 'ui-tooltip-pop',
  name: 'Tooltip Pop',
  category: 'ui',
  tags: ['tooltip', 'popover', 'hint', 'pop', 'bubble', 'appear', 'glass'],
  desc: 'A tiny glassy bubble pop for a tooltip or popover appearing: a bright pip that bends up and settles.',
  dur: 0.08,
  params: {
    pitch: { min: 800, max: 2400, def: 1318, unit: 'Hz' },
    rise: { min: 0, max: 1, def: 0.5 },
    shimmer: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    T.fm(out, t, {
      f: p.pitch, to: p.pitch * (1 + 0.9 * p.rise), ratio: 1.5, index: 0.3 + 1.2 * p.shimmer, index1: 0,
      dur: 0.07, peak: 0.04, a: 0.003, glide: 0.03,
    });
    T.noise(out, t, { filter: 'highpass', f: 5000, q: 0.7, dur: 0.008, peak: 0.004, a: 0.002 });
  },
};
