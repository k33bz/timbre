// A short choir cadence, two soft "ah" chords: the fourth chord of a minor key resolving to the
// tonic (a plagal amen). A switch lifts the last chord to the major for a ray of light. Success,
// saved and completed.
export default {
  id: 'dark-choir-amen',
  name: 'Choir Amen',
  category: 'dark',
  tags: ['success', 'achievement', 'complete', 'confirm', 'choir', 'amen', 'cadence', 'vocal', 'gothic', 'dark', 'soft'],
  desc: 'A short, soft two-chord choir cadence that settles like an amen. For a saved or completed action, an achievement, or a finished load in a gothic interface.',
  dur: 1.8,
  family: 'voice',
  moments: ['success', 'achievement', 'load-complete'],
  params: {
    key: { min: -5, max: 5, def: 0, step: 1, unit: 'st', desc: 'Transposes the cadence' },
    voices: { min: 3, max: 8, def: 5, step: 1, desc: 'Singers: a small group or a fuller chorus' },
    light: { min: 0, max: 1, def: 0, step: 1, desc: '1 ends on a bright major chord, 0 ends on the dark minor' },
    length: { min: 0, max: 1, def: 0.5, desc: 'How long the final chord is held' },
  },
  play(T, out, t, p) {
    const k = Math.pow(2, p.key / 12);
    const n = Math.round(p.voices);
    const third = p.light >= 0.5 ? 'C#4' : 'C4';
    const IV = ['D3', 'A3', 'D4', 'F4'].map((x) => T.note(x) * k);
    const I = ['A2', 'E3', 'A3', third].map((x) => T.note(x) * k);
    const hold = 0.3 + 0.3 * p.length;
    T.choir(out, t, { notes: IV, voices: n, vowel: 'ah', dur: 0.6, a: 0.12, r: 0.25, peak: 0.1, room: { time: 0.4, mix: 0.25 } });
    T.choir(out, t + 0.38, { notes: I, voices: n, vowel: 'ah', to: 'oh', dur: hold + 0.2, a: 0.1, r: 0.3 + 0.1 * p.length, peak: 0.1, room: { time: 0.5, mix: 0.25 } });
  },
};
