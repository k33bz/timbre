// A dialog arriving or leaving: a soft low swell with a breath of air and a glint (rising on open,
// falling on close). Bigger and slower than the menu slide, since a modal interrupts. Soft family.
export default {
  id: 'ui-modal',
  name: 'Modal Open and Close',
  category: 'ui',
  tags: ['modal', 'dialog', 'popup', 'overlay', 'open', 'close', 'sheet', 'soft'],
  desc: 'A soft low swell for a dialog opening, with a small glint on arrival, and a quick falling sigh for it closing.',
  dur: 0.23,
  params: {
    open: { min: 0, max: 1, def: 1, step: 1 },
    pitch: { min: 100, max: 260, def: 165, unit: 'Hz' },
    air: { min: 0, max: 1, def: 0.5 },
    shine: { min: 0, max: 1, def: 0.4 },
  },
  play(T, out, t, p) {
    const w = p.pitch;
    if (p.open >= 0.5) {
      T.osc(out, t, { f: w * 0.7, to: w * 1.1, dur: 0.2, peak: 0.06, a: 0.025, glide: 0.12 });
      T.osc(out, t, { f: w * 1.4, to: w * 2.2, dur: 0.16, peak: 0.025, a: 0.025, glide: 0.12 });
      T.noise(out, t, { filter: 'bandpass', f: 500, to: 1800, q: 0.7, dur: 0.22, a: 0.05, peak: 0.02 + 0.06 * p.air });
      T.bell(out, t + 0.1, { f: 1318, partials: [[1, 1, 1], [2.76, 0.3, 0.5]], dur: 0.12, peak: 0.005 + 0.02 * p.shine, a: 0.002 });
    } else {
      T.osc(out, t, { f: w * 1.1, to: w * 0.6, dur: 0.14, peak: 0.045, a: 0.006, glide: 0.1 });
      T.osc(out, t, { f: w * 2.2, to: w * 1.2, dur: 0.1, peak: 0.02, a: 0.006, glide: 0.1 });
      T.noise(out, t, { filter: 'bandpass', f: 1800, to: 400, q: 0.7, dur: 0.15, a: 0.01, peak: 0.02 + 0.06 * p.air });
      T.bell(out, t, { f: 1318, partials: [[1, 1, 1], [2.76, 0.3, 0.5]], drift: 0.85, dur: 0.1, peak: 0.005 + 0.02 * p.shine, a: 0.002 });
    }
  },
};
