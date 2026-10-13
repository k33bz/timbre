// A fingertip on a touchscreen: a lowpassed pat over a short mid thud. Softer and rounder than any
// of the clicks, meant for touch targets and list rows.
export default {
  id: 'ui-tap',
  name: 'Tap',
  category: 'ui',
  tags: ['tap', 'touch', 'finger', 'press', 'row', 'soft'],
  desc: 'A soft fingertip tap for touch screens and list rows: a muffled pat over a short mid thud, rounder than a click.',
  dur: 0.06,
  params: {
    pitch: { min: 220, max: 600, def: 330, unit: 'Hz' },
    pat: { min: 0, max: 1, def: 0.5 },
    soft: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    T.osc(out, t, { f: p.pitch, to: p.pitch * 0.62, dur: 0.05, peak: 0.05, a: 0.004 });
    T.noise(out, t, { filter: 'lowpass', f: 2600 - 1800 * p.soft, to: 500, q: 0.7, dur: 0.03, peak: 0.025 + 0.11 * p.pat, a: 0.003 });
  },
};
