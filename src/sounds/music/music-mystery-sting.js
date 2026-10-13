// Two inharmonic FM bells a tritone apart over a low swelling pad and a veil of shimmer, in a big
// dark room. The tritone is the unresolved interval; eerie opens the FM index and the pad wobble.
export default {
  id: 'music-mystery-sting',
  name: 'Mystery Sting',
  category: 'music',
  tags: ['mystery', 'suspense', 'eerie', 'clue', 'reveal', 'spooky', 'fm', 'stinger'],
  desc: 'Two hanging bell tones a tritone apart over a dark swell. For a clue, a twist or a door that should not open.',
  dur: 4.2,
  params: {
    key: { min: -5, max: 7, def: 0, step: 1, unit: 'st' },
    tempo: { min: 0.75, max: 1.4, def: 1, unit: 'x' },
    eerie: { min: 0, max: 1, def: 0.5 },
    space: { min: 0.2, max: 0.7, def: 0.45 },
  },
  play(T, out, t, p) {
    const s = 1 / p.tempo;
    const n = (name) => T.note(name) * Math.pow(2, p.key / 12);
    const room = T.reverb(out, t, { time: 2.2, mix: p.space, tone: 0.35 });
    const idx = 1.5 + 3 * p.eerie;
    T.fm(room, t, { f: n('D4'), ratio: 1.41, index: idx, index1: 0.3, dur: 1.6, peak: 0.04, a: 0.01 });
    T.fm(room, t + 0.55 * s, { f: n('G#4'), ratio: 1.41, index: idx, index1: 0.3, dur: 1.6, peak: 0.04, a: 0.01 });
    // the pad: a low sine that swells under the second bell
    T.osc(room, t, {
      f: n('D3'), dur: 2.2, peak: 0.035, a: 0.5 * s, s: 0.7, d: 0.5, r: 1,
      trem: { rate: 5.5, depth: 0.5 * p.eerie }, vib: { rate: 4.5, depth: 12 * p.eerie },
    });
    T.noise(room, t + 0.4 * s, { filter: 'highpass', f: 6500, q: 0.8, dur: 1.5, peak: 0.02 * p.eerie, a: 0.6 });
  },
};
