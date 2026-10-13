// A cartoon "ta-DAA": a short staccato dyad, then a bright major chord of triangle and pluck on a
// bass note, with a rising glissando and a bell on top for sparkle. Warm and cheerful, never a siren.
export default {
  id: 'music-ta-da',
  name: 'Ta-da',
  category: 'music',
  tags: ['ta-da', 'tada', 'reveal', 'cheerful', 'achievement', 'surprise', 'celebrate', 'stinger'],
  desc: 'A cheerful two-chord reveal: a quick staccato hit and a bright held chord with a sparkle on top.',
  dur: 2.0,
  params: {
    key: { min: -5, max: 7, def: 0, step: 1, unit: 'st' },
    tempo: { min: 0.75, max: 1.4, def: 1, unit: 'x' },
    sparkle: { min: 0, max: 1, def: 0.5 },
    weight: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    const s = 1 / p.tempo;
    const n = (name) => T.note(name) * Math.pow(2, p.key / 12);
    const room = T.reverb(out, t, { time: 0.9, mix: 0.2, tone: 0.6 });
    // "ta": a short dyad
    const ta = ['G4', 'C5'];
    for (let k = 0; k < 2; k++) {
      T.osc(room, t, { type: 'triangle', f: n(ta[k]), dur: 0.11, peak: 0.035, a: 0.004, s: 0.6, d: 0.03, r: 0.04 });
    }
    // "daa": the chord, with the bass as the weight
    const at = t + 0.17 * s;
    const chord = ['C5', 'E5', 'G5', 'C6'];
    for (let k = 0; k < 4; k++) {
      T.osc(room, at, { type: 'triangle', f: n(chord[k]), dur: 1, peak: 0.024, a: 0.006, s: 0.6, d: 0.2, r: 0.4 });
      T.pluck(room, at, { f: n(chord[k]), dur: 0.8, bright: 0.6, peak: 0.03 });
    }
    T.osc(room, at, { f: n('C3'), dur: 1, peak: 0.01 + 0.045 * p.weight, a: 0.006, s: 0.6, d: 0.2, r: 0.4 });
    // the sparkle: a quick glissando up into a bell and a shimmer
    T.osc(room, t + 0.1 * s, { f: n('C6'), to: n('C8'), dur: 0.18 * s + 0.05, peak: 0.012 * p.sparkle + 0.002, a: 0.01 });
    T.bell(room, at, { f: n('C7'), dur: 1, peak: 0.01 + 0.015 * p.sparkle });
  },
};
