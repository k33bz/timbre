// A line chart being traced: one sine follows the pen, gliding along the line's overall direction
// with a slow wobble for its ups and downs, then a pair of slightly detuned bright sines glitters
// where the line arrives. Soft family; the glitter folds into 0.9 to 2.5 kHz so it stays clear of
// the line's own pitch whatever the curve.
export default {
  id: 'data-line-draw',
  name: 'Line Draw',
  category: 'data',
  tags: ['chart', 'line', 'graph', 'draw', 'trace', 'plot', 'glide', 'shimmer'],
  desc: 'A soft tone glides along a line as it is drawn, rising or falling with its trend, and glitters where the line arrives.',
  dur: 1.05,
  family: 'soft',
  moments: ['chart-reveal'],
  params: {
    pitch: { min: 260, max: 700, def: 440, unit: 'Hz', desc: 'Where the line starts, as a pitch' },
    curve: { min: -1, max: 1, def: 0.6, desc: 'Where the line goes: -1 falls an octave, 0 stays level, 1 climbs an octave' },
    wobble: { min: 0, max: 1, def: 0.4, desc: 'Ups and downs along the way: 0 a smooth glide, 1 a jagged line' },
    length: { min: 0.3, max: 0.8, def: 0.5, unit: 's', desc: 'Time the line takes to draw' },
    shimmer: { min: 0, max: 1, def: 0.6, desc: 'Glitter where the line arrives: 0 none, 1 a clear bright sparkle' },
  },
  play(T, out, t, p) {
    const len = p.length;
    const end = p.pitch * Math.pow(2, p.curve);
    T.osc(out, t, {
      f: p.pitch, to: end, dur: len, peak: 0.04, a: 0.04, s: 0.9, d: 0.06, r: 0.05, glide: len * 0.95,
      vib: { rate: 1.5 / len, depth: 300 * p.wobble },
    });
    // the arrival: fold the end note up into a bright octave and let two detuned sines beat on it
    let top = end * 2;
    while (top < 900) top *= 2;
    while (top > 2500) top /= 2;
    const at = t + len * 0.93;
    T.osc(out, at, { f: top, dur: 0.28, peak: 0.016 * p.shimmer, a: 0.008 });
    T.osc(out, at, { f: top * 1.007, dur: 0.28, peak: 0.016 * p.shimmer, a: 0.008 });
    T.osc(out, at, { f: top * 2.01, dur: 0.18, peak: 0.008 * p.shimmer, a: 0.008 });
  },
};
