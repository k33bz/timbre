// A sad-brass "wah wah wah waaah": four falling notes, each a pair of slightly detuned sawtooths
// through a lowpass that opens and closes, the last one sagging in pitch with a slow wobble.
export default {
  id: 'music-defeat-jingle',
  name: 'Defeat Jingle',
  category: 'music',
  tags: ['defeat', 'lose', 'fail', 'game-over', 'sad', 'trombone', 'jingle', 'stinger'],
  desc: 'A falling four-note sad-brass wah for a lost round: three short steps down and one long sagging note.',
  dur: 3.4,
  family: 'orchestral',
  moments: ['game-over', 'music'],
  params: {
    key: { min: -5, max: 5, def: 0, step: 1, unit: 'st', desc: 'Transposes the whole jingle' },
    tempo: { min: 0.7, max: 1.4, def: 1, unit: 'x', desc: 'Higher plays the four notes faster and shorter, lower drags them out' },
    droop: { min: 0, max: 1, def: 0.6, desc: 'Sag and wobble on the last note: 0 steady, 1 a deep wobbling slide down' },
    tone: { min: 0, max: 1, def: 0.5, desc: 'Brightness of the wah filter: 0 dark and muffled, 1 brassier' },
  },
  play(T, out, t, p) {
    const s = 1 / p.tempo;
    const n = (name) => T.note(name) * Math.pow(2, p.key / 12);
    const room = T.reverb(out, t, { time: 0.6, mix: 0.15, tone: 0.5 });
    const steps = [['G4', 0, 0.3], ['F#4', 0.34, 0.3], ['F4', 0.68, 0.3], ['E4', 1.02, 1.1]];
    for (let k = 0; k < 4; k++) {
      const at = t + steps[k][1] * s;
      const len = steps[k][2] * s;
      const last = k === 3;
      const f = n(steps[k][0]);
      const open = 500 + 1600 * p.tone;
      // each note opens its filter, then closes it again: the "wah"
      const lp = T.filter(room, at, { type: 'lowpass', f: open * 0.45, to: open, dur: len * 0.25, q: 0.9 });
      const o = {
        dur: len, peak: 0.05, a: 0.03, s: 0.7, d: 0.1, r: Math.min(0.2, len * 0.4),
        to: f * (last ? 1 - 0.2 * p.droop : 0.985),
      };
      T.osc(lp, at, { ...o, type: 'sawtooth', f, detune: -8, vib: last ? { rate: 5.5, depth: 20 * p.droop } : null });
      T.osc(lp, at, { ...o, type: 'sawtooth', f, detune: 8, peak: 0.04, vib: last ? { rate: 5.5, depth: 20 * p.droop } : null });
    }
  },
};
