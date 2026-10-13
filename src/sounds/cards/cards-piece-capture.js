// A capture: the moving piece strikes another with a harder, brighter clack (two woods ringing
// together), and the taken piece skitters away in a few tocks that fall in pitch and level. More
// scatter, more tocks. Louder than a plain move because something happened.
export default {
  id: 'cards-piece-capture',
  name: 'Piece Capture',
  category: 'cards',
  tags: ['board', 'piece', 'capture', 'take', 'knock', 'wood', 'chess', 'hit'],
  desc: 'One wooden piece knocking another off its square: a sharp clack, then the lost piece skittering away.',
  dur: 0.49,
  params: {
    pitch: { min: 300, max: 900, def: 560, unit: 'Hz' },
    force: { min: 0, max: 1, def: 0.6 },
    scatter: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    const hard = 0.6 + 0.4 * p.force;
    T.bell(out, t, {
      f: p.pitch, partials: [[1, 1, 1], [2.45, 0.5, 0.55], [4.3, 0.2, 0.3]], dur: 0.12, peak: 0.048 * hard, a: 0.001,
    });
    T.bell(out, t + 0.003, {
      f: p.pitch * 1.19, partials: [[1, 1, 1], [2.45, 0.4, 0.5]], dur: 0.1, peak: 0.032 * hard, a: 0.001,
    });
    T.noise(out, t, { filter: 'bandpass', f: 2400 + 800 * p.force, to: 1800, q: 1.4, dur: 0.018, peak: 0.096 * hard, a: 0.001 });
    T.osc(out, t, { f: 160, to: 80, dur: 0.06, peak: 0.016 + 0.016 * p.force, a: 0.002 });
    const taps = 1 + Math.round(2 * p.scatter);
    let at = t + 0.075;
    for (let k = 0; k < taps; k++) {
      const l = Math.pow(0.6, k);
      T.bell(out, at, {
        f: p.pitch * 0.8 * Math.pow(0.92, k) * T.rand(0.95, 1.05),
        partials: [[1, 1, 1], [2.45, 0.35, 0.5]], dur: 0.09, peak: 0.04 * l, a: 0.001,
      });
      T.noise(out, at, { filter: 'bandpass', f: 1700, to: 1200, q: 1.4, dur: 0.012, peak: 0.06 * l, a: 0.001 });
      at += (0.08 + 0.07 * p.scatter) * T.rand(0.8, 1.2) * (1 - 0.12 * k);
    }
  },
};
