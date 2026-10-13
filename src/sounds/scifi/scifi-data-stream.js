// Dozens of tiny square and saw ticks scattered across a pitch band, bitcrushed, over a faint
// highpassed hiss: packets pouring through a channel.
export default {
  id: 'scifi-data-stream',
  name: 'Data Stream',
  category: 'scifi',
  tags: ['data', 'stream', 'transfer', 'download', 'digital', 'packets', 'chatter'],
  desc: 'A rapid patter of tiny bitcrushed ticks and chirps, like data pouring through a channel.',
  dur: 1.1,
  params: {
    ticks: { min: 10, max: 40, def: 22, step: 1 },
    length: { min: 0.3, max: 1.0, def: 0.6, unit: 's' },
    pitch: { min: 600, max: 3000, def: 1600, unit: 'Hz' },
    spread: { min: 0, max: 1, def: 0.6 },
    grit: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    const cr = T.crush(out, t, { bits: 8 - 4 * p.grit, ref: 0.1 });
    const n = Math.round(p.ticks);
    const slot = p.length / n;
    for (let k = 0; k < n; k++) {
      const at = t + (k + T.rand(0, 0.8)) * slot;
      const f = p.pitch * Math.pow(2, T.rand(-1, 1) * p.spread * 1.5);
      const type = T.rand() < 0.5 ? 'square' : 'sawtooth';
      T.osc(cr, at, { type, f, to: f * 1.15, dur: 0.022, peak: 0.04, a: 0.002 });
    }
    T.noise(out, t, { filter: 'highpass', f: 5000, q: 0.8, dur: p.length, peak: 0.012, a: 0.05 });
  },
};
