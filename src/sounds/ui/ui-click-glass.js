// A fingernail on a wine glass: high inharmonic partials with a short ring and a faint air tick.
// The glass-family click. The top partial stays under 20 kHz at the highest pitch.
export default {
  id: 'ui-click-glass',
  name: 'Glass Click',
  category: 'ui',
  tags: ['click', 'button', 'press', 'ting', 'glass', 'bright'],
  desc: 'A bright, glassy tick for buttons: a few high inharmonic partials with a short ring, light and clean.',
  dur: 0.21,
  params: {
    pitch: { min: 2000, max: 4600, def: 3136, unit: 'Hz' },
    ring: { min: 0, max: 1, def: 0.4 },
    bright: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    T.bell(out, t, {
      f: p.pitch, partials: [[1, 1, 1], [2.32, 0.4, 0.55], [3.9, 0.18 + 0.2 * p.bright, 0.3]],
      dur: 0.05 + 0.15 * p.ring, peak: 0.028, a: 0.002,
    });
    T.noise(out, t, { filter: 'highpass', f: 6500, q: 0.7, dur: 0.008, peak: 0.004 + 0.012 * p.bright, a: 0.002 });
  },
};
