// A pipe organ swelling on a minor chord with a low pedal under it, the pipes' chiff at the start
// and a slow tremulant, in a long dark nave. The classic gothic sting.
export default {
  id: 'dark-organ-minor',
  name: 'Organ Minor Swell',
  category: 'dark',
  tags: ['organ', 'gothic', 'minor', 'chord', 'sting', 'church', 'cathedral', 'dramatic', 'dark', 'vampire'],
  desc: 'A pipe organ swelling on a minor chord over a deep pedal note. For a gothic title, a haunted mansion or a dramatic reveal.',
  dur: 5.1,
  family: 'orchestral',
  moments: ['scare', 'reveal', 'music'],
  params: {
    key: { min: -5, max: 7, def: 0, step: 1, unit: 'st', desc: 'Transposes the chord' },
    stops: { min: 0, max: 2, def: 1, step: 1, choices: ['flute', 'principal', 'full'], desc: 'Registration: soft flutes, the principal chorus, or full organ' },
    tremulant: { min: 0, max: 1, def: 0.25, desc: 'The slow wobble of the wind: 0 steady, 1 deep and unsettling' },
    space: { min: 0.15, max: 0.6, def: 0.38, desc: 'How much of the nave you hear' },
  },
  play(T, out, t, p) {
    const r = Math.pow(2, p.key / 12);
    const stops = ['flute', 'principal', 'full'][Math.round(p.stops)];
    const room = T.reverb(out, t, { time: 3, mix: p.space, tone: 0.35, pre: 0.02 });
    const shape = { dur: 2.9, a: 0.35, r: 0.6, stops, celeste: 5, chiff: 0.5, trem: 0.15 * p.tremulant, tremRate: 5.5 };
    T.organ(room, t, Object.assign({ notes: [T.note('D4') * r, T.note('F4') * r, T.note('A4') * r], peak: 0.06 }, shape));
    T.organ(room, t, Object.assign({ notes: [T.note('D2') * r], peak: 0.05 }, shape, { stops: 'flute' }));
  },
};
