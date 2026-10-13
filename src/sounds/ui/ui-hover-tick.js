// The quietest sound in the set: a tiny high tick for a pointer entering a target. It fires on every
// mouse move across a list, so it sits near the bottom of the house range on purpose.
export default {
  id: 'ui-hover-tick',
  name: 'Hover Tick',
  category: 'ui',
  tags: ['hover', 'pointer', 'mouseover', 'tick', 'cursor', 'glass'],
  desc: 'A barely-there high tick for the pointer entering a button or row. Very quiet, meant to repeat.',
  dur: 0.03,
  params: {
    pitch: { min: 1800, max: 5200, def: 3136, unit: 'Hz' },
    air: { min: 0, max: 1, def: 0.4 },
  },
  play(T, out, t, p) {
    T.osc(out, t, { f: p.pitch, to: p.pitch * 0.9, dur: 0.02, peak: 0.02, a: 0.002 });
    T.noise(out, t, { filter: 'highpass', f: 6000, q: 0.7, dur: 0.01, peak: 0.003 + 0.009 * p.air, a: 0.002 });
  },
};
