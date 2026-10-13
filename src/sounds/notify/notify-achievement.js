// A three-note rising run (a major triad) into a bell chord (add9) with a small room and a few
// glints. The one big moment in the set, so it is the loudest and the longest; the glints sit at
// the chord's own pitches an octave or two up so they shimmer without turning shrill.
export default {
  id: 'notify-achievement',
  name: 'Achievement Unlocked',
  category: 'notify',
  tags: ['achievement', 'unlock', 'reward', 'trophy', 'level-up', 'fanfare', 'win'],
  desc: 'A quick rising run into a warm bell chord with a few glints. A small celebration for something earned.',
  dur: 1.5,
  family: 'orchestral',
  moments: ['achievement', 'level-up'],
  params: {
    pitch: { min: 392, max: 600, def: 523.25, unit: 'Hz', desc: 'Root note: transposes the run, the bell chord and the glints together' },
    gap: { min: 0.05, max: 0.12, def: 0.075, unit: 's', desc: 'Spacing of the three run notes; the bell chord lands after the third' },
    space: { min: 0, max: 0.6, def: 0.3, desc: 'Reverb mix over the whole sound, from dry to roomy' },
    sparkle: { min: 0, max: 1, def: 0.5, desc: 'Level of the high sine glints over the chord, 0 removes them' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 1.0, mix: p.space, tone: 0.65 });
    const run = [0, 4, 7];
    for (let k = 0; k < 3; k++) {
      T.osc(room, t + k * p.gap, { type: 'triangle', f: p.pitch * Math.pow(2, run[k] / 12), dur: 0.16, peak: 0.08, a: 0.006 });
    }
    const at = t + 3 * p.gap;
    const chord = [0, 4, 7, 14];
    const level = [1, 0.9, 0.9, 0.5];   // the ninth sits highest, so it is the quietest
    const parts = [[1, 1, 1], [2, 0.18, 0.5], [3, 0.04, 0.3]];
    for (let k = 0; k < chord.length; k++) {
      T.bell(room, at, { f: p.pitch * 2 * Math.pow(2, chord[k] / 12), dur: 0.9, peak: 0.042 * level[k], a: 0.006, partials: parts });
    }
    const glint = [0, 4, 7, 12];
    for (let k = 0; k < glint.length; k++) {
      T.osc(room, at + 0.05 + k * 0.07 + T.rand(0, 0.03), {
        f: p.pitch * 4 * Math.pow(2, glint[k] / 12), dur: 0.1, peak: 0.012 * p.sparkle, a: 0.004,
      });
    }
  },
};
