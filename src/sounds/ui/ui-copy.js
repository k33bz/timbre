// Copy to clipboard: a quick scoop of noise that sweeps up, then a bell ping on top, "gather, then
// confirm". Default ping is C7. Glass family.
export default {
  id: 'ui-copy',
  name: 'Copy to Clipboard',
  category: 'ui',
  tags: ['copy', 'clipboard', 'duplicate', 'confirm', 'ping', 'glass'],
  desc: 'A quick rising scoop and a bright ping to confirm a copy to the clipboard.',
  dur: 0.3,
  params: {
    pitch: { min: 1200, max: 3200, def: 2093, unit: 'Hz' },
    scoop: { min: 0.1, max: 1, def: 0.5 },
    ring: { min: 0, max: 1, def: 0.4 },
  },
  play(T, out, t, p) {
    T.noise(out, t, { filter: 'bandpass', f: 1200, to: 4200, q: 1.4, dur: 0.045, a: 0.012, peak: 0.03 + 0.1 * p.scoop });
    T.bell(out, t + 0.04, { f: p.pitch, partials: [[1, 1, 1], [2.76, 0.4, 0.5]], dur: 0.08 + 0.17 * p.ring, peak: 0.04, a: 0.002 });
  },
};
