// A rubber boing: the pitch springs up in a flick, then settles back while a vibrato wobbles and
// fades. A triangle an octave up gives it the squashy, hollow edge. Wobble sets the depth of the
// vibrato.
export default {
  id: 'game-bounce',
  name: 'Bounce',
  category: 'game',
  tags: ['bounce', 'boing', 'spring', 'rubber', 'ball', 'trampoline', 'jump-pad', 'cartoon'],
  desc: 'A rubbery boing: a quick spring up, then a wobble that settles. For jump pads, springs and balls.',
  dur: 0.66,
  params: {
    pitch: { min: 150, max: 500, def: 260, unit: 'Hz' },
    wobble: { min: 0, max: 1, def: 0.6 },
    length: { min: 0.25, max: 0.6, def: 0.4, unit: 's' },
  },
  play(T, out, t, p) {
    T.osc(out, t, { f: p.pitch * 0.9, to: p.pitch * 1.8, glide: 0.05, dur: 0.06, peak: 0.065, a: 0.004 });
    T.osc(out, t + 0.045, {
      f: p.pitch * 1.8, to: p.pitch, glide: p.length * 0.9, dur: p.length, peak: 0.08, a: 0.01,
      vib: { rate: 13, depth: 350 * p.wobble },
    });
    T.osc(out, t + 0.045, {
      type: 'triangle', f: p.pitch * 3.6, to: p.pitch * 2, glide: p.length * 0.9, dur: p.length * 0.8,
      peak: 0.016, a: 0.01, vib: { rate: 13, depth: 350 * p.wobble },
    });
  },
};
