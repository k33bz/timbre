// A rising air sweep that lands on a soft Cmaj7 of FM tones with a deep swell underneath and a
// high glass glint, in a long room. Meant to open a video, a game or an app with a little ceremony.
export default {
  id: 'music-intro-logo',
  name: 'Intro Logo Sting',
  category: 'music',
  tags: ['intro', 'logo', 'brand', 'title', 'opening', 'reveal', 'shimmer', 'stinger'],
  desc: 'A rising sweep that opens into a warm, ringing major-seventh chord with a glint on top. A calm logo reveal.',
  dur: 4.2,
  family: 'orchestral',
  moments: ['music'],
  params: {
    key: { min: -5, max: 7, def: 0, step: 1, unit: 'st', desc: 'Transposes the whole sting' },
    tempo: { min: 0.8, max: 1.3, def: 1, unit: 'x', desc: 'Higher shortens the rising sweep so the chord lands sooner' },
    shine: { min: 0, max: 1, def: 0.5, desc: 'Level of the high bell glint over the chord' },
    space: { min: 0.2, max: 0.7, def: 0.45, desc: 'Reverb mix: low keeps the chord close, high a long washy room' },
  },
  play(T, out, t, p) {
    const s = 1 / p.tempo;
    const n = (name) => T.note(name) * Math.pow(2, p.key / 12);
    const room = T.reverb(out, t, { time: 2, mix: p.space, tone: 0.5 });
    const land = 0.75 * s;
    // the sweep peaks as the chord arrives
    T.noise(room, t, { filter: 'bandpass', f: 400, to: 5000, q: 1.2, dur: land + 0.05, peak: 0.05, a: land });
    // the chord: four FM tones whose brightness settles as they ring
    const names = ['C4', 'E4', 'G4', 'B4'];
    for (let k = 0; k < 4; k++) {
      T.fm(room, t + land, { f: n(names[k]), ratio: 2, index: 1.4, index1: 0.1, dur: 1.8, peak: 0.028, a: 0.012 });
    }
    // the swell: a low octave that blooms under the chord
    T.osc(room, t + land - 0.1, { f: n('C3'), dur: 2, peak: 0.04, a: 0.4, s: 0.7, d: 0.4, r: 0.9 });
    // the glint
    T.bell(room, t + land + 0.12, { f: n('C7'), dur: 1.4, peak: 0.012 + 0.016 * p.shine });
  },
};
