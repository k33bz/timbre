// A heat map, treemap or density plot filling in: a cluster of tiny sine grains scattered mostly
// around the middle of the bloom (the average of two random times), over a slow swell of filtered
// noise and a soft fifth that rises and fades with them. Higher warmth, hotter and brighter.
export default {
  id: 'data-heat-bloom',
  name: 'Heat Bloom',
  category: 'data',
  tags: ['heatmap', 'heat', 'bloom', 'density', 'treemap', 'chart', 'grain', 'soft'],
  desc: 'A soft cluster of tiny grains that swells and fades like a heat map filling in. Higher warmth is brighter and hotter.',
  dur: 1.12,
  family: 'soft',
  moments: ['chart-reveal'],
  params: {
    warmth: { min: 200, max: 800, def: 392, unit: 'Hz', desc: 'Pitch of the cluster: low a cool deep bloom, high a hot bright one' },
    cells: { min: 8, max: 32, def: 16, step: 1, desc: 'How many grains make up the cluster, sparse to dense' },
    bloom: { min: 0.3, max: 0.9, def: 0.55, unit: 's', desc: 'How long the cluster takes to swell before it fades' },
    spread: { min: 0, max: 1, def: 0.5, desc: 'Pitch scatter of the grains: 0 one note, 1 across an octave and a half' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.cells);
    const span = p.bloom;
    const steps = [0, 2, 4, 7, 9, 12, 14, 16, 19];
    // the grains are drawn first so the cluster's pattern never depends on the swell's settings
    const grains = [];
    const grainPeak = 0.016 * Math.sqrt(16 / n);   // a denser cluster gets quieter grains, so it blooms rather than gets louder
    for (let k = 0; k < n; k++) {
      const u = (T.rand() + T.rand()) / 2;     // 0..1, most grains near the middle
      const idx = Math.floor(T.rand() * (1 + 8 * p.spread));
      grains.push({ u, f: p.warmth * 2 * Math.pow(2, steps[Math.min(8, idx)] / 12) });
    }
    // the swell under the grains: noise opening upward, plus a root and a fifth
    T.noise(out, t, { filter: 'bandpass', f: p.warmth * 2, to: p.warmth * 4, q: 0.9, dur: span + 0.2, a: span * 0.5, peak: 0.055 });
    T.osc(out, t, { f: p.warmth, dur: span + 0.2, peak: 0.012, a: span * 0.5 });
    T.osc(out, t, { f: p.warmth * 1.5, dur: span + 0.2, peak: 0.007, a: span * 0.5 });
    for (const g of grains) {
      const lv = 1 - Math.abs(g.u - 0.5) * 1.2;  // the busiest part of the bloom is the loudest
      T.osc(out, t + g.u * span, { f: g.f, dur: 0.08, peak: grainPeak * lv, a: 0.003 });
    }
  },
};
