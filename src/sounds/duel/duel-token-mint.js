// A single-use ink token being made: a small upward bloop of ink, then one bright coin-like tink
// that chirps upward as it strikes, with a glint of air on top. Single strike and short, so it reads
// as "one token, ready to spend". Its pair, Ink Token Pop, plays when the token is spent.
export default {
  id: 'duel-token-mint',
  name: 'Ink Token Mint',
  category: 'duel',
  tags: ['ink-duel', 'token', 'single-use', 'mint', 'ink', 'coin', 'tink', 'card-game'],
  desc: 'A single-use ink token appearing: a small bloop of ink and one bright coin-like tink that chirps upward. For minting a token worth one ink.',
  dur: 0.46,
  family: 'glass',
  moments: ['resource'],
  params: {
    pitch: { min: 1200, max: 2800, def: 1976, unit: 'Hz', desc: 'Note of the tink: low a fuller coin, high a tiny bright one' },
    ring: { min: 0.15, max: 0.4, def: 0.26, unit: 's', desc: 'How long the tink rings out' },
    bloop: { min: 0, max: 1, def: 0.5, desc: 'The upward ink bloop before the tink: 0 none, 1 a clear bubble' },
  },
  play(T, out, t, p) {
    // the ink gathering: a short sine bloop rising
    T.osc(out, t, { f: 420, to: 1000, dur: 0.06, peak: 0.004 + 0.04 * p.bloop, a: 0.006 });
    // the tink: struck metal partials, each chirping up about 12% in the first 30 ms, then ringing
    const at = t + 0.04;
    [[1, 0.05, 1], [2.76, 0.02, 0.5], [5.4, 0.009, 0.25]].forEach(([m, peak, len]) => {
      T.osc(out, at, { f: p.pitch * m * 0.88, to: p.pitch * m, glide: 0.03, dur: p.ring * len, peak, a: 0.002 });
    });
    T.noise(out, at, { filter: 'highpass', f: 6500, to: 9000, q: 0.7, dur: 0.03, peak: 0.012, a: 0.002 });
  },
};
