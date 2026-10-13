// One notch of a scroll wheel or picker: an ultra-dry wooden tick, a short pitched ring and a
// bandpassed noise snap, with no body thump (that is what separates it from the keypress). `ticks`
// plays a quick flick through several notches, each slightly different so it never machine-guns.
// Wood family. Quiet because a scroll can fire it dozens of times a second.
export default {
  id: 'ui-scroll-detent',
  name: 'Scroll Detent',
  category: 'ui',
  tags: ['scroll', 'detent', 'notch', 'wheel', 'ratchet', 'picker', 'wood'],
  desc: 'A tiny dry wooden tick for one notch of a scroll wheel or picker; raise ticks for a quick flick through several.',
  dur: 0.32,
  params: {
    ticks: { min: 1, max: 5, def: 1, step: 1 },
    pitch: { min: 300, max: 900, def: 523, unit: 'Hz' },
    gap: { min: 0.03, max: 0.07, def: 0.05, unit: 's' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.ticks);
    for (let k = 0; k < n; k++) {
      const at = t + k * p.gap;
      const v = 1 + 0.05 * T.rand(-1, 1);
      T.bell(out, at, { f: p.pitch * v, partials: [[1, 1, 1], [2.76, 0.35, 0.5]], drift: 0.97, dur: 0.022, peak: 0.02, a: 0.002 });
      T.noise(out, at, { filter: 'bandpass', f: 2400 * v, q: 4, dur: 0.008, peak: 0.07, a: 0.002 });
    }
  },
};
