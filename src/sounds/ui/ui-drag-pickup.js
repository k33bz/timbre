// Grabbing an item: a tiny grip tick, then a short airy lift that rises with a soft triangle. Quiet,
// because it fires at the start of every drag. Air family.
export default {
  id: 'ui-drag-pickup',
  name: 'Drag Pickup',
  category: 'ui',
  tags: ['drag', 'grab', 'pickup', 'lift', 'drag-start', 'air'],
  desc: 'A soft lift for grabbing an item to drag: a small grip tick and a short rising breath.',
  dur: 0.12,
  params: {
    pitch: { min: 250, max: 700, def: 392, unit: 'Hz' },
    lift: { min: 0, max: 1, def: 0.5 },
    air: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    T.noise(out, t, { filter: 'highpass', f: 3500, q: 0.8, dur: 0.01, peak: 0.012, a: 0.002 });
    T.noise(out, t, { filter: 'bandpass', f: 500, to: 500 + 2200 * p.lift, q: 1, dur: 0.11, a: 0.045, peak: 0.04 + 0.1 * p.air });
    T.osc(out, t, { type: 'triangle', f: p.pitch, to: p.pitch * (1.15 + 0.6 * p.lift), dur: 0.08, peak: 0.03, a: 0.008, glide: 0.06 });
  },
};
