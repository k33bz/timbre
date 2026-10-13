// A selection thumb sliding to a new tab, pill or segment: a thin band of air whose pitch runs from
// where the selection was (prev) to where it lands (pos), ending in a tiny pip at the landing. One
// octave spans the whole bar, so a row of tabs clicked left to right climbs a scale. Air family.
export default {
  id: 'ui-tab-switch',
  name: 'Tab Switch',
  category: 'ui',
  tags: ['tab', 'tabs', 'segmented', 'pill', 'select', 'slide', 'underline', 'switch', 'air'],
  desc: 'A short airy slide with a tiny landing pip for a tab, pill or segment taking the selection; the pitch follows where it lands.',
  dur: 0.14,
  family: 'air',
  moments: ['select'],
  params: {
    pos: { min: 0, max: 1, def: 0.6, desc: 'Where the selection lands along the bar: 0 the first tab and lowest, 1 the last and an octave up' },
    prev: { min: 0, max: 1, def: 0.2, desc: 'Where it slid from: the slide rises when prev is below pos and falls when above' },
    air: { min: 0, max: 1, def: 0.5, desc: 'Level of the airy slide against the landing pip: 0 mostly pip, 1 a clear swish' },
  },
  play(T, out, t, p) {
    const f0 = 520 * Math.pow(2, p.prev);
    const f1 = 520 * Math.pow(2, p.pos);
    const len = 0.05 + 0.05 * Math.abs(p.pos - p.prev);
    T.noise(out, t, {
      filter: 'bandpass', f: f0 * 2.2, to: f1 * 2.2, q: 2.2,
      dur: len + 0.03, a: Math.max(0.01, len * 0.4), peak: 0.05 + 0.13 * p.air,
    });
    const at = t + len * 0.85;
    T.osc(out, at, { f: f1 * 2, to: f1 * 1.9, dur: 0.035, peak: 0.032, a: 0.002 });
    T.noise(out, at, { filter: 'highpass', f: 4500, q: 0.7, dur: 0.008, peak: 0.006, a: 0.002 });
  },
};
