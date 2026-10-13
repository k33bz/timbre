// Two blades meeting: a steel bell (inharmonic partials 1, 2.76, 5.40, 8.93) struck twice a few
// milliseconds apart and a third apart in pitch, over a hard crack, with an optional scrape of
// blade sliding on blade.
export default {
  id: 'game-sword-clash',
  name: 'Sword Clash',
  category: 'game',
  tags: ['sword', 'clash', 'clang', 'parry', 'block', 'steel', 'metal', 'blades', 'duel'],
  desc: 'Steel meeting steel: a hard clang that rings, with an optional scrape. For parries and duels.',
  dur: 1.0,
  family: 'metal',
  moments: ['hit', 'attack'],
  params: {
    pitch: { min: 600, max: 2200, def: 1250, unit: 'Hz', desc: 'Note of the clang; the second blade rings a third above' },
    ring: { min: 0.25, max: 0.9, def: 0.55, unit: 's', desc: 'How long the steel rings after the clash' },
    scrape: { min: 0, max: 1, def: 0.3, desc: 'Level and length of the blade-on-blade scrape, 0 none' },
  },
  play(T, out, t, p) {
    const steel = [[1, 1, 1], [2.76, 0.7, 0.7], [5.4, 0.45, 0.45], [8.93, 0.25, 0.25]];
    T.bell(out, t, { f: p.pitch, partials: steel, drift: 0.995, dur: p.ring, peak: 0.025, a: 0.001 });
    // the second blade: a bit later, a bit shorter, a different pitch, so the ring beats
    T.bell(out, t + 0.008, { f: p.pitch * 1.19, partials: steel, drift: 0.995, dur: p.ring * 0.8, peak: 0.02, a: 0.001 });
    T.noise(out, t, { filter: 'highpass', f: 3500, to: 2500, q: 0.8, dur: 0.03, peak: 0.09, a: 0.001 });
    T.noise(out, t, { filter: 'bandpass', f: 1800, to: 1000, q: 1.5, dur: 0.06, peak: 0.1, a: 0.001 });
    T.noise(out, t + 0.02, {
      filter: 'bandpass', f: 4000, to: 7000, q: 4, dur: 0.12 + 0.12 * p.scrape,
      peak: 0.05 * p.scrape, a: 0.04,
    });
  },
};
