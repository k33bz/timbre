// A star rating being set: one glassy ping per star climbing the major pentatonic, so choosing four
// stars plays four rising notes, and a fifth star adds a glint on top. Glass family; quick enough to
// play on every hover or tap of a star.
export default {
  id: 'ui-rating-star',
  name: 'Star Rating',
  category: 'ui',
  tags: ['rating', 'star', 'stars', 'review', 'like', 'mood', 'select', 'ping', 'glass'],
  desc: 'A run of rising glassy pings, one per star, for rating something; five stars add a small glint on top.',
  dur: 0.4,
  family: 'glass',
  moments: ['select'],
  params: {
    stars: { min: 1, max: 5, def: 3, step: 1, desc: 'How many stars are chosen, one rising ping each' },
    pitch: { min: 392, max: 880, def: 523, unit: 'Hz', desc: 'Note of the first star; the others climb the pentatonic above it' },
    gap: { min: 0.035, max: 0.06, def: 0.045, unit: 's', desc: 'Time between pings: short for a flutter, long for a stepped climb' },
    glint: { min: 0, max: 1, def: 0.5, desc: 'Level of the sparkle that crowns five stars; other counts ignore it' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.stars);
    const scale = [0, 2, 4, 7, 9];
    for (let k = 0; k < n; k++) {
      const at = t + k * p.gap;
      const f = p.pitch * Math.pow(2, scale[k] / 12);
      const last = k === n - 1;
      T.bell(out, at, { f, partials: [[1, 1, 1], [2, 0.2, 0.5]], dur: last ? 0.12 : 0.07, peak: 0.036, a: 0.002 });
      T.noise(out, at, { filter: 'highpass', f: 5000, q: 0.7, dur: 0.007, peak: 0.005, a: 0.002 });
      if (last && n === 5) {
        T.bell(out, at + 0.02, { f: f * 3, partials: [[1, 1, 1], [2.76, 0.4, 0.5]], dur: 0.13, peak: 0.01 + 0.04 * p.glint, a: 0.002 });
      }
    }
  },
};
