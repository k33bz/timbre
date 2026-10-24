// Low male voices chanting a slow five-note phrase, one choir call per note and each overlapping
// the next, over a held two-note drone, in a stone room. The phrase is original, on a minor mode.
export default {
  id: 'dark-monk-chant',
  name: 'Monk Chant',
  category: 'dark',
  tags: ['chant', 'monk', 'choir', 'gregorian', 'sacred', 'gothic', 'dark', 'drone', 'ritual', 'stone'],
  desc: 'Low male voices chant a slow minor phrase over a held drone in a stone chapel. For a ritual, a crypt or the reveal of something old.',
  dur: 7.8,
  family: 'voice',
  moments: ['ambience', 'reveal', 'music'],
  params: {
    key: { min: -5, max: 5, def: 0, step: 1, unit: 'st', desc: 'Transposes the chant' },
    singers: { min: 2, max: 6, def: 4, step: 1, desc: 'How many monks: a lone cantor, or a choir' },
    room: { min: 0.15, max: 0.7, def: 0.45, desc: 'How much stone around them, from a cell to a cathedral' },
  },
  play(T, out, t, p) {
    const r = Math.pow(2, p.key / 12);
    const n = Math.round(p.singers);
    const hall = T.reverb(out, t, { time: 2.4, mix: p.room, tone: 0.3, pre: 0.025 });
    // the drone, a root and fifth hummed all the way through
    T.choir(hall, t, {
      notes: [T.note('D2') * r, T.note('A2') * r], voices: Math.max(2, Math.min(4, n)), vowel: 'mm', to: 'oh', dur: 6.2, a: 1.2, r: 1.6,
      spread: 10, breath: 0.06, peak: 0.06, formant: 1, room: { time: 0.5, mix: 0.15 },
    });
    // the phrase: D F E C D, each note entering before the last has finished
    const line = ['D3', 'F3', 'E3', 'C3', 'D3'];
    const step = 0.95;
    for (let k = 0; k < line.length; k++) {
      const first = k === 0;
      const lastN = k === line.length - 1;
      T.choir(hall, t + 0.5 + k * step, {
        f: T.note(line[k]) * r, voices: n, vowel: k % 2 ? 'oh' : 'mm', to: k % 2 ? 'mm' : 'oh', dur: lastN ? 1.9 : 1.5,
        a: first ? 0.35 : 0.3, r: lastN ? 1.0 : 0.5, spread: 12, breath: 0.07, peak: 0.063, formant: 1, room: { time: 0.5, mix: 0.12 },
      });
    }
  },
};
