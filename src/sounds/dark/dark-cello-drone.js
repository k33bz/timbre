// A low cello section on a root and its fifth, bowed long through the body resonances, the fifth
// entering late. Tremolo swaps the long bow for the nervous shiver of a horror score.
export default {
  id: 'dark-cello-drone',
  name: 'Cello Drone',
  category: 'dark',
  tags: ['cello', 'strings', 'drone', 'bowed', 'low', 'tension', 'dark', 'brooding', 'bed', 'ominous'],
  desc: 'Low cellos holding a bare fifth, swelling in and out of the dark. For a quiet threat, a long walk down a corridor, or a menu that broods.',
  dur: 5.6,
  family: 'orchestral',
  moments: ['tension', 'ambience'],
  params: {
    key: { min: -5, max: 5, def: 0, step: 1, unit: 'st', desc: 'Transposes the drone' },
    players: { min: 1, max: 6, def: 4, step: 1, desc: 'Players per note: one cello, or a section' },
    grit: { min: 0, max: 1, def: 0.35, desc: 'Bow pressure: 0 a smooth glassy tone, 1 a rough, digging scrape' },
    shiver: { min: 0, max: 1, def: 0, step: 1, desc: '1 bows tremolo (the nervous shiver), 0 long smooth bows' },
  },
  play(T, out, t, p) {
    const f = T.note('D2') * Math.pow(2, p.key / 12);
    const room = T.reverb(out, t, { time: 2.2, mix: 0.3, tone: 0.35 });
    const trem = p.shiver > 0.5 ? 13 : 0;
    const common = { players: Math.round(p.players), pressure: p.grit, bright: 0.3, vib: trem ? 4 : 9, trem };
    T.bow(room, t, Object.assign({ f, dur: 4.2, a: 1.4, r: 1.4, peak: 0.058 }, common));
    T.bow(room, t + 0.9, Object.assign({ f: f * 1.5, dur: 3.3, a: 1.2, r: 1.3, peak: 0.04 }, common));
  },
};
