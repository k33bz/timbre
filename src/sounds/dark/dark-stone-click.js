// A click on old stone or bone: a dull tick with a low knock under it, nothing bright. Dark-theme
// click and select.
export default {
  id: 'dark-stone-click',
  name: 'Stone Click',
  category: 'dark',
  tags: ['click', 'select', 'stone', 'bone', 'knock', 'dull', 'low', 'dark', 'gothic', 'soft'],
  desc: 'A dull tick on old stone with a low knock under it, never bright. For buttons and selections in a dark, gothic interface.',
  dur: 0.2,
  family: 'soft',
  moments: ['click', 'select'],
  params: {
    pitch: { min: 70, max: 220, def: 120, unit: 'Hz', desc: 'How low the knock under the tick sits: a deep slab or a lighter bone' },
    weight: { min: 0, max: 1, def: 0.5, desc: 'How heavy it feels: 0 a dry tick, 1 a fuller knock that rings a little longer' },
  },
  play(T, out, t, p) {
    T.tick(out, t, { f: 900, q: 0.9, filter: 'lowpass', dur: 0.014, peak: 0.07, jitter: 0.3, lp: 1800 });
    T.osc(out, t, { f: p.pitch * 1.5, to: p.pitch * 0.8, dur: 0.07 + 0.1 * p.weight, peak: 0.05 + 0.04 * p.weight, a: 0.002 });
    T.osc(out, t, { f: p.pitch * 3.1, to: p.pitch * 1.9, dur: 0.035, peak: 0.016, a: 0.002 });
  },
};
