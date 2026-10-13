// Square-wave minor stabs, then one long diminished chord with a hard sub drop under it, crushed
// to a few bits. The diminished seventh is unstable on purpose: it wants to resolve into action.
export default {
  id: 'music-alert-sting',
  name: 'Alert Sting',
  category: 'music',
  tags: ['alert', 'warning', 'danger', 'alarm', 'urgent', 'boss', '8-bit', 'stinger'],
  desc: 'Short minor stabs and a long tense chord with a sub thump, for danger, a boss entrance or a hard warning.',
  dur: 1.8,
  params: {
    key: { min: -5, max: 7, def: 0, step: 1, unit: 'st' },
    tempo: { min: 0.75, max: 1.5, def: 1, unit: 'x' },
    stabs: { min: 1, max: 4, def: 2, step: 1 },
    edge: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    const s = 1 / p.tempo;
    const n = (name) => T.note(name) * Math.pow(2, p.key / 12);
    const chip = T.crush(out, t, { bits: 8 - 3 * p.edge });
    const m = Math.round(p.stabs);
    const am = ['A4', 'C5', 'E5'];
    for (let k = 0; k < m; k++) {
      for (let j = 0; j < 3; j++) {
        T.osc(chip, t + k * 0.14 * s, { type: 'square', f: n(am[j]), dur: 0.09 * s, peak: 0.026, a: 0.003, s: 0.8, d: 0.02, r: 0.02 });
      }
    }
    // the long chord: A C Eb F# (diminished seventh) with a vibrato that tightens the tension
    const at = t + m * 0.14 * s;
    const dim = ['A4', 'C5', 'D#5', 'F#5'];
    for (let j = 0; j < 4; j++) {
      T.osc(chip, at, {
        type: 'square', f: n(dim[j]), dur: 0.5 * s, peak: 0.022, a: 0.003, s: 0.8, d: 0.05, r: 0.1, vib: { rate: 8, depth: 14 },
      });
    }
    T.osc(chip, at, { type: 'sine', f: n('A2'), to: n('A2') / 2, dur: 0.4 * s, peak: 0.06, a: 0.004 });
  },
};
