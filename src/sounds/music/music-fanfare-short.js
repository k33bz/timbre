// A brass call: three short stabs and a long major chord, each note two detuned sawtooths whose
// lowpass opens in the first 90 ms (the "blat" of a brass attack). The last chord gets a cymbal
// wash and, with weight, a doubling an octave down.
export default {
  id: 'music-fanfare-short',
  name: 'Short Fanfare',
  category: 'music',
  tags: ['fanfare', 'brass', 'trumpet', 'announce', 'royal', 'win', 'proud', 'stinger'],
  desc: 'Three stabs and a long chord on synth brass: an announcement or a proud arrival in two seconds.',
  dur: 2.2,
  params: {
    key: { min: -5, max: 7, def: 0, step: 1, unit: 'st' },
    tempo: { min: 0.75, max: 1.4, def: 1, unit: 'x' },
    brass: { min: 0, max: 1, def: 0.5 },
    weight: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    const s = 1 / p.tempo;
    const n = (name) => T.note(name) * Math.pow(2, p.key / 12);
    const room = T.reverb(out, t, { time: 0.8, mix: 0.18, tone: 0.6 });
    const hit = (at, names, len, pk) => {
      for (let k = 0; k < names.length; k++) {
        const lp = T.filter(room, t + at, { type: 'lowpass', f: 500 + 400 * p.brass, to: 1800 + 2600 * p.brass, dur: 0.09, q: 0.9 });
        const o = { type: 'sawtooth', f: n(names[k]), dur: len, peak: pk, a: 0.02, s: 0.85, d: 0.08, r: Math.min(0.2, len * 0.4) };
        T.osc(lp, t + at, { ...o, detune: -6 });
        T.osc(lp, t + at, { ...o, detune: 6 });
      }
    };
    hit(0, ['G4', 'C5'], 0.13 * s, 0.028);
    hit(0.17 * s, ['G4', 'C5'], 0.13 * s, 0.028);
    hit(0.34 * s, ['G4', 'C5', 'E5'], 0.13 * s, 0.025);
    const end = 0.52 * s;
    hit(end, ['C5', 'E5', 'G5'], 0.9 * s, 0.03);
    // weight: the root an octave down, and a cymbal wash on the last chord
    hit(end, ['C4'], 0.9 * s, 0.04 * p.weight + 0.004);
    T.noise(room, t + end, { filter: 'highpass', f: 5000, q: 0.7, dur: 0.9, peak: 0.03 * p.weight, a: 0.005 });
  },
};
