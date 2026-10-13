// A bottom sheet or side drawer snapping into place: a low slide of air, a weighty landing thump with
// a quick click as it seats, and a small rebound. Closing drops away and lands softer, with no
// rebound. Heavier and lower than the airy menu slide, since a sheet has mass. Soft family.
export default {
  id: 'ui-sheet-snap',
  name: 'Sheet Snap',
  category: 'ui',
  tags: ['sheet', 'drawer', 'bottom-sheet', 'rail', 'sidebar', 'snap', 'settle', 'open', 'close', 'soft'],
  desc: 'A weighty drawer or bottom sheet sliding in and snapping into place with a small rebound; closing drops away with a soft thud.',
  dur: 0.27,
  family: 'soft',
  moments: ['open', 'close'],
  params: {
    open: { min: 0, max: 1, def: 1, step: 1, role: 'open', desc: '1 plays the slide, snap and rebound, 0 the quick drop with a soft thud' },
    weight: { min: 0, max: 1, def: 0.4, desc: 'How heavy the sheet feels: 0 light and higher, 1 a long slide and a deep thump' },
    rebound: { min: 0, max: 1, def: 0.5, desc: 'Size of the small bounce after the snap on open: 0 none, 1 a clear settle' },
  },
  play(T, out, t, p) {
    const open = p.open >= 0.5;
    const base = 190 - 90 * p.weight;
    const len = 0.07 + 0.05 * p.weight;
    if (open) {
      T.noise(out, t, { filter: 'bandpass', f: 250, to: 900, q: 0.8, dur: len + 0.04, a: len * 0.6, peak: 0.13 });
      const at = t + len;
      T.osc(out, at, { f: base * 1.6, to: base * 0.6, dur: 0.09, peak: 0.07, a: 0.003 });
      T.noise(out, at, { filter: 'lowpass', f: 1400, to: 500, q: 0.7, dur: 0.025, peak: 0.04, a: 0.002 });
      T.noise(out, at, { filter: 'bandpass', f: 2200, q: 2, dur: 0.006, peak: 0.05, a: 0.002 });
      T.osc(out, at + 0.075, { f: base * 1.3, to: base * 0.7, dur: 0.055, peak: 0.05 * p.rebound, a: 0.003 });
    } else {
      T.noise(out, t, { filter: 'bandpass', f: 900, to: 220, q: 0.8, dur: len * 0.7 + 0.04, a: len * 0.3, peak: 0.1 });
      const at = t + len * 0.7;
      T.osc(out, at, { f: base * 1.3, to: base * 0.6, dur: 0.07, peak: 0.045, a: 0.003 });
      T.noise(out, at, { filter: 'lowpass', f: 1000, to: 400, q: 0.7, dur: 0.02, peak: 0.025, a: 0.002 });
    }
  },
};
