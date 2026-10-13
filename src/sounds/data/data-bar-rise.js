// Bars of a chart drawing in, one soft marimba tick each, left to right. A bar's height picks its
// note from a pentatonic scale, so a climbing chart plays a rising run and uneven bars play a little
// tune. Heights are precomputed before any voice so the draw order never depends on the settings.
// Wood family: a struck bar with a dry knock; quiet, because a dashboard may draw many charts.
export default {
  id: 'data-bar-rise',
  name: 'Bar Rise',
  category: 'data',
  tags: ['chart', 'bar', 'bars', 'graph', 'rise', 'marimba', 'reveal', 'analytics'],
  desc: 'A staggered run of soft marimba ticks, one per bar, each as high in pitch as the bar is tall. For bar charts drawing in.',
  dur: 0.86,
  family: 'wood',
  moments: ['chart-reveal'],
  params: {
    bars: { min: 3, max: 8, def: 5, step: 1, desc: 'How many bars tick, one after another' },
    pitch: { min: 220, max: 660, def: 330, unit: 'Hz', desc: 'Note of the shortest bar; taller bars climb the scale above it' },
    gap: { min: 0.04, max: 0.1, def: 0.065, unit: 's', desc: 'Time between bars: short a quick flutter, long a stepped climb' },
    climb: { min: 0, max: 1, def: 0.75, desc: 'Bar heights: 0 uneven and random, 1 a clean staircase up' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.bars);
    const scale = [0, 2, 4, 7, 9, 12, 14, 16];
    const heights = [];
    for (let k = 0; k < n; k++) heights.push(p.climb * (k / (n - 1)) + (1 - p.climb) * T.rand());
    for (let k = 0; k < n; k++) {
      const h = heights[k];
      const f = p.pitch * Math.pow(2, scale[Math.round(h * 7)] / 12);
      const at = t + k * p.gap;
      const lv = 0.7 + 0.3 * h;   // taller bars hit a touch harder
      // marimba bars ring at about 1, 3.9 and 9.2 times the note
      T.bell(out, at, { f, partials: [[1, 1, 1], [3.9, 0.3, 0.35], [9.2, 0.08, 0.15]], dur: 0.14, peak: 0.034 * lv, a: 0.002 });
      T.noise(out, at, { filter: 'bandpass', f: 2200, q: 1.5, dur: 0.01, peak: 0.05 * lv, a: 0.002 });
    }
  },
};
