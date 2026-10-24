// A choir on the formant engine: singers dealt round a minor triad an octave apart, holding a
// vowel that opens as they swell, in a long stone room. The room is the house reverb on top of the
// choir's own small hall, so the tail is long but dur still covers it.
export default {
  id: 'dark-cathedral-choir',
  name: 'Cathedral Choir',
  category: 'dark',
  tags: ['choir', 'cathedral', 'gothic', 'voices', 'pad', 'bed', 'dark', 'sacred', 'ominous', 'ambient'],
  desc: 'A hushed choir swelling on a minor chord under a stone vault, the vowel slowly opening. For a gothic menu, a crypt or a solemn reveal.',
  dur: 6.3,
  family: 'voice',
  moments: ['ambience', 'reveal', 'tension'],
  params: {
    key: { min: -5, max: 7, def: 0, step: 1, unit: 'st', desc: 'Transposes the chord' },
    singers: { min: 3, max: 10, def: 8, step: 1, desc: 'How many voices: few is a lonely consort, many a full choir' },
    vowel: { min: 0, max: 3, def: 0, step: 1, choices: ['oo-to-ah', 'mm-to-oo', 'ah', 'oh'], desc: 'What they sing: a hum or an oo opening out, or a held ah or oh' },
    space: { min: 0.15, max: 0.6, def: 0.4, desc: 'How much of the stone vault you hear, from a chapel to a cathedral' },
  },
  play(T, out, t, p) {
    const r = Math.pow(2, p.key / 12);
    const v = [['oo', 'ah'], ['mm', 'oo'], ['ah', 'ah'], ['oh', 'oh']][Math.round(p.vowel)];
    const room = T.reverb(out, t, { time: 3.2, mix: p.space, tone: 0.3, pre: 0.03 });
    T.choir(room, t, {
      notes: [T.note('D3') * r, T.note('F3') * r, T.note('A3') * r, T.note('D4') * r],
      voices: Math.round(p.singers), vowel: v[0], to: v[1], dur: 4.2, a: 1.4, r: 1.6, spread: 16,
      breath: 0.1, peak: 0.13, room: { time: 0.6, mix: 0.2 },
    });
  },
};
