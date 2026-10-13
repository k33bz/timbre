// The Gold ink signature, for a card that supports its allies (the "support and warmth" ink). Every
// ink signature in this set shares one shape: a quick rising flourish for 0.19 s, then a landing
// that rings out, all in the key of D, so the six differ by timbre alone. Gold is soft plucked
// strings climbing a major triad into a warm bell pair a major third apart, with a slow glow under
// it. Round and warm on purpose: the hue to reach for when the sound should feel kind.
export default {
  id: 'duel-ink-gold',
  name: 'Gold Ink',
  category: 'duel',
  tags: ['ink-duel', 'ink', 'gold', 'support', 'warm', 'pluck', 'bell', 'card-game'],
  desc: 'The Gold ink signature: three soft plucks climb into a warm pair of bells that glow and ring out. For supportive, kind cards.',
  dur: 0.85,
  family: 'orchestral',
  moments: ['ability'],
  params: {
    pitch: { min: 0.7, max: 1.5, def: 1, unit: 'x', desc: 'Transposes the whole signature: low and mellow, high and light' },
    glow: { min: 0, max: 1, def: 0.5, desc: 'Slow warm swell under the bells: 0 dry plucks and bells, 1 a full glow' },
    space: { min: 0, max: 0.5, def: 0.22, desc: 'Soft room around the signature, from dry to roomy' },
  },
  play(T, out, t, p) {
    const at = (s) => 293.66 * p.pitch * Math.pow(2, s / 12);
    const room = T.reverb(out, t, { time: 0.4, mix: p.space, tone: 0.55 });
    // the flourish: a plucked major triad, 62 ms apart
    [0, 4, 7].forEach((s, i) => {
      T.pluck(room, t + i * 0.062, { f: at(s), dur: 0.42, bright: 0.45, tone: 0.5, peak: 0.065, a: 0.002 });
    });
    // the landing at 0.19 s: the octave and the major third above it, as near-harmonic warm bells
    const L = t + 0.19;
    const warm = [[1, 1, 1], [2, 0.3, 0.6], [3, 0.14, 0.4], [4.1, 0.06, 0.25]];
    T.bell(room, L, { f: at(12), partials: warm, dur: 0.62, peak: 0.046, a: 0.003 });
    T.bell(room, L + 0.012, { f: at(16), partials: warm, dur: 0.54, peak: 0.033, a: 0.003 });
    // the glow: the root and its fifth swelling in under the bells
    T.osc(room, L - 0.02, { f: at(0), dur: 0.62, peak: 0.009 + 0.028 * p.glow, a: 0.12 });
    T.osc(room, L - 0.02, { f: at(7), dur: 0.56, peak: 0.005 + 0.018 * p.glow, a: 0.14 });
    // a last small bell a fifth above, the lift that passes the warmth on
    T.bell(room, L + 0.13, { f: at(19), partials: [[1, 1, 1], [3, 0.2, 0.4]], dur: 0.4, peak: 0.018, a: 0.003 });
  },
};
