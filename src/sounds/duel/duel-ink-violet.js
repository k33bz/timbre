// The Violet ink signature, for magic and cards that return to the hand. Same shape as the other
// five inks (a rising flourish, then a landing at 0.19 s, key of D): a swell of noise and an FM
// glissando that gather like a reverb tail played backwards, then a glassy FM bell that lands and
// rings, with a faint glide back down under it for the return. Bright and high.
export default {
  id: 'duel-ink-violet',
  name: 'Violet Ink',
  category: 'duel',
  tags: ['ink-duel', 'ink', 'violet', 'magic', 'return', 'swirl', 'fm', 'card-game'],
  desc: 'The Violet ink signature: a backwards shimmer swirls upward into a glassy bell that rings with a faint glide back down. For magic and returns.',
  dur: 0.85,
  family: 'synthetic',
  moments: ['ability'],
  params: {
    pitch: { min: 0.7, max: 1.5, def: 1, unit: 'x', desc: 'Transposes the whole signature: low and eerie, high and bright' },
    swirl: { min: 0, max: 1, def: 0.5, desc: 'How far the opening glide sweeps: 0 a short lift, 1 a long climb from low' },
    shimmer: { min: 0, max: 1, def: 0.5, desc: 'Glassiness of the landing bell: 0 nearly a pure tone, 1 bright and metallic' },
    space: { min: 0, max: 0.5, def: 0.25, desc: 'Soft room around the signature, from dry to roomy' },
  },
  play(T, out, t, p) {
    const R = 587.33 * p.pitch;
    const room = T.reverb(out, t, { time: 0.4, mix: p.space, tone: 0.75 });
    // the flourish: a noise swell opening upward (a reverb tail in reverse) and an FM glide climbing
    T.noise(room, t, { filter: 'bandpass', f: 900, to: 6500, q: 1.2, dur: 0.2, peak: 0.07, a: 0.17 });
    T.fm(room, t, { f: R * (1 - 0.65 * p.swirl), to: R, ratio: 2.01, index: 3, index1: 0.6, dur: 0.2, glide: 0.18, peak: 0.05, a: 0.12 });
    // the landing: two FM bells a few cents apart, so the ring beats softly
    const L = t + 0.19;
    const idx = 0.8 + 3 * p.shimmer;
    T.fm(room, L, { f: R, to: R * 0.99, ratio: 3.5, index: idx, index1: 0.15, dur: 0.62, peak: 0.05, a: 0.003 });
    T.fm(room, L, { f: R * 1.006, to: R * 0.996, ratio: 3.5, index: idx, index1: 0.15, dur: 0.56, peak: 0.032, a: 0.003 });
    T.noise(room, L, { filter: 'highpass', f: 7000, to: 9000, q: 0.7, dur: 0.1, peak: 0.01 + 0.03 * p.shimmer, a: 0.004 });
    // the return: a soft glide back down an octave under the ring
    T.osc(room, L + 0.04, { f: R * 2, to: R * 0.9, dur: 0.5, peak: 0.014, a: 0.05 });
  },
};
