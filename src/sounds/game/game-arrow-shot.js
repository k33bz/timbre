// A bow letting go: a plucked low string (Karplus-Strong, brighter with more twang) and a short
// falling noise zip as the arrow leaves, over a muted thump from the bow's body.
export default {
  id: 'game-arrow-shot',
  name: 'Arrow Shot',
  category: 'game',
  tags: ['arrow', 'bow', 'shot', 'shoot', 'twang', 'archer', 'ranged', 'projectile'],
  desc: 'A bowstring twang and the zip of an arrow leaving. For archers and ranged attacks.',
  dur: 0.55,
  family: 'organic',
  moments: ['shoot', 'attack'],
  params: {
    pitch: { min: 90, max: 320, def: 160, unit: 'Hz', desc: 'Note of the plucked bowstring and the short thump under it' },
    flight: { min: 0.12, max: 0.4, def: 0.22, unit: 's', desc: "How long the arrow's falling noise zip lasts as it recedes" },
    twang: { min: 0, max: 1, def: 0.6, desc: 'String brightness and sustain: 0 a dull short pluck, 1 a bright ringing twang' },
  },
  play(T, out, t, p) {
    T.pluck(out, t, { f: p.pitch, dur: 0.22 + 0.12 * p.twang, bright: 0.3 + 0.6 * p.twang, peak: 0.075 });
    T.osc(out, t, { f: p.pitch * 0.9, to: p.pitch * 0.5, dur: 0.1, peak: 0.03, a: 0.003 });
    // the arrow leaves and recedes: bright and loud at first, then falling away
    T.noise(out, t + 0.015, {
      filter: 'bandpass', f: 5200, to: 1500, q: 2, dur: p.flight, peak: 0.09, a: 0.012,
    });
  },
};
