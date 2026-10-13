// A quick rewind: a triangle that falls under a fluttering tremolo (a reel spinning back), a
// descending air sweep, and a soft tick where it settles. The flutter is held at a steady level so
// several cycles are heard before it lets go. Soft family.
export default {
  id: 'ui-undo',
  name: 'Undo',
  category: 'ui',
  tags: ['undo', 'revert', 'rewind', 'back', 'restore', 'soft'],
  desc: 'A short rewind flutter that falls and settles with a soft tick, for undoing the last action.',
  dur: 0.22,
  family: 'soft',
  moments: ['undo'],
  params: {
    pitch: { min: 500, max: 1400, def: 784, unit: 'Hz', desc: 'Start note of the falling flutter; the settle tick sits an octave below' },
    speed: { min: 18, max: 46, def: 30, unit: 'Hz', desc: 'Flutter rate of the rewind: low a slow wobble, high a fast whir' },
    settle: { min: 0, max: 1, def: 0.5, desc: 'Level of the soft tick where it settles: 0 faint, 1 clear' },
  },
  play(T, out, t, p) {
    T.osc(out, t, {
      type: 'triangle', f: p.pitch, to: p.pitch * 0.45, dur: 0.14, peak: 0.04, a: 0.006,
      s: 0.8, d: 0.01, r: 0.05, trem: { rate: p.speed, depth: 0.8 },
    });
    T.noise(out, t, { filter: 'bandpass', f: 3000, to: 900, q: 1, dur: 0.12, a: 0.01, peak: 0.04 });
    T.bell(out, t + 0.13, { f: p.pitch * 0.5, partials: [[1, 1, 1], [2.76, 0.4, 0.6]], dur: 0.08, peak: 0.005 + 0.03 * p.settle, a: 0.002 });
  },
};
