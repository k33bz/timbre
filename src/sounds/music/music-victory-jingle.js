// An 8-bit win: four quick square notes climbing a major arpeggio, then a held square lead over a
// triangle chord and bass, all crushed to a few bits. Original tune, in the style of console jingles.
export default {
  id: 'music-victory-jingle',
  name: 'Victory Jingle',
  category: 'music',
  tags: ['victory', 'win', 'jingle', '8-bit', 'chiptune', 'square', 'arcade', 'stinger'],
  desc: 'A chiptune win: a quick rising arpeggio into a held major chord. Bright, short and proud.',
  dur: 1.7,
  family: 'chip',
  moments: ['victory', 'level-up', 'music'],
  params: {
    key: { min: -5, max: 7, def: 0, step: 1, unit: 'st', desc: 'Transposes the whole jingle' },
    tempo: { min: 0.75, max: 1.5, def: 1, unit: 'x', desc: 'Higher plays the arpeggio faster and shortens the held chord' },
    crunch: { min: 0, max: 1, def: 0.5, desc: 'Bit-crush amount: 0 light 8-bit grit, 1 grittier and harsher' },
    bass: { min: 0, max: 1, def: 0.6, desc: 'Level of the low triangle bass under the held chord' },
  },
  play(T, out, t, p) {
    const s = 1 / p.tempo;
    const n = (name) => T.note(name) * Math.pow(2, p.key / 12);
    const chip = T.crush(out, t, { bits: 8 - 3 * p.crunch });
    const b = 0.1 * s;
    const run = ['G4', 'C5', 'E5', 'G5'];
    for (let k = 0; k < 4; k++) {
      T.osc(chip, t + k * b, { type: 'square', f: n(run[k]), dur: b * 1.05, peak: 0.048, a: 0.004, s: 0.8, d: 0.01, r: 0.015 });
    }
    // the held chord: a square lead with a little vibrato, a triangle triad, and the bass
    const at = 4 * b;
    const hold = 0.6 * s;
    T.osc(chip, at + t, {
      type: 'square', f: n('C6'), dur: hold, peak: 0.048, a: 0.004, s: 0.75, d: 0.08, r: 0.12, vib: { rate: 7, depth: 10 },
    });
    const triad = ['C5', 'E5', 'G5'];
    for (let k = 0; k < 3; k++) {
      T.osc(chip, at + t, { type: 'triangle', f: n(triad[k]), dur: hold, peak: 0.034, a: 0.004, s: 0.8, d: 0.08, r: 0.12 });
    }
    T.osc(chip, at + t, { type: 'triangle', f: n('C3'), dur: hold, peak: 0.04 * p.bass + 0.004, a: 0.004, s: 0.85, d: 0.08, r: 0.1 });
  },
};
