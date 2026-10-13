// The Grey ink signature, for armor and resist. Same shape as the other five inks (a rising
// flourish, then a landing at 0.19 s, key of D): three small rising rivet tinks, then an anvil
// clang (the inharmonic partials of struck metal) over a low thud and a crack, ringing out. The
// heaviest and darkest of the six.
export default {
  id: 'duel-ink-grey',
  name: 'Grey Ink',
  category: 'duel',
  tags: ['ink-duel', 'ink', 'grey', 'armor', 'resist', 'anvil', 'metal', 'card-game'],
  desc: 'The Grey ink signature: three small rivet tinks rise into an anvil clang over a low thud. For armored, resistant cards.',
  dur: 0.85,
  family: 'metal',
  moments: ['ability'],
  params: {
    pitch: { min: 0.7, max: 1.5, def: 1, unit: 'x', desc: 'Transposes the whole signature: low and massive, high and lighter' },
    weight: { min: 0, max: 1, def: 0.5, desc: 'Thud under the clang: 0 a bare ring, 1 a deep heavy hit' },
    ring: { min: 0.35, max: 0.65, def: 0.6, unit: 's', desc: 'How long the metal rings after the clang' },
    space: { min: 0, max: 0.5, def: 0.15, desc: 'Small room around the signature, from dry to roomy' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 0.4, mix: p.space, tone: 0.4 });
    const k = p.pitch;
    // the flourish: three rivet tinks, each higher
    [0, 1, 2].forEach((i) => {
      const a = t + i * 0.062;
      T.bell(room, a, { f: 1800 * k * Math.pow(2, (i * 4) / 12), partials: [[1, 1, 1], [2.76, 0.5, 0.5]], dur: 0.07, peak: 0.04, a: 0.001 });
      T.noise(room, a, { filter: 'highpass', f: 5000, to: 7000, q: 0.8, dur: 0.012, peak: 0.03, a: 0.001 });
    });
    // the landing at 0.19 s: the anvil, inharmonic metal partials a fourth below D4 (heavier than the
    // other five, which land on D)
    const L = t + 0.19;
    const anvil = [[1, 1, 1], [2.4, 0.6, 0.8], [4.17, 0.5, 0.65], [5.81, 0.35, 0.5], [8.2, 0.2, 0.3]];
    T.bell(room, L, { f: 220 * k, partials: anvil, drift: 0.995, dur: p.ring, peak: 0.039, a: 0.001 });
    T.bell(room, L + 0.006, { f: 220 * k * 1.5, partials: anvil, drift: 0.995, dur: p.ring * 0.8, peak: 0.023, a: 0.001 });
    T.osc(room, L, { f: 95 * k, to: 48 * k, dur: 0.18, peak: 0.01 + 0.05 * p.weight, a: 0.003 });
    T.noise(room, L, { filter: 'bandpass', f: 1800, to: 1000, q: 1.5, dur: 0.05, peak: 0.02, a: 0.001 });
    T.noise(room, L, { filter: 'highpass', f: 3500, to: 2500, q: 0.8, dur: 0.025, peak: 0.014, a: 0.001 });
  },
};
