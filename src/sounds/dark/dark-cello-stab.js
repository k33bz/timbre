// A short low cello stab: two bowed notes a tense interval apart, attacked hard and cut off, with
// the bow digging in. Error and denied or warning.
export default {
  id: 'dark-cello-stab',
  name: 'Cello Stab',
  category: 'dark',
  tags: ['error', 'warning', 'denied', 'fail', 'stab', 'cello', 'strings', 'dissonant', 'dark', 'ominous', 'low'],
  desc: 'A short, low, clashing cello stab with the bow digging in. For a rejected action, an error or a warning in a tense interface.',
  dur: 0.7,
  family: 'orchestral',
  moments: ['error', 'warning'],
  params: {
    pitch: { min: 65, max: 170, def: 98, unit: 'Hz', desc: 'How low the stab sits' },
    clash: { min: 1, max: 6, def: 6, step: 1, unit: 'st', desc: 'Distance between the two notes: 1 a grinding minor second, 6 a hollow tritone' },
    grit: { min: 0, max: 1, def: 0.7, desc: 'Bow pressure: 0 a smooth sting, 1 a rough, scraping dig' },
    length: { min: 0, max: 1, def: 0.4, desc: 'How long the stab rings before it is cut off' },
  },
  play(T, out, t, p) {
    const d = 0.22 + 0.22 * p.length;
    const room = T.reverb(out, t, { time: 0.3, mix: 0.12, tone: 0.4 });
    const o = { dur: d, a: 0.02, r: 0.14, players: 2, pressure: p.grit, bright: 0.45, vib: 4, peak: 0.042 };
    T.bow(room, t, Object.assign({ f: p.pitch }, o));
    T.bow(room, t, Object.assign({ f: p.pitch * Math.pow(2, Math.round(p.clash) / 12) }, o, { peak: 0.034 }));
  },
};
