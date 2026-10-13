// A knuckle on a wooden block: a damped fundamental with inharmonic overtones over a dull knock.
// The wood-family click.
export default {
  id: 'ui-click-wood',
  name: 'Wooden Click',
  category: 'ui',
  tags: ['click', 'button', 'press', 'knock', 'tap', 'wood'],
  desc: 'A warm wooden knock for buttons: a short damped block tone with a dull knuckle thud, calm enough to repeat all day.',
  dur: 0.15,
  params: {
    pitch: { min: 500, max: 1600, def: 880, unit: 'Hz' },
    ring: { min: 0, max: 1, def: 0.35 },
    hollow: { min: 0, max: 1, def: 0.4 },
  },
  play(T, out, t, p) {
    // The second overtone is what reads as hollow; the fundamental droops a little like a struck block.
    T.bell(out, t, {
      f: p.pitch, partials: [[1, 1, 1], [2.35, 0.25 + 0.4 * p.hollow, 0.55], [4.1, 0.12, 0.3]],
      drift: 0.96, dur: 0.04 + 0.1 * p.ring, peak: 0.04, a: 0.002,
    });
    T.noise(out, t, { filter: 'lowpass', f: 2200, q: 0.7, dur: 0.012, peak: 0.04, a: 0.002 });
  },
};
