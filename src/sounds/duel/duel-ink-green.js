// The Green ink signature, for tricky cards and direct damage. Same shape as the other five inks (a
// rising flourish, then a landing at 0.19 s, key of D): three dry pizzicato plucks (D, G, A), each
// followed by a quick leaf-cut swish, then the same three notes an octave up strummed into a finger
// snap, with leaves rustling down afterwards. The open D-G-A chord never resolves, which is the
// trick. Dry, close and quick on its feet.
export default {
  id: 'duel-ink-green',
  name: 'Green Ink',
  category: 'duel',
  tags: ['ink-duel', 'ink', 'green', 'trick', 'snap', 'pizzicato', 'leaf', 'card-game'],
  desc: 'The Green ink signature: three dry plucked notes with leafy swishes land in a finger snap and a rustle of leaves. For tricky cards.',
  dur: 0.85,
  family: 'organic',
  moments: ['ability'],
  params: {
    pitch: { min: 0.7, max: 1.5, def: 1, unit: 'x', desc: 'Transposes the whole signature: low and woody, high and perky' },
    snap: { min: 0, max: 1, def: 0.6, desc: 'The finger snap that lands the signature: 0 hardly there, 1 sharp and bright' },
    leaves: { min: 0, max: 1, def: 0.5, desc: 'The rustle of leaves that follows: 0 none, 1 a full shower' },
    space: { min: 0, max: 0.5, def: 0.2, desc: 'Small room around the signature, from dry to roomy' },
  },
  play(T, out, t, p) {
    const at = (s) => 293.66 * p.pitch * Math.pow(2, s / 12);
    const room = T.reverb(out, t, { time: 0.4, mix: p.space, tone: 0.5 });
    // the flourish: pizzicato D, G, A (an open, unresolved climb), a swish after each
    [0, 5, 7].forEach((s, i) => {
      const a = t + i * 0.062;
      T.pluck(room, a, { f: at(s), dur: 0.18, bright: 0.25, tone: 0.8, peak: 0.085, a: 0.002 });
      T.noise(room, a + 0.012, { filter: 'highpass', f: 4500 + 700 * i, to: 8000, q: 0.8, dur: 0.03, peak: 0.02, a: 0.004 });
    });
    // the landing at 0.19 s: the same three notes an octave up, strummed fast (still unresolved), and the snap
    const L = t + 0.19;
    [0, 5, 7].forEach((s, i) => {
      T.pluck(room, L + i * 0.012, { f: at(12 + s), dur: 0.65 - 0.05 * i, bright: 0.35, tone: 0.8, peak: 0.108 - 0.012 * i, a: 0.002 });
    });
    T.noise(room, L, { filter: 'bandpass', f: 1800 + 1200 * p.snap, to: 1500, q: 2, dur: 0.035, peak: 0.03 + 0.07 * p.snap, a: 0.001 });
    T.osc(room, L, { f: 190, to: 95, dur: 0.03, peak: 0.01 + 0.025 * p.snap, a: 0.002 });
    // the leaves: a soft wash of rustle with high ticks in it, thinning out and dying away
    const fall = T.bus(room, L + 0.03, { peak: 1, a: 0.02, dur: 0.5, s: 0.5, d: 0.15, r: 0.25 });
    T.noise(fall, L + 0.03, { filter: 'bandpass', f: 4800, to: 3200, q: 0.9, dur: 0.5, peak: 0.012 + 0.08 * p.leaves, a: 0.03, s: 0.8, d: 0.05, r: 0.2 });
    T.crackle(fall, L + 0.03, { dur: 0.5, rate: 110, f: 5200, to: 3000, spread: 0.4, q: 1.6, len: 0.007, peak: 0.03 + 0.26 * p.leaves, vary: 0.8 });
  },
};
